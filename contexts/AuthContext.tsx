'use client';

import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { getAccessToken, setAccessToken, clearAuthTokens } from '@/lib/apiClient'; // Assuming apiClient handles token storage

interface AuthContextType {
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (accessToken: string) => void; // Simplified login, real one might take credentials
  logout: () => void;
  // user: User | null; // Define User type if needed
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true); // Start as true to check initial auth status
  const router = useRouter();

  useEffect(() => {
    // Check initial token status (e.g., from apiClient or try a silent refresh)
    const token = getAccessToken();
    if (token) {
      // Here you might want to verify the token or fetch user profile
      // For simplicity, we'll assume if a token exists, it's valid for now
      setIsAuthenticated(true);
    } else {
      // No token, or initial check failed
      setIsAuthenticated(false);
    }
    setIsLoading(false);
  }, []);

  const login = (newAccessToken: string) => {
    setAccessToken(newAccessToken);
    setIsAuthenticated(true);
    // router.push('/dashboard'); // Or let the calling component handle redirect
  };

  const logout = () => {
    clearAuthTokens(); // This is already in apiClient, clears in-memory token
    // Server should clear HttpOnly refresh token cookie via an API call if needed,
    // or it will expire naturally / be cleared on failed refresh.
    setIsAuthenticated(false);
    router.push('/login'); // Redirect to login on logout
  };

  // This effect would listen for a global event or a state change indicating
  // that a token refresh has definitively failed.
  useEffect(() => {
    const handleAuthFailure = () => {
      // This function would be called if apiClient signals an unrecoverable auth error
      console.log('AuthContext: Unrecoverable authentication failure detected. Logging out.');
      logout();
    };

    // Placeholder: How to subscribe to such an event from apiClient?
    // One way is an event emitter, or apiClient could call a callback registered by AuthContext.
    // For now, this is conceptual. The `apiClient` currently throws an error on refresh failure,
    // which would need to be caught by a component that then calls `logout()`.
    // Or, components making API calls can catch the error and call logout.

    // Example: window.addEventListener('authFailure', handleAuthFailure);
    // return () => window.removeEventListener('authFailure', handleAuthFailure);
  }, [router]); // Added router to dependency array for logout

  return (
    <AuthContext.Provider value={{ isAuthenticated, isLoading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

// To make this context effective, wrap your application's layout or root component:
// app/layout.tsx
// import { AuthProvider } from '@/contexts/AuthContext';
// ...
// <AuthProvider>
//   {children}
// </AuthProvider>