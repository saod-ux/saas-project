/**
 * Structured Logging System
 * 
 * Provides consistent, structured logging across the application with tenant context,
 * request tracing, and proper log levels for production monitoring.
 */

export enum LogLevel {
  ERROR = 'error',
  WARN = 'warn',
  INFO = 'info',
  DEBUG = 'debug',
}

export interface LogContext {
  tenantId?: string;
  tenantSlug?: string;
  userId?: string;
  requestId?: string;
  operation?: string;
  duration?: number;
  [key: string]: any;
}

export interface LogEntry {
  timestamp: string;
  level: LogLevel;
  message: string;
  context?: LogContext;
  error?: {
    name: string;
    message: string;
    stack?: string;
  };
}

class Logger {
  private isDevelopment = process.env.NODE_ENV === 'development';
  private isProduction = process.env.NODE_ENV === 'production';

  private formatLogEntry(level: LogLevel, message: string, context?: LogContext, error?: Error): LogEntry {
    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      level,
      message,
    };

    if (context) {
      entry.context = context;
    }

    if (error) {
      entry.error = {
        name: error.name,
        message: error.message,
        stack: this.isDevelopment ? error.stack : undefined,
      };
    }

    return entry;
  }

  private shouldLog(level: LogLevel): boolean {
    if (this.isDevelopment) return true;
    
    // In production, only log INFO and above
    const levels = [LogLevel.ERROR, LogLevel.WARN, LogLevel.INFO];
    return levels.includes(level);
  }

  private output(entry: LogEntry): void {
    if (!this.shouldLog(entry.level)) return;

    if (this.isDevelopment) {
      // Pretty print for development
      const prefix = `[${entry.timestamp}] ${entry.level.toUpperCase()}`;
      const contextStr = entry.context ? ` ${JSON.stringify(entry.context)}` : '';
      const errorStr = entry.error ? `\nError: ${entry.error.name}: ${entry.error.message}` : '';
      
      console.log(`${prefix}: ${entry.message}${contextStr}${errorStr}`);
    } else {
      // Structured JSON for production
      console.log(JSON.stringify(entry));
    }
  }

  error(message: string, context?: LogContext, error?: Error): void {
    this.output(this.formatLogEntry(LogLevel.ERROR, message, context, error));
  }

  warn(message: string, context?: LogContext): void {
    this.output(this.formatLogEntry(LogLevel.WARN, message, context));
  }

  info(message: string, context?: LogContext): void {
    this.output(this.formatLogEntry(LogLevel.INFO, message, context));
  }

  debug(message: string, context?: LogContext): void {
    this.output(this.formatLogEntry(LogLevel.DEBUG, message, context));
  }

  // Convenience methods for common operations
  apiRequest(method: string, path: string, context?: LogContext): void {
    this.info(`API ${method} ${path}`, {
      ...context,
      operation: 'api_request',
    });
  }

  apiResponse(method: string, path: string, statusCode: number, duration: number, context?: LogContext): void {
    this.info(`API ${method} ${path} ${statusCode}`, {
      ...context,
      operation: 'api_response',
      statusCode,
      duration,
    });
  }

  tenantOperation(operation: string, tenantId: string, tenantSlug: string, context?: LogContext): void {
    this.info(`Tenant operation: ${operation}`, {
      ...context,
      operation,
      tenantId,
      tenantSlug,
    });
  }

  userOperation(operation: string, userId: string, context?: LogContext): void {
    this.info(`User operation: ${operation}`, {
      ...context,
      operation,
      userId,
    });
  }

  authEvent(event: string, userId?: string, context?: LogContext): void {
    this.info(`Auth event: ${event}`, {
      ...context,
      operation: 'auth',
      event,
      userId,
    });
  }

  databaseOperation(operation: string, collection: string, context?: LogContext): void {
    this.info(`Database ${operation}: ${collection}`, {
      ...context,
      operation: 'database',
      collection,
    });
  }

  storageOperation(operation: string, path: string, context?: LogContext): void {
    this.info(`Storage ${operation}: ${path}`, {
      ...context,
      operation: 'storage',
      path,
    });
  }

  performance(operation: string, duration: number, context?: LogContext): void {
    this.info(`Performance: ${operation}`, {
      ...context,
      operation: 'performance',
      duration,
    });
  }
}

// Export singleton instance
export const logger = new Logger();

// Export convenience functions
export const logError = (message: string, context?: LogContext, error?: Error) => 
  logger.error(message, context, error);

export const logWarn = (message: string, context?: LogContext) => 
  logger.warn(message, context);

export const logInfo = (message: string, context?: LogContext) => 
  logger.info(message, context);

export const logDebug = (message: string, context?: LogContext) => 
  logger.debug(message, context);

export const logApiRequest = (method: string, path: string, context?: LogContext) => 
  logger.apiRequest(method, path, context);

export const logApiResponse = (method: string, path: string, statusCode: number, duration: number, context?: LogContext) => 
  logger.apiResponse(method, path, statusCode, duration, context);

export const logTenantOperation = (operation: string, tenantId: string, tenantSlug: string, context?: LogContext) => 
  logger.tenantOperation(operation, tenantId, tenantSlug, context);

export const logUserOperation = (operation: string, userId: string, context?: LogContext) => 
  logger.userOperation(operation, userId, context);

export const logAuthEvent = (event: string, userId?: string, context?: LogContext) => 
  logger.authEvent(event, userId, context);

export const logDatabaseOperation = (operation: string, collection: string, context?: LogContext) => 
  logger.databaseOperation(operation, collection, context);

export const logStorageOperation = (operation: string, path: string, context?: LogContext) => 
  logger.storageOperation(operation, path, context);

export const logPerformance = (operation: string, duration: number, context?: LogContext) => 
  logger.performance(operation, duration, context);

