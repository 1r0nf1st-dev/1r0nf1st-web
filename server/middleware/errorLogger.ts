import type { Request, Response, NextFunction } from 'express';
import { logger } from '../utils/logger.js';
import { config } from '../config.js';

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
  const userId = (req as { userId?: string }).userId;

  // Determine log level based on status code (error.status, or res if already set, else 500)
  const errStatus = (err as Error & { status?: number }).status;
  const statusCode =
    errStatus ?? (res.statusCode >= 400 ? res.statusCode : undefined) ?? 500;
  const isClientError = statusCode >= 400 && statusCode < 500;
  const logLevel = isClientError ? 'warn' : 'error';

  // Build error log object
  const errorLog: Record<string, unknown> = {
    requestId,
    method: req.method,
    path: req.path,
    statusCode,
    errorName: err.name,
    errorMessage: err.message,
  };

  // Add user context if available
  if (userId) {
    errorLog.userId = userId;
  }

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

  next(err);
}
