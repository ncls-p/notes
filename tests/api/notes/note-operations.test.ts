import { describe, it, expect, beforeEach, vi } from 'vitest';
import { NextRequest } from 'next/server';
import { PrismaClient } from '@prisma/client';

// Mock Prisma
const mockPrismaInstance = {
  note: {
    findFirst: vi.fn(),
    findUnique: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
  },
};

vi.mock('@prisma/client', () => ({
  PrismaClient: vi.fn(() => mockPrismaInstance),
}));

// Mock Auth Middleware
vi.mock('../../../lib/auth/middleware', () => ({
  authMiddleware: vi.fn(async (req) => {
    // Set the user info in request headers
    req.headers.set('user', JSON.stringify({ id: 'user-1', email: 'test@example.com' }));
    return null; // Indicate auth success
  }),
}));

describe('Note Operations API Routes', () => {
  beforeEach(() => {
    vi.resetAllMocks();
    mockPrismaInstance.note.findFirst.mockReset();
    mockPrismaInstance.note.findUnique.mockReset();
    mockPrismaInstance.note.update.mockReset();
    mockPrismaInstance.note.delete.mockReset();
  });

  describe('GET /api/notes/[noteId]', () => {
    it('should return a note if user has access', async () => {
      const { GET } = await import('../../../app/api/notes/[noteId]/route');

      const mockNote = {
        id: 'note-1',
        title: 'Test Note',
        content_markdown: 'Test content',
        owner_id: 'user-1',
        created_at: new Date(),
        updated_at: new Date(),
      };

      mockPrismaInstance.note.findFirst.mockResolvedValue(mockNote);

      const mockRequest = new NextRequest('http://localhost:3001/api/notes/note-1', {
        headers: {
          user: JSON.stringify({ id: 'user-1' }),
        },
      });

      const response = await GET(mockRequest, { params: { noteId: 'note-1' } });
      const responseData = await response.json();

      expect(response.status).toBe(200);
      expect({
        ...responseData,
        created_at: new Date(responseData.created_at),
        updated_at: new Date(responseData.updated_at),
      }).toEqual(mockNote);
    });

    it('should return 404 if note not found', async () => {
      const { GET } = await import('../../../app/api/notes/[noteId]/route');

      mockPrismaInstance.note.findFirst.mockResolvedValue(null);

      const mockRequest = new NextRequest('http://localhost:3001/api/notes/note-1', {
        headers: {
          user: JSON.stringify({ id: 'user-1' }),
        },
      });

      const response = await GET(mockRequest, { params: { noteId: 'note-1' } });
      expect(response.status).toBe(404);
    });
  });

  describe('PUT /api/notes/[noteId]', () => {
    it('should update a note', async () => {
      const { PUT } = await import('../../../app/api/notes/[noteId]/route');

      const mockNote = {
        id: 'note-1',
        title: 'Test Note',
        content_markdown: 'Test content',
        owner_id: 'user-1',
      };

      mockPrismaInstance.note.findFirst.mockResolvedValue(mockNote);
      mockPrismaInstance.note.update.mockResolvedValue({
        ...mockNote,
        title: 'Updated Title',
        content_markdown: 'Updated content',
      });

      const mockRequest = new NextRequest('http://localhost:3001/api/notes/note-1', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          user: JSON.stringify({ id: 'user-1' }),
        },
        body: JSON.stringify({
          title: 'Updated Title',
          content_markdown: 'Updated content',
        }),
      });

      const response = await PUT(mockRequest, { params: { noteId: 'note-1' } });
      const responseData = await response.json();

      expect(response.status).toBe(200);
      expect(mockPrismaInstance.note.update).toHaveBeenCalledWith({
        where: { id: 'note-1' },
        data: {
          title: 'Updated Title',
          content_markdown: 'Updated content',
        },
      });
      expect(responseData).toHaveProperty('title', 'Updated Title');
      expect(responseData).toHaveProperty('content_markdown', 'Updated content');
    });

    it('should validate input data', async () => {
      const { PUT } = await import('../../../app/api/notes/[noteId]/route');

      const mockNote = {
        id: 'note-1',
        title: 'Test Note',
        content_markdown: 'Test content',
        owner_id: 'user-1',
      };

      mockPrismaInstance.note.findFirst.mockResolvedValue(mockNote);

      const mockRequest = new NextRequest('http://localhost:3001/api/notes/note-1', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          user: JSON.stringify({ id: 'user-1' }),
        },
        body: JSON.stringify({
          title: '', // Empty title should be invalid
        }),
      });

      const response = await PUT(mockRequest, { params: { noteId: 'note-1' } });
      expect(response.status).toBe(400);
    });
  });

  describe('DELETE /api/notes/[noteId]', () => {
    it('should delete a note', async () => {
      const { DELETE } = await import('../../../app/api/notes/[noteId]/route');

      const mockNote = {
        id: 'note-1',
        title: 'Test Note',
        content_markdown: 'Test content',
        owner_id: 'user-1',
      };

      mockPrismaInstance.note.findFirst.mockResolvedValue(mockNote);
      mockPrismaInstance.note.delete.mockResolvedValue(mockNote);

      const mockRequest = new NextRequest('http://localhost:3001/api/notes/note-1', {
        method: 'DELETE',
        headers: {
          user: JSON.stringify({ id: 'user-1' }),
        },
      });

      const response = await DELETE(mockRequest, { params: { noteId: 'note-1' } });
      const responseData = await response.json();

      expect(response.status).toBe(200);
      expect(mockPrismaInstance.note.delete).toHaveBeenCalledWith({
        where: { id: 'note-1' },
      });
      expect(responseData).toHaveProperty('message', 'Note deleted successfully');
    });

    it('should return 404 if note not found', async () => {
      const { DELETE } = await import('../../../app/api/notes/[noteId]/route');

      mockPrismaInstance.note.findFirst.mockResolvedValue(null);

      const mockRequest = new NextRequest('http://localhost:3001/api/notes/note-1', {
        method: 'DELETE',
        headers: {
          user: JSON.stringify({ id: 'user-1' }),
        },
      });

      const response = await DELETE(mockRequest, { params: { noteId: 'note-1' } });
      expect(response.status).toBe(404);
    });
  });
});
