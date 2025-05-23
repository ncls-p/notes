import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import * as argon2 from 'argon2';
import { sign } from 'jsonwebtoken';

const prisma = new PrismaClient();

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json();

    // Input validation
    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and password are required' },
        { status: 400 }
      );
    }

    // Find user by email
    const user = await prisma.user.findUnique({
      where: { email }
    });

    if (!user) {
      return NextResponse.json(
        { error: 'Invalid email or password' },
        { status: 401 }
      );
    }

    // Verify password
    const validPassword = await argon2.verify(user.password_hash, password);

    if (!validPassword) {
      return NextResponse.json(
        { error: 'Invalid email or password' },
        { status: 401 }
      );
    }

    // Generate JWT token
    const jwtSecret = process.env.JWT_SECRET;
    if (!jwtSecret) {
      throw new Error('JWT_SECRET is not configured');
    }

    const token = sign(
      { userId: user.id, email: user.email },
      jwtSecret,
      { expiresIn: '1d' }
    );

    return NextResponse.json(
      {
        token,
        user: {
          id: user.id,
          email: user.email
        }
      },
      {
        status: 200,
        headers: {
          'Set-Cookie': `auth_token=${token}; Path=/; HttpOnly; SameSite=Strict${process.env.NODE_ENV === 'production' ? '; Secure' : ''}`
        }
      }
    );
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
