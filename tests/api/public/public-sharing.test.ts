import { describe, it, expect, beforeEach, vi } from 'vitest';
import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

// Mock the API routes
vi.mock('../../../app/api/notes/[noteId]/public/route', async (importOriginal) => {
  const actual = await importOriginal();
  return {
    ...actual,
  };
});

vi.mock('../../../app/api/folders/[folderId]/public/route', async (importOriginal) => {
  const actual = await importOriginal();
  return {
    ...actual,
  };
});

vi.mock('../../../app/api/public/notes/[token]/route', async (importOriginal) => {
  const actual = await importOriginal();
  return {
    ...actual,
  };
});

vi.mock('../../../app/api/public/folders/[token]/route', async (importOriginal) => {
  const actual = await importOriginal();
  return {
    ...actual,
  };
});

// Mock Prisma
vi.mock('@prisma/client', () => {
  const mockPrismaClient = {
    note: {
      findUnique: vi.fn(),
      update: vi.fn(),
    },
    folder: {
      findUnique: vi.fn(),
      update: vi.fn(),
    },
  };
  return {
    PrismaClient: vi.fn(() => mockPrismaClient),
  };
});

// Mock Auth Middleware
vi.mock('../../../lib/auth/middleware', () => ({
  authMiddleware: vi.fn(() => null), // Return null to indicate auth success
}));

describe('Public Sharing API Routes', () => {
  let mockPrisma;
  
  beforeEach(() => {
    vi.resetAllMocks();
    mockPrisma = new PrismaClient();
  });

  describe('PUT /api/notes/[noteId]/public', () => {
    it('should toggle note to public', async () => {
      const { PUT } = await import('../../../app/api/notes/[noteId]/public/route');
      
      const mockNote = {
        id: 'note-1',
        title: 'Test Note',
        is_public: false,
        public_share_token: null,
      };
      
      mockPrisma.note.findUnique.mockResolvedValue(mockNote);
      mockPrisma.note.update.mockImplementation((args) => {
        return Promise.resolve({
          ...mockNote,
          is_public: args.data.is_public,
          public_share_token: args.data.public_share_token,
        });
      });
      
      const mockRequest = new NextRequest('http://localhost:3000/api/notes/note-1/public', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ isPublic: true }),
      });

      const response = await PUT(mockRequest, { params: { noteId: 'note-1' } });
      const responseData = await response.json();
      
      expect(response.status).toBe(200);
      expect(responseData.message).toBe('Note set to public');
      expect(responseData.note.is_public).toBe(true);
      expect(responseData.note.public_share_token).toBeTruthy();
    });

    it('should toggle note to private', async () => {
      const { PUT } = await import('../../../app/api/notes/[noteId]/public/route');
      
      const mockNote = {
        id: 'note-1',
        title: 'Test Note',
        is_public: true,
        public_share_token: 'test-token',
      };
      
      mockPrisma.note.findUnique.mockResolvedValue(mockNote);
      mockPrisma.note.update.mockImplementation((args) => {
        return Promise.resolve({
          ...mockNote,
          is_public: args.data.is_public,
          public_share_token: args.data.public_share_token,
        });
      });
      
      const mockRequest = new NextRequest('http://localhost:3000/api/notes/note-1/public', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ isPublic: false }),
      });

      const response = await PUT(mockRequest, { params: { noteId: 'note-1' } });
      const responseData = await response.json();
      
      expect(response.status).toBe(200);
      expect(responseData.message).toBe('Note set to private');
      expect(responseData.note.is_public).toBe(false);
      expect(responseData.note.public_share_token).toBeNull();
    });
  });

  describe('PUT /api/folders/[folderId]/public', () => {
    it('should toggle folder to public', async () => {
      const { PUT } = await import('../../../app/api/folders/[folderId]/public/route');
      
      const mockFolder = {
        id: 'folder-1',
        name: 'Test Folder',
        is_public: false,
        public_share_token: null,
      };
      
      mockPrisma.folder.findUnique.mockResolvedValue(mockFolder);
      mockPrisma.folder.update.mockImplementation((args) => {
        return Promise.resolve({
          ...mockFolder,
          is_public: args.data.is_public,
          public_share_token: args.data.public_share_token,
        });
      });
      
      const mockRequest = new NextRequest('http://localhost:3000/api/folders/folder-1/public', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ isPublic: true }),
      });

      const response = await PUT(mockRequest, { params: { folderId: 'folder-1' } });
      const responseData = await response.json();
      
      expect(response.status).toBe(200);
      expect(responseData.message).toBe('Folder set to public');
      expect(responseData.folder.is_public).toBe(true);
      expect(responseData.folder.public_share_token).toBeTruthy();
    });
  });

  describe('GET /api/public/notes/[token]', () => {
    it('should return a public note', async () => {
      const { GET } = await import('../../../app/api/public/notes/[token]/route');
      
      const mockNote = {
        id: 'note-1',
        title: 'Test Note',
        content_markdown: 'Test content',
        created_at: new Date(),
        updated_at: new Date(),
        owner: {
          id: 'user-1',
          email: 'test@example.com'
        }
      };
      
      mockPrisma.note.findUnique.mockResolvedValue(mockNote);
      
      const mockRequest = new NextRequest('http://localhost:3000/api/public/notes/test-token');
      const response = await GET(mockRequest, { params: { token: 'test-token' } });
      const responseData = await response.json();
      
      expect(response.status).toBe(200);
      expect(responseData).toEqual(mockNote);
    });

    it('should return 404 for non-existent or non-public note', async () => {
      const { GET } = await import('../../../app/api/public/notes/[token]/route');
      
      mockPrisma.note.findUnique.mockResolvedValue(null);
      
      const mockRequest = new NextRequest('http://localhost:3000/api/public/notes/invalid-token');
      const response = await GET(mockRequest, { params: { token: 'invalid-token' } });
      
      expect(response.status).toBe(404);
    });
  });
});