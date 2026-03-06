import pino from 'pino';
import { config } from '../config.js';

// Determine log level based on environment and config
function getLogLevel(): pino.Level {
  if (config.logLevel) {
    return config.logLevel as pino.Level;
  }
  return config.nodeEnv === 'production' ? 'info' : 'debug';
}

// On Vercel, add context so Log Drains and dashboard can filter (e.g. by VERCEL_ENV)
const vercelContext =
  typeof process.env.VERCEL === 'string'
    ? {
        vercel: true as const,
        vercel_env: process.env.VERCEL_ENV ?? undefined,
        vercel_region: process.env.VERCEL_REGION ?? undefined,
      }
    : {};

// Create logger instance. In production (including Vercel) logs go to stdout as JSON;
// Vercel captures stdout and shows it under Project → Logs / Runtime Logs.
export const logger = pino({
  level: getLogLevel(),
  base: { ...vercelContext },
  transport:
    config.nodeEnv === 'development'
      ? {
          target: 'pino-pretty',
          options: {
            colorize: true,
            translateTime: 'HH:MM:ss Z',
            ignore: 'pid,hostname',
          },
        }
      : undefined,
  formatters: {
    level: (label) => {
      return { level: label };
    },
  },
  timestamp: pino.stdTimeFunctions.isoTime,
});

// Helper function to generate request IDs
export function generateRequestId(): string {
  return `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
}
