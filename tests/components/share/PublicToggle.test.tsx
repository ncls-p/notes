import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import PublicToggle from '../../../components/share/PublicToggle';
import '@testing-library/jest-dom';

// Mock fetch
global.fetch = vi.fn();

// Mock clipboard API
Object.assign(navigator, {
  clipboard: {
    writeText: vi.fn().mockImplementation(() => Promise.resolve()),
  },
});

// Mock window.location for URL generation
Object.defineProperty(window, 'location', {
  value: {
    origin: 'http://localhost:3000',
  },
  writable: true,
});

describe('PublicToggle Component', () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it('renders in private state correctly', () => {
    render(<PublicToggle
      entityId="note-1"
      entityType="note"
      initialIsPublic={false}
      initialToken={null}
    />);
    
    expect(screen.getByText('Private')).toBeInTheDocument();
    expect(screen.getByRole('switch')).not.toBeChecked();
  });

  it('renders in public state with share link', () => {
    render(<PublicToggle
      entityId="note-1"
      entityType="note"
      initialIsPublic={true}
      initialToken="test-token"
    />);
    
    expect(screen.getByText('Public')).toBeInTheDocument();
    expect(screen.getByRole('switch')).toBeChecked();
    expect(screen.getByDisplayValue('http://localhost:3000/public/notes/test-token')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Copy/i })).toBeInTheDocument();
  });

  it('toggles from private to public', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        message: 'Note set to public',
        note: {
          id: 'note-1',
          title: 'Test Note',
          is_public: true,
          public_share_token: 'new-token'
        }
      })
    });
    
    render(<PublicToggle
      entityId="note-1"
      entityType="note"
      initialIsPublic={false}
      initialToken={null}
    />);
    
    // Toggle to public
    fireEvent.click(screen.getByRole('switch'));
    
    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith('/api/notes/note-1/public', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ isPublic: true })
      });
      
      expect(screen.getByText('Public')).toBeInTheDocument();
      expect(screen.getByRole('switch')).toBeChecked();
      expect(screen.getByText('Note is now public')).toBeInTheDocument();
      expect(screen.getByDisplayValue('http://localhost:3000/public/notes/new-token')).toBeInTheDocument();
    });
  });

  it('toggles from public to private', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        message: 'Note set to private',
        note: {
          id: 'note-1',
          title: 'Test Note',
          is_public: false,
          public_share_token: null
        }
      })
    });
    
    render(<PublicToggle
      entityId="note-1"
      entityType="note"
      initialIsPublic={true}
      initialToken="test-token"
    />);
    
    // Toggle to private
    fireEvent.click(screen.getByRole('switch'));
    
    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith('/api/notes/note-1/public', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ isPublic: false })
      });
      
      expect(screen.getByText('Private')).toBeInTheDocument();
      expect(screen.getByRole('switch')).not.toBeChecked();
      expect(screen.getByText('Note is now private')).toBeInTheDocument();
      // Share link should be removed
      expect(screen.queryByDisplayValue('http://localhost:3000/public/notes/test-token')).not.toBeInTheDocument();
    });
  });

  it('handles errors when toggling', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: false,
      status: 500,
      json: async () => ({
        error: 'Server error'
      })
    });
    
    render(<PublicToggle
      entityId="note-1"
      entityType="note"
      initialIsPublic={false}
      initialToken={null}
    />);
    
    // Attempt to toggle
    fireEvent.click(screen.getByRole('switch'));
    
    await waitFor(() => {
      expect(screen.getByText(/An error occurred/)).toBeInTheDocument();
    });
  });

  it('copies share link to clipboard', async () => {
    render(<PublicToggle
      entityId="note-1"
      entityType="note"
      initialIsPublic={true}
      initialToken="test-token"
    />);
    
    // Click copy button
    fireEvent.click(screen.getByRole('button', { name: /Copy/i }));
    
    await waitFor(() => {
      expect(navigator.clipboard.writeText).toHaveBeenCalledWith('http://localhost:3000/public/notes/test-token');
      expect(screen.getByText('Copied')).toBeInTheDocument();
    });
  });
});