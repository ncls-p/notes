import { NextRequest, NextResponse } from 'next/server';
import { createRequestLogger, logPerformance } from '@/lib/logger';

// Generate a unique request ID compatible with Edge Runtime
const generateRequestId = (): string => {
  // Use crypto.getRandomValues for Edge Runtime compatibility
  if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
    const array = new Uint8Array(16);
    crypto.getRandomValues(array);
    return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
  }

  // Fallback for environments without crypto.getRandomValues
  return 'req_' + Math.random().toString(36).substring(2, 15) + Date.now().toString(36);
};

// Extract client IP address
const getClientIP = (request: NextRequest): string => {
  const forwarded = request.headers.get('x-forwarded-for');
  const realIP = request.headers.get('x-real-ip');
  const remoteAddr = request.headers.get('x-vercel-forwarded-for');

  if (forwarded) {
    return forwarded.split(',')[0].trim();
  }

  return realIP || remoteAddr || 'unknown';
};

// Extract user agent info
const getUserAgent = (request: NextRequest): string => {
  return request.headers.get('user-agent') || 'unknown';
};

// Log request details
export const logRequest = (request: NextRequest, requestId: string) => {
  const logger = createRequestLogger(
    requestId,
    request.method,
    request.nextUrl.pathname
  );

  logger.info({
    url: request.nextUrl.href,
    method: request.method,
    userAgent: getUserAgent(request),
    clientIP: getClientIP(request),
    referrer: request.headers.get('referer') || 'none',
    contentType: request.headers.get('content-type') || 'none',
  }, `Incoming ${request.method} request to ${request.nextUrl.pathname}`);

  return logger;
};

// Log response details
export const logResponse = (
  logger: ReturnType<typeof createRequestLogger>,
  response: NextResponse,
  startTime: number,
  statusCode?: number
) => {
  const duration = Date.now() - startTime;
  const status = statusCode || response.status;

  logger.info({
    statusCode: status,
    duration,
    contentType: response.headers.get('content-type') || 'none',
    contentLength: response.headers.get('content-length') || 'unknown',
  }, `Response ${status} sent in ${duration}ms`);

  // Log performance warnings for slow requests
  if (duration > 1000) {
    logger.warn({
      duration,
      performanceWarning: true,
    }, `Slow request detected: ${duration}ms`);
  }
};

// Create logging middleware for API routes
export const withRequestLogging = (
  handler: (request: NextRequest, context?: any) => Promise<NextResponse> | NextResponse
) => {
  return async (request: NextRequest, context?: any): Promise<NextResponse> => {
    const requestId = generateRequestId();
    const startTime = Date.now();
    const logger = logRequest(request, requestId);

    try {
      const response = await handler(request, context);
      logResponse(logger, response, startTime);

      // Add request ID to response headers for debugging
      response.headers.set('x-request-id', requestId);

      return response;
    } catch (error) {
      const errorResponse = NextResponse.json(
        { error: 'Internal Server Error' },
        { status: 500 }
      );

      logger.error({
        error: error instanceof Error ? {
          name: error.name,
          message: error.message,
          stack: error.stack,
        } : String(error),
        duration: Date.now() - startTime,
      }, `Request failed: ${error instanceof Error ? error.message : 'Unknown error'}`);

      logResponse(logger, errorResponse, startTime, 500);
      errorResponse.headers.set('x-request-id', requestId);

      return errorResponse;
    }
  };
};

// Middleware for logging and adding request context
export const requestLoggingMiddleware = (request: NextRequest) => {
  const requestId = generateRequestId();
  const startTime = Date.now();

  // Log the incoming request
  logRequest(request, requestId);

  // Add request context to headers
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set('x-request-id', requestId);
  requestHeaders.set('x-request-start-time', startTime.toString());

  return {
    requestId,
    startTime,
    headers: requestHeaders,
  };
};

export default withRequestLogging;