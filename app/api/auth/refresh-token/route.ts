import { NextRequest, NextResponse } from 'next/server';
import jwt, { JwtPayload } from 'jsonwebtoken';
import { PrismaClient } from '@prisma/client';
import { cookies } from 'next/headers';

const prisma = new PrismaClient();

export async function POST(req: NextRequest) {
  const cookieStore = cookies();
  const refreshTokenCookie = cookieStore.get('refreshToken');

  if (!refreshTokenCookie) {
    return NextResponse.json({ error: 'Refresh token not found' }, { status: 401 });
  }

  const refreshToken = refreshTokenCookie.value;

  if (!process.env.REFRESH_TOKEN_SECRET || !process.env.JWT_SECRET) {
    console.error('JWT_SECRET or REFRESH_TOKEN_SECRET is not defined in environment variables.');
    return NextResponse.json({ error: 'Internal server configuration error' }, { status: 500 });
  }

  try {
    const decoded = jwt.verify(refreshToken, process.env.REFRESH_TOKEN_SECRET) as JwtPayload;

    if (typeof decoded !== 'object' || !decoded.userId) {
      return NextResponse.json({ error: 'Invalid refresh token payload' }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
    });

    if (!user) {
      // Potentially a compromised refresh token or deleted user
      // Clear the cookie as a precaution
      const response = NextResponse.json({ error: 'User not found or invalid token' }, { status: 403 });
      response.cookies.delete('refreshToken');
      return response;
    }

    // Generate new access token
    const newAccessToken = jwt.sign(
      { userId: user.id, email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: '15m' } // Standard short-lived access token
    );

    return NextResponse.json({ accessToken: newAccessToken });

  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      const response = NextResponse.json({ error: 'Refresh token expired' }, { status: 401 });
      response.cookies.delete('refreshToken'); // Clear expired token
      return response;
    }
    if (error instanceof jwt.JsonWebTokenError) {
      const response = NextResponse.json({ error: 'Invalid refresh token' }, { status: 401 });
      response.cookies.delete('refreshToken'); // Clear invalid token
      return response;
    }
    console.error('Refresh token error:', error);
    return NextResponse.json({ error: 'Internal server error during token refresh' }, { status: 500 });
  }
}