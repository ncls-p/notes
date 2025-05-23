import { testApiHandler, type TestAPIHandlerArgs } from 'next-test-api-route-handler';
import * as meRoute from '@/app/api/users/me/route';
import * as refreshTokenRoute from '@/app/api/auth/refresh-token/route';
import { PrismaClient, User } from '@prisma/client';
import jwt from 'jsonwebtoken';

// Mock Prisma Client
const mockUserFindUnique = jest.fn();
jest.mock('@prisma/client', () => ({
  PrismaClient: jest.fn().mockImplementation(() => ({
    user: {
      findUnique: mockUserFindUnique,
    },
  })),
  // Export other enums/types if needed by the routes directly
}));

const mockUser: User = {
  id: 'user-123',
  email: 'test@example.com',
  password_hash: 'hashedpassword',
  createdAt: new Date(),
  updatedAt: new Date(),
  // Add any other fields from your User model if they exist
  // e.g. name: null, emailVerified: null, image: null
};

const JWT_SECRET = 'test-jwt-secret-for-session-tests';
const REFRESH_TOKEN_SECRET = 'test-refresh-token-secret-for-session-tests';

process.env.JWT_SECRET = JWT_SECRET;
process.env.REFRESH_TOKEN_SECRET = REFRESH_TOKEN_SECRET;

