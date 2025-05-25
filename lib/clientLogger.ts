// Client-side logging utility for browser environments
interface LogEntry {
  level: "debug" | "info" | "warn" | "error";
  message: string;
  timestamp: string;
  context?: Record<string, unknown>;
  userId?: string;
  sessionId?: string;
}

class ClientLogger {
  private logLevel: string;
  private sessionId: string;
  private userId?: string;

  constructor() {
    this.logLevel = process.env.NODE_ENV === "development" ? "debug" : "info";
    this.sessionId = this.generateSessionId();
  }

  private generateSessionId(): string {
    return (
      "client_" +
      Math.random().toString(36).substring(2, 15) +
      Date.now().toString(36)
    );
  }

  private shouldLog(level: string): boolean {
    const levels = ["debug", "info", "warn", "error"];
    const currentLevelIndex = levels.indexOf(this.logLevel);
    const messageLevelIndex = levels.indexOf(level);
    return messageLevelIndex >= currentLevelIndex;
  }

  setUserId(userId: string) {
    this.userId = userId;
  }

  clearUserId() {
    this.userId = undefined;
  }

  private createLogEntry(
    level: "debug" | "info" | "warn" | "error",
    message: string,
    context?: Record<string, unknown>,
  ): LogEntry {
    return {
      level,
      message,
      timestamp: new Date().toISOString(),
      context: this.sanitizeContext(context),
      userId: this.userId,
      sessionId: this.sessionId,
    };
  }

  private sanitizeContext(
    context?: Record<string, unknown>,
  ): Record<string, unknown> | undefined {
    if (!context) return undefined;

    // Remove sensitive information from context
    const sanitized = { ...context };
    const sensitiveKeys = [
      "password",
      "token",
      "accessToken",
      "refreshToken",
      "authorization",
    ];

    sensitiveKeys.forEach((key) => {
      if (sanitized[key]) {
        sanitized[key] = "[REDACTED]";
      }
    });

    return sanitized;
  }

  private formatMessage(entry: LogEntry): string {
    const contextStr = entry.context
      ? ` | ${JSON.stringify(entry.context)}`
      : "";
    const userStr = entry.userId ? ` [User: ${entry.userId}]` : "";
    const sessionStr = entry.sessionId
      ? ` [Session: ${entry.sessionId.substring(0, 8)}...]`
      : "";

    return `[${entry.timestamp}] [${entry.level.toUpperCase()}]${userStr}${sessionStr} ${entry.message}${contextStr}`;
  }

  debug(message: string, context?: Record<string, unknown>) {
    if (!this.shouldLog("debug")) return;

    const entry = this.createLogEntry("debug", message, context);
    console.debug(this.formatMessage(entry));
  }

  info(message: string, context?: Record<string, unknown>) {
    if (!this.shouldLog("info")) return;

    const entry = this.createLogEntry("info", message, context);
    console.info(this.formatMessage(entry));
  }

  warn(message: string, context?: Record<string, unknown>) {
    if (!this.shouldLog("warn")) return;

    const entry = this.createLogEntry("warn", message, context);
    console.warn(this.formatMessage(entry));
  }

  error(message: string, ...args: unknown[]) {
    if (typeof window !== "undefined") {
      console.error(`[CLIENT ERROR] ${message}`, ...args);
    }
  }

  // Performance logging
  time(label: string) {
    console.time(`[PERF] ${label}`);
  }

  timeEnd(label: string, context?: Record<string, unknown>) {
    console.timeEnd(`[PERF] ${label}`);
    if (context) {
      this.debug(`Performance: ${label} completed`, context);
    }
  }

  // Authentication specific logging
  logAuthEvent(
    event:
      | "login_attempt"
      | "login_success"
      | "login_failure"
      | "logout"
      | "token_refresh",
    context?: Record<string, unknown>,
  ) {
    this.info(`Auth event: ${event}`, {
      authEvent: event,
      ...context,
    });
  }

  // Business event logging
  logBusinessEvent(
    event: string,
    userId?: string,
    metadata?: Record<string, unknown>,
  ) {
    this.info(`[BUSINESS] ${event}`, { userId, ...metadata });
  }

  // Network request logging
  logRequest(method: string, url: string, context?: Record<string, unknown>) {
    this.debug(`${method} ${url}`, {
      requestType: "outgoing",
      method,
      url,
      ...context,
    });
  }

  logResponse(
    method: string,
    url: string,
    status: number,
    duration?: number,
    context?: Record<string, unknown>,
  ) {
    const level = status >= 400 ? "warn" : "debug";
    const message = `${method} ${url} → ${status}${duration ? ` (${duration}ms)` : ""}`;

    this[level](message, {
      requestType: "response",
      method,
      url,
      status,
      duration,
      ...context,
    });
  }

  // Error logging with optional error object
  logError(error: unknown, context?: Record<string, unknown>) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    const errorStack = error instanceof Error ? error.stack : undefined;
    this.error(errorMessage, {
      errorName: error instanceof Error ? error.name : undefined,
      errorStack,
      ...context,
    });
  }

  logPerformance(
    operation: string,
    startTime: number,
    metadata?: Record<string, unknown>,
  ) {
    const duration = Date.now() - startTime;
    this.info(
      `[PERFORMANCE] ${operation} completed in ${duration}ms`,
      metadata,
    );
  }

  logApiCall(
    method: string,
    url: string,
    duration: number,
    status?: number,
    metadata?: Record<string, unknown>,
  ) {
    const level = status && status >= 400 ? "error" : "info";
    this[level](
      `[API] ${method} ${url} - ${status || "unknown"} (${duration}ms)`,
      metadata,
    );
  }

  logUserAction(action: string, metadata?: Record<string, unknown>) {
    this.info(`[USER] ${action}`, metadata);
  }

  logComponentRender(
    componentName: string,
    metadata?: Record<string, unknown>,
  ) {
    if (process.env.NODE_ENV === "development") {
      this.debug(`[RENDER] ${componentName}`, metadata);
    }
  }

  logStateChange(
    stateName: string,
    oldValue: unknown,
    newValue: unknown,
    metadata?: Record<string, unknown>,
  ) {
    if (process.env.NODE_ENV === "development") {
      this.debug(`[STATE] ${stateName} changed`, {
        oldValue,
        newValue,
        ...metadata,
      });
    }
  }

  logNavigation(from: string, to: string, metadata?: Record<string, unknown>) {
    this.info(`[NAVIGATION] ${from} -> ${to}`, metadata);
  }

  logFeatureUsage(feature: string, metadata?: Record<string, unknown>) {
    this.info(`[FEATURE] ${feature} used`, metadata);
  }
}

// Create and export a singleton instance
export const clientLogger = new ClientLogger();

// Export the class for testing or multiple instances if needed
export default ClientLogger;
