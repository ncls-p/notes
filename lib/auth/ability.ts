import { AbilityBuilder, PureAbility, subject } from '@casl/ability';
import { PrismaQuery, createPrismaAbility } from '@casl/prisma';
import { User } from '@prisma/client';

// Define the actions that can be performed
export type Actions = 'manage' | 'create' | 'read' | 'update' | 'delete';

// Define the possible subjects
export type Subjects = 'Note' | 'Folder' | 'Permission' | 'Invitation' | 'User' | 'All';

// Define our custom ability type
export type AppAbility = PureAbility<[Actions, Subjects], PrismaQuery>;

/**
 * Define the ability for a user
 * 
 * @param user - The user to define abilities for
 * @returns The ability instance
 */
export function defineAbilityFor(user: User | null) {
  const { can, cannot, build } = new AbilityBuilder<AppAbility>(createPrismaAbility);

  if (!user) {
    // Public can only access publicly shared resources
    // This would be implemented when we add public sharing feature
    return build();
  }

  // Users can manage their own data
  can('manage', 'User', { id: user.id });

  // Users can always read permitted notes and folders
  can('read', 'Note', {
    OR: [
      { owner_id: user.id }, // User owns the note
      { permissions: { some: { user_id: user.id } } } // User has explicit permission
    ],
  });

  can('read', 'Folder', {
    OR: [
      { owner_id: user.id }, // User owns the folder
      { permissions: { some: { user_id: user.id } } } // User has explicit permission
    ],
  });

  // Users can update and delete notes/folders they own
  can('update', 'Note', { owner_id: user.id });
  can('delete', 'Note', { owner_id: user.id });
  
  can('update', 'Folder', { owner_id: user.id });
  can('delete', 'Folder', { owner_id: user.id });

  // Users can update notes they have edit permissions for
  can('update', 'Note', { 
    permissions: { 
      some: { 
        user_id: user.id, 
        access_level: 'edit' 
      } 
    } 
  });

  // Users can update folders they have edit permissions for
  can('update', 'Folder', { 
    permissions: { 
      some: { 
        user_id: user.id, 
        access_level: 'edit' 
      } 
    } 
  });

  // Users can manage invitations they have created
  can('manage', 'Invitation', { inviter_id: user.id });

  // Users can manage permissions for notes/folders they own
  can('manage', 'Permission', { 
    OR: [
      { entity_type: 'note', Note: { owner_id: user.id } },
      { entity_type: 'folder', Folder: { owner_id: user.id } }
    ]
  });

  return build();
}