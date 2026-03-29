import { logger } from './logger';
import { env } from '../config';
import { getSessionAnonId } from './sessionAnonId';
import { getLastRequestId } from './requestContext';

interface ErrorReport {
  message: string;
  stack?: string;
  componentStack?: string;
  url: string;
  userAgent: string;
  timestamp: string;
  errorName?: string;
  errorData?: Record<string, unknown>;
  sessionAnonId?: string;
  requestId?: string;
}

/**
 * Report client-side errors to the backend logging endpoint (no user-identifying fields).
 */
export async function reportError(
  error: Error,
  context?: {
    componentStack?: string;
    errorData?: Record<string, unknown>;
  },
): Promise<void> {
  logger.error('Client-side error occurred', {
    message: error.message,
    stack: error.stack,
    ...context?.errorData,
  });

  try {
    const errorReport: ErrorReport = {
      message: error.message,
      stack: error.stack,
      componentStack: context?.componentStack,
      url: typeof window !== 'undefined' ? window.location.href : '',
      userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : '',
      timestamp: new Date().toISOString(),
      errorName: error.name,
      errorData: context?.errorData,
      sessionAnonId: getSessionAnonId(),
      requestId: getLastRequestId(),
    };

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

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    const sid = getSessionAnonId();
    if (sid) {
      headers['X-Session-Anon-Id'] = sid;
    }

    await fetch(`${apiBase}/logs/error`, {
      method: 'POST',
      headers,
      body: JSON.stringify(errorReport),
    });
  } catch (err) {
    logger.debug('Failed to report error to backend', { err });
  }
}

/**
 * Report unhandled promise rejections and window errors.
 */
export function setupGlobalErrorHandlers(): void {
  window.addEventListener('unhandledrejection', (event) => {
    const error = event.reason instanceof Error ? event.reason : new Error(String(event.reason));
    void reportError(error, {
      errorData: {
        type: 'unhandledrejection',
      },
    });
  });

  window.addEventListener('error', (event) => {
    const error = event.error instanceof Error ? event.error : new Error(event.message);
    void reportError(error, {
      errorData: {
        type: 'window.error',
        filename: event.filename,
        lineno: event.lineno,
        colno: event.colno,
      },
    });
  });
}
