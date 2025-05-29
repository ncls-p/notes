import { test, expect } from '@playwright/test';

test.describe('Registration Flow', () => {
  const uniqueEmail = () => `testuser_${Date.now()}@example.com`;

  test('should allow a new user to register successfully and redirect to login', async ({ page }) => {
    await page.goto('/register');

    await expect(page.getByRole('heading', { name: 'Create Account' })).toBeVisible();

    const email = uniqueEmail();
    await page.getByLabel('Email address').fill(email);
    await page.getByLabel('Password', { exact: true }).fill('Password123!');
    await page.getByLabel('Confirm Password').fill('Password123!');

    // Mock the API response for successful registration if needed, or ensure the backend is running
    // For now, we assume the backend handles it and redirects or shows success.
    // If your actual app doesn't redirect immediately but shows a success message first, adjust accordingly.

    // For this test, we'll assume a successful registration will eventually lead to the login page.
    // If the app directly pushes to /login, this is fine.
    // If it shows a success message and then the user clicks to login, the test needs to be adjusted.

    await page.getByRole('button', { name: 'Create Account' }).click();

    // Wait for navigation to the login page (or a dashboard if auto-login occurs)
    // Adjust the URL as per your application's behavior post-registration.
    await page.waitForURL('/login', { timeout: 10000 });
    await expect(page).toHaveURL('/login');
    // Optionally, check for a success message if one is displayed before redirect
    // await expect(page.getByText('Registration successful!')).toBeVisible();
  });

  test('should show an error message if trying to register with an existing email', async ({ page }) => {
    // First, register a user to ensure their email exists.
    const existingEmail = uniqueEmail();
    await page.goto('/register');
    await page.getByLabel('Email address').fill(existingEmail);
    await page.getByLabel('Password', { exact: true }).fill('Password123!');
    await page.getByLabel('Confirm Password').fill('Password123!');

    // Intercept the first registration call to ensure it succeeds
    // For simplicity in this example, we'll assume the first registration works
    // and the backend is set up to handle it.
    // In a real scenario, you might need to ensure the DB state or mock this.
    await page.getByRole('button', { name: 'Create Account' }).click();
    await page.waitForURL(new RegExp('/login\\?message=registration-success'));

    // Now, attempt to register with the same email again
    await page.goto('/register');
    await page.getByLabel('Email address').fill(existingEmail);
    await page.getByLabel('Password', { exact: true }).fill('AnotherPassword123!');
    await page.getByLabel('Confirm Password').fill('AnotherPassword123!');
    await page.getByRole('button', { name: 'Create Account' }).click();

    // Expect an error message to be visible
    // The exact text depends on your API's error response and how the frontend displays it.
    await expect(page.getByText(/Email already registered|Invalid input Email: Email already registered/i)).toBeVisible({ timeout: 10000 });
  });

  test('should show validation errors for invalid input', async ({ page }) => {
    await page.goto('/register');

    // Submit with empty fields
    await page.getByRole('button', { name: 'Create Account' }).click();
    await expect(page.getByText('Invalid email address')).toBeVisible();
    await expect(page.getByText('Password must be at least 8 characters long')).toBeVisible();
    await expect(page.getByText('Please confirm your password')).toBeVisible();

    // Test mismatched passwords
    await page.getByLabel('Email address').fill(uniqueEmail());
    await page.getByLabel('Password', { exact: true }).fill('Password123!');
    await page.getByLabel('Confirm Password').fill('PasswordDoesNotMatch!');
    await page.getByRole('button', { name: 'Create Account' }).click();
    await expect(page.getByText("Passwords don't match")).toBeVisible();
  });
});