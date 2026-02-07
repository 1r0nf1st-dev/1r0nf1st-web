import { logger } from './logger.js';
import { env } from '../config.js';

interface ErrorReport {
  message: string;
  stack?: string;
  componentStack?: string;
  url: string;
  userAgent: string;
  timestamp: string;
  userId?: string;
  errorName?: string;
  errorData?: Record<string, unknown>;
}

/**
 * Report client-side errors to the backend logging endpoint
 */
export async function reportError(
  error: Error,
  context?: {
    componentStack?: string;
    userId?: string;
    errorData?: Record<string, unknown>;
  },
): Promise<void> {
  // Log locally first
  logger.error('Client-side error occurred', {
    message: error.message,
    stack: error.stack,
    ...context?.errorData,
  });

  // Don't report errors in development (too noisy)
  if (import.meta.env.DEV) {
    return;
  }

  try {
    const errorReport: ErrorReport = {
      message: error.message,
      stack: error.stack,
      componentStack: context?.componentStack,
      url: window.location.href,
      userAgent: navigator.userAgent,
      timestamp: new Date().toISOString(),
      userId: context?.userId,
      errorName: error.name,
      errorData: context?.errorData,
    };

    // Get API base URL
    let apiBase = '/api';
    if (env.apiBaseUrl && env.apiBaseUrl.trim()) {
      const trimmed = env.apiBaseUrl.trim();
      if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
        const normalized = trimmed.endsWith('/') ? trimmed.slice(0, -1) : trimmed;
        apiBase = normalized.endsWith('/api') ? normalized : `${normalized}/api`;
      } else {
        apiBase = trimmed.endsWith('/') ? trimmed.slice(0, -1) : trimmed;
      }
    }

    // Send error report to backend
    await fetch(`${apiBase}/logs/error`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(errorReport),
    });
  } catch (err) {
    // Silently fail - don't create error loops
    logger.debug('Failed to report error to backend', { err });
  }
}

/**
 * Report unhandled promise rejections
 */
export function setupGlobalErrorHandlers(): void {
  // Handle unhandled promise rejections
  window.addEventListener('unhandledrejection', (event) => {
    const error = event.reason instanceof Error ? event.reason : new Error(String(event.reason));
    reportError(error, {
      errorData: {
        type: 'unhandledrejection',
        reason: event.reason,
      },
    });
  });

  // Handle general errors
  window.addEventListener('error', (event) => {
    const error = event.error instanceof Error ? event.error : new Error(event.message);
    reportError(error, {
      errorData: {
        type: 'window.error',
        filename: event.filename,
        lineno: event.lineno,
        colno: event.colno,
      },
    });
  });
}
