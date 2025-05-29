import { NextResponse } from 'next/server';
import { z } from 'zod';
import { verify } from 'argon2';
import jwt from 'jsonwebtoken';
import { authLogger, logError, logSecurityEvent, logDatabaseOperation, logPerformance } from '@/lib/logger';
import prisma from '@/lib/db';

// Zod schema for login input validation (will be defined in Task-UM-002.2)
const loginSchema = z.object({
  email: z.string().email({ message: "Invalid email address" }),
  password: z.string().min(1, { message: "Password is required" }), // Basic check, can be enhanced if needed
});

export async function POST(request: Request) {
  const startTime = Date.now();
  const requestId = request.headers.get('x-request-id') || 'unknown';
  const userAgent = request.headers.get('user-agent') || 'unknown';
  const clientIP = request.headers.get('x-forwarded-for') ||
                   request.headers.get('x-real-ip') ||
                   'unknown';

  const logger = authLogger.child({
    requestId,
    operation: 'login',
    userAgent,
    clientIP
  });

  logger.info('Login attempt started');

  try {
    const body = await request.json();

    // Validate input
    const validation = loginSchema.safeParse(body);
    if (!validation.success) {
      logger.warn({
        validationErrors: validation.error.flatten().fieldErrors,
        email: body.email ? body.email.substring(0, 3) + '***' : 'missing', // Partial email for debugging
      }, 'Login validation failed');

      logSecurityEvent('auth_attempt', {
        requestId,
        email: body.email ? body.email.substring(0, 3) + '***' : 'missing',
        result: 'validation_failed',
        userAgent,
        clientIP,
      });

      return NextResponse.json({
        error: 'Invalid input',
        details: validation.error.flatten().fieldErrors
      }, { status: 400 });
    }

    const { email, password } = validation.data;
    const maskedEmail = email.substring(0, 3) + '***@' + email.split('@')[1];

    logger.info({ email: maskedEmail }, 'Attempting to find user');

    // Database lookup with timing
    const dbStartTime = Date.now();
    const user = await prisma.user.findUnique({ where: { email } });
    logDatabaseOperation('findUnique', 'user', Date.now() - dbStartTime, { email: maskedEmail });

    if (!user || !user.password_hash) {
      logger.warn({ email: maskedEmail }, 'Login failed: user not found or no password hash');

      logSecurityEvent('auth_failure', {
        requestId,
        email: maskedEmail,
        reason: 'user_not_found',
        userAgent,
        clientIP,
      });

      // Add a small delay to prevent timing attacks
      await new Promise(resolve => setTimeout(resolve, 100));

      return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
    }

    // Password verification with timing
    const passwordStartTime = Date.now();
    const isValidPassword = await verify(user.password_hash, password);
    const passwordVerificationTime = Date.now() - passwordStartTime;

    if (!isValidPassword) {
      logger.warn({
        email: maskedEmail,
        userId: user.id,
        passwordVerificationTime,
      }, 'Login failed: invalid password');

      logSecurityEvent('auth_failure', {
        requestId,
        userId: user.id,
        email: maskedEmail,
        reason: 'invalid_password',
        userAgent,
        clientIP,
      });

      return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
    }

    // Check environment configuration
    if (!process.env.JWT_SECRET || !process.env.REFRESH_TOKEN_SECRET) {
      logger.error('JWT secrets not configured');
      return NextResponse.json({ error: 'Internal server configuration error' }, { status: 500 });
    }

    // Generate tokens
    logger.debug({ userId: user.id }, 'Generating JWT tokens');

    const accessToken = jwt.sign(
      { userId: user.id, email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: '15m' }
    );
    const refreshToken = jwt.sign(
      { userId: user.id }, // Keep refresh token payload minimal
      process.env.REFRESH_TOKEN_SECRET,
      { expiresIn: '7d' }
    );

    const response = NextResponse.json({
      message: 'Login successful',
      user: { id: user.id, email: user.email },
      accessToken,
    });

    // Set refresh token in an HttpOnly cookie
    response.cookies.set('refreshToken', refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax', // Or 'strict'
      path: '/', // Make it available for /api/auth/refresh-token
      maxAge: 7 * 24 * 60 * 60, // 7 days in seconds
    });

    // Set auth_token cookie that middleware expects
    response.cookies.set('auth_token', accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 15 * 60, // 15 minutes (same as access token expiry)
    });

    // Log successful login
    logger.info({
      userId: user.id,
      email: maskedEmail,
      passwordVerificationTime,
      totalDuration: Date.now() - startTime,
    }, 'Login successful');

    logSecurityEvent('auth_success', {
      requestId,
      userId: user.id,
      email: maskedEmail,
      userAgent,
      clientIP,
    });

    logPerformance(logger, 'login', startTime, {
      userId: user.id,
      passwordVerificationTime,
    });

    return response;

  } catch (error) {
    logError(logger, error, {
      requestId,
      operation: 'login',
      duration: Date.now() - startTime,
      userAgent,
      clientIP,
    });

    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
