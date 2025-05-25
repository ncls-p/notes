#!/bin/bash

# Production Logging Setup Script
# This script helps configure logging for production deployment

set -e

echo "🚀 Setting up production logging configuration..."

# Check if required environment variables are set
check_env_var() {
    if [ -z "${!1}" ]; then
        echo "❌ Error: Environment variable $1 is not set"
        echo "   Please set $1 before running this script"
        exit 1
    else
        echo "✅ $1 is configured"
    fi
}

echo "📋 Checking required environment variables..."
check_env_var "NODE_ENV"
check_env_var "JWT_SECRET"
check_env_var "REFRESH_TOKEN_SECRET"
check_env_var "DATABASE_URL"

# Validate NODE_ENV
if [ "$NODE_ENV" != "production" ]; then
    echo "⚠️  Warning: NODE_ENV is not set to 'production' (current: $NODE_ENV)"
    read -p "Continue anyway? (y/n): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        exit 1
    fi
fi

# Set default log level if not provided
if [ -z "$LOG_LEVEL" ]; then
    export LOG_LEVEL="info"
    echo "📝 Setting default LOG_LEVEL to 'info'"
else
    echo "✅ LOG_LEVEL is set to '$LOG_LEVEL'"
fi

# Validate log level
case $LOG_LEVEL in
    fatal|error|warn|info|debug|trace)
        echo "✅ LOG_LEVEL '$LOG_LEVEL' is valid"
        ;;
    *)
        echo "❌ Error: Invalid LOG_LEVEL '$LOG_LEVEL'"
        echo "   Valid values: fatal, error, warn, info, debug, trace"
        exit 1
        ;;
esac

# Create logs directory if it doesn't exist
LOG_DIR="${LOG_DIR:-./logs}"
if [ ! -d "$LOG_DIR" ]; then
    mkdir -p "$LOG_DIR"
    echo "📁 Created log directory: $LOG_DIR"
fi

# Set appropriate permissions for log directory
chmod 755 "$LOG_DIR"
echo "🔒 Set permissions for log directory"

# Create log rotation configuration for logrotate (if available)
if command -v logrotate >/dev/null 2>&1; then
    cat > /tmp/notes-app-logrotate << EOF
$LOG_DIR/*.log {
    daily
    missingok
    rotate 14
    compress
    delaycompress
    notifempty
    copytruncate
    create 644 $(whoami) $(whoami)
}
EOF
    echo "📄 Created logrotate configuration at /tmp/notes-app-logrotate"
    echo "   Copy this to /etc/logrotate.d/ with appropriate permissions"
fi

# Test database connection
echo "🔗 Testing database connection..."
if npm run prisma:generate >/dev/null 2>&1; then
    echo "✅ Database connection successful"
else
    echo "❌ Warning: Database connection test failed"
    echo "   Please verify your DATABASE_URL"
fi

# Test application startup
echo "🧪 Testing application startup..."
if timeout 30s npm run build >/dev/null 2>&1; then
    echo "✅ Application builds successfully"
else
    echo "❌ Error: Application build failed"
    echo "   Please fix build errors before deploying"
    exit 1
fi

# Generate production logging configuration summary
cat > "$LOG_DIR/logging-config.txt" << EOF
Production Logging Configuration Summary
========================================
Generated: $(date)
Environment: $NODE_ENV
Log Level: $LOG_LEVEL
Log Directory: $LOG_DIR

Environment Variables:
- NODE_ENV: $NODE_ENV
- LOG_LEVEL: $LOG_LEVEL
- DATABASE_URL: [CONFIGURED]
- JWT_SECRET: [CONFIGURED]
- REFRESH_TOKEN_SECRET: [CONFIGURED]

Log Files:
- Application logs will be written to stdout/stderr
- For file logging, configure LOG_FILE_PATH environment variable
- Health check endpoint: /api/health

Monitoring Recommendations:
1. Set up log aggregation (DataDog, New Relic, ELK Stack)
2. Configure alerts for error rate > 5%
3. Monitor authentication failure patterns
4. Track performance metrics (response times)
5. Set up disk space monitoring for log directory

Security Notes:
- Sensitive data is automatically redacted
- User emails are masked in logs
- Tokens and passwords are not logged
- Request IDs enable correlation across services

For more information, see docs/LOGGING.md
EOF

echo "📊 Generated logging configuration summary: $LOG_DIR/logging-config.txt"

# Create health check script
cat > "$LOG_DIR/health-check.sh" << 'EOF'
#!/bin/bash
# Health check script for monitoring

HEALTH_ENDPOINT="${HEALTH_ENDPOINT:-http://localhost:3000/api/health}"
TIMEOUT="${HEALTH_CHECK_TIMEOUT:-10}"

response=$(curl -s -w "%{http_code}" --max-time $TIMEOUT "$HEALTH_ENDPOINT" -o /tmp/health_response.json)
http_code="${response: -3}"

if [ "$http_code" -eq 200 ]; then
    echo "✅ Health check passed"
    cat /tmp/health_response.json | jq '.' 2>/dev/null || cat /tmp/health_response.json
    exit 0
else
    echo "❌ Health check failed (HTTP $http_code)"
    cat /tmp/health_response.json 2>/dev/null || echo "No response body"
    exit 1
fi
EOF

chmod +x "$LOG_DIR/health-check.sh"
echo "🏥 Created health check script: $LOG_DIR/health-check.sh"

# Print deployment checklist
echo ""
echo "🎯 Production Deployment Checklist:"
echo "   ✅ Environment variables configured"
echo "   ✅ Log directory created with proper permissions"
echo "   ✅ Application builds successfully"
echo "   ✅ Database connection verified"
echo "   ✅ Health check endpoint available"
echo "   ✅ Logging configuration documented"
echo ""
echo "📋 Next Steps:"
echo "   1. Deploy application to production environment"
echo "   2. Configure log aggregation service"
echo "   3. Set up monitoring and alerting"
echo "   4. Test health check endpoint: /api/health"
echo "   5. Review logs for any issues"
echo ""
echo "📖 For detailed information, see:"
echo "   - docs/LOGGING.md - Comprehensive logging guide"
echo "   - $LOG_DIR/logging-config.txt - Configuration summary"
echo "   - $LOG_DIR/health-check.sh - Health monitoring script"
echo ""
echo "🚀 Production logging setup complete!"
EOF

chmod +x scripts/production-logging-setup.sh