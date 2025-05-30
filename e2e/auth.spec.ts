/**
 * End-to-End Authentication Tests
 *
 * These tests simulate real user workflows for:
 * - User Registration
 * - User Login
 * - Session Management
 * - Logout
 * - Auth-protected routes
 */

import { test, expect } from '@playwright/test';

// Test data
const testUser = {
  email: 'test-e2e@example.com',
  password: 'SecurePassword123!',
  invalidPassword: 'weak',
};

const existingUser = {
  email: 'existing@example.com',
  password: 'ExistingPassword123!',
};

test.describe('Authentication E2E Tests', () => {
  test.beforeEach(async ({ page }) => {
    // Start each test from the home page
    await page.goto('/');
  });

  test.describe('User Registration', () => {
    test('should register a new user successfully', async ({ page }) => {
      // Navigate to registration page
      await page.goto('/register');

      // Generate a unique email for this test run
      const uniqueEmail = `test-${Date.now()}-${Math.random().toString(36).substring(7)}@example.com`;

      // Fill registration form
      await page.fill('[data-testid="email-input"]', uniqueEmail);
      await page.fill('[data-testid="password-input"]', testUser.password);
      await page.fill('[data-testid="confirm-password-input"]', testUser.password);

      // Submit form
      await page.click('[data-testid="register-button"]');

      // Should redirect to login page after successful registration
      await expect(page).toHaveURL(/\/login/);

      // Check for success message
      await expect(page.locator('[data-testid="success-message"]')).toContainText(
        'Registration successful'
      );
    });

    test('should show validation errors for invalid input', async ({ page }) => {
      await page.goto('/register');

      // Try to submit with empty fields
      await page.click('[data-testid="register-button"]');

      // Should show validation errors
      await expect(page.locator('[data-testid="email-error"]')).toBeVisible();
      await expect(page.locator('[data-testid="password-error"]')).toBeVisible();
    });

    test('should show error for invalid email format', async ({ page }) => {
      await page.goto('/register');

      await page.fill('[data-testid="email-input"]', 'invalid-email');

      // Trigger validation by focusing away from the email field
      await page.fill('[data-testid="password-input"]', testUser.password);
      await page.fill('[data-testid="confirm-password-input"]', testUser.password);

      // Try to submit the form to trigger validation
      await page.click('[data-testid="register-button"]');

      // Wait for validation error or check if form stays on register page due to validation
      try {
        await expect(page.locator('[data-testid="email-error"]')).toContainText(/Invalid|valid|email/i, { timeout: 2000 });
      } catch {
        // If no explicit error element, check that form didn't submit (should stay on register page)
        await expect(page).toHaveURL(/\/register/);
      }
    });

    test('should show error for weak password', async ({ page }) => {
      await page.goto('/register');

      await page.fill('[data-testid="email-input"]', testUser.email);
      await page.fill('[data-testid="password-input"]', testUser.invalidPassword);
      await page.fill('[data-testid="confirm-password-input"]', testUser.invalidPassword);

      await page.click('[data-testid="register-button"]');

      await expect(page.locator('[data-testid="password-error"]')).toBeVisible();
    });

    test('should show error for password mismatch', async ({ page }) => {
      await page.goto('/register');

      await page.fill('[data-testid="email-input"]', testUser.email);
      await page.fill('[data-testid="password-input"]', testUser.password);
      await page.fill('[data-testid="confirm-password-input"]', 'DifferentPassword123!');

      await page.click('[data-testid="register-button"]');

      await expect(page.locator('[data-testid="confirm-password-error"]')).toContainText('match');
    });

    test('should show error for existing email', async ({ page }) => {
      await page.goto('/register');

      // Try to register with existing email
      await page.fill('[data-testid="email-input"]', existingUser.email);
      await page.fill('[data-testid="password-input"]', testUser.password);
      await page.fill('[data-testid="confirm-password-input"]', testUser.password);

      await page.click('[data-testid="register-button"]');

      await expect(page.locator('[data-testid="error-message"]')).toContainText('Email already registered');
    });

    test('should have working navigation to login page', async ({ page }) => {
      await page.goto('/register');

      await page.click('[data-testid="login-link"]');

      await expect(page).toHaveURL('/login');
    });
  });

  test.describe('User Login', () => {
    test('should login with valid credentials', async ({ page }) => {
      // First register a user to ensure they exist
      const loginTestEmail = `login-test-${Date.now()}@example.com`;
      const loginTestPassword = 'LoginTest123!';

      await page.goto('/register');
      await page.fill('[data-testid="email-input"]', loginTestEmail);
      await page.fill('[data-testid="password-input"]', loginTestPassword);
      await page.fill('[data-testid="confirm-password-input"]', loginTestPassword);
      await page.click('[data-testid="register-button"]');

      // Should redirect to login page
      await expect(page).toHaveURL(/\/login/);

      // Now login with the registered credentials
      await page.fill('[data-testid="email-input"]', loginTestEmail);
      await page.fill('[data-testid="password-input"]', loginTestPassword);

      await page.click('[data-testid="login-button"]');

      // Should redirect to dashboard
      await expect(page).toHaveURL('/dashboard');

      // Should show user is logged in
      await expect(page.locator('[data-testid="user-menu"]')).toBeVisible();
    });

    test('should show error for invalid credentials', async ({ page }) => {
      await page.goto('/login');

      await page.fill('[data-testid="email-input"]', 'nonexistent@example.com');
      await page.fill('[data-testid="password-input"]', 'wrongpassword');

      await page.click('[data-testid="login-button"]');

      await expect(page.locator('[data-testid="error-message"]')).toContainText('Invalid');
      await expect(page).toHaveURL(/\/login/);
    });

    test('should show validation errors for empty fields', async ({ page }) => {
      await page.goto('/login');

      await page.click('[data-testid="login-button"]');

      await expect(page.locator('[data-testid="email-error"]')).toBeVisible();
      await expect(page.locator('[data-testid="password-error"]')).toBeVisible();
    });

    test('should have working navigation to register page', async ({ page }) => {
      await page.goto('/login');

      await page.click('[data-testid="register-link"]');

      await expect(page).toHaveURL('/register');
    });

    test('should show loading state during login', async ({ page }) => {
      await page.goto('/login');

      await page.fill('[data-testid="email-input"]', existingUser.email);
      await page.fill('[data-testid="password-input"]', existingUser.password);

      // Start login process
      const loginPromise = page.click('[data-testid="login-button"]');

      // Check for loading state (button disabled or loading indicator)
      await expect(page.locator('[data-testid="login-button"]')).toBeDisabled();

      await loginPromise;
    });
  });

  test.describe('Protected Routes', () => {
    test('should redirect unauthenticated users to login', async ({ page }) => {
      // Try to access protected route without authentication
      await page.goto('/dashboard');

      await expect(page).toHaveURL(/\/login/);
    });

    test('should redirect unauthenticated users from notes page', async ({ page }) => {
      await page.goto('/dashboard/notes/some-note-id');

      await expect(page).toHaveURL(/\/login/);
    });

    test('should allow authenticated users to access protected routes', async ({ page }) => {
      // First login
      await page.goto('/login');
      await page.fill('[data-testid="email-input"]', existingUser.email);
      await page.fill('[data-testid="password-input"]', existingUser.password);
      await page.click('[data-testid="login-button"]');

      await expect(page).toHaveURL('/dashboard');

      // Now try to access other protected routes
      await page.goto('/dashboard/notes');
      await expect(page).toHaveURL('/dashboard/notes');
    });
  });

  test.describe('Session Management', () => {
    test('should maintain session on page refresh', async ({ page }) => {
      // Login first
      await page.goto('/login');
      await page.fill('[data-testid="email-input"]', existingUser.email);
      await page.fill('[data-testid="password-input"]', existingUser.password);
      await page.click('[data-testid="login-button"]');

      await expect(page).toHaveURL('/dashboard');

      // Refresh the page
      await page.reload();

      // Should still be on dashboard (session maintained)
      await expect(page).toHaveURL('/dashboard');
      await expect(page.locator('[data-testid="user-menu"]')).toBeVisible();
    });

    test('should handle token expiry gracefully', async ({ page }) => {
      // This test would need to mock token expiry
      // For now, we can test the logout functionality
      await page.goto('/login');
      await page.fill('[data-testid="email-input"]', existingUser.email);
      await page.fill('[data-testid="password-input"]', existingUser.password);
      await page.click('[data-testid="login-button"]');

      await expect(page).toHaveURL('/dashboard');

      // Clear cookies to simulate token expiry
      await page.context().clearCookies();

      // Try to access protected route
      await page.goto('/dashboard/notes');

      // Should redirect to login
      await expect(page).toHaveURL(/\/login/);
    });
  });

  test.describe('User Logout', () => {
    test('should logout user successfully', async ({ page }) => {
      // Login first
      await page.goto('/login');
      await page.fill('[data-testid="email-input"]', existingUser.email);
      await page.fill('[data-testid="password-input"]', existingUser.password);
      await page.click('[data-testid="login-button"]');

      await expect(page).toHaveURL('/dashboard');

      // Logout
      await page.click('[data-testid="user-menu"]');
      await page.click('[data-testid="logout-button"]');

      // Should redirect to login
      await expect(page).toHaveURL(/\/login/);

      // Try to access protected route after logout
      await page.goto('/dashboard');
      await expect(page).toHaveURL(/\/login/);
    });

    test('should clear session data on logout', async ({ page }) => {
      // Login first
      await page.goto('/login');
      await page.fill('[data-testid="email-input"]', existingUser.email);
      await page.fill('[data-testid="password-input"]', existingUser.password);
      await page.click('[data-testid="login-button"]');

      // Logout
      await page.click('[data-testid="user-menu"]');
      await page.click('[data-testid="logout-button"]');

      // Check that session cookies are cleared
      const cookies = await page.context().cookies();
      const authCookies = cookies.filter(
        (cookie) =>
          cookie.name.includes('auth') ||
          cookie.name.includes('token') ||
          cookie.name.includes('session')
      );

      expect(authCookies.filter((cookie) => cookie.value)).toHaveLength(0);
    });
  });

  test.describe('User Flow Integration', () => {
    test('should complete full user journey: register -> login -> access dashboard -> logout', async ({
      page,
    }) => {
      const uniqueEmail = `test-${Date.now()}@example.com`;

      // 1. Register
      await page.goto('/register');
      await page.fill('[data-testid="email-input"]', uniqueEmail);
      await page.fill('[data-testid="password-input"]', testUser.password);
      await page.fill('[data-testid="confirm-password-input"]', testUser.password);
      await page.click('[data-testid="register-button"]');

      // 2. Login (if redirected to login page)
      if (page.url().includes('/login')) {
        await page.fill('[data-testid="email-input"]', uniqueEmail);
        await page.fill('[data-testid="password-input"]', testUser.password);
        await page.click('[data-testid="login-button"]');
      }

      // 3. Access dashboard
      await expect(page).toHaveURL('/dashboard');
      await expect(page.locator('[data-testid="user-menu"]')).toBeVisible();

      // 4. Access notes section
      await page.click('[data-testid="notes-nav"]');
      await expect(page).toHaveURL('/dashboard/notes');

      // 5. Logout
      await page.click('[data-testid="user-menu"]');
      await page.click('[data-testid="logout-button"]');
      await expect(page).toHaveURL(/\/login/);

      // 6. Verify session is cleared
      await page.goto('/dashboard');
      await expect(page).toHaveURL(/\/login/);
    });

    test('should handle browser back/forward after authentication', async ({ page }) => {
      // Login
      await page.goto('/login');
      await page.fill('[data-testid="email-input"]', existingUser.email);
      await page.fill('[data-testid="password-input"]', existingUser.password);
      await page.click('[data-testid="login-button"]');

      await expect(page).toHaveURL('/dashboard');

      // Navigate to notes
      await page.goto('/dashboard/notes');
      await expect(page).toHaveURL('/dashboard/notes');

      // Use browser back button
      await page.goBack();
      await expect(page).toHaveURL('/dashboard');

      // Use browser forward button
      await page.goForward();
      await expect(page).toHaveURL('/dashboard/notes');
    });
  });

  test.describe('Error Handling', () => {
    test('should handle network errors gracefully', async ({ page }) => {
      // Intercept network requests and simulate failure
      await page.route('/api/auth/login', (route) => {
        route.abort('internetdisconnected');
      });

      await page.goto('/login');
      await page.fill('[data-testid="email-input"]', existingUser.email);
      await page.fill('[data-testid="password-input"]', existingUser.password);
      await page.click('[data-testid="login-button"]');

      // Should show network error message
      await expect(page.locator('[data-testid="error-message"]')).toContainText('network');
    });

    test('should handle server errors gracefully', async ({ page }) => {
      // Intercept network requests and simulate server error
      await page.route('/api/auth/login', (route) => {
        route.fulfill({
          status: 500,
          contentType: 'application/json',
          body: JSON.stringify({ error: 'Internal server error' }),
        });
      });

      await page.goto('/login');
      await page.fill('[data-testid="email-input"]', existingUser.email);
      await page.fill('[data-testid="password-input"]', existingUser.password);
      await page.click('[data-testid="login-button"]');

      // Should show server error message
      await expect(page.locator('[data-testid="error-message"]')).toContainText('server error');
    });
  });

  test.describe('Accessibility', () => {
    test('should be keyboard navigable', async ({ page }) => {
      await page.goto('/login');

      // Tab through form elements
      await page.press('body', 'Tab');
      await expect(page.locator('[data-testid="email-input"]')).toBeFocused();

      await page.press('[data-testid="email-input"]', 'Tab');
      await expect(page.locator('[data-testid="password-input"]')).toBeFocused();

      await page.press('[data-testid="password-input"]', 'Tab');
      await expect(page.locator('[data-testid="login-button"]')).toBeFocused();

      // Should be able to submit with Enter
      await page.fill('[data-testid="email-input"]', existingUser.email);
      await page.fill('[data-testid="password-input"]', existingUser.password);
      await page.press('[data-testid="login-button"]', 'Enter');

      await expect(page).toHaveURL('/dashboard');
    });

    test('should have proper ARIA labels', async ({ page }) => {
      await page.goto('/login');

      // Check for proper ARIA labels
      await expect(page.locator('[data-testid="email-input"]')).toHaveAttribute('aria-label');
      await expect(page.locator('[data-testid="password-input"]')).toHaveAttribute('aria-label');
      await expect(page.locator('[data-testid="login-button"]')).toHaveAttribute('aria-label');
    });
  });
});
