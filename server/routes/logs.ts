import { Router, type Request } from 'express';
import { logger } from '../utils/logger.js';
import { config } from '../config.js';
import { stripHtmlAndScripts } from '../utils/sanitize.js';
import {
  isAppDbLoggingAvailable,
  recordErrorEvent,
  recordInteractionEvent,
  recordPlatformEvent,
} from '../services/appEventLogService.js';
import { expandPlatformIngestBody } from '../utils/platformLogNormalize.js';
import { verifyVercelDrainSignature } from '../utils/vercelDrainSignature.js';

export const logsRouter = Router();

const rateLimitMap = new Map<string, { count: number; resetTime: number }>();
const RATE_LIMIT_WINDOW = 60 * 1000;
const RATE_LIMIT_MAX_ERROR = 20;
const RATE_LIMIT_MAX_INTERACTION = 60;

function getRateLimitKey(req: { ip?: string; socket?: { remoteAddress?: string } }): string {
  return req.ip || req.socket?.remoteAddress || 'unknown';
}

function checkRateLimit(ip: string, max: number): boolean {
  const now = Date.now();
  const record = rateLimitMap.get(ip);

  if (!record || now > record.resetTime) {
    rateLimitMap.set(ip, { count: 1, resetTime: now + RATE_LIMIT_WINDOW });
    return true;
  }

  if (record.count >= max) {
    return false;
  }

  record.count++;
  return true;
}

setInterval(() => {
  const now = Date.now();
  for (const [ip, record] of rateLimitMap.entries()) {
    if (now > record.resetTime) {
      rateLimitMap.delete(ip);
    }
  }
}, RATE_LIMIT_WINDOW);

function pathnameOnly(urlStr: string): string {
  try {
    const u = new URL(urlStr);
    return u.pathname.length > 500 ? u.pathname.slice(0, 500) : u.pathname;
  } catch {
    return stripHtmlAndScripts(urlStr).substring(0, 500);
  }
}

function platformIngestConfigured(): boolean {
  return Boolean(config.appLogIngestSecret) || Boolean(config.vercelDrainSignatureSecret);
}

/**
 * Shared secret header (any source) or Vercel drain HMAC on raw body.
 */
function platformIngestAuthorized(req: Request): boolean {
  if (config.nodeEnv !== 'production' && !platformIngestConfigured()) {
    return true;
  }
  if (config.appLogIngestSecret && req.get('x-app-log-secret') === config.appLogIngestSecret) {
    return true;
  }
  const vercelSig = req.get('x-vercel-signature');
  if (
    config.vercelDrainSignatureSecret &&
    vercelSig &&
    req.rawBody &&
    verifyVercelDrainSignature(req.rawBody, vercelSig, config.vercelDrainSignatureSecret)
  ) {
    return true;
  }
  return false;
}

/**
 * POST /api/logs/error
 * Accept client-side error reports (no user-identifying fields persisted).
 */
