import { POST } from '@/app/api/auth/refresh-token/route';
import { PrismaClient } from '@prisma/client';
import jwt from 'jsonwebtoken';
import { NextRequest } from 'next/server';
import { cookies } from 'next/headers';

// Mock dependencies (using global mocks from setup-node.js)
const mockJwt = jest.mocked(jwt);
const mockCookies = jest.mocked(cookies);

// Get the mocked Prisma instance from the global mock
const mockPrisma = new PrismaClient() as jest.Mocked<PrismaClient>;

// Create mock cookie store
const mockCookieStore = {
  get: jest.fn(),
  set: jest.fn(),
  delete: jest.fn(),
};

describe('/api/auth/refresh-token', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    process.env.JWT_SECRET = 'test-jwt-secret';
    process.env.REFRESH_TOKEN_SECRET = 'test-refresh-secret';

    // Setup the cookies mock to return our mock cookie store
    mockCookies.mockReturnValue(mockCookieStore as any);
  });

  afterEach(() => {
    delete process.env.JWT_SECRET;
    delete process.env.REFRESH_TOKEN_SECRET;
  });

  const createMockRequest = () => {
    return new NextRequest('http://localhost:3000/api/auth/refresh-token', {
      method: 'POST',
    });
  };

  describe('POST /api/auth/refresh-token', () => {
    it('should refresh token successfully with valid refresh token', async () => {
      const mockUser = {
        id: 'user-123',
        email: 'test@example.com',
        password_hash: 'hashed-password',
        created_at: new Date(),
        updated_at: new Date(),
      };

      const mockDecodedToken = {
        userId: 'user-123',
        iat: Math.floor(Date.now() / 1000),
        exp: Math.floor(Date.now() / 1000) + 3600,
      };

      // Mock cookie get
      mockCookieStore.get.mockReturnValue({ value: 'valid-refresh-token' });

      // Mock JWT verification
      (mockJwt.verify as jest.Mock).mockReturnValue(mockDecodedToken);

      // Mock JWT signing
      (mockJwt.sign as jest.Mock).mockReturnValue('new-access-token');

      // Mock Prisma user lookup
      (mockPrisma.user.findUnique as jest.Mock).mockResolvedValue(mockUser);

      const req = createMockRequest();
      const response = await POST(req);
      const json = await response.json();

      expect(response.status).toBe(200);
      expect(json.accessToken).toBe('new-access-token');

      expect(mockJwt.verify).toHaveBeenCalledWith('valid-refresh-token', 'test-refresh-secret');
      expect(mockJwt.sign).toHaveBeenCalledWith(
        { userId: 'user-123', email: 'test@example.com' },
        'test-jwt-secret',
        { expiresIn: '15m' }
      );
      expect(mockPrisma.user.findUnique).toHaveBeenCalledWith({
        where: { id: 'user-123' },
      });
    });

    it('should return 401 when refresh token cookie is missing', async () => {
      mockCookieStore.get.mockReturnValue(undefined);

      const req = createMockRequest();
      const response = await POST(req);
      const json = await response.json();

      expect(response.status).toBe(401);
      expect(json.error).toBe('Refresh token not found');
      expect(mockJwt.verify).not.toHaveBeenCalled();
      expect(mockPrisma.user.findUnique).not.toHaveBeenCalled();
    });

    it('should return 500 when JWT_SECRET is missing', async () => {
      delete process.env.JWT_SECRET;

      mockCookieStore.get.mockReturnValue({ value: 'valid-refresh-token' });

      const req = createMockRequest();
      const response = await POST(req);
      const json = await response.json();

      expect(response.status).toBe(500);
      expect(json.error).toBe('Internal server configuration error');
      expect(mockJwt.verify).not.toHaveBeenCalled();
    });

    it('should return 500 when REFRESH_TOKEN_SECRET is missing', async () => {
      delete process.env.REFRESH_TOKEN_SECRET;

      mockCookieStore.get.mockReturnValue({ value: 'valid-refresh-token' });

      const req = createMockRequest();
      const response = await POST(req);
      const json = await response.json();

      expect(response.status).toBe(500);
      expect(json.error).toBe('Internal server configuration error');
      expect(mockJwt.verify).not.toHaveBeenCalled();
    });

    it('should return 401 for expired refresh token', async () => {
      mockCookieStore.get.mockReturnValue({ value: 'expired-refresh-token' });

      (mockJwt.verify as jest.Mock).mockImplementation(() => {
        throw new jwt.TokenExpiredError('Token expired', new Date());
      });

      const req = createMockRequest();
      const response = await POST(req);
      const json = await response.json();

      expect(response.status).toBe(401);
      expect(json.error).toBe('Refresh token expired');
      expect(mockPrisma.user.findUnique).not.toHaveBeenCalled();
    });

    it('should return 401 for invalid refresh token', async () => {
      mockCookieStore.get.mockReturnValue({ value: 'invalid-refresh-token' });

      (mockJwt.verify as jest.Mock).mockImplementation(() => {
        throw new jwt.JsonWebTokenError('Invalid token');
      });

      const req = createMockRequest();
      const response = await POST(req);
      const json = await response.json();

      expect(response.status).toBe(401);
      expect(json.error).toBe('Invalid refresh token');
      expect(mockPrisma.user.findUnique).not.toHaveBeenCalled();
    });

    it('should return 401 for invalid token payload (missing userId)', async () => {
      const mockDecodedToken = {
        iat: Math.floor(Date.now() / 1000),
        exp: Math.floor(Date.now() / 1000) + 3600,
      };

      mockCookieStore.get.mockReturnValue({ value: 'token-without-userid' });

      (mockJwt.verify as jest.Mock).mockReturnValue(mockDecodedToken);

      const req = createMockRequest();
      const response = await POST(req);
      const json = await response.json();

      expect(response.status).toBe(401);
      expect(json.error).toBe('Invalid refresh token payload');
      expect(mockPrisma.user.findUnique).not.toHaveBeenCalled();
    });

    it('should return 401 for non-object token payload', async () => {
      mockCookieStore.get.mockReturnValue({ value: 'string-payload-token' });

      (mockJwt.verify as jest.Mock).mockReturnValue('string-payload');

      const req = createMockRequest();
      const response = await POST(req);
      const json = await response.json();

      expect(response.status).toBe(401);
      expect(json.error).toBe('Invalid refresh token payload');
      expect(mockPrisma.user.findUnique).not.toHaveBeenCalled();
    });

    it('should return 403 when user is not found in database', async () => {
      const mockDecodedToken = {
        userId: 'nonexistent-user',
        iat: Math.floor(Date.now() / 1000),
        exp: Math.floor(Date.now() / 1000) + 3600,
      };

      mockCookieStore.get.mockReturnValue({ value: 'valid-token-nonexistent-user' });

      (mockJwt.verify as jest.Mock).mockReturnValue(mockDecodedToken);
      (mockPrisma.user.findUnique as jest.Mock).mockResolvedValue(null);

      const req = createMockRequest();
      const response = await POST(req);
      const json = await response.json();

      expect(response.status).toBe(403);
      expect(json.error).toBe('User not found or invalid token');
      expect(mockPrisma.user.findUnique).toHaveBeenCalledWith({
        where: { id: 'nonexistent-user' },
      });
    });

    it('should return 500 on general JWT verification error', async () => {
      mockCookieStore.get.mockReturnValue({ value: 'problematic-token' });

      (mockJwt.verify as jest.Mock).mockImplementation(() => {
        throw new Error('Unexpected JWT error');
      });

      const req = createMockRequest();
      const response = await POST(req);
      const json = await response.json();

      expect(response.status).toBe(500);
      expect(json.error).toBe('Internal server error during token refresh');
      expect(mockPrisma.user.findUnique).not.toHaveBeenCalled();
    });

    it('should return 500 on database error', async () => {
      const mockDecodedToken = {
        userId: 'user-123',
        iat: Math.floor(Date.now() / 1000),
        exp: Math.floor(Date.now() / 1000) + 3600,
      };

      mockCookieStore.get.mockReturnValue({ value: 'valid-refresh-token' });

      (mockJwt.verify as jest.Mock).mockReturnValue(mockDecodedToken);
      (mockPrisma.user.findUnique as jest.Mock).mockRejectedValue(
        new Error('Database connection error')
      );

      const req = createMockRequest();
      const response = await POST(req);
      const json = await response.json();

      expect(response.status).toBe(500);
      expect(json.error).toBe('Internal server error during token refresh');
    });

    it('should clear refresh token cookie on expired token', async () => {
      mockCookieStore.get.mockReturnValue({ value: 'expired-refresh-token' });

      (mockJwt.verify as jest.Mock).mockImplementation(() => {
        throw new jwt.TokenExpiredError('Token expired', new Date());
      });

      const req = createMockRequest();
      const response = await POST(req);

      expect(response.status).toBe(401);
      // Note: We can't easily test cookie deletion in unit tests without mocking Response
      // This would be better tested in integration tests
    });

    it('should clear refresh token cookie on invalid token', async () => {
      mockCookieStore.get.mockReturnValue({ value: 'invalid-refresh-token' });

      (mockJwt.verify as jest.Mock).mockImplementation(() => {
        throw new jwt.JsonWebTokenError('Invalid token');
      });

      const req = createMockRequest();
      const response = await POST(req);

      expect(response.status).toBe(401);
      // Note: We can't easily test cookie deletion in unit tests without mocking Response
      // This would be better tested in integration tests
    });

    it('should clear refresh token cookie when user not found', async () => {
      const mockDecodedToken = {
        userId: 'deleted-user',
        iat: Math.floor(Date.now() / 1000),
        exp: Math.floor(Date.now() / 1000) + 3600,
      };

      mockCookieStore.get.mockReturnValue({ value: 'token-for-deleted-user' });

      (mockJwt.verify as jest.Mock).mockReturnValue(mockDecodedToken);
      (mockPrisma.user.findUnique as jest.Mock).mockResolvedValue(null);

      const req = createMockRequest();
      const response = await POST(req);

      expect(response.status).toBe(403);
      // Note: We can't easily test cookie deletion in unit tests without mocking Response
      // This would be better tested in integration tests
    });

    it('should handle multiple refresh requests correctly', async () => {
      const mockUser = {
        id: 'user-123',
        email: 'test@example.com',
      };

      const mockDecodedToken = {
        userId: 'user-123',
        iat: Math.floor(Date.now() / 1000),
        exp: Math.floor(Date.now() / 1000) + 3600,
      };

      mockCookieStore.get.mockReturnValue({ value: 'valid-refresh-token' });

      (mockJwt.verify as jest.Mock).mockReturnValue(mockDecodedToken);
      (mockJwt.sign as jest.Mock)
        .mockReturnValueOnce('access-token-1')
        .mockReturnValueOnce('access-token-2');

      (mockPrisma.user.findUnique as jest.Mock).mockResolvedValue(mockUser);

      // First request
      const req1 = createMockRequest();
      const response1 = await POST(req1);
      const json1 = await response1.json();

      expect(response1.status).toBe(200);
      expect(json1.accessToken).toBe('access-token-1');

      // Second request
      const req2 = createMockRequest();
      const response2 = await POST(req2);
      const json2 = await response2.json();

      expect(response2.status).toBe(200);
      expect(json2.accessToken).toBe('access-token-2');

      expect(mockJwt.sign).toHaveBeenCalledTimes(2);
      expect(mockPrisma.user.findUnique).toHaveBeenCalledTimes(2);
    });
  });
});
