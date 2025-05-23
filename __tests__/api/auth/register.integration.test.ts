import { POST } from '@/app/api/auth/register/route';
import { PrismaClient } from '@prisma/client';
import { hash as argon2Hash } from 'argon2';
import http from 'http';
import request from 'supertest';
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
const mockArgon2Hash = argon2Hash as jest.Mock;

// Create a simple server to host our API route
const createTestServer = () => {
  return http.createServer(async (req, res) => {
    if (req.url === '/api/auth/register' && req.method === 'POST') {
      // Adapt NextRequest from http.IncomingMessage
      const chunks: Uint8Array[] = [];
      for await (const chunk of req) {
        chunks.push(chunk);
      }
      const body = Buffer.concat(chunks).toString();

      const nextReq = {
        json: async () => JSON.parse(body || '{}'),
        headers: new Headers(req.headers as HeadersInit),
        method: req.method,
        url: `http://${req.headers.host}${req.url}`,
        // Add other necessary properties if your handler uses them
      } as unknown as NextRequest; // Cast to NextRequest

      const response = await POST(nextReq);
      res.statusCode = response.status;
      response.headers.forEach((value, key) => {
        res.setHeader(key, value);
      });
      const responseBody = await response.text();
      res.end(responseBody);
    } else {
      res.statusCode = 404;
      res.end('Not Found');
    }
  });
};


describe('POST /api/auth/register (Integration)', () => {
  let server: http.Server;

  beforeAll(() => {
    server = createTestServer();
  });

  afterAll((done) => {
    server.close(done);
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return 400 for invalid email', async () => {
    const response = await request(server)
      .post('/api/auth/register')
      .send({ email: 'invalid', password: 'Password123!' });
    expect(response.status).toBe(400);
    expect(response.body.error).toBe('Invalid input');
    expect(response.body.details.email).toContain('Invalid email address');
  });

  it('should return 400 for weak password', async () => {
    const response = await request(server)
      .post('/api/auth/register')
      .send({ email: 'test@example.com', password: 'weak' });
    expect(response.status).toBe(400);
    expect(response.body.error).toBe('Invalid input');
    expect(response.body.details.password).toBeDefined();
  });

  it('should return 409 if email already exists', async () => {
    (mockPrisma.user.findUnique as jest.Mock).mockResolvedValue({ id: '1', email: 'exists@example.com' });
    const response = await request(server)
      .post('/api/auth/register')
      .send({ email: 'exists@example.com', password: 'Password123!' });
    expect(response.status).toBe(409);
    expect(response.body.error).toBe('Email already registered');
  });

  it('should create user and return 201 on success', async () => {
    (mockPrisma.user.findUnique as jest.Mock).mockResolvedValue(null);
    mockArgon2Hash.mockResolvedValue('hashed_password');
    const mockUser = { id: 'newUserId', email: 'new@example.com', createdAt: new Date().toISOString() };
    (mockPrisma.user.create as jest.Mock).mockResolvedValue({ ...mockUser, password_hash: 'hashed_password' });

    const response = await request(server)
      .post('/api/auth/register')
      .send({ email: 'new@example.com', password: 'Password123!' });

    expect(response.status).toBe(201);
    expect(mockArgon2Hash).toHaveBeenCalledWith('Password123!');
    expect(mockPrisma.user.create).toHaveBeenCalledWith({
      data: { email: 'new@example.com', password_hash: 'hashed_password' },
    });
    expect(response.body.id).toBe(mockUser.id);
    expect(response.body.email).toBe(mockUser.email);
  });

  it('should return 500 if hashing fails', async () => {
    (mockPrisma.user.findUnique as jest.Mock).mockResolvedValue(null);
    mockArgon2Hash.mockRejectedValue(new Error('Hashing failed'));

    const response = await request(server)
      .post('/api/auth/register')
      .send({ email: 'test@example.com', password: 'Password123!' });

    expect(response.status).toBe(500);
    expect(response.body.error).toBe('Internal server error');
  });

  it('should return 500 if database create fails', async () => {
    (mockPrisma.user.findUnique as jest.Mock).mockResolvedValue(null);
    mockArgon2Hash.mockResolvedValue('hashed_password');
    (mockPrisma.user.create as jest.Mock).mockRejectedValue(new Error('DB create failed'));

    const response = await request(server)
      .post('/api/auth/register')
      .send({ email: 'test@example.com', password: 'Password123!' });

    expect(response.status).toBe(500);
    expect(response.body.error).toBe('Internal server error');
  });
});