import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { useRouter } from 'next/navigation';
import LoginForm from '@/components/auth/LoginForm';
import { useAuth } from '@/lib/auth/store';

// Mock next/navigation
vi.mock('next/navigation', () => ({
  useRouter: vi.fn(),
}));

// Mock auth store
vi.mock('@/lib/auth/store', () => ({
  useAuth: vi.fn(),
}));

describe('LoginForm', () => {
  const mockRouter = {
    push: vi.fn(),
  };

  const mockSetAuth = vi.fn();

  beforeEach(() => {
    vi.resetAllMocks();
    (useRouter as jest.Mock).mockReturnValue(mockRouter);
    (useAuth as jest.Mock).mockReturnValue({ setAuth: mockSetAuth });
    global.fetch = vi.fn();
  });

  it('renders login form correctly', () => {
    render(<LoginForm />);

    expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /sign in/i })).toBeInTheDocument();
  });

  it('handles successful login', async () => {
    const mockUser = {
      id: 'user-1',
      email: 'test@example.com',
    };
    const mockToken = 'mock-jwt-token';

    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ user: mockUser, token: mockToken }),
    });

    render(<LoginForm />);

    fireEvent.change(screen.getByLabelText(/email/i), {
      target: { value: 'test@example.com' },
    });
    fireEvent.change(screen.getByLabelText(/password/i), {
      target: { value: 'password123' },
    });
    fireEvent.click(screen.getByRole('button', { name: /sign in/i }));

    await waitFor(() => {
      expect(mockSetAuth).toHaveBeenCalledWith(mockUser, mockToken);
      expect(mockRouter.push).toHaveBeenCalledWith('/dashboard');
    });
  });

  it('handles login error', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: false,
      json: async () => ({ error: 'Invalid credentials' }),
    });

    render(<LoginForm />);

    fireEvent.change(screen.getByLabelText(/email/i), {
      target: { value: 'test@example.com' },
    });
    fireEvent.change(screen.getByLabelText(/password/i), {
      target: { value: 'wrongpassword' },
    });
    fireEvent.click(screen.getByRole('button', { name: /sign in/i }));

    await waitFor(() => {
      expect(screen.getByText(/invalid credentials/i)).toBeInTheDocument();
    });
  });

  it('validates required fields', async () => {
    render(<LoginForm />);

    fireEvent.click(screen.getByRole('button', { name: /sign in/i }));

    await waitFor(() => {
      expect(global.fetch).not.toHaveBeenCalled();
    });
  });
});
