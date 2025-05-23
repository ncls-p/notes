import { beforeAll, describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { PrismaClient } from '@prisma/client';
import * as argon2 from 'argon2';
import { verify } from 'jsonwebtoken';
import { NextRequest } from 'next/server';

// Mock PrismaClient
const mockPrismaInstance = {
  user: {
    create: vi.fn(),
    deleteMany: vi.fn(),
    findUnique: vi.fn(),
  }
};

vi.mock('@prisma/client', () => ({
  PrismaClient: vi.fn(() => mockPrismaInstance),
}));

// Mock JWT_SECRET
beforeAll(() => {
  process.env.JWT_SECRET = 'test-jwt-secret';
});

describe('/api/auth/login', () => {
  beforeEach(async () => {
    vi.resetAllMocks();
    mockPrismaInstance.user.create.mockReset();
    mockPrismaInstance.user.deleteMany.mockReset();
    mockPrismaInstance.user.findUnique.mockReset();

    // Setup test user
    const hashedPassword = await argon2.hash('StrongPassword123!');
    const mockUser = {
      id: 'user-1',
      email: 'testuser@example.com',
      password_hash: hashedPassword,
    };

    mockPrismaInstance.user.create.mockResolvedValue(mockUser);
    mockPrismaInstance.user.findUnique.mockResolvedValue(mockUser);
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  it('should authenticate a user with valid credentials', async () => {
    const { POST } = await import('../app/api/auth/login/route');

    const mockRequest = new NextRequest('http://localhost:3001/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'testuser@example.com',
        password: 'StrongPassword123!'
      })
    });

    const response = await POST(mockRequest);
    expect(response.status).toBe(200);

    const data = await response.json();
    expect(data).toHaveProperty('token');
    expect(data).toHaveProperty('user.id');
    expect(data).toHaveProperty('user.email', 'testuser@example.com');
    expect(data).not.toHaveProperty('user.password_hash');

    // Verify JWT token
    const token = data.token;
    const decoded = verify(token, process.env.JWT_SECRET!);
    expect(decoded).toHaveProperty('userId');
    expect(decoded).toHaveProperty('email', 'testuser@example.com');
  });

  it('should reject invalid credentials', async () => {
    const { POST } = await import('../app/api/auth/login/route');

    const mockRequest = new NextRequest('http://localhost:3001/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'testuser@example.com',
        password: 'WrongPassword123!'
      })
    });

    const response = await POST(mockRequest);
    expect(response.status).toBe(401);
    const data = await response.json();
    expect(data).toHaveProperty('error', 'Invalid email or password');
  });

  it('should require email and password', async () => {
    const { POST } = await import('../app/api/auth/login/route');

    const mockRequest = new NextRequest('http://localhost:3001/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({})
    });

    const response = await POST(mockRequest);
    expect(response.status).toBe(400);
    const data = await response.json();
    expect(data).toHaveProperty('error', 'Email and password are required');
  });
});
