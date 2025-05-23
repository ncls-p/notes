import { create } from 'zustand';

interface AuthState {
  user: {
    id: string;
    email: string;
  } | null;
  token: string | null;
  setAuth: (user: { id: string; email: string } | null, token: string | null) => void;
  logout: () => void;
}

export const useAuth = create<AuthState>((set) => ({
  user: null,
  token: null,
  setAuth: (user, token) => set({ user, token }),
  logout: async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
      set({ user: null, token: null });
    } catch (error) {
      console.error('Logout error:', error);
    }
  }
}));

// Helper function to check if user is authenticated
export const isAuthenticated = () => {
  const { user, token } = useAuth.getState();
  return !!(user && token);
};

// Helper function to get auth token
export const getAuthToken = () => {
  return useAuth.getState().token;
};
