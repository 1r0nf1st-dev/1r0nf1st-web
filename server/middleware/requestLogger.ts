import type { Request, Response, NextFunction } from 'express';
import { logger } from '../utils/logger.js';
import { config } from '../config.js';
import { generateRequestId } from '../utils/logger.js';

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


export function requestLogger(
  req: RequestWithMetadata,
  res: Response,
  next: NextFunction,
): void {
  // Skip logging for health check endpoints
  if (req.path === '/health' || req.path === '/api/health') {
    return next();
  }

  // Skip if request logging is disabled
  if (!config.enableRequestLogging) {
    return next();
  }

  // Generate request ID and attach to request
  const requestId = generateRequestId();
  const startTime = Date.now();
  (req as { requestId?: string }).requestId = requestId;
  (req as { startTime?: number }).startTime = startTime;

  // Log incoming request
  const requestLog: Record<string, unknown> = {
    requestId,
    method: req.method,
    path: req.path,
    query: req.query,
    ip: req.ip || req.socket.remoteAddress,
    userAgent: req.get('user-agent'),
  };

  // Log request body if present (sanitized)
  if (req.body && Object.keys(req.body).length > 0) {
    requestLog.body = sanitizeObject(req.body);
  }

  logger.info(requestLog, 'Incoming request');

  // Log response when finished
  const originalSend = res.send;
  res.send = function (body) {
    const duration = req.startTime ? Date.now() - req.startTime : 0;
    const responseSize = typeof body === 'string' ? body.length : JSON.stringify(body).length;

    const responseLog: Record<string, unknown> = {
      requestId,
      method: req.method,
      path: req.path,
      statusCode: res.statusCode,
      duration: `${duration}ms`,
      responseSize: `${responseSize} bytes`,
    };

    // Log user ID if available
    if ((req as { userId?: string }).userId) {
      responseLog.userId = (req as { userId?: string }).userId;
    }

    const logLevel = res.statusCode >= 500 ? 'error' : res.statusCode >= 400 ? 'warn' : 'info';
    logger[logLevel](responseLog, 'Request completed');

    return originalSend.call(this, body);
  };

  next();
}
