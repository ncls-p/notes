import { GET, PUT, DELETE } from '@/app/api/notes/[noteId]/route';
import { PrismaClient } from '@prisma/client';
import { NextRequest } from 'next/server';

// Mock PrismaClient
jest.mock('@prisma/client', () => ({
  PrismaClient: jest.fn().mockImplementation(() => ({
    note: {
      findFirst: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
  })),
}));

const mockPrisma = new PrismaClient();

describe('/api/notes/[noteId]', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  const mockAuthenticatedRequest = (body: any = {}, userId: string = 'user-123') => {
    const headers = new Headers();
    headers.set('user', JSON.stringify({ id: userId, email: 'test@example.com' }));

    return {
      headers,
      json: async () => body,
      url: 'http://localhost:3000/api/notes/note-123',
    } as unknown as NextRequest;
  };

  const mockUnauthenticatedRequest = (body: any = {}) => {
    const headers = new Headers();

    return {
      headers,
      json: async () => body,
      url: 'http://localhost:3000/api/notes/note-123',
    } as unknown as NextRequest;
  };

  const mockParams = { noteId: 'note-123' };

  describe('GET /api/notes/[noteId]', () => {
    it('should fetch note successfully for owner', async () => {
      const mockNote = {
        id: 'note-123',
        title: 'Test Note',
        content_markdown: '# Hello World',
        folder_id: null,
        owner_id: 'user-123',
        is_public: false,
        created_at: new Date(),
        updated_at: new Date(),
      };

      (mockPrisma.note.findFirst as jest.Mock).mockResolvedValue(mockNote);

      const req = mockAuthenticatedRequest();
      const response = await GET(req, { params: mockParams });
      const json = await response.json();

      expect(response.status).toBe(200);
      expect(json).toEqual(mockNote);
      expect(mockPrisma.note.findFirst).toHaveBeenCalledWith({
        where: {
          id: 'note-123',
          OR: [
            { owner_id: 'user-123' },
            { is_public: true },
            {
              permissions: {
                some: {
                  user_id: 'user-123',
                },
              },
            },
          ],
        },
      });
    });

    it('should fetch public note for any user', async () => {
      const mockNote = {
        id: 'note-123',
        title: 'Public Note',
        content_markdown: '# Public Content',
        folder_id: null,
        owner_id: 'other-user',
        is_public: true,
        created_at: new Date(),
        updated_at: new Date(),
      };

      (mockPrisma.note.findFirst as jest.Mock).mockResolvedValue(mockNote);

      const req = mockAuthenticatedRequest({}, 'user-456');
      const response = await GET(req, { params: mockParams });
      const json = await response.json();

      expect(response.status).toBe(200);
      expect(json).toEqual(mockNote);
    });

    it('should return 404 for non-existent note', async () => {
      (mockPrisma.note.findFirst as jest.Mock).mockResolvedValue(null);

      const req = mockAuthenticatedRequest();
      const response = await GET(req, { params: mockParams });
      const json = await response.json();

      expect(response.status).toBe(404);
      expect(json.error).toBe('Note not found');
    });

    it('should return 401 for unauthenticated request', async () => {
      const req = mockUnauthenticatedRequest();
      const response = await GET(req, { params: mockParams });
      const json = await response.json();

      expect(response.status).toBe(401);
      expect(json.error).toBe('Unauthorized');
      expect(mockPrisma.note.findFirst).not.toHaveBeenCalled();
    });

    it('should return 500 on database error', async () => {
      (mockPrisma.note.findFirst as jest.Mock).mockRejectedValue(new Error('Database error'));

      const req = mockAuthenticatedRequest();
      const response = await GET(req, { params: mockParams });
      const json = await response.json();

      expect(response.status).toBe(500);
      expect(json.error).toBe('Internal server error');
    });
  });

  describe('PUT /api/notes/[noteId]', () => {
    it('should update note successfully for owner', async () => {
      const existingNote = {
        id: 'note-123',
        title: 'Old Title',
        content_markdown: '# Old Content',
        folder_id: null,
        owner_id: 'user-123',
        created_at: new Date(),
        updated_at: new Date(),
      };

      const updatedNote = {
        ...existingNote,
        title: 'New Title',
        content_markdown: '# New Content',
        updated_at: new Date(),
      };

      (mockPrisma.note.findFirst as jest.Mock).mockResolvedValue(existingNote);
      (mockPrisma.note.update as jest.Mock).mockResolvedValue(updatedNote);

      const req = mockAuthenticatedRequest({
        title: 'New Title',
        content_markdown: '# New Content',
      });

      const response = await PUT(req, { params: mockParams });
      const json = await response.json();

      expect(response.status).toBe(200);
      expect(json).toEqual(updatedNote);
      expect(mockPrisma.note.update).toHaveBeenCalledWith({
        where: { id: 'note-123' },
        data: {
          title: 'New Title',
          content_markdown: '# New Content',
        },
      });
    });

    it('should update note for user with edit permission', async () => {
      const existingNote = {
        id: 'note-123',
        title: 'Shared Note',
        content_markdown: '# Shared Content',
        folder_id: null,
        owner_id: 'other-user',
        created_at: new Date(),
        updated_at: new Date(),
      };

      const updatedNote = {
        ...existingNote,
        title: 'Updated Shared Note',
        updated_at: new Date(),
      };

      (mockPrisma.note.findFirst as jest.Mock).mockResolvedValue(existingNote);
      (mockPrisma.note.update as jest.Mock).mockResolvedValue(updatedNote);

      const req = mockAuthenticatedRequest({
        title: 'Updated Shared Note',
      });

      const response = await PUT(req, { params: mockParams });
      const json = await response.json();

      expect(response.status).toBe(200);
      expect(json).toEqual(updatedNote);
    });

    it('should update only folder_id', async () => {
      const existingNote = {
        id: 'note-123',
        title: 'Test Note',
        content_markdown: '# Test Content',
        folder_id: null,
        owner_id: 'user-123',
        created_at: new Date(),
        updated_at: new Date(),
      };

      const updatedNote = {
        ...existingNote,
        folder_id: 'folder-456',
        updated_at: new Date(),
      };

      (mockPrisma.note.findFirst as jest.Mock).mockResolvedValue(existingNote);
      (mockPrisma.note.update as jest.Mock).mockResolvedValue(updatedNote);

      const req = mockAuthenticatedRequest({
        folder_id: 'folder-456',
      });

      const response = await PUT(req, { params: mockParams });
      const json = await response.json();

      expect(response.status).toBe(200);
      expect(json).toEqual(updatedNote);
      expect(mockPrisma.note.update).toHaveBeenCalledWith({
        where: { id: 'note-123' },
        data: {
          folder_id: 'folder-456',
        },
      });
    });

    it('should return 404 for non-existent note', async () => {
      (mockPrisma.note.findFirst as jest.Mock).mockResolvedValue(null);

      const req = mockAuthenticatedRequest({
        title: 'New Title',
      });

      const response = await PUT(req, { params: mockParams });
      const json = await response.json();

      expect(response.status).toBe(404);
      expect(json.error).toBe('Note not found or permission denied');
      expect(mockPrisma.note.update).not.toHaveBeenCalled();
    });

    it('should return 401 for unauthenticated request', async () => {
      const req = mockUnauthenticatedRequest({
        title: 'New Title',
      });

      const response = await PUT(req, { params: mockParams });
      const json = await response.json();

      expect(response.status).toBe(401);
      expect(json.error).toBe('Unauthorized');
      expect(mockPrisma.note.findFirst).not.toHaveBeenCalled();
    });

    it('should return 400 for invalid input', async () => {
      const req = mockAuthenticatedRequest({
        title: '', // Empty string should fail validation
      });

      const response = await PUT(req, { params: mockParams });
      const json = await response.json();

      expect(response.status).toBe(400);
      expect(json.error).toBe('Invalid input');
      expect(json.details).toBeDefined();
    });

    it('should return 500 on database error during findFirst', async () => {
      (mockPrisma.note.findFirst as jest.Mock).mockRejectedValue(new Error('Database error'));

      const req = mockAuthenticatedRequest({
        title: 'New Title',
      });

      const response = await PUT(req, { params: mockParams });
      const json = await response.json();

      expect(response.status).toBe(500);
      expect(json.error).toBe('Internal server error');
    });

    it('should return 500 on database error during update', async () => {
      const existingNote = {
        id: 'note-123',
        title: 'Test Note',
        owner_id: 'user-123',
      };

      (mockPrisma.note.findFirst as jest.Mock).mockResolvedValue(existingNote);
      (mockPrisma.note.update as jest.Mock).mockRejectedValue(new Error('Update error'));

      const req = mockAuthenticatedRequest({
        title: 'New Title',
      });

      const response = await PUT(req, { params: mockParams });
      const json = await response.json();

      expect(response.status).toBe(500);
      expect(json.error).toBe('Internal server error');
    });
  });

  describe('DELETE /api/notes/[noteId]', () => {
    it('should delete note successfully for owner', async () => {
      const existingNote = {
        id: 'note-123',
        title: 'Test Note',
        content_markdown: '# Test Content',
        folder_id: null,
        owner_id: 'user-123',
        created_at: new Date(),
        updated_at: new Date(),
      };

      (mockPrisma.note.findFirst as jest.Mock).mockResolvedValue(existingNote);
      (mockPrisma.note.delete as jest.Mock).mockResolvedValue(existingNote);

      const req = mockAuthenticatedRequest();
      const response = await DELETE(req, { params: mockParams });
      const json = await response.json();

      expect(response.status).toBe(200);
      expect(json.message).toBe('Note deleted successfully');
      expect(mockPrisma.note.findFirst).toHaveBeenCalledWith({
        where: {
          id: 'note-123',
          owner_id: 'user-123',
        },
      });
      expect(mockPrisma.note.delete).toHaveBeenCalledWith({
        where: { id: 'note-123' },
      });
    });

    it('should return 404 for non-existent note', async () => {
      (mockPrisma.note.findFirst as jest.Mock).mockResolvedValue(null);

      const req = mockAuthenticatedRequest();
      const response = await DELETE(req, { params: mockParams });
      const json = await response.json();

      expect(response.status).toBe(404);
      expect(json.error).toBe('Note not found or permission denied');
      expect(mockPrisma.note.delete).not.toHaveBeenCalled();
    });

    it('should return 404 for note owned by different user', async () => {
      (mockPrisma.note.findFirst as jest.Mock).mockResolvedValue(null);

      const req = mockAuthenticatedRequest({}, 'different-user');
      const response = await DELETE(req, { params: mockParams });
      const json = await response.json();

      expect(response.status).toBe(404);
      expect(json.error).toBe('Note not found or permission denied');
      expect(mockPrisma.note.delete).not.toHaveBeenCalled();
    });

    it('should return 401 for unauthenticated request', async () => {
      const req = mockUnauthenticatedRequest();
      const response = await DELETE(req, { params: mockParams });
      const json = await response.json();

      expect(response.status).toBe(401);
      expect(json.error).toBe('Unauthorized');
      expect(mockPrisma.note.findFirst).not.toHaveBeenCalled();
    });

    it('should return 500 on database error during findFirst', async () => {
      (mockPrisma.note.findFirst as jest.Mock).mockRejectedValue(new Error('Database error'));

      const req = mockAuthenticatedRequest();
      const response = await DELETE(req, { params: mockParams });
      const json = await response.json();

      expect(response.status).toBe(500);
      expect(json.error).toBe('Internal server error');
    });

    it('should return 500 on database error during delete', async () => {
      const existingNote = {
        id: 'note-123',
        owner_id: 'user-123',
      };

      (mockPrisma.note.findFirst as jest.Mock).mockResolvedValue(existingNote);
      (mockPrisma.note.delete as jest.Mock).mockRejectedValue(new Error('Delete error'));

      const req = mockAuthenticatedRequest();
      const response = await DELETE(req, { params: mockParams });
      const json = await response.json();

      expect(response.status).toBe(500);
      expect(json.error).toBe('Internal server error');
    });
  });
});
