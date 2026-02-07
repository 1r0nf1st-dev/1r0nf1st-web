import { Router } from 'express';
import { logger } from '../utils/logger.js';
import { config } from '../config.js';

export const logsRouter = Router();

// Rate limiting map (simple in-memory rate limiting)
// In production, consider using a proper rate limiting library like express-rate-limit
const rateLimitMap = new Map<string, { count: number; resetTime: number }>();
const RATE_LIMIT_WINDOW = 60 * 1000; // 1 minute
const RATE_LIMIT_MAX_REQUESTS = 10; // Max 10 requests per minute per IP

function getRateLimitKey(req: { ip?: string; socket?: { remoteAddress?: string } }): string {
  return req.ip || req.socket?.remoteAddress || 'unknown';
}

function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  const record = rateLimitMap.get(ip);

  if (!record || now > record.resetTime) {
    rateLimitMap.set(ip, { count: 1, resetTime: now + RATE_LIMIT_WINDOW });
    return true;
  }

  if (record.count >= RATE_LIMIT_MAX_REQUESTS) {
    return false;
  }

  record.count++;
  return true;
}

// Clean up old rate limit records periodically
setInterval(() => {
  const now = Date.now();
  for (const [ip, record] of rateLimitMap.entries()) {
    if (now > record.resetTime) {
      rateLimitMap.delete(ip);
    }
  }
}, RATE_LIMIT_WINDOW);

/**
 * POST /api/logs/error
 * Accept client-side error reports
 */
logsRouter.post('/error', async (req, res) => {
  const ip = getRateLimitKey(req);

  // Check rate limit
  if (!checkRateLimit(ip)) {
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
      userId,
      errorName,
      errorData,
    } = req.body;

    // Validate required fields
    if (!message || typeof message !== 'string') {
      res.status(400).json({ error: 'Invalid error report: message is required' });
      return;
    }

    // Sanitize and log the error
    const errorLog: Record<string, unknown> = {
      source: 'client',
      message: message.substring(0, 1000), // Limit message length
      errorName: errorName || 'Error',
      url: url?.substring(0, 500),
      userAgent: userAgent?.substring(0, 500),
      timestamp: timestamp || new Date().toISOString(),
    };

    if (stack) {
      errorLog.stack = stack.substring(0, 5000); // Limit stack trace length
    }

    if (componentStack) {
      errorLog.componentStack = componentStack.substring(0, 2000);
    }

    if (userId) {
      errorLog.userId = userId;
    }

    if (errorData && typeof errorData === 'object') {
      // Sanitize error data (remove sensitive fields)
      const sanitized: Record<string, unknown> = {};
      for (const [key, value] of Object.entries(errorData)) {
        const lowerKey = key.toLowerCase();
        if (
          !lowerKey.includes('password') &&
          !lowerKey.includes('token') &&
          !lowerKey.includes('secret') &&
          !lowerKey.includes('key')
        ) {
          sanitized[key] = value;
        }
      }
      if (Object.keys(sanitized).length > 0) {
        errorLog.errorData = sanitized;
      }
    }

    // Log to backend logger
    logger.error(errorLog, 'Client-side error reported');

    res.status(200).json({ message: 'Error reported successfully' });
  } catch (error) {
    logger.error({ error, ip }, 'Failed to process error report');
    res.status(500).json({ error: 'Failed to process error report' });
  }
});

/**
 * POST /api/logs/analytics
 * Accept analytics events (if analytics is enabled)
 */
logsRouter.post('/analytics', async (req, res) => {
  // Check if analytics is enabled
  if (!config.enableAnalytics) {
    res.status(403).json({ error: 'Analytics is disabled' });
    return;
  }

  const ip = getRateLimitKey(req);

  // Check rate limit
  if (!checkRateLimit(ip)) {
    res.status(429).json({
      error: 'Too many requests',
      message: 'Rate limit exceeded. Please try again later.',
    });
    return;
  }

  try {
    const { event, data, timestamp } = req.body;

    // Validate required fields
    if (!event || typeof event !== 'string') {
      res.status(400).json({ error: 'Invalid analytics event: event name is required' });
      return;
    }

    // Sanitize and log the analytics event
    const analyticsLog: Record<string, unknown> = {
      source: 'client-analytics',
      event: event.substring(0, 100),
      timestamp: timestamp || new Date().toISOString(),
      url: req.get('referer')?.substring(0, 500),
    };

    if (data && typeof data === 'object') {
      // Sanitize analytics data (remove PII)
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

    // Log to backend logger at info level
    logger.info(analyticsLog, 'Analytics event');

    res.status(200).json({ message: 'Analytics event logged successfully' });
  } catch (error) {
    logger.error({ error, ip }, 'Failed to process analytics event');
    res.status(500).json({ error: 'Failed to process analytics event' });
  }
});
