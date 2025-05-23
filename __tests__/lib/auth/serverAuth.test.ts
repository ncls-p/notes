import { withAuth, AuthenticatedRequest } from '@/lib/auth/serverAuth';
import { NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';

// Mock jsonwebtoken
jest.mock('jsonwebtoken', () => ({
  verify: jest.fn(),
  TokenExpiredError: class TokenExpiredError extends Error {
    name = 'TokenExpiredError';
    constructor(message: string, expiredAt: Date) {
      super(message);
      this.expiredAt = expiredAt;
    }
    expiredAt: Date;
  },
  JsonWebTokenError: class JsonWebTokenError extends Error {
    name = 'JsonWebTokenError';
  },
}));

const mockedJwt = jest.mocked(jwt);

describe('serverAuth', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    process.env.JWT_SECRET = 'test-secret-key';
  });

  afterEach(() => {
    delete process.env.JWT_SECRET;
  });

  const mockHandler = jest.fn();
  const mockContext = { params: {} };

  const createRequest = (authHeader?: string) => {
    const headers = new Headers();
    if (authHeader) {
      headers.set('Authorization', authHeader);
    }

    return {
      headers,
      url: 'http://localhost:3000/api/test',
    } as Request;
  };

  describe('withAuth', () => {
    it('should call handler with authenticated user for valid token', async () => {
      const mockPayload = {
        userId: 'user-123',
        email: 'test@example.com',
        iat: Date.now() / 1000,
        exp: Date.now() / 1000 + 3600,
      };

      (mockedJwt.verify as jest.Mock).mockReturnValue(mockPayload);
      mockHandler.mockResolvedValue(NextResponse.json({ success: true }));

      const protectedHandler = withAuth(mockHandler);
      const req = createRequest('Bearer valid-token');

      const response = await protectedHandler(req, mockContext);

      expect(mockedJwt.verify).toHaveBeenCalledWith('valid-token', 'test-secret-key');
      expect(mockHandler).toHaveBeenCalledWith(
        expect.objectContaining({
          user: { id: 'user-123', email: 'test@example.com' },
        }),
        mockContext
      );
      expect(response.status).toBe(200);
    });

    it('should return 401 for missing Authorization header', async () => {
      const protectedHandler = withAuth(mockHandler);
      const req = createRequest();

      const response = await protectedHandler(req, mockContext);
      const json = await response.json();

      expect(response.status).toBe(401);
      expect(json.error).toBe('Unauthorized: Missing or invalid token');
      expect(mockHandler).not.toHaveBeenCalled();
      expect(mockedJwt.verify).not.toHaveBeenCalled();
    });

    it('should return 401 for invalid Authorization header format', async () => {
      const protectedHandler = withAuth(mockHandler);
      const req = createRequest('InvalidFormat token');

      const response = await protectedHandler(req, mockContext);
      const json = await response.json();

      expect(response.status).toBe(401);
      expect(json.error).toBe('Unauthorized: Missing or invalid token');
      expect(mockHandler).not.toHaveBeenCalled();
      expect(mockedJwt.verify).not.toHaveBeenCalled();
    });

    it('should return 401 for missing token after Bearer', async () => {
      const protectedHandler = withAuth(mockHandler);
      const req = createRequest('Bearer ');

      const response = await protectedHandler(req, mockContext);
      const json = await response.json();

      expect(response.status).toBe(401);
      expect(json.error).toBe('Unauthorized: Missing or invalid token');
      expect(mockHandler).not.toHaveBeenCalled();
      expect(mockedJwt.verify).not.toHaveBeenCalled();
    });

    it('should return 401 for expired token', async () => {
      (mockedJwt.verify as jest.Mock).mockImplementation(() => {
        throw new jwt.TokenExpiredError('Token expired', new Date());
      });

      const protectedHandler = withAuth(mockHandler);
      const req = createRequest('Bearer expired-token');

      const response = await protectedHandler(req, mockContext);
      const json = await response.json();

      expect(response.status).toBe(401);
      expect(json.error).toBe('Unauthorized: Token expired');
      expect(mockHandler).not.toHaveBeenCalled();
    });

    it('should return 401 for invalid token', async () => {
      (mockedJwt.verify as jest.Mock).mockImplementation(() => {
        throw new jwt.JsonWebTokenError('Invalid token');
      });

      const protectedHandler = withAuth(mockHandler);
      const req = createRequest('Bearer invalid-token');

      const response = await protectedHandler(req, mockContext);
      const json = await response.json();

      expect(response.status).toBe(401);
      expect(json.error).toBe('Unauthorized: Invalid token');
      expect(mockHandler).not.toHaveBeenCalled();
    });

    it('should return 500 for other JWT errors', async () => {
      (mockedJwt.verify as jest.Mock).mockImplementation(() => {
        throw new Error('Unexpected JWT error');
      });

      const protectedHandler = withAuth(mockHandler);
      const req = createRequest('Bearer problematic-token');

      const response = await protectedHandler(req, mockContext);
      const json = await response.json();

      expect(response.status).toBe(500);
      expect(json.error).toBe('Internal server error during authentication');
      expect(mockHandler).not.toHaveBeenCalled();
    });

    it('should return 401 for invalid payload (missing userId)', async () => {
      const mockPayload = {
        email: 'test@example.com',
        iat: Date.now() / 1000,
        exp: Date.now() / 1000 + 3600,
      };

      (mockedJwt.verify as jest.Mock).mockReturnValue(mockPayload);

      const protectedHandler = withAuth(mockHandler);
      const req = createRequest('Bearer token-without-userid');

      const response = await protectedHandler(req, mockContext);
      const json = await response.json();

      expect(response.status).toBe(401);
      expect(json.error).toBe('Unauthorized: Invalid token payload');
      expect(mockHandler).not.toHaveBeenCalled();
    });

    it('should return 401 for invalid payload (missing email)', async () => {
      const mockPayload = {
        userId: 'user-123',
        iat: Date.now() / 1000,
        exp: Date.now() / 1000 + 3600,
      };

      (mockedJwt.verify as jest.Mock).mockReturnValue(mockPayload);

      const protectedHandler = withAuth(mockHandler);
      const req = createRequest('Bearer token-without-email');

      const response = await protectedHandler(req, mockContext);
      const json = await response.json();

      expect(response.status).toBe(401);
      expect(json.error).toBe('Unauthorized: Invalid token payload');
      expect(mockHandler).not.toHaveBeenCalled();
    });

    it('should return 401 for non-object payload', async () => {
      (mockedJwt.verify as jest.Mock).mockReturnValue('string-payload');

      const protectedHandler = withAuth(mockHandler);
      const req = createRequest('Bearer token-with-string-payload');

      const response = await protectedHandler(req, mockContext);
      const json = await response.json();

      expect(response.status).toBe(401);
      expect(json.error).toBe('Unauthorized: Invalid token payload');
      expect(mockHandler).not.toHaveBeenCalled();
    });

    it('should handle handler errors gracefully', async () => {
      const mockPayload = {
        userId: 'user-123',
        email: 'test@example.com',
        iat: Date.now() / 1000,
        exp: Date.now() / 1000 + 3600,
      };

      (mockedJwt.verify as jest.Mock).mockReturnValue(mockPayload);
      mockHandler.mockRejectedValue(new Error('Handler error'));

      const protectedHandler = withAuth(mockHandler);
      const req = createRequest('Bearer valid-token');

      await expect(protectedHandler(req, mockContext)).rejects.toThrow('Handler error');
      expect(mockHandler).toHaveBeenCalled();
    });

    it('should pass through the context parameter correctly', async () => {
      const mockPayload = {
        userId: 'user-123',
        email: 'test@example.com',
        iat: Date.now() / 1000,
        exp: Date.now() / 1000 + 3600,
      };

      const customContext = { params: { id: 'test-id', slug: 'test-slug' } };

      (mockedJwt.verify as jest.Mock).mockReturnValue(mockPayload);
      mockHandler.mockResolvedValue(NextResponse.json({ success: true }));

      const protectedHandler = withAuth(mockHandler);
      const req = createRequest('Bearer valid-token');

      await protectedHandler(req, customContext);

      expect(mockHandler).toHaveBeenCalledWith(
        expect.objectContaining({
          user: { id: 'user-123', email: 'test@example.com' },
        }),
        customContext
      );
    });

    it('should work with multiple different tokens', async () => {
      const mockPayload1 = {
        userId: 'user-123',
        email: 'user1@example.com',
        iat: Date.now() / 1000,
        exp: Date.now() / 1000 + 3600,
      };

      const mockPayload2 = {
        userId: 'user-456',
        email: 'user2@example.com',
        iat: Date.now() / 1000,
        exp: Date.now() / 1000 + 3600,
      };

      (mockedJwt.verify as jest.Mock)
        .mockReturnValueOnce(mockPayload1)
        .mockReturnValueOnce(mockPayload2);

      mockHandler.mockResolvedValue(NextResponse.json({ success: true }));

      const protectedHandler = withAuth(mockHandler);

      // First request
      const req1 = createRequest('Bearer token1');
      await protectedHandler(req1, mockContext);

      expect(mockHandler).toHaveBeenNthCalledWith(
        1,
        expect.objectContaining({
          user: { id: 'user-123', email: 'user1@example.com' },
        }),
        mockContext
      );

      // Second request
      const req2 = createRequest('Bearer token2');
      await protectedHandler(req2, mockContext);

      expect(mockHandler).toHaveBeenNthCalledWith(
        2,
        expect.objectContaining({
          user: { id: 'user-456', email: 'user2@example.com' },
        }),
        mockContext
      );
    });
  });
});
