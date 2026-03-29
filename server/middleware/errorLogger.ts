import type { Request, Response, NextFunction } from 'express';
import { logger } from '../utils/logger.js';
import { config } from '../config.js';
import { isAppDbLoggingAvailable, recordErrorEvent } from '../services/appEventLogService.js';

interface RequestWithMetadata extends Request {
  requestId?: string;
}

export function errorLogger(
  err: Error,
  req: RequestWithMetadata,
  res: Response,
  next: NextFunction,
): void {
  const requestId = req.requestId || 'unknown';

  // Determine log level based on status code (error.status, or res if already set, else 500)
  const errStatus = (err as Error & { status?: number }).status;
  const statusCode = errStatus ?? (res.statusCode >= 400 ? res.statusCode : undefined) ?? 500;
  const isClientError = statusCode >= 400 && statusCode < 500;
  const logLevel = isClientError ? 'warn' : 'error';

  // Build error log object (no user-identifying fields)
  const errorLog: Record<string, unknown> = {
    requestId,
    method: req.method,
    path: req.path,
    statusCode,
    errorName: err.name,
    errorMessage: err.message,
  };

  // Add stack trace in development or for server errors
  if (config.nodeEnv === 'development' || !isClientError) {
    errorLog.errorStack = err.stack;
  }

  // Add request context
  if (req.query && Object.keys(req.query).length > 0) {
    errorLog.query = req.query;
  }

  // Log the error
  logger[logLevel](errorLog, 'Request error');

  if (config.enableAppDbLogging && isAppDbLoggingAvailable()) {
    recordErrorEvent({
      source: 'server',
      severity: isClientError ? 'warn' : 'error',
      errorType: err.name,
      message: err.message,
      stack: err.stack,
      httpMethod: req.method,
      path: req.path,
      statusCode,
      requestId: req.requestId,
      sessionAnonId: req.get('x-session-anon-id') ?? undefined,
      payload: {
        queryKeys: Object.keys(req.query ?? {}),
      },
    });
  }

  next(err);
}
