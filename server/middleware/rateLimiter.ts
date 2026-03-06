import type { Request, Response, NextFunction } from 'express';
import { config } from '../config.js';
import { logger } from '../utils/logger.js';

interface RateLimitStore {
  [key: string]: {
    count: number;
    resetTime: number;
  };
}

// In-memory store for rate limiting
// In production, consider using Redis or a distributed cache
const rateLimitStore: RateLimitStore = {};

// Clean up expired entries every 5 minutes
setInterval(() => {
  const now = Date.now();
  Object.keys(rateLimitStore).forEach((key) => {
    if (rateLimitStore[key].resetTime < now) {
      delete rateLimitStore[key];
    }
  });
}, 5 * 60 * 1000);

/**
 * Get client identifier for rate limiting
 */
function getClientId(req: Request): string {
  // Try to get IP from various headers (for proxies/load balancers)
  const forwarded = req.headers['x-forwarded-for'];
  const ip =
    (typeof forwarded === 'string' ? forwarded.split(',')[0].trim() : null) ||
    req.headers['x-real-ip'] ||
    req.socket.remoteAddress ||
    'unknown';

  // Combine IP with user ID if authenticated (for per-user rate limiting)
  const userId = (req as Request & { userId?: string }).userId;
  return userId ? `user:${userId}` : `ip:${ip}`;
}

interface RateLimitOptions {
  /** Maximum number of requests per window */
  max: number;
  /** Window duration in milliseconds */
  windowMs: number;
  /** Message to return when rate limit is exceeded */
  message?: string;
  /** Whether to skip rate limiting in development */
  skipInDevelopment?: boolean;
}

/**
 * Rate limiting middleware factory
 */
export function createRateLimiter(options: RateLimitOptions) {
  const { max, windowMs, message = 'Too many requests, please try again later', skipInDevelopment = true } = options;

  return (req: Request, res: Response, next: NextFunction): void => {
    // Skip rate limiting in development if configured
    if (skipInDevelopment && config.nodeEnv === 'development') {
      return next();
    }

    const clientId = getClientId(req);
    const now = Date.now();
    const entry = rateLimitStore[clientId];

    // Check if entry exists and is still valid
    if (entry && entry.resetTime > now) {
      // Increment count
      entry.count++;

      // Check if limit exceeded
      if (entry.count > max) {
        logger.warn(
          {
            clientId,
            count: entry.count,
            max,
            path: req.path,
            method: req.method,
          },
          'Rate limit exceeded',
        );

        res.status(429).json({
          error: 'Too Many Requests',
          message,
          retryAfter: Math.ceil((entry.resetTime - now) / 1000), // seconds
        });
        return;
      }
    } else {
      // Create new entry or reset expired one
      rateLimitStore[clientId] = {
        count: 1,
        resetTime: now + windowMs,
      };
    }

    // Add rate limit headers
    const currentEntry = rateLimitStore[clientId];
    res.setHeader('X-RateLimit-Limit', max.toString());
    res.setHeader('X-RateLimit-Remaining', Math.max(0, max - currentEntry.count).toString());
    res.setHeader('X-RateLimit-Reset', new Date(currentEntry.resetTime).toISOString());

    next();
  };
}

/**
 * Default rate limiter: 100 requests per 15 minutes per IP/user
 */
export const defaultRateLimiter = createRateLimiter({
  max: 100,
  windowMs: 15 * 60 * 1000, // 15 minutes
});

/**
 * Strict rate limiter: 10 requests per minute (for sensitive endpoints)
 */
export const strictRateLimiter = createRateLimiter({
  max: 10,
  windowMs: 60 * 1000, // 1 minute
  message: 'Too many requests. Please slow down.',
});

/**
 * Auth rate limiter: 5 requests per minute (for login/register endpoints)
 */
export const authRateLimiter = createRateLimiter({
  max: 5,
  windowMs: 60 * 1000, // 1 minute
  message: 'Too many authentication attempts. Please try again later.',
});
