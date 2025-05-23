import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { hash } from 'argon2';
import { z } from 'zod';

const prisma = new PrismaClient();

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
  try {
    const body = await request.json();
    const validation = registerSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json({ error: 'Invalid input', details: validation.error.flatten().fieldErrors }, { status: 400 });
    }

    const { email, password } = validation.data;

    // Check for existing user
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return NextResponse.json({ error: 'Email already registered' }, { status: 409 });
    }

    // Hash password
    const password_hash = await hash(password);

    const user = await prisma.user.create({
      data: { email, password_hash }
    });

    return NextResponse.json(
      { id: user.id, email: user.email, createdAt: user.createdAt },
      { status: 201 }
    );
  } catch (_err) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
