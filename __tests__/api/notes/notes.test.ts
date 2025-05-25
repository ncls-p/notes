import { NextRequest } from 'next/server';
import { POST, GET } from '@/app/api/notes/route';
import { GET as getNoteById, PUT, DELETE } from '@/app/api/notes/[noteId]/route';
import * as serverAuth from '@/lib/auth/serverAuth';
import { PrismaClient } from '@prisma/client';

// Mock serverAuth
jest.mock('@/lib/auth/serverAuth');
const mockVerifyJWT = serverAuth.verifyJWT as jest.MockedFunction<typeof serverAuth.verifyJWT>;

// Mock PrismaClient
jest.mock('@prisma/client');
const MockedPrismaClient = PrismaClient as jest.MockedClass<typeof PrismaClient>;

describe('/api/notes', () => {
  let mockPrisma: any;
  let consoleSpy: jest.SpyInstance;

  beforeEach(() => {
    jest.clearAllMocks();

    // Mock Prisma instance
    mockPrisma = {
      note: {
        create: jest.fn(),
        findFirst: jest.fn(),
        findMany: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
        findUnique: jest.fn(),
      },
      folder: {
        findFirst: jest.fn(),
      },
    };

    MockedPrismaClient.mockImplementation(() => mockPrisma);

    // Mock console.error to avoid noise in tests
    consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    consoleSpy.mockRestore();
  });

  describe('POST /api/notes', () => {
    it('should return 401 when unauthorized', async () => {
      mockVerifyJWT.mockResolvedValue({
        success: false,
        error: 'Invalid token',
      });

      const request = new NextRequest('http://localhost/api/notes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: 'Test Note', content: 'Test content' }),
      });

      const response = await POST(request);
      expect(response.status).toBe(401);
    });

    it('should return 400 for invalid input - missing title', async () => {
      mockVerifyJWT.mockResolvedValue({
        success: true,
        userId: 'user-1',
        email: 'test@example.com',
      });

      const request = new NextRequest('http://localhost/api/notes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: 'Test content' }), // Missing title
      });

      const response = await POST(request);
      expect(response.status).toBe(400);
    });

    it('should return 400 for empty title', async () => {
      mockVerifyJWT.mockResolvedValue({
        success: true,
        userId: 'user-1',
        email: 'test@example.com',
      });

      const request = new NextRequest('http://localhost/api/notes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: '', content: 'Test content' }),
      });

      const response = await POST(request);
      expect(response.status).toBe(400);
    });

    it('should return 404 when folder does not exist', async () => {
      mockVerifyJWT.mockResolvedValue({
        success: true,
        userId: 'user-1',
        email: 'test@example.com',
      });

      mockPrisma.folder.findFirst.mockResolvedValue(null);

      const request = new NextRequest('http://localhost/api/notes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: 'Test Note',
          content: 'Test content',
          folderId: 'non-existent-folder'
        }),
      });

      const response = await POST(request);
      expect(response.status).toBe(404);
    });

    it('should create note successfully without folder', async () => {
      mockVerifyJWT.mockResolvedValue({
        success: true,
        userId: 'user-1',
        email: 'test@example.com',
      });

      const newNote = {
        id: 'note-1',
        title: 'Test Note',
        content: 'Test content',
        folderId: null,
        ownerId: 'user-1',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockPrisma.note.findFirst.mockResolvedValue(null); // No duplicate
      mockPrisma.note.create.mockResolvedValue(newNote);

      const request = new NextRequest('http://localhost/api/notes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: 'Test Note', content: 'Test content' }),
      });

      const response = await POST(request);
      expect(response.status).toBe(201);

      const responseData = await response.json();
      expect(responseData.note).toEqual(newNote);
    });

    it('should return 409 for duplicate note title in same folder', async () => {
      mockVerifyJWT.mockResolvedValue({
        success: true,
        userId: 'user-1',
        email: 'test@example.com',
      });

      const existingNote = {
        id: 'existing-note',
        title: 'Test Note',
        folderId: null,
        ownerId: 'user-1',
      };

      mockPrisma.note.findFirst.mockResolvedValue(existingNote);

      const request = new NextRequest('http://localhost/api/notes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: 'Test Note', content: 'Test content' }),
      });

      const response = await POST(request);
      expect(response.status).toBe(409);
    });
  });

  describe('GET /api/notes', () => {
    it('should return 401 when unauthorized', async () => {
      mockVerifyJWT.mockResolvedValue({
        success: false,
        error: 'Invalid token',
      });

      const request = new NextRequest('http://localhost/api/notes');
      const response = await GET(request);
      expect(response.status).toBe(401);
    });

    it('should list notes successfully', async () => {
      mockVerifyJWT.mockResolvedValue({
        success: true,
        userId: 'user-1',
        email: 'test@example.com',
      });

      const notes = [
        {
          id: 'note-1',
          title: 'Note 1',
          content: 'Content 1',
          folderId: null,
          ownerId: 'user-1',
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          id: 'note-2',
          title: 'Note 2',
          content: 'Content 2',
          folderId: null,
          ownerId: 'user-1',
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      mockPrisma.note.findMany.mockResolvedValue(notes);

      const request = new NextRequest('http://localhost/api/notes');
      const response = await GET(request);
      expect(response.status).toBe(200);

      const responseData = await response.json();
      expect(responseData.notes).toEqual(notes);
    });
  });

  describe('GET /api/notes/[noteId]', () => {
    it('should return 401 when unauthorized', async () => {
      mockVerifyJWT.mockResolvedValue({
        success: false,
        error: 'Invalid token',
      });

      const request = new NextRequest('http://localhost/api/notes/note-1');
      const response = await getNoteById(request, { params: { noteId: 'note-1' } });
      expect(response.status).toBe(401);
    });

    it('should return 404 for non-existent note', async () => {
      mockVerifyJWT.mockResolvedValue({
        success: true,
        userId: 'user-1',
        email: 'test@example.com',
      });

      mockPrisma.note.findFirst.mockResolvedValue(null);

      const request = new NextRequest('http://localhost/api/notes/note-1');
      const response = await getNoteById(request, { params: { noteId: 'note-1' } });
      expect(response.status).toBe(404);
    });

    it('should return note successfully', async () => {
      mockVerifyJWT.mockResolvedValue({
        success: true,
        userId: 'user-1',
        email: 'test@example.com',
      });

      const note = {
        id: 'note-1',
        title: 'Test Note',
        content: 'Test content',
        folderId: null,
        ownerId: 'user-1',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockPrisma.note.findFirst.mockResolvedValue(note);

      const request = new NextRequest('http://localhost/api/notes/note-1');
      const response = await getNoteById(request, { params: { noteId: 'note-1' } });
      expect(response.status).toBe(200);

      const responseData = await response.json();
      expect(responseData.note).toEqual(note);
    });
  });

  describe('PUT /api/notes/[noteId]', () => {
    it('should return 401 when unauthorized', async () => {
      mockVerifyJWT.mockResolvedValue({
        success: false,
        error: 'Invalid token',
      });

      const request = new NextRequest('http://localhost/api/notes/note-1', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: 'Updated Note', content: 'Updated content' }),
      });

      const response = await PUT(request, { params: { noteId: 'note-1' } });
      expect(response.status).toBe(401);
    });

    it('should return 404 for non-existent note', async () => {
      mockVerifyJWT.mockResolvedValue({
        success: true,
        userId: 'user-1',
        email: 'test@example.com',
      });

      mockPrisma.note.findFirst.mockResolvedValue(null);

      const request = new NextRequest('http://localhost/api/notes/note-1', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: 'Updated Note', content: 'Updated content' }),
      });

      const response = await PUT(request, { params: { noteId: 'note-1' } });
      expect(response.status).toBe(404);
    });

    it('should update note successfully', async () => {
      mockVerifyJWT.mockResolvedValue({
        success: true,
        userId: 'user-1',
        email: 'test@example.com',
      });

      const existingNote = {
        id: 'note-1',
        title: 'Test Note',
        content: 'Test content',
        folderId: null,
        ownerId: 'user-1',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const updatedNote = {
        ...existingNote,
        title: 'Updated Note',
        content: 'Updated content',
        updatedAt: new Date(),
      };

      mockPrisma.note.findFirst.mockResolvedValue(existingNote);
      mockPrisma.note.update.mockResolvedValue(updatedNote);

      const request = new NextRequest('http://localhost/api/notes/note-1', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: 'Updated Note', content: 'Updated content' }),
      });

      const response = await PUT(request, { params: { noteId: 'note-1' } });
      expect(response.status).toBe(200);

      const responseData = await response.json();
      expect(responseData.note.title).toBe('Updated Note');
      expect(responseData.note.content).toBe('Updated content');
    });
  });

  describe('DELETE /api/notes/[noteId]', () => {
    it('should return 401 when unauthorized', async () => {
      mockVerifyJWT.mockResolvedValue({
        success: false,
        error: 'Invalid token',
      });

      const request = new NextRequest('http://localhost/api/notes/note-1', {
        method: 'DELETE',
      });

      const response = await DELETE(request, { params: { noteId: 'note-1' } });
      expect(response.status).toBe(401);
    });

    it('should return 404 for non-existent note', async () => {
      mockVerifyJWT.mockResolvedValue({
        success: true,
        userId: 'user-1',
        email: 'test@example.com',
      });

      mockPrisma.note.findFirst.mockResolvedValue(null);

      const request = new NextRequest('http://localhost/api/notes/note-1', {
        method: 'DELETE',
      });

      const response = await DELETE(request, { params: { noteId: 'note-1' } });
      expect(response.status).toBe(404);
    });

    it('should delete note successfully', async () => {
      mockVerifyJWT.mockResolvedValue({
        success: true,
        userId: 'user-1',
        email: 'test@example.com',
      });

      const existingNote = {
        id: 'note-1',
        title: 'Test Note',
        content: 'Test content',
        folderId: null,
        ownerId: 'user-1',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockPrisma.note.findFirst.mockResolvedValue(existingNote);
      mockPrisma.note.delete.mockResolvedValue(existingNote);

      const request = new NextRequest('http://localhost/api/notes/note-1', {
        method: 'DELETE',
      });

      const response = await DELETE(request, { params: { noteId: 'note-1' } });
      expect(response.status).toBe(200);

      const responseData = await response.json();
      expect(responseData.message).toBe('Note deleted successfully');
    });
  });
});