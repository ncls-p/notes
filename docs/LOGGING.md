# Logging System Documentation

This document describes the comprehensive logging system implemented in the Notes application.

## Overview

The application uses a structured logging approach with different loggers for server-side and client-side operations:

- **Server-side**: [Pino](https://github.com/pinojs/pino) for high-performance structured logging
- **Client-side**: Custom logger for browser environments with sanitization and context management

## Server-Side Logging

### Logger Configuration

The main logger is configured in [`lib/logger.ts`](../lib/logger.ts) with:

- **Development**: Pretty-printed logs with colors and readable format
- **Production**: Structured JSON logs optimized for log aggregation services
- **Automatic redaction**: Sensitive data (passwords, tokens) is automatically redacted

### Specialized Loggers

- `authLogger`: Authentication and authorization events
- `apiLogger`: API route operations
- `dbLogger`: Database operations
- `middlewareLogger`: Middleware processing

### Log Levels

- `fatal`: System is unusable
- `error`: Error conditions
- `warn`: Warning conditions
- `info`: Informational messages (default for production)
- `debug`: Debug-level messages (default for development)
- `trace`: Very detailed debug information

### Usage Examples

```typescript
import { authLogger, logError, logPerformance } from "@/lib/logger";

// Basic logging
authLogger.info("User login attempt", { email: "user@example.com" });

// Error logging with context
logError(authLogger, error, { userId: "123", operation: "login" });

// Performance logging
const startTime = Date.now();
// ... operation ...
logPerformance(authLogger, "login", startTime, { userId: "123" });

// Security events
logSecurityEvent("auth_failure", {
  userId: "123",
  reason: "invalid_password",
});
```

## Client-Side Logging

### Logger Configuration

Client-side logging is handled by [`lib/clientLogger.ts`](../lib/clientLogger.ts) with features:

- **Automatic sanitization**: Sensitive data is redacted before logging
- **Session tracking**: Each browser session gets a unique ID
- **User context**: Logs include user ID when authenticated
- **Performance timing**: Built-in performance measurement tools

### Usage Examples

```typescript
import { clientLogger } from "@/lib/clientLogger";

// Basic logging
clientLogger.info("Component mounted", { component: "Dashboard" });

// Authentication events
clientLogger.logAuthEvent("login_success", { method: "email" });

// Business events
clientLogger.logBusinessEvent("note_created", { noteId: "123" });

// Network requests
clientLogger.logRequest("POST", "/api/notes");
clientLogger.logResponse("POST", "/api/notes", 201, 150);

// Error logging
clientLogger.logError(error, { component: "NoteEditor" });
```

## Environment Configuration

Configure logging through environment variables:

```bash
# Log level (fatal, error, warn, info, debug, trace)
LOG_LEVEL=info

# Environment (affects log format)
NODE_ENV=production
```

## Logging in Different Components

### API Routes

All API routes include:

- Request/response logging with timing
- Database operation logging
- Error logging with context
- Security event logging for auth operations
- Performance monitoring

Example implementation in [`app/api/auth/login/route.ts`](../app/api/auth/login/route.ts).

### Middleware

The authentication middleware includes:

- Request processing logging
- Authentication success/failure events
- Security event logging
- Performance monitoring

See [`middleware.ts`](../middleware.ts) for implementation.

### React Components

Client components use the client logger for:

- Component lifecycle events
- User interaction tracking
- API request/response logging
- Error boundary logging

Example in [`contexts/AuthContext.tsx`](../contexts/AuthContext.tsx).

## Log Structure

### Server Logs (JSON)

```json
{
  "level": "info",
  "time": "2025-01-25T09:24:32.123Z",
  "service": "notes-app",
  "version": "0.1.0",
  "environment": "production",
  "module": "auth",
  "requestId": "abc123",
  "userId": "user123",
  "msg": "Login successful",
  "email": "use***@example.com",
  "duration": 145
}
```

### Client Logs

```
[2025-01-25T09:24:32.123Z] [INFO] [User: user123] [Session: client_ab...] Login successful | {"method":"email","duration":145}
```

## Security and Privacy

### Data Redaction

Sensitive information is automatically redacted:

- Passwords and password hashes
- JWT tokens (access and refresh)
- Authorization headers
- Cookie values

### Privacy Protection

- Email addresses are masked in logs (first 3 characters + domain)
- User IDs are included for debugging but personal data is protected
- Request/response bodies containing sensitive data are sanitized

## Production Considerations

### Log Retention

- Configure log rotation and retention policies
- Consider using log aggregation services (DataDog, New Relic, ELK Stack)
- Monitor log volume to prevent disk space issues

### Performance

- Pino is used for high-performance logging (minimal performance impact)
- Asynchronous logging prevents blocking operations
- Log levels can be adjusted to reduce volume in production

### Monitoring and Alerting

Set up alerts for:

- Error rate spikes
- Authentication failures
- Performance degradation
- Security events

### Log Aggregation

For production deployments, consider integrating with:

- **DataDog**: APM and log management
- **New Relic**: Application monitoring
- **ELK Stack**: Elasticsearch, Logstash, Kibana
- **Grafana + Loki**: Open-source log aggregation

## Testing

Logging is integrated into the test suite:

- Unit tests verify log output
- Integration tests check log correlation
- Security tests validate data redaction

## Troubleshooting

### Common Issues

1. **Missing logs**: Check log level configuration
2. **Sensitive data in logs**: Verify redaction configuration
3. **Performance impact**: Adjust log level or output format
4. **Missing context**: Ensure request ID propagation

### Debug Mode

Enable debug logging for troubleshooting:

```bash
LOG_LEVEL=debug npm run dev
```

### Log Analysis

Use the structured format for analysis:

```bash
# Filter by user
cat logs.json | grep '"userId":"user123"'

# Filter by error level
cat logs.json | grep '"level":"error"'

# Performance analysis
cat logs.json | grep '"operation":"login"' | jq '.duration'
```

## Future Enhancements

- Real-time log streaming
- Log-based metrics and dashboards
- Automated anomaly detection
- Integration with error tracking services (Sentry)
- Custom log formatters for different environments
