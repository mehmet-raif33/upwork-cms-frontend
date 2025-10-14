// Logger utility for development and production environments
const IS_DEVELOPMENT = process.env.NODE_ENV === 'development';
const IS_TEST = process.env.NODE_ENV === 'test';

// Allow logging in development and test environments
const LOGGING_ENABLED = IS_DEVELOPMENT || IS_TEST;

export interface LogContext {
  [key: string]: unknown;
}

class Logger {
  private formatMessage(level: string, message: string, context?: LogContext): string {
    const timestamp = new Date().toISOString();
    const contextStr = context ? ` ${JSON.stringify(context)}` : '';
    return `[${timestamp}] ${level.toUpperCase()}: ${message}${contextStr}`;
  }

  debug(message: string, context?: LogContext): void {
    if (LOGGING_ENABLED) {
      console.debug(this.formatMessage('debug', message, context));
    }
  }

  info(message: string, context?: LogContext): void {
    if (LOGGING_ENABLED) {
      console.info(this.formatMessage('info', message, context));
    }
  }

  warn(message: string, context?: LogContext): void {
    if (LOGGING_ENABLED) {
      console.warn(this.formatMessage('warn', message, context));
    }
  }

  error(message: string, error?: Error | unknown, context?: LogContext): void {
    if (LOGGING_ENABLED) {
      console.error(this.formatMessage('error', message, context));
      if (error) {
        console.error(error);
      }
    }
  }

  // For production critical errors that should always be logged
  critical(message: string, error?: Error | unknown, context?: LogContext): void {
    console.error(this.formatMessage('critical', message, context));
    if (error) {
      console.error(error);
    }
  }
}

// Export singleton instance
export const logger = new Logger();

// Export log levels for easy imports
export const log = {
  debug: logger.debug.bind(logger),
  info: logger.info.bind(logger),
  warn: logger.warn.bind(logger),
  error: logger.error.bind(logger),
  critical: logger.critical.bind(logger),
};

export default logger; 