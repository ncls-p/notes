import { NextResponse } from 'next/server';
import { hash } from 'argon2';
import { z } from 'zod';
import { authLogger, logError, logSecurityEvent, logDatabaseOperation, logPerformance, logBusinessEvent } from '@/lib/logger';
import prisma from '@/lib/db';

const passwordValidation = new RegExp(
  /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?~`]).{8,}$/
);

const registerSchema = z.object({
  email: z.string().email({ message: 'Invalid email address' }),
  password: z.string().min(8, { message: 'Password must be at least 8 characters long' }).regex(passwordValidation, {
    message: 'Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character'
  })
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
    operation: 'register',
    userAgent,
    clientIP
  });

  logger.info('Registration attempt started');

  try {
    const body = await request.json();
    const validation = registerSchema.safeParse(body);

    if (!validation.success) {
      logger.warn({
        validationErrors: validation.error.flatten().fieldErrors,
        email: body.email ? body.email.substring(0, 3) + '***' : 'missing',
      }, 'Registration validation failed');

      logSecurityEvent('auth_attempt', {
        requestId,
        operation: 'register',
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

    logger.info({ email: maskedEmail }, 'Checking for existing user');

    // Check for existing user with timing
    const existingUserStartTime = Date.now();
    const existing = await prisma.user.findUnique({ where: { email } });
    logDatabaseOperation('findUnique', 'user', Date.now() - existingUserStartTime, {
      email: maskedEmail,
      operation: 'check_existing'
    });

    if (existing) {
      logger.warn({ email: maskedEmail }, 'Registration failed: email already exists');

      logSecurityEvent('auth_attempt', {
        requestId,
        operation: 'register',
        email: maskedEmail,
        result: 'email_exists',
        userAgent,
        clientIP,
      });

      return NextResponse.json({ error: 'Email already registered' }, { status: 409 });
    }

    // Hash password with timing
    logger.debug({ email: maskedEmail }, 'Hashing password');
    const hashStartTime = Date.now();
    const password_hash = await hash(password);
    const hashDuration = Date.now() - hashStartTime;

    // Create user with timing
    logger.info({ email: maskedEmail }, 'Creating new user');
    const createUserStartTime = Date.now();
    const user = await prisma.user.create({
      data: { email, password_hash }
    });
    logDatabaseOperation('create', 'user', Date.now() - createUserStartTime, {
      userId: user.id,
      email: maskedEmail
    });

    logger.info({
      userId: user.id,
      email: maskedEmail,
      hashDuration,
      totalDuration: Date.now() - startTime,
    }, 'User registration successful');

    logBusinessEvent('user_registered', user.id, {
      requestId,
      email: maskedEmail,
      userAgent,
      clientIP,
    });

    logPerformance(logger, 'register', startTime, {
      userId: user.id,
      hashDuration,
    });

    return NextResponse.json(
      { id: user.id, email: user.email, createdAt: user.createdAt },
      { status: 201 }
    );
  } catch (error) {
    logError(logger, error, {
      requestId,
      operation: 'register',
      duration: Date.now() - startTime,
      userAgent,
      clientIP,
    });

    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
