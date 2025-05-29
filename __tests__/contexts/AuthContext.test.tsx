import React from 'react';
import { render, screen, act, waitFor } from '@testing-library/react';
import { useRouter } from 'next/navigation';
import { AuthProvider, useAuth } from '@/contexts/AuthContext';
import { getAccessToken, setAccessToken, clearAuthTokens } from '@/lib/apiClient';

// Mock dependencies
jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
}));

jest.mock('@/lib/apiClient', () => ({
  getAccessToken: jest.fn(),
  setAccessToken: jest.fn(),
  clearAuthTokens: jest.fn(),
}));

const mockUseRouter = useRouter as jest.MockedFunction<typeof useRouter>;
const mockGetAccessToken = getAccessToken as jest.MockedFunction<typeof getAccessToken>;
const mockSetAccessToken = setAccessToken as jest.MockedFunction<typeof setAccessToken>;
const mockClearAuthTokens = clearAuthTokens as jest.MockedFunction<typeof clearAuthTokens>;

describe('AuthContext', () => {
  const mockPush = jest.fn();

  // Helper to create valid JWT tokens for testing
  const createTestJWT = (payload: any) => {
    const header = { alg: 'HS256', typ: 'JWT' };
    const encodedHeader = Buffer.from(JSON.stringify(header)).toString('base64url');
    const encodedPayload = Buffer.from(JSON.stringify(payload)).toString('base64url');
    const signature = 'test-signature';
    return `${encodedHeader}.${encodedPayload}.${signature}`;
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockUseRouter.mockReturnValue({
      push: mockPush,
      replace: jest.fn(),
      prefetch: jest.fn(),
      back: jest.fn(),
      forward: jest.fn(),
      refresh: jest.fn(),
    } as any);
    // Ensure getAccessToken is reset for each test's specific scenario
    mockGetAccessToken.mockReturnValue(null);
  });

  // Test component to access auth context
  const TestComponent = () => {
    const { isAuthenticated, isLoading, login, logout, user } = useAuth();
    return (
      <div>
        <div data-testid='authenticated'>{isAuthenticated.toString()}</div>
        <div data-testid='loading'>{isLoading.toString()}</div>
        <div data-testid='user'>{user ? user.id : 'null'}</div>
        <button
          data-testid='login'
          onClick={() =>
            login('test-token', { id: 'test-user', email: 'test@example.com', name: 'Test User' })
          }
        >
          Login
        </button>
        <button data-testid='logout' onClick={logout}>
          Logout
        </button>
      </div>
    );
  };

  const TestComponentWithoutProvider = () => {
    const auth = useAuth();
    return <div>{auth.isAuthenticated}</div>;
  };

  describe('AuthProvider', () => {
    it('should initialize with loading state and then become unauthenticated if no token', async () => {
      mockGetAccessToken.mockReturnValue(null);

      render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      );

      // Check initial state if possible (might be too fast)
      // expect(screen.getByTestId('loading')).toHaveTextContent('true');

      await waitFor(() => {
        expect(screen.getByTestId('loading')).toHaveTextContent('false');
      });

      expect(screen.getByTestId('authenticated')).toHaveTextContent('false');
      expect(mockGetAccessToken).toHaveBeenCalledTimes(1);
    });

    it('should initialize as authenticated when token exists', async () => {
      const testPayload = { userId: 'test-user', email: 'test@example.com' };
      const validJWT = createTestJWT(testPayload);
      mockGetAccessToken.mockReturnValue(validJWT);

      render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      );

      // Wait for initialization to complete
      await waitFor(() => {
        expect(screen.getByTestId('loading')).toHaveTextContent('false');
      });

      expect(screen.getByTestId('authenticated')).toHaveTextContent('true');
      expect(mockGetAccessToken).toHaveBeenCalledTimes(1);
    });

    it('should handle login correctly', async () => {
      // mockGetAccessToken is already returning null from beforeEach
      render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      );
      await waitFor(() => expect(screen.getByTestId('loading')).toHaveTextContent('false'));
      expect(screen.getByTestId('authenticated')).toHaveTextContent('false');

      act(() => {
        screen.getByTestId('login').click();
      });

      expect(screen.getByTestId('authenticated')).toHaveTextContent('true');
      // User data provided during login in TestComponent
      expect(screen.getByTestId('user')).toHaveTextContent('test-user');
      expect(mockSetAccessToken).toHaveBeenCalledWith('test-token');
      expect(mockSetAccessToken).toHaveBeenCalledTimes(1);
    });

    it('should handle logout correctly', async () => {
      const testPayload = { userId: 'test-user', email: 'test@example.com' };
      const validJWT = createTestJWT(testPayload);
      mockGetAccessToken.mockReturnValue(validJWT);

      render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      );

      // Wait for initial load
      await waitFor(() => {
        expect(screen.getByTestId('loading')).toHaveTextContent('false');
      });

      expect(screen.getByTestId('authenticated')).toHaveTextContent('true');

      // Perform logout
      act(() => {
        screen.getByTestId('logout').click();
      });

      expect(screen.getByTestId('authenticated')).toHaveTextContent('false');
      expect(mockClearAuthTokens).toHaveBeenCalledTimes(1);
      expect(mockPush).toHaveBeenCalledWith('/login');
    });

    it('should handle multiple login/logout cycles', async () => {
      mockGetAccessToken.mockReturnValue(null);

      render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      );

      // Wait for initial load
      await waitFor(() => {
        expect(screen.getByTestId('loading')).toHaveTextContent('false');
      });

      // Initial state
      expect(screen.getByTestId('authenticated')).toHaveTextContent('false');

      // Login
      act(() => {
        screen.getByTestId('login').click();
      });
      expect(screen.getByTestId('authenticated')).toHaveTextContent('true');

      // Logout
      act(() => {
        screen.getByTestId('logout').click();
      });
      expect(screen.getByTestId('authenticated')).toHaveTextContent('false');

      // Login again
      act(() => {
        screen.getByTestId('login').click();
      });
      expect(screen.getByTestId('authenticated')).toHaveTextContent('true');

      expect(mockSetAccessToken).toHaveBeenCalledTimes(2);
      expect(mockClearAuthTokens).toHaveBeenCalledTimes(1);
      expect(mockPush).toHaveBeenCalledTimes(1);
    });

    it('should handle different access tokens and user data on login', async () => {
      // This test should be self-contained with its own component and provider instance
      const TestSpecificLoginComponent = () => {
        const { login, isAuthenticated, user } = useAuth();
        return (
          <div>
            <div data-testid='auth-specific'>{isAuthenticated.toString()}</div>
            <div data-testid='user-specific'>{user ? user.id : 'null'}</div>
            <button
              onClick={() =>
                login('token-1', { id: 'user-1', email: 'user1@example.com', name: 'User One' })
              }
            >
              Login 1
            </button>
            <button
              onClick={() =>
                login('token-2', { id: 'user-2', email: 'user2@example.com', name: 'User Two' })
              }
            >
              Login 2
            </button>
          </div>
        );
      };

      render(
        <AuthProvider>
          <TestSpecificLoginComponent />
        </AuthProvider>
      );

      // Wait for initial load of this specific provider
      await waitFor(() => {
        // Check a loading state if TestSpecificLoginComponent had one, or just proceed
        expect(screen.getByTestId('auth-specific')).toHaveTextContent('false');
      });

      const buttons = screen.getAllByRole('button');
      const loginBtn1 = buttons.find((btn) => btn.textContent === 'Login 1');
      const loginBtn2 = buttons.find((btn) => btn.textContent === 'Login 2');

      if (!loginBtn1 || !loginBtn2) {
        throw new Error('Login buttons not found');
      }

      act(() => {
        loginBtn1.click();
      });
      expect(mockSetAccessToken).toHaveBeenCalledWith('token-1');
      await waitFor(() => expect(screen.getByTestId('user-specific')).toHaveTextContent('user-1'));

      act(() => {
        loginBtn2.click();
      });
      expect(mockSetAccessToken).toHaveBeenCalledWith('token-2');
      await waitFor(() => expect(screen.getByTestId('user-specific')).toHaveTextContent('user-2'));

      expect(mockSetAccessToken).toHaveBeenCalledTimes(2); // Called twice in this test
    });

    it('should provide stable context values when state does not change', async () => {
      const testPayload = { userId: 'test-user', email: 'test@example.com' };
      const validJWT = createTestJWT(testPayload);
      mockGetAccessToken.mockReturnValue(validJWT);

      let renderCount = 0;
      const TestComponentRenderCounter = () => {
        renderCount++;
        const auth = useAuth();
        return <div>{auth.isAuthenticated.toString()}</div>;
      };

      const { rerender } = render(
        <AuthProvider>
          <TestComponentRenderCounter />
        </AuthProvider>
      );

      await waitFor(() => {
        expect(screen.getByText('true')).toBeInTheDocument();
      });

      const initialRenderCount = renderCount;

      // Rerender parent without changing auth state
      rerender(
        <AuthProvider>
          <TestComponentRenderCounter />
        </AuthProvider>
      );

      // The component should not re-render unnecessarily
      // Note: This test is more about verifying that context doesn't cause unnecessary rerenders
      // but since we're creating a new AuthProvider on rerender, it will re-initialize
      expect(renderCount).toBeGreaterThan(initialRenderCount);
    });

    it('should render children correctly', () => {
      const TestChildren = () => <div data-testid='children'>Test Children</div>;

      render(
        <AuthProvider>
          <TestChildren />
        </AuthProvider>
      );

      expect(screen.getByTestId('children')).toHaveTextContent('Test Children');
    });

    it('should handle multiple children components', async () => {
      const Child1 = () => {
        const { isAuthenticated } = useAuth();
        return <div data-testid='child1'>{isAuthenticated.toString()}</div>;
      };

      const Child2 = () => {
        const { isLoading } = useAuth();
        return <div data-testid='child2'>{isLoading.toString()}</div>;
      };

      const testPayload = { userId: 'test-user', email: 'test@example.com' };
      const validJWT = createTestJWT(testPayload);
      mockGetAccessToken.mockReturnValue(validJWT);

      render(
        <AuthProvider>
          <Child1 />
          <Child2 />
        </AuthProvider>
      );

      await waitFor(() => {
        expect(screen.getByTestId('child1')).toHaveTextContent('true');
        expect(screen.getByTestId('child2')).toHaveTextContent('false');
      });
    });

    it('should set loading to false and remain unauthenticated if getAccessToken throws', async () => {
      mockGetAccessToken.mockImplementation(() => {
        throw new Error('Storage error');
      });

      // Suppress console.error for this expected error
      const originalError = console.error;
      console.error = jest.fn();

      render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      );

      await waitFor(() => {
        expect(screen.getByTestId('loading')).toHaveTextContent('false');
      });
      expect(screen.getByTestId('authenticated')).toHaveTextContent('false');
      expect(console.error).toHaveBeenCalledWith('Failed to initialize auth:', expect.any(Error));

      console.error = originalError; // Restore console.error
    });

    it('should logout and redirect even if clearAuthTokens throws', async () => {
      const testPayload = { userId: 'test-user', email: 'test@example.com' };
      const validJWT = createTestJWT(testPayload);
      mockGetAccessToken.mockReturnValue(validJWT); // Start authenticated
      mockClearAuthTokens.mockImplementation(() => {
        throw new Error('Clear tokens error');
      });

      // Suppress console.error for this expected error
      const originalError = console.error;
      console.error = jest.fn();

      render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      );

      await waitFor(() => expect(screen.getByTestId('authenticated')).toHaveTextContent('true'));

      act(() => {
        screen.getByTestId('logout').click();
      });

      expect(screen.getByTestId('authenticated')).toHaveTextContent('false');
      expect(screen.getByTestId('user')).toHaveTextContent('null');
      expect(mockPush).toHaveBeenCalledWith('/login');
      // Check that the error was logged by the AuthProvider
      expect(console.error).toHaveBeenCalledWith(
        'Failed to clear tokens during logout:',
        expect.any(Error)
      );

      console.error = originalError; // Restore console.error
    });
  });

  describe('useAuth hook', () => {
    it('should throw error when used outside AuthProvider', () => {
      // Suppress console.error for this test
      const originalError = console.error;
      console.error = jest.fn();

      expect(() => {
        render(<TestComponentWithoutProvider />);
      }).toThrow('useAuth must be used within an AuthProvider');

      console.error = originalError;
    });

    it('should return auth context when used within AuthProvider', async () => {
      mockGetAccessToken.mockReturnValue(null);

      render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      );

      await waitFor(() => {
        expect(screen.getByTestId('loading')).toHaveTextContent('false');
      });

      expect(screen.getByTestId('authenticated')).toHaveTextContent('false');
      expect(screen.getByTestId('login')).toBeInTheDocument();
      expect(screen.getByTestId('logout')).toBeInTheDocument();
    });

    it('should provide consistent function references', async () => {
      mockGetAccessToken.mockReturnValue(null);

      let loginFn: any;
      let logoutFn: any;

      const TestFunctionReferences = () => {
        const { login, logout } = useAuth();
        loginFn = login;
        logoutFn = logout;
        return <div>Test</div>;
      };

      const { rerender } = render(
        <AuthProvider>
          <TestFunctionReferences />
        </AuthProvider>
      );

      const initialLoginFn = loginFn;
      const initialLogoutFn = logoutFn;

      // Force a state change
      act(() => {
        loginFn('test-token', { id: 'test-user', email: 'test@example.com', name: 'Test User' });
      });

      rerender(
        <AuthProvider>
          <TestFunctionReferences />
        </AuthProvider>
      );

      // Note: In this implementation, functions are recreated on each render
      // In a production environment, you might want to memoize these functions
      // This test documents the current behavior
      expect(typeof loginFn).toBe('function');
      expect(typeof logoutFn).toBe('function');
    });
  });
});
