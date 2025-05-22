import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import ShareModal from '../../../components/share/ShareModal';
import '@testing-library/jest-dom';

// Mock fetch
global.fetch = vi.fn();

describe('ShareModal Component', () => {
  const defaultProps = {
    isOpen: true,
    onClose: vi.fn(),
    entityId: 'note-1',
    entityType: 'note',
    entityName: 'Test Note'
  };

  beforeEach(() => {
    vi.resetAllMocks();
  });

  it('renders correctly when open', () => {
    // Mock fetch calls for initial data loading (collaborators list)
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => [] // No collaborators initially
    });
    
    render(<ShareModal {...defaultProps} />);
    
    // Check dialog title and content
    expect(screen.getByText('Share Note')).toBeInTheDocument();
    expect(screen.getByText('Test Note')).toBeInTheDocument();
    expect(screen.getByLabelText('Email')).toBeInTheDocument();
    expect(screen.getByLabelText('Access')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Invite/i })).toBeInTheDocument();
  });

  it('does not render when closed', () => {
    render(<ShareModal {...defaultProps} isOpen={false} />);
    
    // Dialog should not be in the document
    expect(screen.queryByText('Share Note')).not.toBeInTheDocument();
  });

  it('fetches collaborators on initial render', async () => {
    const mockCollaborators = [
      {
        user: { id: 'user-1', email: 'owner@example.com' },
        accessLevel: 'owner',
        isOwner: true
      },
      {
        user: { id: 'user-2', email: 'viewer@example.com' },
        accessLevel: 'view',
        isOwner: false
      }
    ];
    
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => mockCollaborators
    });
    
    render(<ShareModal {...defaultProps} />);
    
    // Verify API call
    expect(global.fetch).toHaveBeenCalledWith(
      `/api/permissions?entityType=note&entityId=note-1`
    );
    
    // Wait for fetch to complete
    await waitFor(() => {
      expect(screen.getByText('owner@example.com')).toBeInTheDocument();
      expect(screen.getByText('Owner')).toBeInTheDocument();
      expect(screen.getByText('viewer@example.com')).toBeInTheDocument();
      expect(screen.getByText('Can view')).toBeInTheDocument();
    });
  });

  it('handles invitation submission', async () => {
    const user = userEvent.setup();
    
    // Mock fetch for collaborators
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => []
    }).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        id: 'inv-1',
        entity_id: 'note-1',
        entity_type: 'note',
        invitee_email: 'new@example.com',
        access_level: 'edit'
      })
    }).mockResolvedValueOnce({
      // Response from the second collaborators fetch after invite
      ok: true,
      json: async () => []
    });
    
    render(<ShareModal {...defaultProps} />);
    
    // Fill out and submit the form
    await user.type(screen.getByLabelText('Email'), 'new@example.com');
    
    // Open the access dropdown and select "Edit"
    await user.click(screen.getByRole('combobox', { name: /Access/i }));
    await user.click(screen.getByText('Edit'));
    
    await user.click(screen.getByRole('button', { name: /Invite/i }));
    
    // Verify API call
    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith('/api/invitations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          invitee_email: 'new@example.com',
          entity_type: 'note',
          entity_id: 'note-1',
          access_level: 'edit'
        })
      });
      
      // Success message should be displayed
      expect(screen.getByText('Invitation sent to new@example.com')).toBeInTheDocument();
      
      // Email field should be cleared
      expect(screen.getByLabelText('Email')).toHaveValue('');
    });
  });

  it('handles errors when fetching collaborators', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: false,
      status: 500
    });
    
    render(<ShareModal {...defaultProps} />);
    
    // Wait for fetch to complete
    await waitFor(() => {
      expect(screen.getByText('Failed to load collaborator list')).toBeInTheDocument();
    });
  });

  it('handles errors when submitting invitation', async () => {
    const user = userEvent.setup();
    
    // Mock fetch for collaborators
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => []
    }).mockResolvedValueOnce({
      ok: false,
      json: async () => ({ error: 'User already has access' })
    });
    
    render(<ShareModal {...defaultProps} />);
    
    // Fill out and submit the form
    await user.type(screen.getByLabelText('Email'), 'new@example.com');
    await user.click(screen.getByRole('button', { name: /Invite/i }));
    
    // Wait for fetch to complete
    await waitFor(() => {
      expect(screen.getByText('User already has access')).toBeInTheDocument();
    });
  });

  it('allows updating collaborator access level', async () => {
    const mockCollaborators = [
      {
        user: { id: 'user-1', email: 'owner@example.com' },
        accessLevel: 'owner',
        isOwner: true
      },
      {
        user: { id: 'user-2', email: 'viewer@example.com' },
        accessLevel: 'view',
        isOwner: false
      }
    ];
    
    (global.fetch as jest.Mock)
      // Initial collaborators fetch
      .mockResolvedValueOnce({
        ok: true,
        json: async () => mockCollaborators
      })
      // Update access level
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          message: 'Permission updated successfully',
          permission: {
            id: 'perm-1',
            user_id: 'user-2',
            entity_type: 'note',
            entity_id: 'note-1',
            access_level: 'edit'
          }
        })
      })
      // Collaborators fetch after update
      .mockResolvedValueOnce({
        ok: true,
        json: async () => [
          mockCollaborators[0],
          { ...mockCollaborators[1], accessLevel: 'edit' }
        ]
      });
    
    render(<ShareModal {...defaultProps} />);
    
    // Wait for initial fetch to complete
    await waitFor(() => {
      expect(screen.getByText('viewer@example.com')).toBeInTheDocument();
    });
    
    // Open the select dropdown for the collaborator
    const selectTrigger = screen.getAllByRole('combobox')[1]; // Second select in document
    fireEvent.click(selectTrigger);
    
    // Click on "Edit" option
    fireEvent.click(screen.getAllByText('Edit')[1]); // Choose the option in dropdown, not the header
    
    // Wait for update and refetch
    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith('/api/permissions/user-2', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          access_level: 'edit'
        })
      });
      
      expect(screen.getByText('Access level updated successfully')).toBeInTheDocument();
    });
  });

  it('allows removing a collaborator', async () => {
    const mockCollaborators = [
      {
        user: { id: 'user-1', email: 'owner@example.com' },
        accessLevel: 'owner',
        isOwner: true
      },
      {
        user: { id: 'user-2', email: 'viewer@example.com' },
        accessLevel: 'view',
        isOwner: false
      }
    ];
    
    (global.fetch as jest.Mock)
      // Initial collaborators fetch
      .mockResolvedValueOnce({
        ok: true,
        json: async () => mockCollaborators
      })
      // Remove collaborator
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          message: 'Permission revoked successfully'
        })
      })
      // Collaborators fetch after update
      .mockResolvedValueOnce({
        ok: true,
        json: async () => [mockCollaborators[0]] // Only owner remains
      });
    
    render(<ShareModal {...defaultProps} />);
    
    // Wait for initial fetch to complete
    await waitFor(() => {
      expect(screen.getByText('viewer@example.com')).toBeInTheDocument();
    });
    
    // Click the remove button (X icon)
    const removeButton = screen.getByRole('button', { name: 'Remove' }); // Using aria-label
    fireEvent.click(removeButton);
    
    // Wait for update and refetch
    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith('/api/permissions/user-2', {
        method: 'DELETE'
      });
      
      expect(screen.getByText('Collaborator removed successfully')).toBeInTheDocument();
      expect(screen.queryByText('viewer@example.com')).not.toBeInTheDocument();
    });
  });
});