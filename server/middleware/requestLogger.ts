import type { Request, Response, NextFunction } from 'express';
import { logger } from '../utils/logger.js';
import { config } from '../config.js';
import { generateRequestId } from '../utils/logger.js';
import { isAppDbLoggingAvailable, recordInteractionEvent } from '../services/appEventLogService.js';

interface RequestWithMetadata extends Request {
  requestId?: string;
  startTime?: number;
}

// Fields to mask in request bodies
const SENSITIVE_FIELDS = [
  'password',
  'token',
  'accessToken',
  'refreshToken',
  'apiKey',
  'secret',
  'authorization',
  'authToken',
];

// Sanitize object by masking sensitive fields
function sanitizeObject(obj: unknown, depth = 0): unknown {
  if (depth > 5) {
    return '[Max depth reached]';
  }

  if (obj === null || obj === undefined) {
    return obj;
  }

  if (typeof obj !== 'object') {
    return obj;
  }

  if (Array.isArray(obj)) {
    return obj.map((item) => sanitizeObject(item, depth + 1));
  }

  const sanitized: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(obj as Record<string, unknown>)) {
    const lowerKey = key.toLowerCase();
    if (SENSITIVE_FIELDS.some((field) => lowerKey.includes(field.toLowerCase()))) {
      sanitized[key] = '[REDACTED]';
    } else if (typeof value === 'object' && value !== null) {
      sanitized[key] = sanitizeObject(value, depth + 1);
    } else {
      sanitized[key] = value;
    }
  }

  return sanitized;
}

export function requestLogger(req: RequestWithMetadata, res: Response, next: NextFunction): void {
  // Skip logging for health check endpoints
  if (req.path === '/health' || req.path === '/api/health') {
    next();
    return;
  }

  const requestId = generateRequestId();
  const startTime = Date.now();
  (req as { requestId?: string }).requestId = requestId;
  (req as { startTime?: number }).startTime = startTime;
  res.setHeader('X-Request-Id', requestId);

  if (config.enableRequestLogging) {
    const requestLog: Record<string, unknown> = {
      requestId,
      method: req.method,
      path: req.path,
      query: req.query,
      ip: req.ip || req.socket.remoteAddress,
      userAgent: req.get('user-agent'),
    };

    if (req.body && Object.keys(req.body).length > 0) {
      requestLog.body = sanitizeObject(req.body);
    }

    logger.info(requestLog, 'Incoming request');
  }

  res.once('finish', () => {
    const duration = req.startTime ? Date.now() - req.startTime : 0;
    const contentLength = res.getHeader('content-length');
    const responseSize =
      typeof contentLength === 'number'
        ? contentLength
        : typeof contentLength === 'string'
          ? Number.parseInt(contentLength, 10)
          : undefined;

    if (config.enableRequestLogging) {
      const responseLog: Record<string, unknown> = {
        requestId,
        method: req.method,
        path: req.path,
        statusCode: res.statusCode,
        duration: `${duration}ms`,
        ...(responseSize !== undefined && !Number.isNaN(responseSize)
          ? { responseSize: `${responseSize} bytes` }
          : {}),
      };

      const logLevel = res.statusCode >= 500 ? 'error' : res.statusCode >= 400 ? 'warn' : 'info';
      logger[logLevel](responseLog, 'Request completed');
    }

    if (config.enableAppDbLogging && isAppDbLoggingAvailable()) {
      const queryKeys = Object.keys(req.query ?? {});
      recordInteractionEvent({
        kind: 'api_request',
        name: `${req.method} ${req.path}`,
        requestId,
        sessionAnonId: req.get('x-session-anon-id') ?? undefined,
        durationMs: duration,
        path: req.path,
        httpMethod: req.method,
        statusCode: res.statusCode,
        metadata: { queryParamKeys: queryKeys },
      });
    }
  });

  next();
}
