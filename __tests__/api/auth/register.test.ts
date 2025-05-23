import { POST } from '@/app/api/auth/register/route';
import { PrismaClient } from '@prisma/client';
import { hash } from 'argon2';
import { NextRequest } from 'next/server';

// Mocks
jest.mock('@prisma/client', () => ({
  PrismaClient: jest.fn().mockImplementation(() => ({
    user: {
      findUnique: jest.fn(),
      create: jest.fn(),
    },
  })),
}));

jest.mock('argon2', () => ({
  hash: jest.fn(),
}));

const mockPrisma = new PrismaClient();
const mockHash = hash as jest.Mock;

describe('/api/auth/register POST', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  const mockRequest = (body: any): NextRequest => {
    return {
      json: async () => body,
    } as NextRequest;
  };

  it('should return 400 for invalid email format', async () => {
    const req = mockRequest({ email: 'invalid-email', password: 'Password123!' });
    const response = await POST(req);
    const json = await response.json();

    expect(response.status).toBe(400);
    expect(json.error).toBe('Invalid input');
    expect(json.details.email).toContain('Invalid email address');
  });

  it('should return 400 for weak password', async () => {
    const req = mockRequest({ email: 'test@example.com', password: 'weak' });
    const response = await POST(req);
    const json = await response.json();

    expect(response.status).toBe(400);
    expect(json.error).toBe('Invalid input');
    expect(json.details.password).toBeDefined();
  });

  it('should return 400 for password without uppercase', async () => {
    const req = mockRequest({ email: 'test@example.com', password: 'password123!' });
    const response = await POST(req);
    const json = await response.json();
    expect(response.status).toBe(400);
    expect(json.details.password).toContain('Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character');
  });

  it('should return 400 for password without lowercase', async () => {
    const req = mockRequest({ email: 'test@example.com', password: 'PASSWORD123!' });
    const response = await POST(req);
    const json = await response.json();
    expect(response.status).toBe(400);
    expect(json.details.password).toContain('Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character');
  });

  it('should return 400 for password without number', async () => {
    const req = mockRequest({ email: 'test@example.com', password: 'Password!' });
    const response = await POST(req);
    const json = await response.json();
    expect(response.status).toBe(400);
    expect(json.details.password).toContain('Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character');
  });

  it('should return 400 for password without special character', async () => {
    const req = mockRequest({ email: 'test@example.com', password: 'Password123' });
    const response = await POST(req);
    const json = await response.json();
    expect(response.status).toBe(400);
    expect(json.details.password).toContain('Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character');
  });


  it('should return 409 if email already registered', async () => {
    (mockPrisma.user.findUnique as jest.Mock).mockResolvedValue({ id: '1', email: 'test@example.com' });
    const req = mockRequest({ email: 'test@example.com', password: 'Password123!' });
    const response = await POST(req);
    const json = await response.json();

    expect(response.status).toBe(409);
    expect(json.error).toBe('Email already registered');
  });

  it('should hash password and create user successfully', async () => {
    (mockPrisma.user.findUnique as jest.Mock).mockResolvedValue(null);
    mockHash.mockResolvedValue('hashed_password');
    const mockUser = { id: '1', email: 'new@example.com', password_hash: 'hashed_password', createdAt: new Date() };
    (mockPrisma.user.create as jest.Mock).mockResolvedValue(mockUser);

    const req = mockRequest({ email: 'new@example.com', password: 'Password123!' });
    const response = await POST(req);
    const json = await response.json();

    expect(response.status).toBe(201);
    expect(mockHash).toHaveBeenCalledWith('Password123!');
    expect(mockPrisma.user.create).toHaveBeenCalledWith({
      data: { email: 'new@example.com', password_hash: 'hashed_password' },
    });
    expect(json.id).toBe(mockUser.id);
    expect(json.email).toBe(mockUser.email);
  });

  it('should return 500 on Prisma error during findUnique', async () => {
    (mockPrisma.user.findUnique as jest.Mock).mockRejectedValue(new Error('DB error'));
    const req = mockRequest({ email: 'test@example.com', password: 'Password123!' });
    const response = await POST(req);
    const json = await response.json();

    expect(response.status).toBe(500);
    expect(json.error).toBe('Internal server error');
  });

  it('should return 500 on Argon2 error', async () => {
    (mockPrisma.user.findUnique as jest.Mock).mockResolvedValue(null);
    mockHash.mockRejectedValue(new Error('Hashing error'));
    const req = mockRequest({ email: 'test@example.com', password: 'Password123!' });
    const response = await POST(req);
    const json = await response.json();

    expect(response.status).toBe(500);
    expect(json.error).toBe('Internal server error');
  });

  it('should return 500 on Prisma error during create', async () => {
    (mockPrisma.user.findUnique as jest.Mock).mockResolvedValue(null);
    mockHash.mockResolvedValue('hashed_password');
    (mockPrisma.user.create as jest.Mock).mockRejectedValue(new Error('DB error'));

    const req = mockRequest({ email: 'test@example.com', password: 'Password123!' });
    const response = await POST(req);
    const json = await response.json();

    expect(response.status).toBe(500);
    expect(json.error).toBe('Internal server error');
  });
});