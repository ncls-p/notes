import { describe, it, expect, beforeEach } from 'vitest';
import { defineAbilityFor } from '../../../lib/auth/ability';

describe('Permission system (CASL abilities)', () => {
  const mockUser = {
    id: 'user-1',
    email: 'test@example.com',
    password_hash: 'hashed-password',
    createdAt: new Date(),
    updatedAt: new Date()
  };
  
  it('should allow users to manage their own account', () => {
    const ability = defineAbilityFor(mockUser);
    expect(ability.can('update', 'User', { id: 'user-1' })).toBe(true);
    expect(ability.can('update', 'User', { id: 'user-2' })).toBe(false);
  });
  
  it('should allow owners to manage their notes', () => {
    const ability = defineAbilityFor(mockUser);
    expect(ability.can('update', 'Note', { owner_id: 'user-1' })).toBe(true);
    expect(ability.can('delete', 'Note', { owner_id: 'user-1' })).toBe(true);
    expect(ability.can('update', 'Note', { owner_id: 'user-2' })).toBe(false);
  });
  
  it('should allow users with edit permission to update notes', () => {
    const ability = defineAbilityFor(mockUser);
    expect(ability.can('update', 'Note', { 
      permissions: { some: { user_id: 'user-1', access_level: 'edit' } } 
    })).toBe(true);
  });
  
  it('should not allow users with view permission to update notes', () => {
    const ability = defineAbilityFor(mockUser);
    expect(ability.can('update', 'Note', { 
      permissions: { some: { user_id: 'user-1', access_level: 'view' } } 
    })).toBe(false);
  });
  
  it('should allow users to manage invitations they created', () => {
    const ability = defineAbilityFor(mockUser);
    expect(ability.can('update', 'Invitation', { inviter_id: 'user-1' })).toBe(true);
    expect(ability.can('delete', 'Invitation', { inviter_id: 'user-1' })).toBe(true);
    expect(ability.can('update', 'Invitation', { inviter_id: 'user-2' })).toBe(false);
  });
  
  it('should not grant any permissions to unauthenticated users', () => {
    const ability = defineAbilityFor(null);
    expect(ability.can('read', 'Note')).toBe(false);
    expect(ability.can('read', 'Folder')).toBe(false);
  });
});