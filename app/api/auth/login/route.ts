import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { z } from 'zod';
import { verify } from 'argon2';
import jwt from 'jsonwebtoken';

const prisma = new PrismaClient();

// Zod schema for login input validation (will be defined in Task-UM-002.2)
const loginSchema = z.object({
  email: z.string().email({ message: "Invalid email address" }),
  password: z.string().min(1, { message: "Password is required" }), // Basic check, can be enhanced if needed
});

export async function POST(request: Request) {
  try {
    const body = await request.json();

    const validation = loginSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json({ error: 'Invalid input', details: validation.error.flatten().fieldErrors }, { status: 400 });
    }
    const { email, password } = validation.data;

    const user = await prisma.user.findUnique({ where: { email } });

    if (!user || !user.password_hash) { // Also check if password_hash exists
      return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
    }

    const isValidPassword = await verify(user.password_hash, password);
    if (!isValidPassword) {
      return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
    }

    if (!process.env.JWT_SECRET || !process.env.REFRESH_TOKEN_SECRET) {
      console.error('JWT_SECRET or REFRESH_TOKEN_SECRET not defined');
      return NextResponse.json({ error: 'Internal server configuration error' }, { status: 500 });
    }

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

    return response;

  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
