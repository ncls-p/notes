import { test, expect } from '@playwright/test';

test.describe('Folder Management', () => {
  test.beforeEach(async ({ page }) => {
    // Register and login a test user
    await page.goto('/register');

    const timestamp = Date.now();
    const testEmail = `folder-test-${timestamp}@example.com`;
    const testPassword = 'TestPassword123!';

    await page.fill('input[name="email"]', testEmail);
    await page.fill('input[name="password"]', testPassword);
    await page.fill('input[name="confirmPassword"]', testPassword);
    await page.click('button[type="submit"]');

    // Should redirect to login (possibly with query parameters)
    await expect(page).toHaveURL(/\/login/);

    // Login
    await page.fill('input[name="email"]', testEmail);
    await page.fill('input[name="password"]', testPassword);
    await page.click('button[type="submit"]');

    // Should redirect to dashboard
    await expect(page).toHaveURL('/dashboard');
  });

  test('should create a new folder', async ({ page }) => {
    // Click "Create Folder" button
    await page.click('button:has-text("Create Folder")');

    // Modal should be visible
    await expect(page.locator('[role="dialog"]')).toBeVisible();
    await expect(page.locator('text=Create New Folder')).toBeVisible();

    // Fill in folder name
    const folderName = `Test Folder ${Date.now()}`;
    await page.fill('input[name="name"]', folderName);

    // Submit form
    await page.click('button[type="submit"]:has-text("Create")');

    // Modal should close
    await expect(page.locator('[role="dialog"]')).not.toBeVisible();

    // Folder should appear in the dashboard
    await expect(page.locator(`text=${folderName}`)).toBeVisible();

    // Should show folder card
    await expect(page.locator('[data-testid="folder-card"]').filter({ hasText: folderName })).toBeVisible();
  });

  test('should not create folder with empty name', async ({ page }) => {
    // Click "Create Folder" button
    await page.click('button:has-text("Create Folder")');

    // Try to submit with empty name
    await page.click('button[type="submit"]:has-text("Create")');

    // Should show validation error
    await expect(page.locator('text=Folder name is required')).toBeVisible();

    // Modal should still be open
    await expect(page.locator('[role="dialog"]')).toBeVisible();
  });

  test('should not create duplicate folder names', async ({ page }) => {
    const folderName = `Duplicate Test ${Date.now()}`;

    // Create first folder
    await page.click('button:has-text("Create Folder")');
    await page.fill('input[name="name"]', folderName);
    await page.click('button[type="submit"]:has-text("Create")');
    await expect(page.locator('[role="dialog"]')).not.toBeVisible();

    // Try to create second folder with same name
    await page.click('button:has-text("Create Folder")');
    await page.fill('input[name="name"]', folderName);
    await page.click('button[type="submit"]:has-text("Create")');

    // Should show error message
    await expect(page.locator('text=A folder with this name already exists')).toBeVisible();
  });

  test('should rename a folder', async ({ page }) => {
    // Create a folder first
    const originalName = `Original Folder ${Date.now()}`;
    await page.click('button:has-text("Create Folder")');
    await page.fill('input[name="name"]', originalName);
    await page.click('button[type="submit"]:has-text("Create")');
    await expect(page.locator('[role="dialog"]')).not.toBeVisible();

    // Find the folder card and click edit button
    const folderCard = page.locator('[data-testid="folder-card"]').filter({ hasText: originalName });
    await folderCard.locator('[data-testid="edit-folder-btn"]').click();

    // Rename modal should be visible
    await expect(page.locator('text=Rename Folder')).toBeVisible();

    // Update the name
    const newName = `Renamed Folder ${Date.now()}`;
    await page.fill('input[name="name"]', newName);
    await page.click('button[type="submit"]:has-text("Save")');

    // Modal should close and folder should have new name
    await expect(page.locator('[role="dialog"]')).not.toBeVisible();
    await expect(page.locator(`text=${newName}`)).toBeVisible();
    await expect(page.locator(`text=${originalName}`)).not.toBeVisible();
  });

  test('should delete an empty folder', async ({ page }) => {
    // Create a folder first
    const folderName = `Delete Test ${Date.now()}`;
    await page.click('button:has-text("Create Folder")');
    await page.fill('input[name="name"]', folderName);
    await page.click('button[type="submit"]:has-text("Create")');
    await expect(page.locator('[role="dialog"]')).not.toBeVisible();

    // Find the folder card and click delete button
    const folderCard = page.locator('[data-testid="folder-card"]').filter({ hasText: folderName });
    await folderCard.locator('[data-testid="delete-folder-btn"]').click();

    // Confirmation dialog should appear
    await expect(page.locator('text=Delete Folder')).toBeVisible();
    await expect(page.locator('text=Are you sure you want to delete this folder?')).toBeVisible();

    // Confirm deletion
    await page.click('button:has-text("Delete")');

    // Folder should be removed from dashboard
    await expect(page.locator('[role="dialog"]')).not.toBeVisible();
    await expect(page.locator(`text=${folderName}`)).not.toBeVisible();
  });

  test('should navigate into a folder', async ({ page }) => {
    // Create a folder first
    const folderName = `Navigate Test ${Date.now()}`;
    await page.click('button:has-text("Create Folder")');
    await page.fill('input[name="name"]', folderName);
    await page.click('button[type="submit"]:has-text("Create")');
    await expect(page.locator('[role="dialog"]')).not.toBeVisible();

    // Click on the folder to navigate into it
    await page.click(`text=${folderName}`);

    // Should navigate to folder view
    await expect(page.locator('text=Root')).toBeVisible(); // Breadcrumb
    await expect(page.locator(`text=${folderName}`)).toBeVisible(); // Current folder in breadcrumb

    // Should show empty state since folder is empty
    await expect(page.locator('text=This folder is empty')).toBeVisible();
  });

  test('should show folder with note count', async ({ page }) => {
    // Create a folder first
    const folderName = `Count Test ${Date.now()}`;
    await page.click('button:has-text("Create Folder")');
    await page.fill('input[name="name"]', folderName);
    await page.click('button[type="submit"]:has-text("Create")');
    await expect(page.locator('[role="dialog"]')).not.toBeVisible();

    // Navigate into the folder
    await page.click(`text=${folderName}`);

    // Create a note in this folder
    await page.click('button:has-text("New Note")');
    const noteName = `Test Note ${Date.now()}`;
    await page.fill('input[name="title"]', noteName);
    await page.click('button[type="submit"]:has-text("Create")');

    // Go back to root
    await page.click('text=Root');

    // Folder should show note count
    const folderCard = page.locator('[data-testid="folder-card"]').filter({ hasText: folderName });
    await expect(folderCard.locator('text=1 note')).toBeVisible();
  });
});