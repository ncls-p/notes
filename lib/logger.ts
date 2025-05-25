import pino from 'pino';

// Define log levels and their numeric values
const logLevels = {
  fatal: 60,
  error: 50,
  warn: 40,
  info: 30,
  debug: 20,
  trace: 10,
};

// Create base logger configuration
const createLogger = () => {
  const isDevelopment = process.env.NODE_ENV === 'development';
  const logLevel = process.env.LOG_LEVEL || (isDevelopment ? 'debug' : 'info');

  const baseConfig = {
    level: logLevel,
    timestamp: pino.stdTimeFunctions.isoTime,
    formatters: {
      level: (label: string) => {
        return { level: label };
      },
    },
    redact: {
      paths: [
        'password',
        'password_hash',
        'accessToken',
        'refreshToken',
        'authorization',
        'cookie',
        '*.password',
        '*.password_hash',
        '*.accessToken',
        '*.refreshToken',
        'req.headers.authorization',
        'req.headers.cookie',
      ],
      censor: '[REDACTED]',
    },
  };

  // Development configuration - temporarily disable pino-pretty to diagnose worker issues
  if (isDevelopment) {
    console.log('[DEBUG] Creating development logger without pino-pretty transport');
    return pino({
      ...baseConfig,
      // Temporarily comment out pino-pretty transport to test if it's causing worker crashes
      // transport: {
      //   target: 'pino-pretty',
      //   options: {
      //     colorize: true,
      //     translateTime: 'SYS:standard',
      //     ignore: 'pid,hostname',
      //     singleLine: false,
      //   },
      // },
    });
  }

  // Production configuration with structured JSON logging
  return pino({
    ...baseConfig,
    base: {
      service: 'notes-app',
      version: process.env.npm_package_version || '0.1.0',
      environment: process.env.NODE_ENV || 'production',
    },
  });
};

// Create the main logger instance
export const logger = createLogger();

// Create specialized loggers for different modules
export const authLogger = logger.child({ module: 'auth' });
export const apiLogger = logger.child({ module: 'api' });
export const dbLogger = logger.child({ module: 'database' });
export const middlewareLogger = logger.child({ module: 'middleware' });

// Utility function to create request-scoped logger
export const createRequestLogger = (requestId: string, method: string, url: string) => {
  return logger.child({
    requestId,
    method,
    url,
    module: 'request',
  });
};

// Performance logging utility
export const logPerformance = (
  logger: pino.Logger,
  operation: string,
  startTime: number,
  metadata?: Record<string, any>
) => {
  try {
    const duration = Date.now() - startTime;
    // Create a safe copy of metadata to avoid circular references
    const safeMetadata = metadata ? JSON.parse(JSON.stringify(metadata)) : {};
    logger.info({
      operation,
      duration,
      ...safeMetadata,
    }, `${operation} completed in ${duration}ms`);
  } catch (error) {
    console.log('[DEBUG] Error in logPerformance:', error);
    // Fallback logging without metadata
    logger.info({ operation, duration: Date.now() - startTime }, `${operation} completed`);
  }
};

// Error logging with stack trace
export const logError = (
  logger: pino.Logger,
  error: Error | unknown,
  context?: Record<string, any>
) => {
  if (error instanceof Error) {
    logger.error({
      error: {
        name: error.name,
        message: error.message,
        stack: error.stack,
      },
      ...context,
    }, error.message);
  } else {
    logger.error({
      error: String(error),
      ...context,
    }, 'Unknown error occurred');
  }
};

// Security event logging
export const logSecurityEvent = (
  eventType: 'auth_attempt' | 'auth_success' | 'auth_failure' | 'unauthorized_access' | 'suspicious_activity',
  details: Record<string, any>
) => {
  logger.warn({
    securityEvent: eventType,
    timestamp: new Date().toISOString(),
    ...details,
  }, `Security event: ${eventType}`);
};

// Database operation logging
export const logDatabaseOperation = (
  operation: string,
  table: string,
  duration?: number,
  metadata?: Record<string, any>
) => {
  try {
    // Create a safe copy of metadata to avoid circular references
    const safeMetadata = metadata ? JSON.parse(JSON.stringify(metadata)) : {};
    dbLogger.info({
      operation,
      table,
      duration,
      ...safeMetadata,
    }, `Database ${operation} on ${table}${duration ? ` (${duration}ms)` : ''}`);
  } catch (error) {
    console.log('[DEBUG] Error in logDatabaseOperation:', error);
    // Fallback logging without metadata
    dbLogger.info({ operation, table, duration }, `Database ${operation} on ${table}`);
  }
};

// Business logic logging
export const logBusinessEvent = (
  event: string,
  userId?: string,
  metadata?: Record<string, any>
) => {
  logger.info({
    businessEvent: event,
    userId,
    timestamp: new Date().toISOString(),
    ...metadata,
  }, `Business event: ${event}`);
};

export default logger;