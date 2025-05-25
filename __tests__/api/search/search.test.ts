import { NextRequest } from 'next/server';
import { GET } from '@/app/api/search/route';
import { PrismaClient } from '@prisma/client';
import { verifyJWT } from '@/lib/auth/serverAuth';

// Mock dependencies
jest.mock('@prisma/client');
jest.mock('@/lib/auth/serverAuth');
jest.mock('@/lib/logger', () => ({
  apiLogger: {
    child: jest.fn(() => ({
      info: jest.fn(),
      warn: jest.fn(),
      debug: jest.fn(),
    })),
  },
  logError: jest.fn(),
  logDatabaseOperation: jest.fn(),
  logPerformance: jest.fn(),
}));

const mockVerifyJWT = verifyJWT as jest.MockedFunction<typeof verifyJWT>;
const MockedPrismaClient = PrismaClient as jest.MockedClass<typeof PrismaClient>;

describe('/api/search', () => {
  let mockPrisma: any;
  let consoleSpy: jest.SpyInstance;

  beforeEach(() => {
    jest.clearAllMocks();

    // Mock Prisma instance
    mockPrisma = {
      folder: {
        findMany: jest.fn(),
        findUnique: jest.fn(),
      },
      note: {
        findMany: jest.fn(),
      },
    };

    MockedPrismaClient.mockImplementation(() => mockPrisma);

    // Mock console.error to avoid noise in tests
    consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    consoleSpy.mockRestore();
  });

  describe('GET /api/search', () => {
    it('should return 401 when unauthorized', async () => {
      mockVerifyJWT.mockResolvedValue({
        success: false,
        error: 'Invalid token',
      });

      const request = new NextRequest('http://localhost/api/search?query=test');
      const response = await GET(request);
      expect(response.status).toBe(401);
    });

    it('should return 400 when query is missing', async () => {
      mockVerifyJWT.mockResolvedValue({
        success: true,
        userId: 'user-1',
        email: 'test@example.com',
      });

      const request = new NextRequest('http://localhost/api/search');
      const response = await GET(request);
      expect(response.status).toBe(400);
    });

    it('should search folders and notes successfully', async () => {
      mockVerifyJWT.mockResolvedValue({
        success: true,
        userId: 'user-1',
        email: 'test@example.com',
      });

      const mockFolders = [
        {
          id: 'folder-1',
          name: 'Test Folder',
          parentId: null,
          parent: null,
          _count: { children: 2, notes: 3 },
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      const mockNotes = [
        {
          id: 'note-1',
          title: 'Test Note',
          contentMarkdown: 'This is a test note content',
          folderId: 'folder-1',
          folder: { id: 'folder-1', name: 'Test Folder' },
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      mockPrisma.folder.findMany.mockResolvedValue(mockFolders);
      mockPrisma.note.findMany.mockResolvedValue(mockNotes);
      mockPrisma.folder.findUnique.mockResolvedValue(null); // For path building

      const request = new NextRequest('http://localhost/api/search?query=test');
      const response = await GET(request);

      if (response.status !== 200) {
        const errorData = await response.json();
        console.log('Error response:', errorData);
      }

      expect(response.status).toBe(200);

      const responseData = await response.json();
      expect(responseData.results).toHaveLength(2);
      expect(responseData.query).toBe('test');
      expect(responseData.totalResults).toBe(2);

      // Check folder result
      const folderResult = responseData.results.find((r: any) => r.type === 'folder');
      expect(folderResult).toBeDefined();
      expect(folderResult.name).toBe('Test Folder');
      expect(folderResult.path).toBe('Root');

      // Check note result
      const noteResult = responseData.results.find((r: any) => r.type === 'note');
      expect(noteResult).toBeDefined();
      expect(noteResult.title).toBe('Test Note');
      expect(noteResult.path).toBe('Root');
    });

    it('should build folder paths correctly', async () => {
      mockVerifyJWT.mockResolvedValue({
        success: true,
        userId: 'user-1',
        email: 'test@example.com',
      });

      const mockFolders = [
        {
          id: 'folder-2',
          name: 'Child Folder',
          parentId: 'folder-1',
          parent: { id: 'folder-1', name: 'Parent Folder' },
          _count: { children: 0, notes: 1 },
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      const mockNotes = [];

      mockPrisma.folder.findMany.mockResolvedValue(mockFolders);
      mockPrisma.note.findMany.mockResolvedValue(mockNotes);

      // Mock the path building
      mockPrisma.folder.findUnique
        .mockResolvedValueOnce({ name: 'Parent Folder', parentId: null })
        .mockResolvedValueOnce(null);

      const request = new NextRequest('http://localhost/api/search?query=child');
      const response = await GET(request);
      expect(response.status).toBe(200);

      const responseData = await response.json();
      expect(responseData.results).toHaveLength(1);

      const folderResult = responseData.results[0];
      expect(folderResult.path).toBe('Parent Folder');
    });

    it('should handle sorting by name', async () => {
      mockVerifyJWT.mockResolvedValue({
        success: true,
        userId: 'user-1',
        email: 'test@example.com',
      });

      const mockFolders = [
        {
          id: 'folder-1',
          name: 'Z Folder',
          parentId: null,
          parent: null,
          _count: { children: 0, notes: 0 },
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          id: 'folder-2',
          name: 'A Folder',
          parentId: null,
          parent: null,
          _count: { children: 0, notes: 0 },
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      mockPrisma.folder.findMany.mockResolvedValue(mockFolders);
      mockPrisma.note.findMany.mockResolvedValue([]);
      mockPrisma.folder.findUnique.mockResolvedValue(null);

      const request = new NextRequest(
        'http://localhost/api/search?query=folder&sortBy=name&sortOrder=asc'
      );
      const response = await GET(request);
      expect(response.status).toBe(200);

      const responseData = await response.json();
      expect(responseData.results).toHaveLength(2);
      expect(responseData.results[0].name).toBe('A Folder');
      expect(responseData.results[1].name).toBe('Z Folder');
    });
  });
});
