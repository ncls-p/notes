import { GET } from '@/app/api/users/me/route';
import { NextResponse } from 'next/server';

// Mock the withAuth higher-order function to simulate authenticated requests
jest.mock('@/lib/auth/serverAuth', () => ({
  withAuth: jest.fn((handler) => {
    return async (req: any, context: any) => {
      // Simulate an authenticated request with user data
      const authenticatedReq = {
        ...req,
        user: { id: 'user-123', email: 'test@example.com' },
      };
      return handler(authenticatedReq, context);
    };
  }),
}));

describe('/api/users/me', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  const mockContext = { params: {} };

  describe('GET /api/users/me', () => {
    it('should return user information for authenticated request', async () => {
      const response = await GET({} as any, mockContext);
      const json = await response.json();

      expect(response.status).toBe(200);
      expect(json).toEqual({
        id: 'user-123',
        email: 'test@example.com',
      });
    });

    it('should handle different user data correctly', async () => {
      // Mock withAuth to return different user data
      const { withAuth } = require('@/lib/auth/serverAuth');
      withAuth.mockImplementation((handler) => {
        return async (req: any, context: any) => {
          const authenticatedReq = {
            ...req,
            user: { id: 'different-user-456', email: 'different@example.com' },
          };
          return handler(authenticatedReq, context);
        };
      });

      const response = await GET({} as any, mockContext);
      const json = await response.json();

      expect(response.status).toBe(200);
      expect(json).toEqual({
        id: 'different-user-456',
        email: 'different@example.com',
      });
    });

    it('should return 401 for request without user (safety check)', async () => {
      // Mock withAuth to simulate missing user data
      const { withAuth } = require('@/lib/auth/serverAuth');
      withAuth.mockImplementation((handler) => {
        return async (req: any, context: any) => {
          const unauthenticatedReq = {
            ...req,
            user: undefined,
          };
          return handler(unauthenticatedReq, context);
        };
      });

      const response = await GET({} as any, mockContext);
      const json = await response.json();

      expect(response.status).toBe(401);
      expect(json.error).toBe('Authentication required');
    });

    it('should only return id and email fields', async () => {
      // Mock withAuth to return user with extra fields
      const { withAuth } = require('@/lib/auth/serverAuth');
      withAuth.mockImplementation((handler) => {
        return async (req: any, context: any) => {
          const authenticatedReq = {
            ...req,
            user: {
              id: 'user-123',
              email: 'test@example.com',
              // These fields should not be included in the response
              password_hash: 'hashed-password',
              created_at: new Date(),
              updated_at: new Date(),
              role: 'admin',
            },
          };
          return handler(authenticatedReq, context);
        };
      });

      const response = await GET({} as any, mockContext);
      const json = await response.json();

      expect(response.status).toBe(200);
      expect(json).toEqual({
        id: 'user-123',
        email: 'test@example.com',
      });
      expect(json).not.toHaveProperty('password_hash');
      expect(json).not.toHaveProperty('created_at');
      expect(json).not.toHaveProperty('updated_at');
      expect(json).not.toHaveProperty('role');
    });

    it('should properly handle context parameter', async () => {
      const customContext = { params: { someParam: 'value' } };

      const response = await GET({} as any, customContext);
      const json = await response.json();

      expect(response.status).toBe(200);
      expect(json).toEqual({
        id: 'user-123',
        email: 'test@example.com',
      });
    });
  });

  describe('withAuth integration', () => {
    it('should handle withAuth error propagation', async () => {
      const { withAuth } = require('@/lib/auth/serverAuth');
      withAuth.mockImplementation(() => {
        return async () => {
          throw new Error('Authentication failed');
        };
      });

      await expect(GET({} as any, mockContext)).rejects.toThrow('Authentication failed');
    });

    it('should handle withAuth returning error response', async () => {
      const { withAuth } = require('@/lib/auth/serverAuth');
      const errorResponse = NextResponse.json({ error: 'Invalid token' }, { status: 401 });

      withAuth.mockImplementation(() => {
        return async () => {
          return errorResponse;
        };
      });

      const response = await GET({} as any, mockContext);
      const json = await response.json();

      expect(response.status).toBe(401);
      expect(json.error).toBe('Invalid token');
    });
  });
});
