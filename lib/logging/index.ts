/**
 * Logging Module Exports
 * 
 * Centralized exports for the logging system.
 */

export * from './logger';
export * from './middleware';

// Re-export commonly used functions for convenience
export {
  logger,
  logError,
  logWarn,
  logInfo,
  logDebug,
  logApiRequest,
  logApiResponse,
  logTenantOperation,
  logUserOperation,
  logAuthEvent,
  logDatabaseOperation,
  logStorageOperation,
  logPerformance,
} from './logger';

export {
  withLogging,
  createRequestContext,
  extractTenantFromRequest,
} from './middleware';

