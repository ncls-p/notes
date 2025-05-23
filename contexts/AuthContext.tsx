'use client';

import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { getAccessToken, setAccessToken, clearAuthTokens } from '@/lib/apiClient'; // Assuming apiClient handles token storage

// Define User type
interface User {
  id: string;
  email: string;
  name?: string;
  // Add other relevant user fields
}

interface AuthContextType {
  isAuthenticated: boolean;
  isLoading: boolean;
  user: User | null;
  login: (accessToken: string, userData: User) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true); // Start as true to check initial auth status
  const router = useRouter();

  useEffect(() => {
    let isMounted = true;
    const initializeAuth = async () => {
      try {
        const token = getAccessToken(); // Synchronous in current mock, could be async
        if (token) {
          // In a real app, you'd verify token and fetch user data here
          // For this example, if a token exists, we assume it implies a logged-in user.
          // The actual user data would be set during login or fetched based on the token.
          // If getAccessToken also returned user data, we could use it here.
          // For now, we just set isAuthenticated. User data comes via login().
          if (isMounted) {
            setIsAuthenticated(true);
            // If you had a way to get user from token, set it here:
            // e.g., const userData = await fetchUserFromToken(token);
            // setUser(userData);
          }
        }
      } catch (error) {
        console.error('Failed to initialize auth:', error);
        // Remain unauthenticated if token check fails
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    initializeAuth();
    return () => {
      isMounted = false;
    };
  }, []);

  const login = (newAccessToken: string, userData: User) => {
    setAccessToken(newAccessToken);
    setUser(userData);
    setIsAuthenticated(true);
  };

  const logout = () => {
    try {
      clearAuthTokens();
    } catch (error) {
      console.error('Failed to clear tokens during logout:', error);
      // Proceed with logout on client-side even if token clearing fails
    }
    setUser(null);
    setIsAuthenticated(false);
    router.push('/login');
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
    <AuthContext.Provider value={{ isAuthenticated, isLoading, user, login, logout }}>
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
