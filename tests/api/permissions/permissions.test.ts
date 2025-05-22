import { describe, it, expect, beforeEach, vi } from 'vitest';
import { NextRequest } from 'next/server';
import { PrismaClient } from '@prisma/client';

// Mock the API routes
vi.mock('../../../app/api/permissions/route', async (importOriginal) => {
  const actual = await importOriginal();
  return {
    ...actual,
    // Mock the exported functions (GET, POST, etc.)
  };
});

vi.mock('../../../app/api/permissions/[permissionId]/route', async (importOriginal) => {
  const actual = await importOriginal();
  return {
    ...actual,
    // Mock the exported functions (PUT, DELETE, etc.)
  };
});

vi.mock('@prisma/client', () => {
  const mockPrismaClient = {
    permission: {
      create: vi.fn(),
      findMany: vi.fn(),
      findUnique: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
    note: {
      findUnique: vi.fn(),
    },
    folder: {
      findUnique: vi.fn(),
    },
    user: {
      findUnique: vi.fn(),
      findFirst: vi.fn(),
    },
  };
  return {
    PrismaClient: vi.fn(() => mockPrismaClient),
  };
});

vi.mock('jsonwebtoken', () => ({
  verify: vi.fn(() => ({ userId: 'user-1', email: 'test@example.com' })),
}));

// Mock our permission helper
vi.mock('../../../lib/auth/permissions', () => ({
  hasPermission: vi.fn(() => true),
  getUsersWithAccess: vi.fn(() => []),
}));

describe('Permissions API Routes', () => {
  let mockPrisma;
  
  beforeEach(() => {
    vi.resetAllMocks();
    mockPrisma = new PrismaClient();
  });

  describe('GET /api/permissions', () => {
    it('should return collaborators for an entity', async () => {
      const { GET } = await import('../../../app/api/permissions/route');
      
      const mockCollaborators = [
        {
          user: { id: 'user-1', email: 'test@example.com' },
          accessLevel: 'owner',
          isOwner: true
        },
        {
          user: { id: 'user-2', email: 'collaborator@example.com' },
          accessLevel: 'view',
          isOwner: false
        }
      ];
      
      const { getUsersWithAccess } = await import('../../../lib/auth/permissions');
      (getUsersWithAccess as jest.Mock).mockResolvedValue(mockCollaborators);
      
      const mockRequest = new NextRequest(
        'http://localhost:3000/api/permissions?entityType=note&entityId=note-1',
        {
          method: 'GET',
          headers: {
            'Authorization': '******',
          },
        }
      );

      const response = await GET(mockRequest);
      const responseData = await response.json();
      
      expect(response.status).toBe(200);
      expect(getUsersWithAccess).toHaveBeenCalledWith('note', 'note-1');
      expect(responseData).toEqual(mockCollaborators);
    });
    
    it('should validate query parameters', async () => {
      const { GET } = await import('../../../app/api/permissions/route');
      
      const mockRequest = new NextRequest(
        'http://localhost:3000/api/permissions', // Missing params
        {
          method: 'GET',
          headers: {
            'Authorization': '******',
          },
        }
      );

      const response = await GET(mockRequest);
      expect(response.status).toBe(400);
    });
  });

  describe('POST /api/permissions', () => {
    it('should create a permission', async () => {
      const { POST } = await import('../../../app/api/permissions/route');
      
      const mockPermission = {
        id: 'perm-1',
        user_id: 'user-2',
        entity_type: 'note',
        entity_id: 'note-1',
        access_level: 'view',
        createdAt: new Date()
      };
      
      // Mock note existence
      mockPrisma.note.findUnique.mockResolvedValue({
        id: 'note-1',
        owner_id: 'user-1' // Current user is owner
      });
      
      // Mock user existence
      mockPrisma.user.findUnique.mockResolvedValue({
        id: 'user-2',
        email: 'collaborator@example.com'
      });
      
      mockPrisma.permission.create.mockResolvedValue(mockPermission);
      
      const mockRequest = new NextRequest('http://localhost:3000/api/permissions', {
        method: 'POST',
        headers: {
          'Authorization': '******',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          user_id: 'user-2',
          entity_type: 'note',
          entity_id: 'note-1',
          access_level: 'view'
        }),
      });

      const response = await POST(mockRequest);
      const responseData = await response.json();
      
      expect(response.status).toBe(201);
      expect(mockPrisma.permission.create).toHaveBeenCalledWith({
        data: {
          user_id: 'user-2',
          entity_type: 'note',
          entity_id: 'note-1',
          access_level: 'view'
        }
      });
      expect(responseData).toHaveProperty('message', 'Permission created successfully');
      expect(responseData).toHaveProperty('permission');
    });
    
    it('should validate required fields', async () => {
      const { POST } = await import('../../../app/api/permissions/route');
      
      const mockRequest = new NextRequest('http://localhost:3000/api/permissions', {
        method: 'POST',
        headers: {
          'Authorization': '******',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          // Missing required fields
          user_id: 'user-2',
          entity_id: 'note-1',
        }),
      });

      const response = await POST(mockRequest);
      expect(response.status).toBe(400);
    });
    
    it('should validate access level', async () => {
      const { POST } = await import('../../../app/api/permissions/route');
      
      const mockRequest = new NextRequest('http://localhost:3000/api/permissions', {
        method: 'POST',
        headers: {
          'Authorization': '******',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          user_id: 'user-2',
          entity_type: 'note',
          entity_id: 'note-1',
          access_level: 'invalid' // Invalid access level
        }),
      });

      const response = await POST(mockRequest);
      expect(response.status).toBe(400);
    });
    
    it('should validate entity type', async () => {
      const { POST } = await import('../../../app/api/permissions/route');
      
      const mockRequest = new NextRequest('http://localhost:3000/api/permissions', {
        method: 'POST',
        headers: {
          'Authorization': '******',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          user_id: 'user-2',
          entity_type: 'invalid', // Invalid entity type
          entity_id: 'note-1',
          access_level: 'view'
        }),
      });

      const response = await POST(mockRequest);
      expect(response.status).toBe(400);
    });
    
    it('should check if entity exists', async () => {
      const { POST } = await import('../../../app/api/permissions/route');
      
      // No entity found
      mockPrisma.note.findUnique.mockResolvedValue(null);
      
      const mockRequest = new NextRequest('http://localhost:3000/api/permissions', {
        method: 'POST',
        headers: {
          'Authorization': '******',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          user_id: 'user-2',
          entity_type: 'note',
          entity_id: 'note-1',
          access_level: 'view'
        }),
      });

      const response = await POST(mockRequest);
      expect(response.status).toBe(404);
    });
    
    it('should check if user exists', async () => {
      const { POST } = await import('../../../app/api/permissions/route');
      
      // Entity exists
      mockPrisma.note.findUnique.mockResolvedValue({
        id: 'note-1',
        owner_id: 'user-1'
      });
      
      // User doesn't exist
      mockPrisma.user.findUnique.mockResolvedValue(null);
      
      const mockRequest = new NextRequest('http://localhost:3000/api/permissions', {
        method: 'POST',
        headers: {
          'Authorization': '******',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          user_id: 'user-2',
          entity_type: 'note',
          entity_id: 'note-1',
          access_level: 'view'
        }),
      });

      const response = await POST(mockRequest);
      expect(response.status).toBe(404);
    });
  });

  describe('PUT /api/permissions/[permissionId]', () => {
    it('should update a permission access level', async () => {
      const { PUT } = await import('../../../app/api/permissions/[permissionId]/route');
      
      const mockPermission = {
        id: 'perm-1',
        user_id: 'user-2',
        entity_type: 'note',
        entity_id: 'note-1',
        access_level: 'view'
      };
      
      mockPrisma.permission.findUnique.mockResolvedValue(mockPermission);
      mockPrisma.note.findUnique.mockResolvedValue({
        id: 'note-1',
        owner_id: 'user-1' // Current user is owner
      });
      mockPrisma.permission.update.mockResolvedValue({
        ...mockPermission,
        access_level: 'edit'
      });
      
      const mockRequest = new NextRequest('http://localhost:3000/api/permissions/perm-1', {
        method: 'PUT',
        headers: {
          'Authorization': '******',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          access_level: 'edit'
        }),
      });

      const response = await PUT(mockRequest, { params: { permissionId: 'perm-1' } });
      const responseData = await response.json();
      
      expect(response.status).toBe(200);
      expect(mockPrisma.permission.update).toHaveBeenCalledWith({
        where: { id: 'perm-1' },
        data: { access_level: 'edit' }
      });
      expect(responseData).toHaveProperty('message', 'Permission updated successfully');
    });
    
    it('should validate access level', async () => {
      const { PUT } = await import('../../../app/api/permissions/[permissionId]/route');
      
      const mockRequest = new NextRequest('http://localhost:3000/api/permissions/perm-1', {
        method: 'PUT',
        headers: {
          'Authorization': '******',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          access_level: 'invalid' // Invalid access level
        }),
      });

      const response = await PUT(mockRequest, { params: { permissionId: 'perm-1' } });
      expect(response.status).toBe(400);
    });
    
    it('should return 404 for non-existent permission', async () => {
      const { PUT } = await import('../../../app/api/permissions/[permissionId]/route');
      
      mockPrisma.permission.findUnique.mockResolvedValue(null);
      
      const mockRequest = new NextRequest('http://localhost:3000/api/permissions/perm-1', {
        method: 'PUT',
        headers: {
          'Authorization': '******',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          access_level: 'edit'
        }),
      });

      const response = await PUT(mockRequest, { params: { permissionId: 'perm-1' } });
      expect(response.status).toBe(404);
    });
  });

  describe('DELETE /api/permissions/[permissionId]', () => {
    it('should delete a permission', async () => {
      const { DELETE } = await import('../../../app/api/permissions/[permissionId]/route');
      
      const mockPermission = {
        id: 'perm-1',
        user_id: 'user-2',
        entity_type: 'note',
        entity_id: 'note-1',
        access_level: 'view'
      };
      
      mockPrisma.permission.findUnique.mockResolvedValue(mockPermission);
      mockPrisma.note.findUnique.mockResolvedValue({
        id: 'note-1',
        owner_id: 'user-1' // Current user is owner
      });
      mockPrisma.permission.delete.mockResolvedValue(mockPermission);
      
      const mockRequest = new NextRequest('http://localhost:3000/api/permissions/perm-1', {
        method: 'DELETE',
        headers: {
          'Authorization': '******',
        },
      });

      const response = await DELETE(mockRequest, { params: { permissionId: 'perm-1' } });
      const responseData = await response.json();
      
      expect(response.status).toBe(200);
      expect(mockPrisma.permission.delete).toHaveBeenCalledWith({
        where: { id: 'perm-1' }
      });
      expect(responseData).toHaveProperty('message', 'Permission revoked successfully');
    });
    
    it('should return 404 for non-existent permission', async () => {
      const { DELETE } = await import('../../../app/api/permissions/[permissionId]/route');
      
      mockPrisma.permission.findUnique.mockResolvedValue(null);
      
      const mockRequest = new NextRequest('http://localhost:3000/api/permissions/perm-1', {
        method: 'DELETE',
        headers: {
          'Authorization': '******',
        },
      });

      const response = await DELETE(mockRequest, { params: { permissionId: 'perm-1' } });
      expect(response.status).toBe(404);
    });
  });
});