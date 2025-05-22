import { hasPermission, getUsersWithAccess } from "../../../lib/auth/permissions";
import { PrismaClient } from "@prisma/client";

// Mock the Prisma client
jest.mock('@prisma/client', () => {
  const mockPrismaClient = {
    note: {
      findUnique: jest.fn(),
    },
    folder: {
      findUnique: jest.fn(),
    },
    permission: {
      findFirst: jest.fn(),
      findMany: jest.fn(),
    },
    user: {
      findUnique: jest.fn(),
    },
  };
  return {
    PrismaClient: jest.fn(() => mockPrismaClient),
  };
});

describe('Permission System', () => {
  const mockPrisma = new PrismaClient();
  
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('hasPermission', () => {
    const userId = 'user123';
    const entityId = 'entity123';

    test('should return true if user is the owner of a note', async () => {
      (mockPrisma.note.findUnique as jest.Mock).mockResolvedValue({
        owner_id: userId
      });

      const result = await hasPermission(userId, 'note', entityId, 'edit');
      
      expect(mockPrisma.note.findUnique).toHaveBeenCalledWith({
        where: { id: entityId },
        select: { owner_id: true }
      });
      expect(result).toBe(true);
    });

    test('should return true if user is the owner of a folder', async () => {
      (mockPrisma.folder.findUnique as jest.Mock).mockResolvedValue({
        owner_id: userId
      });

      const result = await hasPermission(userId, 'folder', entityId, 'edit');
      
      expect(mockPrisma.folder.findUnique).toHaveBeenCalledWith({
        where: { id: entityId },
        select: { owner_id: true }
      });
      expect(result).toBe(true);
    });

    test('should check permissions if user is not the owner', async () => {
      (mockPrisma.note.findUnique as jest.Mock).mockResolvedValue({
        owner_id: 'anotherUser'
      });
      (mockPrisma.permission.findFirst as jest.Mock).mockResolvedValue({
        access_level: 'view'
      });

      const result = await hasPermission(userId, 'note', entityId, 'view');
      
      expect(mockPrisma.permission.findFirst).toHaveBeenCalledWith({
        where: {
          user_id: userId,
          entity_type: 'note',
          entity_id: entityId
        }
      });
      expect(result).toBe(true);
    });

    test('should return false for view access when no permissions exist', async () => {
      (mockPrisma.note.findUnique as jest.Mock).mockResolvedValue({
        owner_id: 'anotherUser'
      });
      (mockPrisma.permission.findFirst as jest.Mock).mockResolvedValue(null);

      const result = await hasPermission(userId, 'note', entityId, 'view');
      
      expect(result).toBe(false);
    });

    test('should return false for edit access when only view permission exists', async () => {
      (mockPrisma.note.findUnique as jest.Mock).mockResolvedValue({
        owner_id: 'anotherUser'
      });
      (mockPrisma.permission.findFirst as jest.Mock).mockResolvedValue({
        access_level: 'view'
      });

      const result = await hasPermission(userId, 'note', entityId, 'edit');
      
      expect(result).toBe(false);
    });

    test('should return true for edit access when edit permission exists', async () => {
      (mockPrisma.note.findUnique as jest.Mock).mockResolvedValue({
        owner_id: 'anotherUser'
      });
      (mockPrisma.permission.findFirst as jest.Mock).mockResolvedValue({
        access_level: 'edit'
      });

      const result = await hasPermission(userId, 'note', entityId, 'edit');
      
      expect(result).toBe(true);
    });

    test('should handle and propagate errors', async () => {
      const error = new Error('Database error');
      (mockPrisma.note.findUnique as jest.Mock).mockRejectedValue(error);

      await expect(hasPermission(userId, 'note', entityId, 'view'))
        .rejects.toThrow('Database error');
    });
  });

  describe('getUsersWithAccess', () => {
    const entityId = 'entity123';
    const ownerId = 'owner123';

    test('should retrieve owner and permission details for a note', async () => {
      const noteOwner = { id: ownerId, email: 'owner@example.com' };
      const permissions = [
        {
          user: { id: 'user1', email: 'user1@example.com' },
          access_level: 'view',
          user_id: 'user1'
        },
        {
          user: { id: 'user2', email: 'user2@example.com' },
          access_level: 'edit',
          user_id: 'user2'
        }
      ];

      (mockPrisma.note.findUnique as jest.Mock).mockResolvedValue({
        owner_id: ownerId
      });
      (mockPrisma.permission.findMany as jest.Mock).mockResolvedValue(permissions);
      (mockPrisma.user.findUnique as jest.Mock).mockResolvedValue(noteOwner);

      const result = await getUsersWithAccess('note', entityId);
      
      expect(mockPrisma.note.findUnique).toHaveBeenCalledWith({
        where: { id: entityId },
        select: { owner_id: true }
      });
      expect(mockPrisma.permission.findMany).toHaveBeenCalledWith({
        where: {
          entity_type: 'note',
          entity_id: entityId
        },
        include: {
          user: {
            select: {
              id: true,
              email: true
            }
          }
        }
      });

      expect(result).toEqual([
        {
          user: { id: 'user1', email: 'user1@example.com' },
          accessLevel: 'view',
          isOwner: false
        },
        {
          user: { id: 'user2', email: 'user2@example.com' },
          accessLevel: 'edit',
          isOwner: false
        },
        {
          user: { id: ownerId, email: 'owner@example.com' },
          accessLevel: 'owner',
          isOwner: true
        }
      ]);
    });

    test('should retrieve owner and permission details for a folder', async () => {
      const folderOwner = { id: ownerId, email: 'owner@example.com' };
      const permissions = [
        {
          user: { id: 'user1', email: 'user1@example.com' },
          access_level: 'view',
          user_id: 'user1'
        }
      ];

      (mockPrisma.folder.findUnique as jest.Mock).mockResolvedValue({
        owner_id: ownerId
      });
      (mockPrisma.permission.findMany as jest.Mock).mockResolvedValue(permissions);
      (mockPrisma.user.findUnique as jest.Mock).mockResolvedValue(folderOwner);

      const result = await getUsersWithAccess('folder', entityId);
      
      expect(mockPrisma.folder.findUnique).toHaveBeenCalledWith({
        where: { id: entityId },
        select: { owner_id: true }
      });
      expect(result).toEqual([
        {
          user: { id: 'user1', email: 'user1@example.com' },
          accessLevel: 'view',
          isOwner: false
        },
        {
          user: { id: ownerId, email: 'owner@example.com' },
          accessLevel: 'owner',
          isOwner: true
        }
      ]);
    });

    test('should handle when owner already has explicit permissions', async () => {
      const permissions = [
        {
          user: { id: ownerId, email: 'owner@example.com' },
          access_level: 'edit',
          user_id: ownerId
        },
        {
          user: { id: 'user1', email: 'user1@example.com' },
          access_level: 'view',
          user_id: 'user1'
        }
      ];

      (mockPrisma.note.findUnique as jest.Mock).mockResolvedValue({
        owner_id: ownerId
      });
      (mockPrisma.permission.findMany as jest.Mock).mockResolvedValue(permissions);

      const result = await getUsersWithAccess('note', entityId);
      
      // Should not call findUnique for the owner since they're already in the permissions
      expect(mockPrisma.user.findUnique).not.toHaveBeenCalled();
      
      expect(result).toEqual([
        {
          user: { id: ownerId, email: 'owner@example.com' },
          accessLevel: 'edit',
          isOwner: true
        },
        {
          user: { id: 'user1', email: 'user1@example.com' },
          accessLevel: 'view',
          isOwner: false
        }
      ]);
    });

    test('should handle errors', async () => {
      const error = new Error('Database error');
      (mockPrisma.note.findUnique as jest.Mock).mockRejectedValue(error);

      await expect(getUsersWithAccess('note', entityId))
        .rejects.toThrow('Database error');
    });
  });
});