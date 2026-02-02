/**
 * Vercel serverless function: runs the Express app for all /api/* routes.
 * All /api/* requests are rewritten to /api/catchall?x-path=:path* so this handler receives them.
 * Loads app from server/dist (built by pnpm build:server); includeFiles in vercel.json required.
 */
import path from 'path';
import { pathToFileURL } from 'url';
import type { IncomingMessage, ServerResponse } from 'http';

type ExpressApp = (req: IncomingMessage, res: ServerResponse) => void;

let appPromise: Promise<{ default: ExpressApp }> | null = null;
let appLoadError: Error | null = null;
let loadAttempts = 0;
const MAX_LOAD_ATTEMPTS = 3;

/**
 * Structured logging utility for Vercel function logs
 */
function log(level: 'info' | 'error' | 'warn', message: string, data?: Record<string, unknown>): void {
  const timestamp = new Date().toISOString();
  const logEntry = {
    timestamp,
    level,
    message,
    ...data,
  };
  console.log(JSON.stringify(logEntry));
}

/**
 * Send error response and ensure response is completed
 */
function sendErrorResponse(
  res: ServerResponse,
  status: number,
  error: string,
  details?: Record<string, unknown>,
): void {
  if (res.headersSent) {
    log('warn', 'Response already sent, cannot send error', { status, error });
    return;
  }

  try {
    res.statusCode = status;
    res.setHeader('Content-Type', 'application/json');
    res.end(
      JSON.stringify({
        error,
        ...(details && Object.keys(details).length > 0 ? { details } : {}),
      }),
    );
  } catch (err) {
    log('error', 'Failed to send error response', { originalError: error, sendError: err });
  }
}

/**
 * Normalize and sanitize URL path from rewrite query parameter
 */
function normalizePath(req: IncomingMessage): string | null {
  const url = req.url ?? '/';

  try {
    const parsed = new URL(url, 'http://_');
    const pathSeg = parsed.searchParams.get('x-path');

    if (pathSeg !== null && pathSeg !== '') {
      // Extract remaining query params (excluding x-path)
      const rest = new URLSearchParams(parsed.searchParams);
      rest.delete('x-path');
      const queryString = rest.toString();

      // Sanitize path segment: remove double slashes, ensure single leading slash
      let normalizedPath = pathSeg
        .replace(/\/+/g, '/') // Replace multiple slashes with single
        .replace(/^\/+/, '/') // Ensure single leading slash
        .replace(/\/+$/, ''); // Remove trailing slashes

      // Ensure path starts with /api
      if (!normalizedPath.startsWith('/api')) {
        normalizedPath = '/api' + (normalizedPath.startsWith('/') ? normalizedPath : `/${normalizedPath}`);
      }

      // Reconstruct full URL with query string
      return normalizedPath + (queryString ? `?${queryString}` : '');
    }

    // Fallback: handle direct /api/catchall paths
    if (url.startsWith('/api/catchall')) {
      const remaining = url.slice('/api/catchall'.length);
      return '/api' + (remaining || '/');
    }

    // Default: ensure /api prefix
    if (!url.startsWith('/api')) {
      return '/api' + (url.startsWith('/') ? url : `/${url}`);
    }

    return url;
  } catch (error) {
    log('error', 'Failed to normalize path', { url, error: error instanceof Error ? error.message : String(error) });
    return '/api';
  }
}

/**
 * Validate incoming request
 */
function validateRequest(req: IncomingMessage): { valid: boolean; error?: string } {
  if (!req.method) {
    return { valid: false, error: 'Missing HTTP method' };
  }

  const validMethods = ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'];
  if (!validMethods.includes(req.method)) {
    return { valid: false, error: `Unsupported HTTP method: ${req.method}` };
  }

  if (!req.url) {
    return { valid: false, error: 'Missing URL' };
  }

  return { valid: true };
}

/**
 * Load Express app with retry logic and error recovery
 */
