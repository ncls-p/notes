import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import SharedBadge from '../../../components/share/SharedBadge';
import '@testing-library/jest-dom';

// Mock fetch
global.fetch = vi.fn();

describe('SharedBadge Component', () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it('does not render when there are no non-owner collaborators', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => [
        {
          user: { id: 'user-1', email: 'owner@example.com' },
          accessLevel: 'owner',
          isOwner: true
        }
        // No collaborators, just the owner
      ]
    });
    
    const { container } = render(<SharedBadge 
      entityId="note-1" 
      entityType="note" 
    />);
    
    // Wait for fetch to complete
    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        '/api/permissions?entityType=note&entityId=note-1'
      );
    });
    
    // Badge should not be rendered
    expect(container).toBeEmptyDOMElement();
  });

  it('renders with correct collaborator count', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => [
        {
          user: { id: 'user-1', email: 'owner@example.com' },
          accessLevel: 'owner',
          isOwner: true
        },
        {
          user: { id: 'user-2', email: 'user2@example.com' },
          accessLevel: 'view',
          isOwner: false
        },
        {
          user: { id: 'user-3', email: 'user3@example.com' },
          accessLevel: 'edit',
          isOwner: false
        }
      ]
    });
    
    render(<SharedBadge 
      entityId="note-1" 
      entityType="note" 
    />);
    
    // Wait for fetch to complete
    await waitFor(() => {
      expect(screen.getByText('Shared')).toBeInTheDocument();
    });
    
    // Check tooltip shows correct count
    expect(screen.getByRole('tooltip', { hidden: true })).toHaveTextContent('Shared with 2 people');
  });

  it('passes onClick handler correctly', async () => {
    const mockOnClick = vi.fn();
    
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => [
        {
          user: { id: 'user-1', email: 'owner@example.com' },
          accessLevel: 'owner',
          isOwner: true
        },
        {
          user: { id: 'user-2', email: 'user2@example.com' },
          accessLevel: 'view',
          isOwner: false
        }
      ]
    });
    
    render(<SharedBadge 
      entityId="note-1" 
      entityType="note"
      onClick={mockOnClick}
    />);
    
    // Wait for fetch to complete
    await waitFor(() => {
      expect(screen.getByText('Shared')).toBeInTheDocument();
    });
    
    // Click the badge
    screen.getByText('Shared').click();
    expect(mockOnClick).toHaveBeenCalled();
  });

  it('handles API errors gracefully', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: false,
      status: 500
    });
    
    const { container } = render(<SharedBadge 
      entityId="note-1" 
      entityType="note" 
    />);
    
    // Wait for fetch to complete
    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalled();
    });
    
    // Badge should not be rendered on error
    expect(container).toBeEmptyDOMElement();
  });

  it('singularizes person text when there is only one collaborator', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => [
        {
          user: { id: 'user-1', email: 'owner@example.com' },
          accessLevel: 'owner',
          isOwner: true
        },
        {
          user: { id: 'user-2', email: 'user2@example.com' },
          accessLevel: 'view',
          isOwner: false
        }
      ]
    });
    
    render(<SharedBadge 
      entityId="note-1" 
      entityType="note" 
    />);
    
    // Wait for fetch to complete
    await waitFor(() => {
      expect(screen.getByText('Shared')).toBeInTheDocument();
    });
    
    // Check tooltip shows singular form
    expect(screen.getByRole('tooltip', { hidden: true })).toHaveTextContent('Shared with 1 person');
  });
});