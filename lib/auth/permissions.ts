import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * Check if a user has permission to access an entity
 * 
 * @param userId - ID of the user
 * @param entityType - Type of entity ('note' or 'folder')
 * @param entityId - ID of the entity
 * @param requiredAccessLevel - Required access level ('view' or 'edit')
 * @returns Promise resolving to boolean indicating if user has permission
 */
export async function hasPermission(
  userId: string,
  entityType: 'note' | 'folder',
  entityId: string,
  requiredAccessLevel: 'view' | 'edit'
): Promise<boolean> {
  try {
    // Check if user is the owner of the entity
    if (entityType === 'note') {
      const note = await prisma.note.findUnique({
        where: { id: entityId },
        select: { owner_id: true }
      });
      
      if (note && note.owner_id === userId) {
        return true; // Owner has full access
      }
    } else if (entityType === 'folder') {
      const folder = await prisma.folder.findUnique({
        where: { id: entityId },
        select: { owner_id: true }
      });
      
      if (folder && folder.owner_id === userId) {
        return true; // Owner has full access
      }
    }
    
    // Check if user has explicit permissions
    const permission = await prisma.permission.findFirst({
      where: {
        user_id: userId,
        entity_type: entityType,
        entity_id: entityId
      }
    });
    
    if (!permission) {
      return false; // No explicit permission
    }
    
    // Check access level
    if (requiredAccessLevel === 'view') {
      // Both 'view' and 'edit' permissions allow viewing
      return permission.access_level === 'view' || permission.access_level === 'edit';
    } else if (requiredAccessLevel === 'edit') {
      // Only 'edit' permission allows editing
      return permission.access_level === 'edit';
    }
    
    return false;
  } catch (error) {
    console.error('Error checking permission:', error);
    throw error;
  }
}

/**
 * Get all users who have access to an entity
 * 
 * @param entityType - Type of entity ('note' or 'folder')
 * @param entityId - ID of the entity
 * @returns Promise resolving to array of users with their access levels
 */
export async function getUsersWithAccess(
  entityType: 'note' | 'folder',
  entityId: string
) {
  try {
    // First get the owner
    let ownerId: string | null = null;
    
    if (entityType === 'note') {
      const note = await prisma.note.findUnique({
        where: { id: entityId },
        select: { owner_id: true }
      });
      ownerId = note?.owner_id || null;
    } else if (entityType === 'folder') {
      const folder = await prisma.folder.findUnique({
        where: { id: entityId },
        select: { owner_id: true }
      });
      ownerId = folder?.owner_id || null;
    }
    
    // Then get all users with explicit permissions
    const permissions = await prisma.permission.findMany({
      where: {
        entity_type: entityType,
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
    
    const result = permissions.map(permission => ({
      user: permission.user,
      accessLevel: permission.access_level,
      isOwner: permission.user.id === ownerId
    }));
    
    // If owner is not in the permissions list, add them
    if (ownerId && !result.some(r => r.user.id === ownerId)) {
      const owner = await prisma.user.findUnique({
        where: { id: ownerId },
        select: { id: true, email: true }
      });
      
      if (owner) {
        result.push({
          user: owner,
          accessLevel: 'owner',
          isOwner: true
        });
      }
    }
    
    return result;
  } catch (error) {
    console.error('Error getting users with access:', error);
    throw error;
  }
}