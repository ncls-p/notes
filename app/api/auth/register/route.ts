import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { createHash } from 'crypto';

const prisma = new PrismaClient();

export async function POST(request: Request) {
  try {
    const { email, password } = await request.json();

    // Basic input validation
    if (
      typeof email !== 'string' ||
      typeof password !== 'string' ||
      !email.match(/^[^@]+@[^@]+\.[^@]+$/) ||
      password.length < 8
    ) {
      return NextResponse.json({ error: 'Invalid email or password' }, { status: 400 });
    }

    // Check for existing user
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return NextResponse.json({ error: 'Email already registered' }, { status: 409 });
    }

    // Hash password (using Node.js crypto as placeholder; replace with Argon2id in production)
    const password_hash = createHash('sha256').update(password).digest('hex');

    const user = await prisma.user.create({
      data: { email, password_hash }
    });

    return NextResponse.json(
      { id: user.id, email: user.email, createdAt: user.createdAt },
      { status: 201 }
    );
  } catch (err) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
