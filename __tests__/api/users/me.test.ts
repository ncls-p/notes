import { NextResponse, NextRequest } from 'next/server';
import type { NextRequestWithUser } from '@/lib/auth/serverAuth';

// Store a reference to the function that withAuth will execute, allowing us to change it per test
let currentAuthImplementation = jest.fn(
  (handler: (req: NextRequestWithUser, context: any) => Promise<NextResponse>) => {
    // Default behavior: pass through with a standard mock user
    return async (req: NextRequest, context: any) => {
      const authenticatedReq = req as NextRequestWithUser;
      authenticatedReq.user = { id: 'user-123', email: 'test@example.com', name: 'Test User' };
      return handler(authenticatedReq, context);
    };
  }
);

jest.mock('@/lib/auth/serverAuth', () => ({
  // The mock for withAuth will call our changeable currentAuthImplementation
  withAuth: jest.fn(
    (handler: (req: NextRequestWithUser, context: any) => Promise<NextResponse>) =>
      async (req: NextRequest, context: any) =>
        currentAuthImplementation(handler)(req, context)
  ),
}));

// Import GET AFTER the mock is set up
import { GET } from '@/app/api/users/me/route';

describe('/api/users/me', () => {
  const mockContext = { params: {} };

  beforeEach(() => {
    // Reset to default behavior before each test
    currentAuthImplementation = jest.fn(
      (handler: (req: NextRequestWithUser, context: any) => Promise<NextResponse>) => {
        return async (req: NextRequest, context: any) => {
          const authenticatedReq = req as NextRequestWithUser;
          authenticatedReq.user = { id: 'user-123', email: 'test@example.com', name: 'Test User' };
          return handler(authenticatedReq, context);
        };
      }
    );

    // Clear the call history of the main withAuth mock itself and the implementation
    const { withAuth } = require('@/lib/auth/serverAuth');
    (withAuth as jest.Mock).mockClear();
    currentAuthImplementation.mockClear();
  });

  describe('GET /api/users/me', () => {
    it('should return user information for authenticated request', async () => {
      const response = await GET(new NextRequest('http://localhost/api/users/me'), mockContext);
      const json = await response.json();

      expect(response.status).toBe(200);
      expect(json).toEqual({
        id: 'user-123',
        email: 'test@example.com',
      });
    });

    it('should handle different user data correctly', async () => {
      currentAuthImplementation = jest.fn(
        (handler: (req: NextRequestWithUser, context: any) => Promise<NextResponse>) => {
          return async (req: NextRequest, context: any) => {
            const authenticatedReq = req as NextRequestWithUser;
            authenticatedReq.user = {
              id: 'different-user-456',
              email: 'different@example.com',
              name: 'Diff User',
            };
            return handler(authenticatedReq, context);
          };
        }
      );

      const response = await GET(new NextRequest('http://localhost/api/users/me'), mockContext);
      const json = await response.json();

      expect(response.status).toBe(200);
      expect(json).toEqual({
        id: 'different-user-456',
        email: 'different@example.com',
      });
    });

    it('should return 401 for request where withAuth returns error', async () => {
      currentAuthImplementation = jest.fn(
        (_handler: (req: NextRequestWithUser, context: any) => Promise<NextResponse>) => {
          // Simulate withAuth itself denying access
          return async (_req: NextRequest, _context: any) => {
            return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
          };
        }
      );

      const response = await GET(new NextRequest('http://localhost/api/users/me'), mockContext);
      const json = await response.json();

      expect(response.status).toBe(401);
      expect(json.error).toBe('Authentication required');
    });

    it('should only return id and email fields from user object', async () => {
      currentAuthImplementation = jest.fn(
        (handler: (req: NextRequestWithUser, context: any) => Promise<NextResponse>) => {
          return async (req: NextRequest, context: any) => {
            const authenticatedReq = req as NextRequestWithUser;
            authenticatedReq.user = {
              id: 'user-123',
              email: 'test@example.com',
              name: 'Test User',
              // These fields should not be included in the response from the GET handler
              password_hash: 'hashed-password',
              created_at: new Date(),
              updated_at: new Date(),
              role: 'admin',
            };
            return handler(authenticatedReq, context);
          };
        }
      );

      const response = await GET(new NextRequest('http://localhost/api/users/me'), mockContext);
      const json = await response.json();

      expect(response.status).toBe(200);
      expect(json).toEqual({
        id: 'user-123',
        email: 'test@example.com',
      });
      expect(json).not.toHaveProperty('password_hash');
      expect(json).not.toHaveProperty('name');
      expect(json).not.toHaveProperty('role');
    });
  });

  describe('withAuth integration for error handling by withAuth itself', () => {
    it('should propagate error thrown by withAuth', async () => {
      currentAuthImplementation = jest.fn(
        (_handler: (req: NextRequestWithUser, context: any) => Promise<NextResponse>) => {
          return async (_req: NextRequest, _context: any) => {
            throw new Error('Authentication failed by withAuth');
          };
        }
      );
      // The GET route itself will catch this and return a 500 if not handled by withAuth more gracefully
      // Or, if withAuth is expected to return a response upon error:
      // For this test, we assume the error propagates and GET might return a 500 or rethrow.
      // Let's check if the route handler's try/catch catches it.
      // The actual GET handler in me/route.ts does not have a try/catch for withAuth errors.
      // It expects withAuth to handle auth and return a response or let user proceed.
      // So, if withAuth throws, it will likely lead to Jest's unhandled error.
      // To test this properly, we need to assert the error is thrown from GET call.
      await expect(
        GET(new NextRequest('http://localhost/api/users/me'), mockContext)
      ).rejects.toThrow('Authentication failed by withAuth');
    });

    it('should allow withAuth to return a custom error response', async () => {
      const errorResponseFromAuth = NextResponse.json(
        { error: 'Custom Invalid token from withAuth' },
        { status: 403 }
      );
      currentAuthImplementation = jest.fn(
        (_handler: (req: NextRequestWithUser, context: any) => Promise<NextResponse>) => {
          return async (_req: NextRequest, _context: any) => {
            return errorResponseFromAuth;
          };
        }
      );

      const response = await GET(new NextRequest('http://localhost/api/users/me'), mockContext);
      const json = await response.json();

      expect(response.status).toBe(403);
      expect(json.error).toBe('Custom Invalid token from withAuth');
    });
  });
});
