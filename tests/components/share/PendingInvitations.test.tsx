import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import PendingInvitations from '../../../components/share/PendingInvitations';
import '@testing-library/jest-dom';

// Mock fetch
global.fetch = vi.fn();

describe('PendingInvitations Component', () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it('shows loading state initially', () => {
    // Mock fetch to never resolve during this test
    (global.fetch as jest.Mock).mockImplementation(() => new Promise(() => {}));
    
    render(<PendingInvitations />);
    
    expect(screen.getByRole('status')).toBeInTheDocument();
  });

  it('displays pending invitations when loaded', async () => {
    const mockInvitations = [
      {
        id: 'inv-1',
        entity_type: 'note',
        entity_id: 'note-1',
        access_level: 'view',
        expires_at: new Date(Date.now() + 86400000).toISOString(),
        created_at: new Date().toISOString(),
        inviter: {
          id: 'user-1',
          email: 'inviter@example.com'
        }
      }
    ];
    
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => mockInvitations
    });
    
    render(<PendingInvitations />);
    
    await waitFor(() => {
      expect(screen.queryByRole('status')).not.toBeInTheDocument();
      expect(screen.getByText('Note Invitation')).toBeInTheDocument();
      expect(screen.getByText(/From inviter@example.com/)).toBeInTheDocument();
      expect(screen.getByText('View Access')).toBeInTheDocument();
    });
  });

  it('shows empty state when no invitations', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => []
    });
    
    render(<PendingInvitations />);
    
    await waitFor(() => {
      expect(screen.getByText('No pending invitations')).toBeInTheDocument();
    });
  });

  it('shows error state when fetch fails', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: false,
      status: 500
    });
    
    render(<PendingInvitations />);
    
    await waitFor(() => {
      expect(screen.getByText('Failed to load invitations')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /Try Again/i })).toBeInTheDocument();
    });
  });

  it('handles invitation accept', async () => {
    // Initial fetch for invitations
    const mockInvitations = [
      {
        id: 'inv-1',
        entity_type: 'note',
        entity_id: 'note-1',
        access_level: 'edit',
        expires_at: new Date(Date.now() + 86400000).toISOString(),
        created_at: new Date().toISOString(),
        inviter: {
          id: 'user-1',
          email: 'inviter@example.com'
        }
      }
    ];
    
    (global.fetch as jest.Mock)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => mockInvitations
      })
      // Accept invitation response
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ message: 'Invitation accepted successfully' })
      });
    
    render(<PendingInvitations />);
    
    await waitFor(() => {
      expect(screen.getByText('Edit Access')).toBeInTheDocument();
    });
    
    const acceptButton = screen.getByRole('button', { name: /Accept/i });
    fireEvent.click(acceptButton);
    
    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith('/api/invitations/inv-1/accept', {
        method: 'POST'
      });
      // The invitation should be removed from the list after acceptance
      expect(screen.getByText('No pending invitations')).toBeInTheDocument();
    });
  });

  it('handles invitation decline', async () => {
    // Initial fetch for invitations
    const mockInvitations = [
      {
        id: 'inv-1',
        entity_type: 'note',
        entity_id: 'note-1',
        access_level: 'view',
        expires_at: new Date(Date.now() + 86400000).toISOString(),
        created_at: new Date().toISOString(),
        inviter: {
          id: 'user-1',
          email: 'inviter@example.com'
        }
      }
    ];
    
    (global.fetch as jest.Mock)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => mockInvitations
      })
      // Decline invitation response
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ message: 'Invitation declined successfully' })
      });
    
    render(<PendingInvitations />);
    
    await waitFor(() => {
      expect(screen.getByText('View Access')).toBeInTheDocument();
    });
    
    const declineButton = screen.getByRole('button', { name: /Decline/i });
    fireEvent.click(declineButton);
    
    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith('/api/invitations/inv-1/decline', {
        method: 'POST'
      });
      // The invitation should be removed from the list after declining
      expect(screen.getByText('No pending invitations')).toBeInTheDocument();
    });
  });

  it('shows error for failed invitation action', async () => {
    // Initial fetch for invitations
    const mockInvitations = [
      {
        id: 'inv-1',
        entity_type: 'note',
        entity_id: 'note-1',
        access_level: 'view',
        expires_at: new Date(Date.now() + 86400000).toISOString(),
        created_at: new Date().toISOString(),
        inviter: {
          id: 'user-1',
          email: 'inviter@example.com'
        }
      }
    ];
    
    (global.fetch as jest.Mock)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => mockInvitations
      })
      // Accept invitation failure
      .mockResolvedValueOnce({
        ok: false,
        status: 500
      });
    
    render(<PendingInvitations />);
    
    await waitFor(() => {
      expect(screen.getByText('View Access')).toBeInTheDocument();
    });
    
    const acceptButton = screen.getByRole('button', { name: /Accept/i });
    fireEvent.click(acceptButton);
    
    await waitFor(() => {
      expect(screen.getByText('Failed to accept invitation')).toBeInTheDocument();
    });
  });
});