logsRouter.post('/error', async (req, res) => {
  const ip = getRateLimitKey(req);

  if (!checkRateLimit(ip, RATE_LIMIT_MAX_ERROR)) {
    res.status(429).json({
      error: 'Too many requests',
      message: 'Rate limit exceeded. Please try again later.',
    });
    return;
  }

  try {
    const {
      message,
      stack,
      componentStack,
      url,
      userAgent,
      timestamp,
      errorName,
      errorData,
      sessionAnonId: bodySessionId,
      requestId: bodyRequestId,
    } = req.body as Record<string, unknown>;

    if (!message || typeof message !== 'string') {
      res.status(400).json({ error: 'Invalid error report: message is required' });
      return;
    }

    const headerRequestId = req.get('x-request-id');
    const headerSessionId = req.get('x-session-anon-id');
    const sessionAnonId =
      typeof bodySessionId === 'string'
        ? bodySessionId
        : typeof headerSessionId === 'string'
          ? headerSessionId
          : undefined;
    const requestId =
      typeof bodyRequestId === 'string'
        ? bodyRequestId
        : typeof headerRequestId === 'string'
          ? headerRequestId
          : undefined;

    const pathFromUrl = typeof url === 'string' ? pathnameOnly(url) : undefined;

    const errorLog: Record<string, unknown> = {
      source: 'client',
      message: stripHtmlAndScripts(message).substring(0, 1000),
      errorName: stripHtmlAndScripts(String(errorName || 'Error')).substring(0, 200),
      urlPath: pathFromUrl,
      userAgent: userAgent ? stripHtmlAndScripts(String(userAgent)).substring(0, 500) : undefined,
      timestamp: timestamp || new Date().toISOString(),
      requestId,
      sessionAnonId: sessionAnonId
        ? stripHtmlAndScripts(sessionAnonId).substring(0, 80)
        : undefined,
    };

    if (stack) {
      errorLog.stack = stripHtmlAndScripts(String(stack)).substring(0, 5000);
    }

    if (componentStack) {
      errorLog.componentStack = stripHtmlAndScripts(String(componentStack)).substring(0, 2000);
    }

    if (errorData && typeof errorData === 'object') {
      const sanitized: Record<string, unknown> = {};
      for (const [key, value] of Object.entries(errorData as Record<string, unknown>)) {
        const lowerKey = key.toLowerCase();
        if (
          !lowerKey.includes('password') &&
          !lowerKey.includes('token') &&
          !lowerKey.includes('secret') &&
          !lowerKey.includes('key') &&
          !lowerKey.includes('email') &&
          !lowerKey.includes('user') &&
          !lowerKey.includes('userid')
        ) {
          sanitized[key] = value;
        }
      }
      if (Object.keys(sanitized).length > 0) {
        errorLog.errorData = sanitized;
      }
    }

    logger.error(errorLog, 'Client-side error reported');

    if (config.enableAppDbLogging && isAppDbLoggingAvailable()) {
      const payload: Record<string, unknown> = {};
      if (errorLog.errorData) {
        payload.client = errorLog.errorData;
      }
      if (errorLog.userAgent) {
        payload.userAgentSnippet = String(errorLog.userAgent).slice(0, 120);
      }
      recordErrorEvent({
        source: 'client',
        severity: 'error',
        errorType: String(errorName || 'Error'),
        message: stripHtmlAndScripts(message).substring(0, 4000),
        stack: stack ? stripHtmlAndScripts(String(stack)).substring(0, 12000) : undefined,
        componentStack: componentStack
          ? stripHtmlAndScripts(String(componentStack)).substring(0, 8000)
          : undefined,
        path: pathFromUrl,
        requestId: requestId ? stripHtmlAndScripts(requestId).substring(0, 120) : undefined,
        sessionAnonId: sessionAnonId
          ? stripHtmlAndScripts(sessionAnonId).substring(0, 80)
          : undefined,
        payload,
      });
    }

    res.status(200).json({ message: 'Error reported successfully' });
  } catch (error) {
    logger.error({ error, ip }, 'Failed to process error report');
    res.status(500).json({ error: 'Failed to process error report' });
  }
});

/**
 * POST /api/logs/interaction
 * Client-side structured interactions (navigation, key UI actions). No PII.
 */
logsRouter.post('/interaction', async (req, res) => {
  const ip = getRateLimitKey(req);

  if (!checkRateLimit(ip, RATE_LIMIT_MAX_INTERACTION)) {
    res.status(429).json({
      error: 'Too many requests',
      message: 'Rate limit exceeded. Please try again later.',
    });
    return;
  }

  try {
    const body = req.body as Record<string, unknown>;
    const kind = body.kind;
    const name = body.name;
    if (!kind || typeof kind !== 'string' || !name || typeof name !== 'string') {
      res.status(400).json({ error: 'Invalid interaction: kind and name are required strings' });
      return;
    }

    const headerRequestId = req.get('x-request-id');
    const headerSessionId = req.get('x-session-anon-id');
    const requestId =
      typeof body.requestId === 'string'
        ? body.requestId
        : typeof headerRequestId === 'string'
          ? headerRequestId
          : undefined;
    const sessionAnonId =
      typeof body.sessionAnonId === 'string'
        ? body.sessionAnonId
        : typeof headerSessionId === 'string'
          ? headerSessionId
          : undefined;

    const metadata =
      body.metadata && typeof body.metadata === 'object'
        ? (body.metadata as Record<string, unknown>)
        : {};

    logger.info(
      {
        source: 'client-interaction',
        kind: stripHtmlAndScripts(kind).substring(0, 120),
        name: stripHtmlAndScripts(name).substring(0, 200),
      },
      'Client interaction',
    );

    if (config.enableAppDbLogging && isAppDbLoggingAvailable()) {
      recordInteractionEvent({
        kind: `client:${stripHtmlAndScripts(kind).substring(0, 100)}`,
        name: stripHtmlAndScripts(name).substring(0, 500),
        requestId: requestId ? stripHtmlAndScripts(requestId).substring(0, 120) : undefined,
        sessionAnonId: sessionAnonId
          ? stripHtmlAndScripts(sessionAnonId).substring(0, 80)
          : undefined,
        metadata,
      });
    }

    res.status(200).json({ message: 'Interaction logged' });
  } catch (error) {
    logger.error({ error, ip }, 'Failed to process interaction');
    res.status(500).json({ error: 'Failed to process interaction' });
  }
});

