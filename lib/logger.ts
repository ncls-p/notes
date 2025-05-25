import pino from "pino";

// Define log levels and their numeric values
const _LOG_LEVEL = process.env.LOG_LEVEL || "info";

const _logLevels = {
  fatal: 60,
  error: 50,
  warn: 40,
  info: 30,
  debug: 20,
  trace: 10,
};

// Create base logger configuration
const createLogger = () => {
  const isDevelopment = process.env.NODE_ENV === "development";
  const logLevel = process.env.LOG_LEVEL || (isDevelopment ? "debug" : "info");

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
        "password",
        "password_hash",
        "accessToken",
        "refreshToken",
        "authorization",
        "cookie",
        "*.password",
        "*.password_hash",
        "*.accessToken",
        "*.refreshToken",
        "req.headers.authorization",
        "req.headers.cookie",
      ],
      censor: "[REDACTED]",
    },
  };

  // Development configuration - temporarily disable pino-pretty to diagnose worker issues
  if (isDevelopment) {
    console.log(
      "[DEBUG] Creating development logger without pino-pretty transport",
    );
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
      service: "notes-app",
      version: process.env.npm_package_version || "0.1.0",
      environment: process.env.NODE_ENV || "production",
    },
  });
};

// Create the main logger instance
export const logger = createLogger();

// Create specialized loggers for different modules
export const authLogger = logger.child({ module: "auth" });
export const apiLogger = logger.child({ module: "api" });
export const dbLogger = logger.child({ module: "database" });
export const middlewareLogger = logger.child({ module: "middleware" });

// Utility function to create request-scoped logger
export const createRequestLogger = (
  requestId: string,
  method: string,
  url: string,
) => {
  return logger.child({
    requestId,
    method,
    url,
    module: "request",
  });
};

// Performance logging utility
export const logPerformance = (
  logger: pino.Logger,
  operation: string,
  startTime: number,
  metadata?: Record<string, unknown>,
) => {
  const duration = Date.now() - startTime;
  logger.info(`${operation} completed in ${duration}ms`, {
    operation,
    duration,
    ...metadata,
  });
};

// Error logging with stack trace
export const logError = (
  logger: pino.Logger,
  error: unknown,
  context?: Record<string, unknown>,
) => {
  const errorMessage = error instanceof Error ? error.message : String(error);
  const errorStack = error instanceof Error ? error.stack : undefined;

  logger.error(errorMessage, {
    errorName: error instanceof Error ? error.name : undefined,
    errorStack,
    ...context,
  });
};

// Security event logging
export const logSecurityEvent = (
  eventType:
    | "auth_attempt"
    | "auth_success"
    | "auth_failure"
    | "unauthorized_access"
    | "suspicious_activity",
  details: Record<string, unknown>,
) => {
  logger.warn(
    {
      securityEvent: eventType,
      timestamp: new Date().toISOString(),
      ...details,
    },
    `Security event: ${eventType}`,
  );
};

// Database operation logging
export const logDatabaseOperation = (
  operation: string,
  table: string,
  duration: number,
  metadata?: Record<string, unknown>,
) => {
  apiLogger.debug(`Database ${operation} on ${table} took ${duration}ms`, {
    operation,
    table,
    duration,
    ...metadata,
  });
};

// Business logic logging
export const logBusinessEvent = (
  event: string,
  userId: string,
  metadata?: Record<string, unknown>,
) => {
  apiLogger.info(`Business event: ${event}`, {
    businessEvent: event,
    userId,
    ...metadata,
  });
};

export default logger;
