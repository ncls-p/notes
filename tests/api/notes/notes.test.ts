import { describe, it, expect, beforeEach, vi } from 'vitest';
import { NextRequest } from 'next/server';
import { PrismaClient } from '@prisma/client';

// Mock Prisma
const mockPrismaInstance = {
  note: {
    create: vi.fn(),
    findMany: vi.fn(),
    findFirst: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
  },
};

vi.mock('@prisma/client', () => ({
  PrismaClient: vi.fn(() => mockPrismaInstance),
}));

// Type for mocked Prisma client
type MockPrismaClient = {
  note: {
    create: ReturnType<typeof vi.fn>;
    findMany: ReturnType<typeof vi.fn>;
    findFirst: ReturnType<typeof vi.fn>;
    update: ReturnType<typeof vi.fn>;
    delete: ReturnType<typeof vi.fn>;
  };
};  // Mock Auth Middleware
vi.mock('../../../lib/auth/middleware', () => ({
  authMiddleware: vi.fn(async (req) => {
    // Set the user info in request headers
    req.headers.set('user', JSON.stringify({ id: 'user-1', email: 'test@example.com' }));
    return null; // Indicate auth success
  }),
}));

describe('Notes API Routes', () => {
  beforeEach(() => {
    vi.resetAllMocks();
    mockPrismaInstance.note.create.mockReset();
    mockPrismaInstance.note.findMany.mockReset();
    mockPrismaInstance.note.findFirst.mockReset();
    mockPrismaInstance.note.update.mockReset();
    mockPrismaInstance.note.delete.mockReset();
  });

  describe('POST /api/notes', () => {
    it('should create a new note', async () => {
      const { POST } = await import('../../../app/api/notes/route');

      const mockNote = {
        id: 'note-1',
        title: 'Test Note',
        content_markdown: 'Test content',
        owner_id: 'user-1',
        created_at: new Date(),
        updated_at: new Date(),
      };

      mockPrismaInstance.note.create.mockResolvedValue(mockNote);

      const mockRequest = new NextRequest('http://localhost:3001/api/notes', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          user: JSON.stringify({ id: 'user-1' }),
        },
        body: JSON.stringify({
          title: 'Test Note',
          content_markdown: 'Test content',
        }),
      });

      const response = await POST(mockRequest);
      const responseData = await response.json();

      expect(response.status).toBe(201);
      expect(mockPrismaInstance.note.create).toHaveBeenCalledWith({
        data: {
          title: 'Test Note',
          content_markdown: 'Test content',
          owner_id: 'user-1',
        },
      });
      expect({
        ...responseData,
        created_at: new Date(responseData.created_at),
        updated_at: new Date(responseData.updated_at),
      }).toEqual(mockNote);
    });

    it('should validate required fields', async () => {
      const { POST } = await import('../../../app/api/notes/route');

      const mockRequest = new NextRequest('http://localhost:3001/api/notes', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          user: JSON.stringify({ id: 'user-1' }),
        },
        body: JSON.stringify({}),
      });

      const response = await POST(mockRequest);
      expect(response.status).toBe(400);
    });
  });

  describe('GET /api/notes', () => {
    it('should return user\'s notes', async () => {
      const { GET } = await import('../../../app/api/notes/route');

      const mockNotes = [
        {
          id: 'note-1',
          title: 'Test Note 1',
          content_markdown: 'Test content 1',
          owner_id: 'user-1',
          created_at: new Date(),
          updated_at: new Date(),
        },
        {
          id: 'note-2',
          title: 'Test Note 2',
          content_markdown: 'Test content 2',
          owner_id: 'user-1',
          created_at: new Date(),
          updated_at: new Date(),
        },
      ];

      mockPrismaInstance.note.findMany.mockResolvedValue(mockNotes);

      const mockRequest = new NextRequest('http://localhost:3001/api/notes', {
        headers: {
          user: JSON.stringify({ id: 'user-1' }),
        },
      });

      const response = await GET(mockRequest);
      const responseData = await response.json();

      expect(response.status).toBe(200);
      expect(mockPrismaInstance.note.findMany).toHaveBeenCalledWith({
        where: {
          owner_id: 'user-1',
          folder_id: null,
        },
        orderBy: {
          updated_at: 'desc',
        },
      });
      expect(responseData.map(note => ({
        ...note,
        created_at: new Date(note.created_at),
        updated_at: new Date(note.updated_at),
      }))).toEqual(mockNotes);
    });

    it('should filter by folder_id', async () => {
      const { GET } = await import('../../../app/api/notes/route');

      const mockRequest = new NextRequest(
        'http://localhost:3001/api/notes?folder_id=folder-1',
        {
          headers: {
            user: JSON.stringify({ id: 'user-1' }),
          },
        }
      );

      await GET(mockRequest);

      expect(mockPrismaInstance.note.findMany).toHaveBeenCalledWith({
        where: {
          owner_id: 'user-1',
          folder_id: 'folder-1',
        },
        orderBy: {
          updated_at: 'desc',
        },
      });
    });
  });
});
