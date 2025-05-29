import { POST } from '@/app/api/auth/login/route';
import { PrismaClient } from '@prisma/client';
import { verify } from 'argon2';
import jwt from 'jsonwebtoken';
import { NextRequest } from 'next/server';

// Mocks
jest.mock('@prisma/client', () => {
  const mockPrismaClient = {
    user: {
      findUnique: jest.fn(),
    },
  };
  return { PrismaClient: jest.fn(() => mockPrismaClient) };
});

jest.mock('argon2', () => ({
  verify: jest.fn(),
}));

jest.mock('jsonwebtoken', () => ({
  sign: jest.fn(),
}));

describe('/api/auth/login POST', () => {
  let mockPrisma: PrismaClient;
  let originalEnv: NodeJS.ProcessEnv;

  beforeEach(() => {
    mockPrisma = new PrismaClient();
    jest.clearAllMocks();
    originalEnv = process.env;
    process.env = {
      ...originalEnv,
      JWT_SECRET: 'test-jwt-secret',
      REFRESH_TOKEN_SECRET: 'test-refresh-token-secret',
    };
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  const mockRequest = (body: any) => {
    return {
      json: jest.fn().mockResolvedValue(body),
      headers: {
        get: jest.fn().mockImplementation((headerName: string) => {
          // Return default values for commonly requested headers
          switch (headerName) {
            case 'x-request-id':
              return 'test-request-id';
            case 'user-agent':
              return 'jest-test-runner';
            case 'x-forwarded-for':
              return '127.0.0.1';
            case 'x-real-ip':
              return '127.0.0.1';
            default:
              return null;
          }
        }),
      },
    } as unknown as NextRequest;
  };

  it('should return 400 for invalid input (missing email)', async () => {
    const req = mockRequest({ password: 'Password123!' });
    const response = await POST(req);
    const json = await response.json();

    expect(response.status).toBe(400);
    expect(json.error).toBe('Invalid input');
    expect(json.details.email).toContain('Required'); // Zod default for missing required field
  });

  it('should return 400 for invalid input (invalid email format)', async () => {
    const req = mockRequest({ email: 'invalid-email', password: 'Password123!' });
    const response = await POST(req);
    const json = await response.json();

    expect(response.status).toBe(400);
    expect(json.error).toBe('Invalid input');
    expect(json.details.email).toContain('Invalid email address');
  });

  it('should return 400 for invalid input (missing password)', async () => {
    const req = mockRequest({ email: 'test@example.com' });
    const response = await POST(req);
    const json = await response.json();

    expect(response.status).toBe(400);
    expect(json.error).toBe('Invalid input');
    expect(json.details.password).toContain('Required'); // Zod default for missing required field
  });

  it('should return 401 if user is not found', async () => {
    (mockPrisma.user.findUnique as jest.Mock).mockResolvedValue(null);
    const req = mockRequest({ email: 'nonexistent@example.com', password: 'Password123!' });
    const response = await POST(req);
    const json = await response.json();

    expect(response.status).toBe(401);
    expect(json.error).toBe('Invalid credentials');
  });

  it('should return 401 if password_hash is missing on user object (edge case)', async () => {
    (mockPrisma.user.findUnique as jest.Mock).mockResolvedValue({
      id: '1',
      email: 'test@example.com',
      password_hash: null,
    });
    const req = mockRequest({ email: 'test@example.com', password: 'Password123!' });
    const response = await POST(req);
    const json = await response.json();

    expect(response.status).toBe(401);
    expect(json.error).toBe('Invalid credentials');
  });

  it('should return 401 if password verification fails', async () => {
    (mockPrisma.user.findUnique as jest.Mock).mockResolvedValue({
      id: '1',
      email: 'test@example.com',
      password_hash: 'hashed_password',
    });
    (verify as jest.Mock).mockResolvedValue(false);

    const req = mockRequest({ email: 'test@example.com', password: 'WrongPassword!' });
    const response = await POST(req);
    const json = await response.json();

    expect(response.status).toBe(401);
    expect(json.error).toBe('Invalid credentials');
  });

  it('should return 500 if JWT secrets are not defined', async () => {
    delete process.env.JWT_SECRET; // Temporarily remove for this test
    (mockPrisma.user.findUnique as jest.Mock).mockResolvedValue({
      id: '1',
      email: 'test@example.com',
      password_hash: 'hashed_password',
    });
    (verify as jest.Mock).mockResolvedValue(true);

    const req = mockRequest({ email: 'test@example.com', password: 'Password123!' });
    const response = await POST(req);
    const json = await response.json();

    expect(response.status).toBe(500);
    expect(json.error).toBe('Internal server configuration error');
  });

  it('should return 200 with tokens and user info on successful login', async () => {
    const mockUser = {
      id: 'user-123',
      email: 'test@example.com',
      password_hash: 'hashed_password',
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    (mockPrisma.user.findUnique as jest.Mock).mockResolvedValue(mockUser);
    (verify as jest.Mock).mockResolvedValue(true);
    (jwt.sign as jest.Mock)
      .mockImplementationOnce(() => 'mockAccessToken') // First call for access token
      .mockImplementationOnce(() => 'mockRefreshToken'); // Second call for refresh token

    const req = mockRequest({ email: 'test@example.com', password: 'Password123!' });
    const response = await POST(req);
    const json = await response.json();

    expect(response.status).toBe(200);
    expect(json.message).toBe('Login successful');
    expect(json.user).toEqual({ id: mockUser.id, email: mockUser.email });
    expect(json.accessToken).toBe('mockAccessToken');

    // Verify refreshToken cookie
    const refreshTokenCookie = response.cookies.get('refreshToken');
    expect(refreshTokenCookie?.value).toBe('mockRefreshToken');
    expect(refreshTokenCookie?.httpOnly).toBe(true);
    expect(refreshTokenCookie?.sameSite).toBe('lax');
    expect(refreshTokenCookie?.path).toBe('/');
    expect(refreshTokenCookie?.maxAge).toBe(7 * 24 * 60 * 60);

    // Verify auth_token cookie
    const authTokenCookie = response.cookies.get('auth_token');
    expect(authTokenCookie?.value).toBe('mockAccessToken');
    expect(authTokenCookie?.httpOnly).toBe(true);
    expect(authTokenCookie?.sameSite).toBe('lax');
    expect(authTokenCookie?.path).toBe('/');
    expect(authTokenCookie?.maxAge).toBe(15 * 60);

    expect(jwt.sign).toHaveBeenCalledWith(
      { userId: mockUser.id, email: mockUser.email },
      'test-jwt-secret',
      { expiresIn: '15m' }
    );
    expect(jwt.sign).toHaveBeenCalledWith({ userId: mockUser.id }, 'test-refresh-token-secret', {
      expiresIn: '7d',
    });
  });

  it('should return 500 if Prisma throws an error', async () => {
    (mockPrisma.user.findUnique as jest.Mock).mockRejectedValue(new Error('Prisma error'));
    const req = mockRequest({ email: 'test@example.com', password: 'Password123!' });
    const response = await POST(req);
    const json = await response.json();

    expect(response.status).toBe(500);
    expect(json.error).toBe('Internal server error');
  });

  it('should return 500 if argon2.verify throws an error', async () => {
    (mockPrisma.user.findUnique as jest.Mock).mockResolvedValue({
      id: '1',
      email: 'test@example.com',
      password_hash: 'hashed_password',
    });
    (verify as jest.Mock).mockRejectedValue(new Error('Argon2 error'));
    const req = mockRequest({ email: 'test@example.com', password: 'Password123!' });
    const response = await POST(req);
    const json = await response.json();

    expect(response.status).toBe(500);
    expect(json.error).toBe('Internal server error');
  });
});
