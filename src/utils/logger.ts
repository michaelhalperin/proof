/**
 * Structured logging utility for the Proof app
 * Replaces console.log/error/warn with structured logging
 */

export enum LogLevel {
  DEBUG = 'DEBUG',
  INFO = 'INFO',
  WARN = 'WARN',
  ERROR = 'ERROR',
}

interface LogEntry {
  level: LogLevel;
  message: string;
  timestamp: number;
  data?: any;
  error?: {
    message: string;
    stack?: string;
    name?: string;
  };
}

class Logger {
  private logs: LogEntry[] = [];
  private maxLogs = 100; // Keep last 100 logs in memory
  private isDevelopment = __DEV__;

  private createLogEntry(
    level: LogLevel,
    message: string,
    data?: any,
    error?: Error
  ): LogEntry {
    return {
      level,
      message,
      timestamp: Date.now(),
      data,
      error: error
        ? {
            message: error.message,
            stack: error.stack,
            name: error.name,
          }
        : undefined,
    };
  }

  private addLog(entry: LogEntry) {
    this.logs.push(entry);
    if (this.logs.length > this.maxLogs) {
      this.logs.shift(); // Remove oldest log
    }

    // In development, also log to console
    if (this.isDevelopment) {
      const timestamp = new Date(entry.timestamp).toISOString();
      const logMessage = `[${timestamp}] [${entry.level}] ${entry.message}`;

      switch (entry.level) {
        case LogLevel.DEBUG:
          console.debug(logMessage, entry.data || '');
          break;
        case LogLevel.INFO:
          console.info(logMessage, entry.data || '');
          break;
        case LogLevel.WARN:
          console.warn(logMessage, entry.data || '');
          break;
        case LogLevel.ERROR:
          console.error(logMessage, entry.data || '', entry.error || '');
          break;
      }
    }
  }

  debug(message: string, data?: any) {
    this.addLog(this.createLogEntry(LogLevel.DEBUG, message, data));
  }

  info(message: string, data?: any) {
    this.addLog(this.createLogEntry(LogLevel.INFO, message, data));
  }

  warn(message: string, data?: any) {
    this.addLog(this.createLogEntry(LogLevel.WARN, message, data));
  }

  error(message: string, data?: any, error?: Error) {
    this.addLog(this.createLogEntry(LogLevel.ERROR, message, data, error));
  }

  /**
   * Get recent logs (useful for debugging or crash reports)
   */
  getRecentLogs(count: number = 50): LogEntry[] {
    return this.logs.slice(-count);
  }

  /**
   * Get logs filtered by level
   */
  getLogsByLevel(level: LogLevel): LogEntry[] {
    return this.logs.filter((log) => log.level === level);
  }

  /**
   * Clear all logs
   */
  clearLogs() {
    this.logs = [];
  }

  /**
   * Export logs as JSON (useful for debugging)
   */
  exportLogs(): string {
    return JSON.stringify(this.logs, null, 2);
  }
}

// Export singleton instance
export const logger = new Logger();

// Convenience exports
export const logDebug = logger.debug.bind(logger);
export const logInfo = logger.info.bind(logger);
export const logWarn = logger.warn.bind(logger);
export const logError = logger.error.bind(logger);

