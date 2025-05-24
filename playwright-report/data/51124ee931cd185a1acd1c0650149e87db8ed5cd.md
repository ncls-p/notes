# Test info

- Name: Registration Flow >> should allow a new user to register successfully and redirect to login
- Location: /Users/ncls/work/perso/notes/e2e/auth/register.spec.ts:6:3

# Error details

```
TimeoutError: page.waitForURL: Timeout 10000ms exceeded.
=========================== logs ===========================
waiting for navigation to "/login" until "load"
============================================================
    at /Users/ncls/work/perso/notes/e2e/auth/register.spec.ts:28:16
```

# Page snapshot

```yaml
- heading "Create Account" [level=1]
- text: Internal server error Email address
- textbox "Email address": testuser_1748112348294@example.com
- text: Password
- textbox "Password": Password123!
- text: Confirm Password
- textbox "Confirm Password": Password123!
- button "Create Account"
- paragraph:
  - text: Already have an account?
  - link "Log in":
    - /url: /login
- alert
- button "Open Next.js Dev Tools":
  - img
```

# Test source

```ts
   1 | import { test, expect } from '@playwright/test';
   2 |
   3 | test.describe('Registration Flow', () => {
   4 |   const uniqueEmail = () => `testuser_${Date.now()}@example.com`;
   5 |
   6 |   test('should allow a new user to register successfully and redirect to login', async ({ page }) => {
   7 |     await page.goto('/register');
   8 |
   9 |     await expect(page.getByRole('heading', { name: 'Create Account' })).toBeVisible();
  10 |
  11 |     const email = uniqueEmail();
  12 |     await page.getByLabel('Email address').fill(email);
  13 |     await page.getByLabel('Password', { exact: true }).fill('Password123!');
  14 |     await page.getByLabel('Confirm Password').fill('Password123!');
  15 |
  16 |     // Mock the API response for successful registration if needed, or ensure the backend is running
  17 |     // For now, we assume the backend handles it and redirects or shows success.
  18 |     // If your actual app doesn't redirect immediately but shows a success message first, adjust accordingly.
  19 |
  20 |     // For this test, we'll assume a successful registration will eventually lead to the login page.
  21 |     // If the app directly pushes to /login, this is fine.
  22 |     // If it shows a success message and then the user clicks to login, the test needs to be adjusted.
  23 |
  24 |     await page.getByRole('button', { name: 'Create Account' }).click();
  25 |
  26 |     // Wait for navigation to the login page (or a dashboard if auto-login occurs)
  27 |     // Adjust the URL as per your application's behavior post-registration.
> 28 |     await page.waitForURL('/login', { timeout: 10000 });
     |                ^ TimeoutError: page.waitForURL: Timeout 10000ms exceeded.
  29 |     await expect(page).toHaveURL('/login');
  30 |     // Optionally, check for a success message if one is displayed before redirect
  31 |     // await expect(page.getByText('Registration successful!')).toBeVisible();
  32 |   });
  33 |
  34 |   test('should show an error message if trying to register with an existing email', async ({ page }) => {
  35 |     // First, register a user to ensure their email exists.
  36 |     const existingEmail = uniqueEmail();
  37 |     await page.goto('/register');
  38 |     await page.getByLabel('Email address').fill(existingEmail);
  39 |     await page.getByLabel('Password', { exact: true }).fill('Password123!');
  40 |     await page.getByLabel('Confirm Password').fill('Password123!');
  41 |
  42 |     // Intercept the first registration call to ensure it succeeds
  43 |     // For simplicity in this example, we'll assume the first registration works
  44 |     // and the backend is set up to handle it.
  45 |     // In a real scenario, you might need to ensure the DB state or mock this.
  46 |     await page.getByRole('button', { name: 'Create Account' }).click();
  47 |     await page.waitForURL('/login'); // Wait for the first registration to complete
  48 |
  49 |     // Now, attempt to register with the same email again
  50 |     await page.goto('/register');
  51 |     await page.getByLabel('Email address').fill(existingEmail);
  52 |     await page.getByLabel('Password', { exact: true }).fill('AnotherPassword123!');
  53 |     await page.getByLabel('Confirm Password').fill('AnotherPassword123!');
  54 |     await page.getByRole('button', { name: 'Create Account' }).click();
  55 |
  56 |     // Expect an error message to be visible
  57 |     // The exact text depends on your API's error response and how the frontend displays it.
  58 |     await expect(page.getByText(/Email already registered|Invalid input Email: Email already registered/i)).toBeVisible({ timeout: 10000 });
  59 |   });
  60 |
  61 |   test('should show validation errors for invalid input', async ({ page }) => {
  62 |     await page.goto('/register');
  63 |
  64 |     // Submit with empty fields
  65 |     await page.getByRole('button', { name: 'Create Account' }).click();
  66 |     await expect(page.getByText('Invalid email address')).toBeVisible();
  67 |     await expect(page.getByText('Password must be at least 8 characters long')).toBeVisible();
  68 |     await expect(page.getByText('Please confirm your password')).toBeVisible();
  69 |
  70 |     // Test mismatched passwords
  71 |     await page.getByLabel('Email address').fill(uniqueEmail());
  72 |     await page.getByLabel('Password', { exact: true }).fill('Password123!');
  73 |     await page.getByLabel('Confirm Password').fill('PasswordDoesNotMatch!');
  74 |     await page.getByRole('button', { name: 'Create Account' }).click();
  75 |     await expect(page.getByText("Passwords don't match")).toBeVisible();
  76 |   });
  77 | });
```