describe('API Auth Session Routes', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUserFindUnique.mockResolvedValue(mockUser); // Default mock for user found
  });

  describe('/api/users/me (Protected Route)', () => {
    it('should return 401 if no token is provided', async () => {
      await testApiHandler({
        appHandler: meRoute,
        test: async ({ fetch }: TestAPIHandlerArgs) => {
          const res = await fetch({ method: 'GET' });
          expect(res.status).toBe(401);
          const body = await res.json();
          expect(body.error).toContain('Missing or invalid token');
        },
      });
    });

    it('should return 401 if token is malformed', async () => {
      await testApiHandler({
        appHandler: meRoute,
        test: async ({ fetch }: TestAPIHandlerArgs) => {
          const res = await fetch({
            method: 'GET',
            headers: { Authorization: 'Bearer malformedtoken' },
          });
          expect(res.status).toBe(401);
          const body = await res.json();
          expect(body.error).toContain('Invalid token');
        },
      });
    });

    it('should return 401 if token is expired', async () => {
      const expiredToken = jwt.sign({ userId: mockUser.id, email: mockUser.email }, JWT_SECRET, { expiresIn: '0s' });
      await new Promise(resolve => setTimeout(resolve, 50)); // Ensure it's expired

      await testApiHandler({
        appHandler: meRoute,
        test: async ({ fetch }: TestAPIHandlerArgs) => {
          const res = await fetch({
            method: 'GET',
            headers: { Authorization: `Bearer ${expiredToken}` },
          });
          expect(res.status).toBe(401);
          const body = await res.json();
          expect(body.error).toContain('Token expired');
        },
      });
    });

    it('should return 200 and user data if token is valid', async () => {
      const validToken = jwt.sign({ userId: mockUser.id, email: mockUser.email }, JWT_SECRET, { expiresIn: '15m' });
      await testApiHandler({
        appHandler: meRoute,
        test: async ({ fetch }: TestAPIHandlerArgs) => {
          const res = await fetch({
            method: 'GET',
            headers: { Authorization: `Bearer ${validToken}` },
          });
          expect(res.status).toBe(200);
          const body = await res.json();
          expect(body.id).toBe(mockUser.id);
          expect(body.email).toBe(mockUser.email);
        },
      });
    });

     it('should return 401 if token payload is invalid', async () => {
      const invalidPayloadToken = jwt.sign({ wrongUserId: mockUser.id }, JWT_SECRET, { expiresIn: '15m' });
      await testApiHandler({
        appHandler: meRoute,
        test: async ({ fetch }: TestAPIHandlerArgs) => {
          const res = await fetch({
            method: 'GET',
            headers: { Authorization: `Bearer ${invalidPayloadToken}` },
          });
          expect(res.status).toBe(401);
          const body = await res.json();
          expect(body.error).toContain('Invalid token payload');
        },
      });
    });
  });

  describe('/api/auth/refresh-token', () => {
    it('should return 401 if no refresh token cookie is provided', async () => {
      await testApiHandler({
        appHandler: refreshTokenRoute,
        test: async ({ fetch }: TestAPIHandlerArgs) => {
          const res = await fetch({ method: 'POST' });
          expect(res.status).toBe(401);
          const body = await res.json();
          expect(body.error).toBe('Refresh token not found');
        },
      });
    });

    it('should return 401 if refresh token is malformed', async () => {
      await testApiHandler({
        appHandler: refreshTokenRoute,
        test: async ({ fetch }: TestAPIHandlerArgs) => {
          const res = await fetch({
            method: 'POST',
            headers: { Cookie: 'refreshToken=malformedrefreshtoken' },
          });
          expect(res.status).toBe(401);
          const body = await res.json();
          expect(body.error).toBe('Invalid refresh token');
        },
      });
    });

    it('should return 401 and clear cookie if refresh token is expired', async () => {
      const expiredRefreshToken = jwt.sign({ userId: mockUser.id }, REFRESH_TOKEN_SECRET, { expiresIn: '0s' });
      await new Promise(resolve => setTimeout(resolve, 50));

      await testApiHandler({
        appHandler: refreshTokenRoute,
        test: async ({ fetch }: TestAPIHandlerArgs) => {
          const res = await fetch({
            method: 'POST',
            headers: { Cookie: `refreshToken=${expiredRefreshToken}` },
          });
          expect(res.status).toBe(401);
          const body = await res.json();
          expect(body.error).toBe('Refresh token expired');
          const setCookieHeader = res.headers.get('Set-Cookie');
          expect(setCookieHeader).toMatch(/refreshToken=;/);
          expect(setCookieHeader).toMatch(/Max-Age=0/);
        },
      });
    });

    it('should return 403 and clear cookie if refresh token is for a non-existent user', async () => {
      mockUserFindUnique.mockResolvedValue(null);
      const validRefreshTokenForNonExistentUser = jwt.sign({ userId: 'non-existent-user' }, REFRESH_TOKEN_SECRET, { expiresIn: '1d' });

      await testApiHandler({
        appHandler: refreshTokenRoute,
        test: async ({ fetch }: TestAPIHandlerArgs) => {
          const res = await fetch({
            method: 'POST',
            headers: { Cookie: `refreshToken=${validRefreshTokenForNonExistentUser}` },
          });
          expect(res.status).toBe(403);
          const body = await res.json();
          expect(body.error).toBe('User not found or invalid token');
          const setCookieHeader = res.headers.get('Set-Cookie');
          expect(setCookieHeader).toMatch(/refreshToken=;/);
        },
      });
    });

    it('should return 401 if refresh token payload is invalid', async () => {
      const invalidPayloadToken = jwt.sign({ wrongUserId: 'user-123' }, REFRESH_TOKEN_SECRET, { expiresIn: '1d' });
      await testApiHandler({
        appHandler: refreshTokenRoute,
        test: async ({ fetch }: TestAPIHandlerArgs) => {
          const res = await fetch({
            method: 'POST',
            headers: { Cookie: `refreshToken=${invalidPayloadToken}` },
          });
          expect(res.status).toBe(401);
          const body = await res.json();
          expect(body.error).toBe('Invalid refresh token payload');
        },
      });
    });

    it('should return 200 and a new access token if refresh token is valid', async () => {
      const validRefreshToken = jwt.sign({ userId: mockUser.id }, REFRESH_TOKEN_SECRET, { expiresIn: '1d' });
      mockUserFindUnique.mockResolvedValue(mockUser);

      await testApiHandler({
        appHandler: refreshTokenRoute,
        test: async ({ fetch }: TestAPIHandlerArgs) => {
          const res = await fetch({
            method: 'POST',
            headers: { Cookie: `refreshToken=${validRefreshToken}` },
          });
          expect(res.status).toBe(200);
          const body = await res.json();
          expect(body.accessToken).toBeDefined();

          try {
            const decodedAccessToken = jwt.verify(body.accessToken, JWT_SECRET) as jwt.JwtPayload;
            expect(decodedAccessToken.userId).toBe(mockUser.id);
            expect(decodedAccessToken.email).toBe(mockUser.email);
          } catch (e) {
            fail('New access token could not be verified');
          }
        },
      });
    });

    it('should return 500 if REFRESH_TOKEN_SECRET is not set', async () => {
      const originalSecret = process.env.REFRESH_TOKEN_SECRET;
      delete process.env.REFRESH_TOKEN_SECRET;

      await testApiHandler({
        appHandler: refreshTokenRoute,
        test: async ({ fetch }: TestAPIHandlerArgs) => {
          const res = await fetch({ method: 'POST' });
          expect(res.status).toBe(500);
          const body = await res.json();
          expect(body.error).toBe('Internal server configuration error');
        },
      });
      process.env.REFRESH_TOKEN_SECRET = originalSecret;
    });
  });
});