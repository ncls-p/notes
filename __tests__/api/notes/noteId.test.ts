// Define mocks that can be referenced from outside
const findFirstMock = jest.fn();
const updateMock = jest.fn();
const deleteMock = jest.fn();

// Mock PrismaClient to use these specific mock functions
jest.mock('@prisma/client', () => ({
  PrismaClient: jest.fn().mockImplementation(() => ({
    note: {
      findFirst: findFirstMock,
      update: updateMock,
      delete: deleteMock,
    },
    // Mock other Prisma methods if needed
    $transaction: jest.fn(), // Example if transaction is used
  })),
}));

// Import route handlers AFTER jest.mock has been defined and hoisted
import { GET, PUT, DELETE } from '@/app/api/notes/[noteId]/route';
import { NextRequest } from 'next/server';
// PrismaClient import here is mostly for type, actual instance in route is mocked
// We don't need to import PrismaClient here anymore as we are not creating an instance of it in the test file.
// import { PrismaClient } from '@prisma/client';

// We don't need this instance anymore as we are using the global mocks.
// const mockPrisma = new PrismaClient();

describe('/api/notes/[noteId]', () => {
  beforeEach(() => {
    // Clear these specific, shared mock functions
    findFirstMock.mockClear();
    updateMock.mockClear();
    deleteMock.mockClear();
    // If $transaction was mocked and used:
    // jest.mocked(new PrismaClient().$transaction).mockClear(); // Need a way to get the mocked $transaction
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

      findFirstMock.mockResolvedValue(mockNote);

      const req = mockAuthenticatedRequest();
      const response = await GET(req, { params: mockParams });
      const json = await response.json();

      expect(response.status).toBe(200);
      expect(json).toEqual(mockNote);
      expect(findFirstMock).toHaveBeenCalledWith({
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

      findFirstMock.mockResolvedValue(mockNote);

      const req = mockAuthenticatedRequest({}, 'user-456');
      const response = await GET(req, { params: mockParams });
      const json = await response.json();

      expect(response.status).toBe(200);
      expect(json).toEqual(mockNote);
    });

    it('should return 404 for non-existent note', async () => {
      findFirstMock.mockResolvedValue(null);

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
      expect(findFirstMock).not.toHaveBeenCalled();
    });

    it('should return 500 on database error', async () => {
      findFirstMock.mockRejectedValue(new Error('Database error'));

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

      const updatedNoteData = {
        title: 'New Title',
        content_markdown: '# New Content',
      };
      const updatedNoteResult = {
        ...existingNote,
        ...updatedNoteData,
        updated_at: new Date(), // This will be different, so check separately or mock Date
      };

      findFirstMock.mockResolvedValue(existingNote);
      updateMock.mockResolvedValue(updatedNoteResult);

      const req = mockAuthenticatedRequest(updatedNoteData);

      const response = await PUT(req, { params: mockParams });
      const json = await response.json();

      expect(response.status).toBe(200);
      expect(json.id).toEqual(updatedNoteResult.id);
      expect(json.title).toEqual(updatedNoteResult.title);
      expect(updateMock).toHaveBeenCalledWith({
        where: { id: 'note-123' },
        data: updatedNoteData,
      });
    });

    it('should update note for user with edit permission', async () => {
      const existingNote = {
        id: 'note-123',
        title: 'Shared Note',
        content_markdown: '# Shared Content',
        folder_id: null,
        owner_id: 'other-user', // Not the current user
        permissions: [
          // User 'user-123' has edit permission
          { user_id: 'user-123', access_level: 'edit' },
        ],
        created_at: new Date(),
        updated_at: new Date(),
      };
      const updatedNoteData = {
        title: 'Updated Shared Note',
      };
      const updatedNoteResult = {
        ...existingNote,
        ...updatedNoteData,
        updated_at: new Date(),
      };

      findFirstMock.mockResolvedValue(existingNote); // findFirst is used to check permission
      updateMock.mockResolvedValue(updatedNoteResult);

      const req = mockAuthenticatedRequest(updatedNoteData, 'user-123');
      const response = await PUT(req, { params: mockParams });
      const json = await response.json();

      expect(response.status).toBe(200);
      expect(json.title).toEqual(updatedNoteResult.title);
    });

    it('should update only folder_id', async () => {
      const existingNote = {
        id: 'note-123',
        owner_id: 'user-123',
        folder_id: 'old-folder',
      };
      const updatedData = { folder_id: 'new-folder' };
      const updatedResult = { ...existingNote, ...updatedData };

      findFirstMock.mockResolvedValue(existingNote);
      updateMock.mockResolvedValue(updatedResult);

      const req = mockAuthenticatedRequest(updatedData);
      const response = await PUT(req, { params: mockParams });
      const json = await response.json();

      expect(response.status).toBe(200);
      expect(json.folder_id).toBe('new-folder');
      expect(updateMock).toHaveBeenCalledWith({
        where: { id: 'note-123' },
        data: updatedData,
      });
    });

    it('should return 404 if note not found for update', async () => {
      findFirstMock.mockResolvedValue(null); // Note doesn't exist or no permission

      const req = mockAuthenticatedRequest({ title: 'New Title' });
      const response = await PUT(req, { params: mockParams });
      const json = await response.json();

      expect(response.status).toBe(404);
      expect(json.error).toBe('Note not found or permission denied');
      expect(updateMock).not.toHaveBeenCalled();
    });

    it('should return 401 for unauthenticated update request', async () => {
      const req = mockUnauthenticatedRequest({ title: 'New Title' });
      const response = await PUT(req, { params: mockParams });
      const json = await response.json();

      expect(response.status).toBe(401);
      expect(json.error).toBe('Unauthorized');
      expect(findFirstMock).not.toHaveBeenCalled();
      expect(updateMock).not.toHaveBeenCalled();
    });

    it('should return 400 for invalid input', async () => {
      // This test relies on the actual Zod validation in the route
      // The global mock in setup-node.js bypasses validation by default.
      // To test this properly, we'd need to un-mock Zod or make the mock more sophisticated.
      // For now, we assume the global mock is in place.
      // If Zod validation were active, and we sent invalid data:
      const existingNote = { id: 'note-123', owner_id: 'user-123' };
      findFirstMock.mockResolvedValue(existingNote); // Permission check passes

      // Intentionally send data that would fail Zod validation if it were active
      // e.g. title: "" if min(1) is required.
      // Since our mock bypasses Zod, this won't directly trigger ZodError in the route from the test.
      // The route itself would need to throw a ZodError based on its schema.

      // To simulate a ZodError being thrown by the route for other reasons (e.g. direct .parse call)
      // we can mock request.json() to throw it.
      const mockZodError = new (jest.requireActual('zod').ZodError)([
        {
          code: 'too_small',
          minimum: 1,
          type: 'string',
          inclusive: true,
          exact: false,
          message: 'String must contain at least 1 character(s)',
          path: ['title'],
        },
      ]);

      const req = mockAuthenticatedRequest({});
      req.json = jest.fn().mockRejectedValue(mockZodError); // Simulate .json() itself throwing ZodError after parse

      const response = await PUT(req, { params: mockParams });
      const json = await response.json();

      expect(response.status).toBe(400);
      expect(json.error).toBe('Invalid input');
      expect(json.details).toBeDefined();
    });

    it('should return 500 on database error during findFirst', async () => {
      findFirstMock.mockRejectedValue(new Error('DB find error'));

      const req = mockAuthenticatedRequest({ title: 'New Title' });
      const response = await PUT(req, { params: mockParams });
      const json = await response.json();

      expect(response.status).toBe(500);
      expect(json.error).toBe('Internal server error');
    });

    it('should return 500 on database error during update', async () => {
      const existingNote = { id: 'note-123', owner_id: 'user-123' };
      findFirstMock.mockResolvedValue(existingNote);
      updateMock.mockRejectedValue(new Error('DB update error'));

      const req = mockAuthenticatedRequest({ title: 'New Title' });
      const response = await PUT(req, { params: mockParams });
      const json = await response.json();

      expect(response.status).toBe(500);
      expect(json.error).toBe('Internal server error');
    });
  });

  describe('DELETE /api/notes/[noteId]', () => {
    it('should delete note successfully for owner', async () => {
      const existingNote = { id: 'note-123', owner_id: 'user-123' };
      findFirstMock.mockResolvedValue(existingNote);
      deleteMock.mockResolvedValue({}); // Prisma delete returns void/undefined or the object

      const req = mockAuthenticatedRequest();
      const response = await DELETE(req, { params: mockParams });
      const json = await response.json();

      expect(response.status).toBe(200);
      expect(json.message).toBe('Note deleted successfully');
      expect(findFirstMock).toHaveBeenCalledWith({
        // Check findFirst for permission
        where: {
          id: 'note-123',
          owner_id: 'user-123',
        },
      });
      expect(deleteMock).toHaveBeenCalledWith({ where: { id: 'note-123' } });
    });

    it('should return 404 if note not found for delete', async () => {
      findFirstMock.mockResolvedValue(null); // Note not found or not owned by user

      const req = mockAuthenticatedRequest();
      const response = await DELETE(req, { params: mockParams });
      const json = await response.json();

      expect(response.status).toBe(404);
      expect(json.error).toBe('Note not found or permission denied');
      expect(deleteMock).not.toHaveBeenCalled();
    });

    it('should return 401 for unauthenticated delete request', async () => {
      const req = mockUnauthenticatedRequest();
      const response = await DELETE(req, { params: mockParams });
      const json = await response.json();

      expect(response.status).toBe(401);
      expect(json.error).toBe('Unauthorized');
      expect(findFirstMock).not.toHaveBeenCalled();
      expect(deleteMock).not.toHaveBeenCalled();
    });

    it('should return 500 on database error during findFirst', async () => {
      findFirstMock.mockRejectedValue(new Error('DB find error'));

      const req = mockAuthenticatedRequest();
      const response = await DELETE(req, { params: mockParams });
      const json = await response.json();

      expect(response.status).toBe(500);
      expect(json.error).toBe('Internal server error');
    });

    it('should return 500 on database error during delete', async () => {
      const existingNote = { id: 'note-123', owner_id: 'user-123' };
      findFirstMock.mockResolvedValue(existingNote);
      deleteMock.mockRejectedValue(new Error('DB delete error'));

      const req = mockAuthenticatedRequest();
      const response = await DELETE(req, { params: mockParams });
      const json = await response.json();

      expect(response.status).toBe(500);
      expect(json.error).toBe('Internal server error');
    });
  });
});
