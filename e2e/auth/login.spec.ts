import { test, expect } from '@playwright/test';

test.describe('Login Flow', () => {
  const uniqueEmail = () => `testuser_login_${Date.now()}@example.com`;
  const password = 'Password123!';
  let registeredEmail: string;

  // Hook to register a user before tests run, so we have a valid user to log in with.
  // This makes the login test dependent on registration working.
  // For more isolated tests, consider seeding a user in the database directly
  // or using a pre-existing test account if your environment supports it.
  test.beforeAll(async ({ browser }) => {
    registeredEmail = uniqueEmail();
    const context = await browser.newContext();
    const page = await context.newPage();
    await page.goto('/register');
    await page.getByLabel('Email address').fill(registeredEmail);
    await page.getByLabel('Password', { exact: true }).fill(password);
    await page.getByLabel('Confirm Password').fill(password);
    await page.getByRole('button', { name: 'Create Account' }).click();
    await page.waitForURL('/login'); // Wait for redirection to login after registration
    await page.close();
    await context.close();
  });

  test('should allow a registered user to log in successfully and redirect to dashboard', async ({ page }) => {
    await page.goto('/login');

    await expect(page.getByRole('heading', { name: 'Log In' })).toBeVisible();

    await page.getByLabel('Email address').fill(registeredEmail);
    await page.getByLabel('Password').fill(password);
    await page.getByRole('button', { name: 'Log In' }).click();

    // Wait for navigation to the dashboard page
    await page.waitForURL('/dashboard', { timeout: 10000 });
    await expect(page).toHaveURL('/dashboard');
    // Optionally, check for a welcome message or a specific element on the dashboard
    // await expect(page.getByRole('heading', { name: /Welcome|Dashboard/i })).toBeVisible();
  });

  test('should show an error message for invalid credentials', async ({ page }) => {
    await page.goto('/login');

    await expect(page.getByRole('heading', { name: 'Log In' })).toBeVisible();

    await page.getByLabel('Email address').fill(registeredEmail); // Correct email
    await page.getByLabel('Password').fill('WrongPassword123!'); // Incorrect password
    await page.getByRole('button', { name: 'Log In' }).click();

    // Expect an error message to be visible
    // The exact text depends on your API's error response and how the frontend displays it.
    await expect(page.getByText(/Invalid credentials|Login failed/i)).toBeVisible({ timeout: 10000 });
    await expect(page).not.toHaveURL('/dashboard'); // Ensure no redirect
  });

  test('should show validation errors for empty fields', async ({ page }) => {
    await page.goto('/login');
    await expect(page.getByRole('heading', { name: 'Log In' })).toBeVisible();

    await page.getByRole('button', { name: 'Log In' }).click(); // Submit with empty fields

    await expect(page.getByText('Invalid email address')).toBeVisible();
    await expect(page.getByText('Password is required')).toBeVisible();
    await expect(page).not.toHaveURL('/dashboard'); // Ensure no redirect
  });

   test('should show validation error for invalid email format', async ({ page }) => {
    await page.goto('/login');
    await expect(page.getByRole('heading', { name: 'Log In' })).toBeVisible();

    await page.getByLabel('Email address').fill('invalid-email-format');
    await page.getByLabel('Password').fill(password);
    await page.getByRole('button', { name: 'Log In' }).click();

    await expect(page.getByText('Invalid email address')).toBeVisible();
    await expect(page).not.toHaveURL('/dashboard'); // Ensure no redirect
  });
});