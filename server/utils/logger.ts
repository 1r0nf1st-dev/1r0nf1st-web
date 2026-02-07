import pino from 'pino';
import { config } from '../config.js';

// Determine log level based on environment and config
function getLogLevel(): pino.Level {
  if (config.logLevel) {
    return config.logLevel as pino.Level;
  }
  return config.nodeEnv === 'production' ? 'info' : 'debug';
}

// Create logger instance
export const logger = pino({
  level: getLogLevel(),
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