async function getApp(): Promise<ExpressApp> {
  // If we have a cached error and haven't exceeded retry limit, try again
  if (appLoadError && loadAttempts < MAX_LOAD_ATTEMPTS) {
    log('info', 'Retrying app load after previous failure', { attempt: loadAttempts + 1 });
    appPromise = null; // Clear cache to force reload
    appLoadError = null;
  }

  if (!appPromise) {
    loadAttempts++;
    const appPath = path.join(process.cwd(), 'server', 'dist', 'app.js');

    appPromise = import(pathToFileURL(appPath).href)
      .then((module) => {
        log('info', 'Express app loaded successfully', { path: appPath });
        appLoadError = null;
        loadAttempts = 0; // Reset on success
        return module;
      })
      .catch((error) => {
        appLoadError = error;
        log('error', 'Failed to load Express app', {
          path: appPath,
          attempt: loadAttempts,
          error: error instanceof Error ? error.message : String(error),
        });
        // Clear promise so next request can retry
        appPromise = null;
        throw error;
      });
  }

  try {
    const module = await appPromise;
    if (!module.default) {
      throw new Error('Express app module does not export default');
    }
    return module.default;
  } catch (error) {
    if (loadAttempts >= MAX_LOAD_ATTEMPTS) {
      log('error', 'Max load attempts exceeded, giving up', { attempts: loadAttempts });
    }
    throw error;
  }
}

/**
 * Vercel serverless function handler
 */
export default async function handler(
  req: IncomingMessage,
  res: ServerResponse,
): Promise<void> {
  const startTime = Date.now();
  const method = req.method || 'UNKNOWN';
  const originalUrl = req.url || '/';

  // Fast path for health check
  if (originalUrl.includes('/health') || originalUrl.includes('x-path=health')) {
    try {
      res.statusCode = 200;
      res.setHeader('Content-Type', 'application/json');
      res.end(
        JSON.stringify({
          status: 'ok',
          timestamp: new Date().toISOString(),
          handler: 'catchall',
        }),
      );
      log('info', 'Health check handled', { method, url: originalUrl, duration: Date.now() - startTime });
      return;
    } catch (error) {
      log('error', 'Health check failed', { error: error instanceof Error ? error.message : String(error) });
      sendErrorResponse(res, 500, 'Health check failed');
      return;
    }
  }

  // Validate request
  const validation = validateRequest(req);
  if (!validation.valid) {
    log('warn', 'Invalid request', { method, url: originalUrl, error: validation.error });
    sendErrorResponse(res, 400, validation.error || 'Invalid request');
    return;
  }

  // Normalize path
  const normalizedUrl = normalizePath(req);
  if (!normalizedUrl) {
    log('error', 'Path normalization failed', { method, url: originalUrl });
    sendErrorResponse(res, 400, 'Invalid request path');
    return;
  }

  req.url = normalizedUrl;
  log('info', 'Request received', { method, originalUrl, normalizedUrl });

  // Set timeout to prevent hanging (Vercel functions have max duration)
  // Declare outside try block so it's accessible in catch
  let timeout: NodeJS.Timeout | null = null;

  // Load and execute Express app
  try {
    const app = await getApp();

    // Set timeout to prevent hanging (Vercel functions have max duration)
    timeout = setTimeout(() => {
      if (!res.headersSent) {
        log('error', 'Request timeout', { method, url: normalizedUrl, duration: Date.now() - startTime });
        sendErrorResponse(res, 504, 'Request timeout');
      }
    }, 25000); // 25 seconds (Vercel free tier is 10s, but allow buffer)

    // Ensure timeout is cleared when response completes
    const originalEnd = res.end.bind(res);
    res.end = function (chunk?: unknown, encoding?: unknown, cb?: () => void) {
      if (timeout) clearTimeout(timeout);
      return originalEnd(chunk, encoding, cb);
    };

    // Execute Express app
    app(req, res);

    // Log successful completion
    res.once('finish', () => {
      if (timeout) clearTimeout(timeout);
      log('info', 'Request completed', {
        method,
        url: normalizedUrl,
        statusCode: res.statusCode,
        duration: Date.now() - startTime,
      });
    });

    res.once('close', () => {
      if (timeout) clearTimeout(timeout);
    });
  } catch (error) {
    if (timeout) clearTimeout(timeout);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    log('error', 'Handler error', {
      method,
      url: normalizedUrl,
      error: errorMessage,
      duration: Date.now() - startTime,
    });

    if (!res.headersSent) {
      if (errorMessage.includes('Cannot find module') || errorMessage.includes('ENOENT')) {
        sendErrorResponse(
          res,
          503,
          'Service temporarily unavailable',
          {
            message: 'Express app not found. Ensure server/dist/app.js exists.',
            retry: loadAttempts < MAX_LOAD_ATTEMPTS,
          },
        );
      } else {
        sendErrorResponse(res, 500, 'Internal server error', {
          message: process.env.NODE_ENV === 'development' ? errorMessage : undefined,
        });
      }
    }
  }
}
