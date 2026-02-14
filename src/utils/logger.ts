type LogLevel = 'error' | 'warn' | 'info' | 'debug';

interface LogEntry {
  level: LogLevel;
  message: string;
  data?: Record<string, unknown>;
  timestamp: string;
}

class Logger {
  private isDevelopment: boolean;
  private logLevel: LogLevel;

  constructor() {
    this.isDevelopment =
      (typeof process !== 'undefined' && process.env.NODE_ENV === 'development') ||
      (typeof import.meta !== 'undefined' &&
        (import.meta.env?.DEV || import.meta.env?.MODE === 'development'));
    // In production, only log errors and warnings
    // In development, log everything
    this.logLevel = this.isDevelopment ? 'debug' : 'warn';
  }

  private shouldLog(level: LogLevel): boolean {
    const levels: LogLevel[] = ['error', 'warn', 'info', 'debug'];
    const currentLevelIndex = levels.indexOf(this.logLevel);
    const messageLevelIndex = levels.indexOf(level);
    return messageLevelIndex <= currentLevelIndex;
  }

  private formatMessage(level: LogLevel, message: string, data?: Record<string, unknown>): string {
    const timestamp = new Date().toISOString();
    if (data) {
      return `[${timestamp}] [${level.toUpperCase()}] ${message} ${JSON.stringify(data)}`;
    }
    return `[${timestamp}] [${level.toUpperCase()}] ${message}`;
  }

  private log(level: LogLevel, message: string, data?: Record<string, unknown>): void {
    if (!this.shouldLog(level)) {
      return;
    }

    const logEntry: LogEntry = {
      level,
      message,
      data,
      timestamp: new Date().toISOString(),
    };

    // In development, use console with colors
    if (this.isDevelopment) {
      const styles: Record<LogLevel, string> = {
        error: 'color: red; font-weight: bold',
        warn: 'color: orange',
        info: 'color: blue',
        debug: 'color: gray',
      };
      console.log(`%c${this.formatMessage(level, message, data)}`, styles[level]);
    } else {
      // In production, use structured logging
      console[level === 'error' ? 'error' : level === 'warn' ? 'warn' : 'log'](
        JSON.stringify(logEntry),
      );
    }
  }

  error(message: string, data?: Record<string, unknown>): void {
    this.log('error', message, data);
  }

  warn(message: string, data?: Record<string, unknown>): void {
    this.log('warn', message, data);
  }

  info(message: string, data?: Record<string, unknown>): void {
    this.log('info', message, data);
  }

  debug(message: string, data?: Record<string, unknown>): void {
    this.log('debug', message, data);
  }
}

export const logger = new Logger();
