import { describe, it, expect, beforeEach, vi } from 'vitest';
import { NextRequest, NextResponse } from 'next/server';
import * as uuid from 'uuid';
import { PrismaClient } from '@prisma/client';

// Mock the API routes (you'll need to adjust these imports to match your actual directory structure)
vi.mock('../../../app/api/invitations/route', async (importOriginal) => {
  const actual = await importOriginal();
  return {
    ...actual,
    // Mock the exported functions (GET, POST, etc.)
  };
});

vi.mock('@prisma/client', () => {
  const mockPrismaClient = {
    invitation: {
      create: vi.fn(),
      findMany: vi.fn(),
      findUnique: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
    permission: {
      create: vi.fn(),
    },
    user: {
      findUnique: vi.fn(),
      findFirst: vi.fn(),
    },
    $transaction: vi.fn((callback) => callback(mockPrismaClient)),
  };
  return {
    PrismaClient: vi.fn(() => mockPrismaClient),
  };
});

vi.mock('uuid', () => ({
  v4: () => 'mocked-uuid',
}));

vi.mock('jsonwebtoken', () => ({
  verify: vi.fn(() => ({ userId: 'user-1', email: 'test@example.com' })),
}));

describe('Invitation API Routes', () => {
  let mockPrisma;
  
  beforeEach(() => {
    vi.resetAllMocks();
    mockPrisma = new PrismaClient();
  });

  describe('POST /api/invitations', () => {
    it('should create a new invitation', async () => {
      // Import the handler after mocking
      const { POST } = await import('../../../app/api/invitations/route');
      
      mockPrisma.user.findFirst.mockResolvedValue({
        id: 'user-2',
        email: 'invitee@example.com',
      });

      const mockRequest = new NextRequest('http://localhost:3000/api/invitations', {
        method: 'POST',
        headers: {
          'Authorization': '******',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          entity_type: 'note',
          entity_id: 'note-1',
          invitee_email: 'invitee@example.com',
          access_level: 'view'
        }),
      });

      const response = await POST(mockRequest);
      const responseData = await response.json();
      
      expect(response.status).toBe(201);
      expect(mockPrisma.invitation.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          inviter_id: 'user-1',
          invitee_email: 'invitee@example.com',
          entity_type: 'note',
          entity_id: 'note-1',
          access_level: 'view',
          token: expect.any(String),
          expires_at: expect.any(Date),
        }),
      });
      expect(responseData).toHaveProperty('id');
    });
    
    it('should validate required fields', async () => {
      const { POST } = await import('../../../app/api/invitations/route');
      
      const mockRequest = new NextRequest('http://localhost:3000/api/invitations', {
        method: 'POST',
        headers: {
          'Authorization': '******',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          // Missing required fields
          entity_id: 'note-1',
          access_level: 'view'
        }),
      });

      const response = await POST(mockRequest);
      expect(response.status).toBe(400);
    });
    
    it('should validate access level', async () => {
      const { POST } = await import('../../../app/api/invitations/route');
      
      const mockRequest = new NextRequest('http://localhost:3000/api/invitations', {
        method: 'POST',
        headers: {
          'Authorization': '******',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          entity_type: 'note',
          entity_id: 'note-1',
          invitee_email: 'invitee@example.com',
          access_level: 'invalid' // Invalid access level
        }),
      });

      const response = await POST(mockRequest);
      expect(response.status).toBe(400);
    });
  });

  describe('GET /api/invitations/pending', () => {
    it('should return pending invitations for the user', async () => {
      const { GET } = await import('../../../app/api/invitations/pending/route');
      
      const mockInvitations = [
        {
          id: 'inv-1',
          entity_type: 'note',
          entity_id: 'note-1',
          access_level: 'view',
          status: 'pending',
          token: 'token-1',
          expires_at: new Date(Date.now() + 86400000), // 1 day in the future
          created_at: new Date(),
          inviter: {
            id: 'user-2',
            email: 'inviter@example.com'
          }
        }
      ];
      
      mockPrisma.invitation.findMany.mockResolvedValue(mockInvitations);
      
      const mockRequest = new NextRequest('http://localhost:3000/api/invitations/pending', {
        method: 'GET',
        headers: {
          'Authorization': '******',
        },
      });

      const response = await GET(mockRequest);
      const responseData = await response.json();
      
      expect(response.status).toBe(200);
      expect(mockPrisma.invitation.findMany).toHaveBeenCalledWith({
        where: {
          invitee_email: 'test@example.com',
          status: 'pending',
          expires_at: { gt: expect.any(Date) }
        },
        include: {
          inviter: {
            select: {
              id: true,
              email: true
            }
          }
        }
      });
      expect(responseData).toEqual(mockInvitations);
    });
  });

  describe('POST /api/invitations/[invitationId]/accept', () => {
    it('should accept an invitation and create a permission', async () => {
      const { POST } = await import('../../../app/api/invitations/[invitationId]/accept/route');
      
      const mockInvitation = {
        id: 'inv-1',
        inviter_id: 'user-2',
        invitee_email: 'test@example.com',
        entity_type: 'note',
        entity_id: 'note-1',
        access_level: 'view',
        status: 'pending',
        token: 'token-1',
        expires_at: new Date(Date.now() + 86400000), // 1 day in the future
        createdAt: new Date()
      };
      
      const mockPermission = {
        id: 'perm-1',
        user_id: 'user-1',
        entity_type: 'note',
        entity_id: 'note-1',
        access_level: 'view',
        createdAt: new Date()
      };
      
      mockPrisma.invitation.findUnique.mockResolvedValue(mockInvitation);
      mockPrisma.invitation.update.mockResolvedValue({
        ...mockInvitation,
        status: 'accepted'
      });
      mockPrisma.permission.create.mockResolvedValue(mockPermission);
      
      const mockRequest = new NextRequest('http://localhost:3000/api/invitations/inv-1/accept', {
        method: 'POST',
        headers: {
          'Authorization': '******',
        },
      });

      const response = await POST(mockRequest, { params: { invitationId: 'inv-1' } });
      const responseData = await response.json();
      
      expect(response.status).toBe(200);
      expect(mockPrisma.invitation.update).toHaveBeenCalledWith({
        where: { id: 'inv-1' },
        data: { status: 'accepted' }
      });
      expect(mockPrisma.permission.create).toHaveBeenCalledWith({
        data: {
          user_id: 'user-1',
          entity_type: 'note',
          entity_id: 'note-1',
          access_level: 'view'
        }
      });
      expect(responseData).toHaveProperty('message', 'Invitation accepted successfully');
    });
    
    it('should return 404 for non-existent invitation', async () => {
      const { POST } = await import('../../../app/api/invitations/[invitationId]/accept/route');
      
      mockPrisma.invitation.findUnique.mockResolvedValue(null);
      
      const mockRequest = new NextRequest('http://localhost:3000/api/invitations/inv-1/accept', {
        method: 'POST',
        headers: {
          'Authorization': '******',
        },
      });

      const response = await POST(mockRequest, { params: { invitationId: 'inv-1' } });
      expect(response.status).toBe(404);
    });
    
    it('should return 403 for expired invitation', async () => {
      const { POST } = await import('../../../app/api/invitations/[invitationId]/accept/route');
      
      const mockInvitation = {
        id: 'inv-1',
        inviter_id: 'user-2',
        invitee_email: 'test@example.com',
        entity_type: 'note',
        entity_id: 'note-1',
        access_level: 'view',
        status: 'pending',
        token: 'token-1',
        expires_at: new Date(Date.now() - 86400000), // 1 day in the past
        createdAt: new Date()
      };
      
      mockPrisma.invitation.findUnique.mockResolvedValue(mockInvitation);
      
      const mockRequest = new NextRequest('http://localhost:3000/api/invitations/inv-1/accept', {
        method: 'POST',
        headers: {
          'Authorization': '******',
        },
      });

      const response = await POST(mockRequest, { params: { invitationId: 'inv-1' } });
      expect(response.status).toBe(403);
    });
  });

  describe('POST /api/invitations/[invitationId]/decline', () => {
    it('should decline an invitation', async () => {
      const { POST } = await import('../../../app/api/invitations/[invitationId]/decline/route');
      
      const mockInvitation = {
        id: 'inv-1',
        inviter_id: 'user-2',
        invitee_email: 'test@example.com',
        entity_type: 'note',
        entity_id: 'note-1',
        access_level: 'view',
        status: 'pending',
        token: 'token-1',
        expires_at: new Date(Date.now() + 86400000), // 1 day in the future
        createdAt: new Date()
      };
      
      mockPrisma.invitation.findUnique.mockResolvedValue(mockInvitation);
      mockPrisma.invitation.update.mockResolvedValue({
        ...mockInvitation,
        status: 'declined'
      });
      
      const mockRequest = new NextRequest('http://localhost:3000/api/invitations/inv-1/decline', {
        method: 'POST',
        headers: {
          'Authorization': '******',
        },
      });

      const response = await POST(mockRequest, { params: { invitationId: 'inv-1' } });
      const responseData = await response.json();
      
      expect(response.status).toBe(200);
      expect(mockPrisma.invitation.update).toHaveBeenCalledWith({
        where: { id: 'inv-1' },
        data: { status: 'declined' }
      });
      expect(responseData).toHaveProperty('message', 'Invitation declined successfully');
    });
  });
});