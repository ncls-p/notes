import { createServer, Server, IncomingMessage, ServerResponse } from 'http';
import { Readable } from 'stream';
import request from 'supertest';
import { POST as loginHandler } from '@/app/api/auth/login/route';
import { PrismaClient } from '@prisma/client';
import { verify } from 'argon2';
import jwt from 'jsonwebtoken';
// Global Headers should be used by new Request()

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

async function streamToString(stream: Readable): Promise<string> {
  const chunks: Buffer[] = [];
  return new Promise((resolve, reject) => {
    stream.on('data', (chunk) => chunks.push(Buffer.from(chunk)));
    stream.on('error', (err) => reject(err));
    stream.on('end', () => resolve(Buffer.concat(chunks).toString('utf8')));
  });
}

describe('/api/auth/login Integration Test', () => {
  let server: Server;
  let mockPrisma: PrismaClient;
  let originalEnv: NodeJS.ProcessEnv;

  beforeAll(async () => {
    const requestHandler = async (nodeReq: IncomingMessage, nodeRes: ServerResponse) => {
      // Only handle the specific route we're testing
      if (nodeReq.url === '/api/auth/login' && nodeReq.method === 'POST') {
        const bodyString = await streamToString(nodeReq);
        const webHeaders = new Headers(); // Uses global Headers
        for (const key in nodeReq.headers) {
          if (nodeReq.headers[key]) {
            const headerValue = nodeReq.headers[key];
            if (Array.isArray(headerValue)) {
              headerValue.forEach(val => webHeaders.append(key, val));
            } else if (headerValue) { // Ensure headerValue is not undefined
              webHeaders.append(key, headerValue as string); // Cast to string
            }
          }
        }

        // Convert Headers object to Record<string, string> for RequestInit
        const plainHeaders: Record<string, string> = {};
        webHeaders.forEach((value, key) => {
          plainHeaders[key] = value;
        });

        const host = nodeReq.headers.host || 'localhost:3000'; // Default host
        const protocol = 'http'; // Assuming http for test server

        const webRequest = new Request(`${protocol}://${host}${nodeReq.url}`, {
          method: nodeReq.method,
          headers: plainHeaders, // Use plain object
          body: bodyString.length > 0 ? bodyString : null, // Pass null for empty body
        });

        try {
          const nextResponse = await loginHandler(webRequest);

          nodeRes.statusCode = nextResponse.status;
          nextResponse.headers.forEach((value, key) => {
            nodeRes.setHeader(key, value);
          });
          // Read the body as text first, then attempt to parse if content-type is JSON
          const responseBodyText = await nextResponse.text();
          nodeRes.end(responseBodyText);
        } catch (error) {
          console.error("Error in test handler:", error);
          nodeRes.statusCode = 500;
          nodeRes.setHeader('Content-Type', 'application/json');
          nodeRes.end(JSON.stringify({ error: 'Internal Server Error in test handler wrapper' }));
        }
      } else {
        nodeRes.statusCode = 404;
        nodeRes.setHeader('Content-Type', 'application/json');
        nodeRes.end(JSON.stringify({ error: 'Not Found in test server' }));
      }
    };
    server = createServer(requestHandler);
    // It's important to listen on a port for supertest to connect
    await new Promise<void>(resolve => server.listen(0, 'localhost', resolve)); // Listen on a random available port
  });

  afterAll((done) => {
    server.close(done);
  });

  beforeEach(() => {
    mockPrisma = new PrismaClient();
    jest.clearAllMocks();
    originalEnv = process.env;
    process.env = {
      ...originalEnv,
      JWT_SECRET: 'test-jwt-secret-integration',
      REFRESH_TOKEN_SECRET: 'test-refresh-token-secret-integration',
      NODE_ENV: 'test',
    };
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  it('should return 400 for missing email', async () => {
    const response = await request(server)
      .post('/api/auth/login')
      .send({ password: 'Password123!' });

    expect(response.status).toBe(400);
    expect(response.body.error).toBe('Invalid input');
    expect(response.body.details.email).toBeDefined();
  });

  it('should return 400 for invalid email format', async () => {
    const response = await request(server)
      .post('/api/auth/login')
      .send({ email: 'invalid', password: 'Password123!' });

    expect(response.status).toBe(400);
    expect(response.body.error).toBe('Invalid input');
    expect(response.body.details.email).toContain('Invalid email address');
  });

  it('should return 401 if user not found', async () => {
    (mockPrisma.user.findUnique as jest.Mock).mockResolvedValue(null);
    const response = await request(server)
      .post('/api/auth/login')
      .send({ email: 'unknown@example.com', password: 'Password123!' });

    expect(response.status).toBe(401);
    expect(response.body.error).toBe('Invalid credentials');
  });

  it('should return 401 if password verification fails', async () => {
    (mockPrisma.user.findUnique as jest.Mock).mockResolvedValue({
      id: '1',
      email: 'test@example.com',
      password_hash: 'hashed_password',
    });
    (verify as jest.Mock).mockResolvedValue(false);

    const response = await request(server)
      .post('/api/auth/login')
      .send({ email: 'test@example.com', password: 'WrongPassword!' });

    expect(response.status).toBe(401);
    expect(response.body.error).toBe('Invalid credentials');
  });

  it('should return 200 and tokens on successful login', async () => {
    const mockUser = {
      id: 'user-123',
      email: 'test@example.com',
      password_hash: 'correct_hashed_password',
    };
    (mockPrisma.user.findUnique as jest.Mock).mockResolvedValue(mockUser);
    (verify as jest.Mock).mockResolvedValue(true);
    (jwt.sign as jest.Mock)
      .mockReturnValueOnce('mockAccessTokenIntegration')
      .mockReturnValueOnce('mockRefreshTokenIntegration');

    const response = await request(server)
      .post('/api/auth/login')
      .send({ email: 'test@example.com', password: 'Password123!' });

    expect(response.status).toBe(200);
    expect(response.body.message).toBe('Login successful');
    expect(response.body.user).toEqual({ id: mockUser.id, email: mockUser.email });
    expect(response.body.accessToken).toBe('mockAccessTokenIntegration');

    const cookiesHeader = response.headers['set-cookie'];
    const cookies: string[] = Array.isArray(cookiesHeader) ? cookiesHeader : (cookiesHeader ? [cookiesHeader] : []);
    expect(cookies.length).toBeGreaterThan(0);
    const refreshTokenCookie = cookies.find((cookie: string) => cookie.startsWith('refreshToken='));
    expect(refreshTokenCookie).toBeDefined();
    if (refreshTokenCookie) { // TypeScript null check
        expect(refreshTokenCookie).toContain('mockRefreshTokenIntegration');
        expect(refreshTokenCookie).toContain('HttpOnly');
        expect(refreshTokenCookie).toContain('Path=/');
        expect(refreshTokenCookie).toContain('SameSite=Lax');
        // In NODE_ENV=test, Secure flag should not be present
        expect(refreshTokenCookie).not.toContain('Secure');
    }


    expect(jwt.sign).toHaveBeenCalledWith(
        { userId: mockUser.id, email: mockUser.email },
        'test-jwt-secret-integration',
        { expiresIn: '15m' }
    );
    expect(jwt.sign).toHaveBeenCalledWith(
        { userId: mockUser.id },
        'test-refresh-token-secret-integration',
        { expiresIn: '7d' }
    );
  });

  it('should return 500 if JWT_SECRET is not defined', async () => {
    delete process.env.JWT_SECRET;
     (mockPrisma.user.findUnique as jest.Mock).mockResolvedValue({
      id: '1',
      email: 'test@example.com',
      password_hash: 'hashed_password',
    });
    (verify as jest.Mock).mockResolvedValue(true);

    const response = await request(server)
      .post('/api/auth/login')
      .send({ email: 'test@example.com', password: 'Password123!' });

    expect(response.status).toBe(500);
    expect(response.body.error).toBe('Internal server configuration error');
  });
});