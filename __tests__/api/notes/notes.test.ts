// Mock PrismaClient before importing anything else
jest.mock('@prisma/client', () => {
  const mockNote = {
    create: jest.fn(),
    findMany: jest.fn(),
    findFirst: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  };

  const mockPrismaInstance = {
    note: mockNote,
    $connect: jest.fn(),
    $disconnect: jest.fn(),
    $transaction: jest.fn(),
  };

  return {
    PrismaClient: jest.fn().mockImplementation(() => mockPrismaInstance),
  };
});

import { POST, GET } from '@/app/api/notes/route';
import { NextRequest } from 'next/server';
import { PrismaClient } from '@prisma/client';

// Get the mocked Prisma instance
const mockPrisma = new PrismaClient();

describe('/api/notes', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  const createMockRequest = (
    body: any,
    hasUser: boolean = true,
    url: string = 'http://localhost:3000/api/notes'
  ) => {
    const headers = new Headers();

    if (hasUser) {
      headers.set('user', JSON.stringify({ id: 'user-123', email: 'test@example.com' }));
    }

    const request = {
      headers,
      json: jest.fn().mockResolvedValue(body),
      url,
      method: 'POST',
    } as unknown as NextRequest;

    // For GET requests, add URL parsing capability
    if (url.includes('?')) {
      Object.defineProperty(request, 'url', {
        value: url,
        writable: false,
      });
    }

    return request;
  };

  describe('POST /api/notes', () => {
    it('should create a note successfully', async () => {
      const mockNote = {
        id: 'note-123',
        title: 'Test Note',
        content_markdown: '# Hello World',
        folder_id: null,
        owner_id: 'user-123',
        created_at: new Date(),
        updated_at: new Date(),
      };

      // Mock the prisma create method
      (mockPrisma.note.create as jest.Mock).mockResolvedValue(mockNote);

      const req = createMockRequest({
        title: 'Test Note',
        content_markdown: '# Hello World',
      });

      const response = await POST(req);
      const json = await response.json();

      expect(response.status).toBe(201);
      expect(json).toEqual(mockNote);
    });

    it('should return 401 for unauthenticated request', async () => {
      const req = createMockRequest(
        {
          title: 'Test Note',
          content_markdown: '# Hello World',
        },
        false
      ); // hasUser = false

      const response = await POST(req);
      const json = await response.json();

      expect(response.status).toBe(401);
      expect(json.error).toBe('Unauthorized');
    });

    it('should return 500 on database error', async () => {
      (mockPrisma.note.create as jest.Mock).mockRejectedValue(new Error('Database error'));

      const req = createMockRequest({
        title: 'Test Note',
        content_markdown: '# Hello World',
      });

      const response = await POST(req);
      const json = await response.json();

      expect(response.status).toBe(500);
      expect(json.error).toBe('Internal server error');
    });
  });

  describe('GET /api/notes', () => {
    it('should fetch notes for user without folder filter', async () => {
      const mockNotes = [
        {
          id: 'note-1',
          title: 'Note 1',
          content_markdown: '# Note 1',
          folder_id: null,
          owner_id: 'user-123',
          created_at: new Date('2024-01-01'),
          updated_at: new Date('2024-01-02'),
        },
      ];

      (mockPrisma.note.findMany as jest.Mock).mockResolvedValue(mockNotes);

      const req = createMockRequest({});

      const response = await GET(req);
      const json = await response.json();

      expect(response.status).toBe(200);
      expect(json).toEqual(mockNotes);
    });

    it('should return 401 for unauthenticated request', async () => {
      const req = createMockRequest({}, false); // hasUser = false

      const response = await GET(req);
      const json = await response.json();

      expect(response.status).toBe(401);
      expect(json.error).toBe('Unauthorized');
    });

    it('should return 500 on database error', async () => {
      (mockPrisma.note.findMany as jest.Mock).mockRejectedValue(new Error('Database error'));

      const req = createMockRequest({});

      const response = await GET(req);
      const json = await response.json();

      expect(response.status).toBe(500);
      expect(json.error).toBe('Internal server error');
    });

    it('should return empty array when no notes found', async () => {
      (mockPrisma.note.findMany as jest.Mock).mockResolvedValue([]);

      const req = createMockRequest({});

      const response = await GET(req);
      const json = await response.json();

      expect(response.status).toBe(200);
      expect(json).toEqual([]);
    });
  });
});