/**
 * POST /api/logs/platform
 * Ingest Vercel log drains, Supabase webhooks, or CI jobs. Header: X-App-Log-Secret
 */
logsRouter.post('/platform', async (req, res) => {
  if (config.nodeEnv === 'production' && !platformIngestConfigured()) {
    res.status(503).json({ error: 'Platform ingest not configured' });
    return;
  }

  if (!platformIngestAuthorized(req)) {
    res.status(401).json({ error: 'Unauthorized' });
    return;
  }

  try {
    const rows = expandPlatformIngestBody(req.body);

    let accepted = 0;
    for (const row of rows) {
      recordPlatformEvent({
        provider: stripHtmlAndScripts(row.provider).substring(0, 40),
        category: stripHtmlAndScripts(row.category).substring(0, 80),
        severity: row.severity ? stripHtmlAndScripts(row.severity).substring(0, 32) : undefined,
        title: row.title ? stripHtmlAndScripts(row.title).substring(0, 500) : undefined,
        message: row.message ? stripHtmlAndScripts(row.message).substring(0, 8000) : undefined,
        externalId: row.externalId
          ? stripHtmlAndScripts(row.externalId).substring(0, 500)
          : undefined,
        occurredAt: row.occurredAt,
        payload: row.payload,
      });
      accepted++;
    }

    logger.info({ accepted }, 'Platform log batch ingested');
    res.status(200).json({ message: 'Platform events accepted', accepted });
  } catch (error) {
    logger.error({ error }, 'Failed platform ingest');
    res.status(500).json({ error: 'Failed platform ingest' });
  }
});

/**
 * POST /api/logs/analytics
 * Accept analytics events (if analytics is enabled)
 */
logsRouter.post('/analytics', async (req, res) => {
  if (!config.enableAnalytics) {
    res.status(403).json({ error: 'Analytics is disabled' });
    return;
  }

  const ip = getRateLimitKey(req);

  if (!checkRateLimit(ip, RATE_LIMIT_MAX_INTERACTION)) {
    res.status(429).json({
      error: 'Too many requests',
      message: 'Rate limit exceeded. Please try again later.',
    });
    return;
  }

  try {
    const { event, data, timestamp } = req.body;

    if (!event || typeof event !== 'string') {
      res.status(400).json({ error: 'Invalid analytics event: event name is required' });
      return;
    }

    const analyticsLog: Record<string, unknown> = {
      source: 'client-analytics',
      event: stripHtmlAndScripts(event).substring(0, 100),
      timestamp: timestamp || new Date().toISOString(),
      url: req.get('referer')
        ? stripHtmlAndScripts(req.get('referer')!).substring(0, 500)
        : undefined,
    };

    if (data && typeof data === 'object') {
      const sanitized: Record<string, unknown> = {};
      for (const [key, value] of Object.entries(data)) {
        const lowerKey = key.toLowerCase();
        if (
          !lowerKey.includes('email') &&
          !lowerKey.includes('name') &&
          !lowerKey.includes('phone') &&
          !lowerKey.includes('address')
        ) {
          sanitized[key] = value;
        }
      }
      if (Object.keys(sanitized).length > 0) {
        analyticsLog.data = sanitized;
      }
    }

    logger.info(analyticsLog, 'Analytics event');

    res.status(200).json({ message: 'Analytics event logged successfully' });
  } catch (error) {
    logger.error({ error, ip }, 'Failed to process analytics event');
    res.status(500).json({ error: 'Failed to process analytics event' });
  }
});
