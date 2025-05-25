import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import RegisterPage from '@/app/register/page';

// Mock next/navigation
const mockPush = jest.fn();
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
  }),
}));

// Mock fetch
global.fetch = jest.fn();

describe('RegisterPage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (global.fetch as jest.Mock).mockReset();
  });

  it('renders the registration form', () => {
    render(<RegisterPage />);
    expect(screen.getByRole('heading', { name: /Create Account/i })).toBeInTheDocument();
    expect(screen.getByLabelText(/Email address/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/^Password$/i)).toBeInTheDocument(); // Exact match for "Password"
    expect(screen.getByLabelText(/Confirm Password/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Create Account/i })).toBeInTheDocument();
  });

  it('shows validation errors for empty fields on submit', async () => {
    render(<RegisterPage />);
    fireEvent.click(screen.getByRole('button', { name: /Create Account/i }));

    expect(await screen.findByText('Invalid email address')).toBeInTheDocument();
    expect(await screen.findByText('Password must be at least 8 characters long')).toBeInTheDocument();
    expect(await screen.findByText('Please confirm your password')).toBeInTheDocument();
  });

  it('shows validation error for mismatched passwords', async () => {
    render(<RegisterPage />);
    fireEvent.change(screen.getByLabelText(/Email address/i), { target: { value: 'test@example.com' } });
    fireEvent.change(screen.getByLabelText(/^Password$/i), { target: { value: 'Password123!' } });
    fireEvent.change(screen.getByLabelText(/Confirm Password/i), { target: { value: 'Password123' } });
    fireEvent.click(screen.getByRole('button', { name: /Create Account/i }));

    expect(await screen.findByText("Passwords don't match")).toBeInTheDocument();
  });

  it('shows validation error for invalid password format', async () => {
    render(<RegisterPage />);
    fireEvent.change(screen.getByLabelText(/Email address/i), { target: { value: 'test@example.com' } });
    fireEvent.change(screen.getByLabelText(/^Password$/i), { target: { value: 'password' } });
    fireEvent.change(screen.getByLabelText(/Confirm Password/i), { target: { value: 'password' } });
    fireEvent.click(screen.getByRole('button', { name: /Create Account/i }));

    expect(await screen.findByText('Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character')).toBeInTheDocument();
  });

  it('submits the form and calls API on successful validation', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ id: '1', email: 'test@example.com' }),
    });

    render(<RegisterPage />);
    fireEvent.change(screen.getByLabelText(/Email address/i), { target: { value: 'test@example.com' } });
    fireEvent.change(screen.getByLabelText(/^Password$/i), { target: { value: 'Password123!' } });
    fireEvent.change(screen.getByLabelText(/Confirm Password/i), { target: { value: 'Password123!' } });
    fireEvent.click(screen.getByRole('button', { name: /Create Account/i }));

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: 'test@example.com', password: 'Password123!' }),
      });
    });
  });

  it('redirects to /login on successful API response', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ id: '1', email: 'test@example.com' }),
    });

    render(<RegisterPage />);
    fireEvent.change(screen.getByLabelText(/Email address/i), { target: { value: 'test@example.com' } });
    fireEvent.change(screen.getByLabelText(/^Password$/i), { target: { value: 'Password123!' } });
    fireEvent.change(screen.getByLabelText(/Confirm Password/i), { target: { value: 'Password123!' } });
    fireEvent.click(screen.getByRole('button', { name: /Create Account/i }));

    await waitFor(() => expect(mockPush).toHaveBeenCalledWith('/login'));
  });

  it('shows API error message on failed API response', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: false,
      json: async () => ({ error: 'Email already registered' }),
    });

    render(<RegisterPage />);
    fireEvent.change(screen.getByLabelText(/Email address/i), { target: { value: 'test@example.com' } });
    fireEvent.change(screen.getByLabelText(/^Password$/i), { target: { value: 'Password123!' } });
    fireEvent.change(screen.getByLabelText(/Confirm Password/i), { target: { value: 'Password123!' } });
    fireEvent.click(screen.getByRole('button', { name: /Create Account/i }));

    expect(await screen.findByText('Email already registered')).toBeInTheDocument();
  });

   it('shows API error with details on failed API response with details', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: false,
      json: async () => ({ error: 'Invalid input', details: {email: ['Bad email format'], password: ['Too short']} }),
    });

    render(<RegisterPage />);
    fireEvent.change(screen.getByLabelText(/Email address/i), { target: { value: 'test@example.com' } });
    fireEvent.change(screen.getByLabelText(/^Password$/i), { target: { value: 'Password123!' } });
    fireEvent.change(screen.getByLabelText(/Confirm Password/i), { target: { value: 'Password123!' } });
    fireEvent.click(screen.getByRole('button', { name: /Create Account/i }));

    expect(await screen.findByText(/Invalid input Email: Bad email format. Password: Too short./i)).toBeInTheDocument();
  });


  it('shows generic error message on network failure', async () => {
    (global.fetch as jest.Mock).mockRejectedValueOnce(new Error('Network error'));

    render(<RegisterPage />);
    fireEvent.change(screen.getByLabelText(/Email address/i), { target: { value: 'test@example.com' } });
    fireEvent.change(screen.getByLabelText(/^Password$/i), { target: { value: 'Password123!' } });
    fireEvent.change(screen.getByLabelText(/Confirm Password/i), { target: { value: 'Password123!' } });
    fireEvent.click(screen.getByRole('button', { name: /Create Account/i }));

    expect(await screen.findByText('An unexpected error occurred. Please try again.')).toBeInTheDocument();
  });
});