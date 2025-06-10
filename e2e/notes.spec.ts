import { expect, test } from "@playwright/test";

test.describe("Note Management", () => {
  test.beforeEach(async ({ page }) => {
    // Register and login a test user
    await page.goto("/register");

    const timestamp = Date.now();
    const testEmail = `note-test-${timestamp}@example.com`;
    const testPassword = "TestPassword123!";

    await page.fill('input[name="email"]', testEmail);
    await page.fill('input[name="password"]', testPassword);
    await page.fill('input[name="confirmPassword"]', testPassword);
    await page.click('button[type="submit"]');

    // Should redirect to login with success message
    await expect(page).toHaveURL(
      new RegExp("/login\\?message=registration-success"),
    );

    // Login
    await page.fill('input[name="email"]', testEmail);
    await page.fill('input[name="password"]', testPassword);
    await page.click('button[type="submit"]');

    // Should redirect to dashboard
    await expect(page).toHaveURL("/dashboard");
  });

  test("should create a new note in root", async ({ page }) => {
    // Wait for dashboard URL
    await page.waitForURL("/dashboard");

    // Add console listener to capture any JavaScript errors
    page.on("console", (msg) => {
      if (msg.type() === "error") {
        console.log("Browser console error:", msg.text());
      }
    });

    // Wait a moment for the page to stabilize
    await page.waitForTimeout(2000);

    // Debug what's actually on the page
    await page.screenshot({ path: "debug-dashboard.png", fullPage: true });
    console.log("Page title:", await page.title());

    // Check for error indicators
    const errorElement = page.locator("text=Something went wrong");
    if (await errorElement.isVisible()) {
      console.log("ERROR: Dashboard shows error page");
      const errorMessage = await page.locator("text=Error:").textContent();
      console.log("Error message:", errorMessage);
      throw new Error(`Dashboard crashed with error page: ${errorMessage}`);
    }

    // Try to find buttons with multiple strategies
    const newNoteByTestId = page.locator('[data-testid="new-note-button"]');
    const newNoteByText = page.locator('button:has-text("New Note")');
    const anyButton = page.locator("button");

    console.log("Total buttons on page:", await anyButton.count());
    console.log(
      "New Note button by testid visible:",
      await newNoteByTestId.isVisible(),
    );
    console.log(
      "New Note button by text visible:",
      await newNoteByText.isVisible(),
    );

    // Try to wait for any button first
    await page.waitForSelector("button", { timeout: 10000 });
    console.log("Found at least one button");

    // Wait for dashboard to load and buttons to be available
    await page.waitForSelector('[data-testid="new-note-button"]', {
      state: "visible",
      timeout: 10000,
    });

    // Click "Create Note" button
    await page.click('[data-testid="new-note-button"]');

    // Modal should be visible
    await expect(page.locator('[role="dialog"]')).toBeVisible();
    await expect(page.locator("text=Create New Note")).toBeVisible();

    // Fill in note title
    const noteTitle = `Test Note ${Date.now()}`;
    await page.fill('input[name="title"]', noteTitle);

    // Submit form - be more specific to avoid sort buttons
    await page.click('[role="dialog"] button:has-text("Create")');

    // Modal should close
    await expect(page.locator('[role="dialog"]')).not.toBeVisible();

    // Wait for the page to refresh with new data
    await page.waitForTimeout(1000);

    // Note should appear in the dashboard
    await expect(page.locator(`text=${noteTitle}`)).toBeVisible();

    // Should show note card
    await expect(
      page.locator('[data-testid="note-card"]').filter({ hasText: noteTitle }),
    ).toBeVisible();
  });

  test("should not create note with empty title", async ({ page }) => {
    // Click "Create Note" button
    await page.click('button:has-text("New Note")');

    // Try to submit with empty title
    await page.click('button[type="submit"]:has-text("Create")');

    // Should show validation error
    await expect(page.locator("text=Note title is required")).toBeVisible();

    // Modal should still be open
    await expect(page.locator('[role="dialog"]')).toBeVisible();
  });

  test("should not create duplicate note titles in same location", async ({
    page,
  }) => {
    const noteTitle = `Duplicate Note ${Date.now()}`;

    // Create first note
    await page.click('button:has-text("New Note")');
    await page.fill('input[name="title"]', noteTitle);
    await page.click('button[type="submit"]:has-text("Create")');
    await expect(page.locator('[role="dialog"]')).not.toBeVisible();

    // Try to create second note with same title
    await page.click('button:has-text("New Note")');
    await page.fill('input[name="title"]', noteTitle);
    await page.click('button[type="submit"]:has-text("Create")');

    // Should show error message
    await expect(
      page.locator("text=A note with this title already exists"),
    ).toBeVisible();
  });

  test("should open note editor when clicking edit button", async ({
    page,
  }) => {
    // Create a note first
    const noteTitle = `Editor Test ${Date.now()}`;
    await page.click('button:has-text("New Note")');
    await page.fill('input[name="title"]', noteTitle);
    await page.click('button[type="submit"]:has-text("Create")');
    await expect(page.locator('[role="dialog"]')).not.toBeVisible();

    // Find the note card and click edit button
    const noteCard = page
      .locator('[data-testid="note-card"]')
      .filter({ hasText: noteTitle });
    await noteCard.locator('[data-testid="edit-note-btn"]').click();

    // Should navigate to note editor
    await expect(page).toHaveURL(/\/notes\/[^\/]+$/);

    // Should show note editor with CodeMirror
    await expect(page.locator(".cm-editor")).toBeVisible();

    // Should show note title
    await expect(page.locator(`text=${noteTitle}`)).toBeVisible();

    // Should show split view with editor and preview
    await expect(page.locator("text=Editor")).toBeVisible();
    await expect(page.locator("text=Preview")).toBeVisible();
  });

  test("should edit and save note content", async ({ page }) => {
    // Create a note first by opening the New Note dialog
    const noteTitle = `Save Test ${Date.now()}`;
    await page.waitForSelector('button:has-text("New Note")', {
      state: "visible",
    });
    await page.click('button:has-text("New Note")');
    await page.waitForSelector('input[name="title"]', { state: "visible" });
    await page.fill('input[name="title"]', noteTitle);
    await page.click('button[type="submit"]:has-text("Create")');
    await expect(page.locator('[role="dialog"]')).not.toBeVisible();

    // Open note editor
    const noteCard = page
      .locator('[data-testid="note-card"]')
      .filter({ hasText: noteTitle });
    await noteCard.locator('[data-testid="edit-note-btn"]').click();

    // Add content to the editor
    const testContent =
      '# Test Header\n\nThis is **bold** text and this is *italic* text.\n\n- List item 1\n- List item 2\n\n```javascript\nconsole.log("Hello World");\n```';

    await page.locator(".cm-content").fill(testContent);

    // Preview should update in real-time
    await expect(page.locator(".prose h1")).toHaveText("Test Header");
    await expect(page.locator(".prose strong")).toHaveText("bold");
    await expect(page.locator(".prose em")).toHaveText("italic");
    await expect(page.locator(".prose ul li").first()).toHaveText(
      "List item 1",
    );
    await expect(page.locator(".prose code")).toHaveText(
      'console.log("Hello World");',
    );

    // Save the note
    await page.click('button:has-text("Save")');

    // Should show save success feedback
    await expect(page.locator("text=Saved")).toBeVisible();

    // Navigate back to dashboard
    await page.click("text=← Back to Dashboard");
    await expect(page).toHaveURL("/dashboard");

    // Open note again to verify content was saved
    await noteCard.locator('[data-testid="edit-note-btn"]').click();

    // Content should be preserved
    await expect(page.locator(".cm-content")).toContainText("# Test Header");
    await expect(page.locator(".prose h1")).toHaveText("Test Header");
  });

  test("should delete a note", async ({ page }) => {
    // Create a note first by opening the New Note dialog
    const noteTitle = `Delete Test ${Date.now()}`;
    await page.waitForSelector('button:has-text("New Note")', {
      state: "visible",
    });
    await page.click('button:has-text("New Note")');
    await page.waitForSelector('input[name="title"]', { state: "visible" });
    await page.fill('input[name="title"]', noteTitle);
    await page.click('button[type="submit"]:has-text("Create")');
    await expect(page.locator('[role="dialog"]')).not.toBeVisible();

    // Find the note card and click delete button
    const noteCard = page
      .locator('[data-testid="note-card"]')
      .filter({ hasText: noteTitle });
    await noteCard.locator('[data-testid="delete-note-btn"]').click();

    // Confirmation dialog should appear
    await expect(page.locator("text=Delete Note")).toBeVisible();
    await expect(
      page.locator("text=Are you sure you want to delete this note?"),
    ).toBeVisible();

    // Confirm deletion
    await page.click('button:has-text("Delete")');

    // Note should be removed from dashboard
    await expect(page.locator('[role="dialog"]')).not.toBeVisible();
    await expect(page.locator(`text=${noteTitle}`)).not.toBeVisible();
  });

  test("should create note inside a folder", async ({ page }) => {
    // Create a folder first by opening the New Folder dialog
    const folderName = `Note Folder ${Date.now()}`;
    await page.waitForSelector('button:has-text("New Folder")', {
      state: "visible",
    });
    await page.click('button:has-text("New Folder")');
    await page.waitForSelector('input[name="name"]', { state: "visible" });
    await page.fill('input[name="name"]', folderName);
    await page.click('button[type="submit"]:has-text("Create")');
    await expect(page.locator('[role="dialog"]')).not.toBeVisible();

    // Navigate into the folder
    await page.click(`text=${folderName}`);

    // Create a note in this folder
    await page.click('button:has-text("New Note")');
    const noteTitle = `Folder Note ${Date.now()}`;
    await page.fill('input[name="title"]', noteTitle);
    await page.click('button[type="submit"]:has-text("Create")');

    // Note should appear in the folder
    await expect(page.locator(`text=${noteTitle}`)).toBeVisible();

    // Go back to root and check folder shows note count
    await page.click("text=Root");
    const folderCard = page
      .locator('[data-testid="folder-card"]')
      .filter({ hasText: folderName });
    await expect(folderCard.locator("text=1 note")).toBeVisible();
  });

  test("should show unsaved changes warning", async ({ page }) => {
    // Create a note first by opening the New Note dialog
    const noteTitle = `Unsaved Test ${Date.now()}`;
    await page.waitForSelector('button:has-text("New Note")', {
      state: "visible",
    });
    await page.click('button:has-text("New Note")');
    await page.waitForSelector('input[name="title"]', { state: "visible" });
    await page.fill('input[name="title"]', noteTitle);
    await page.click('button[type="submit"]:has-text("Create")');
    await expect(page.locator('[role="dialog"]')).not.toBeVisible();

    // Open note editor
    const noteCard = page
      .locator('[data-testid="note-card"]')
      .filter({ hasText: noteTitle });
    await noteCard.locator('[data-testid="edit-note-btn"]').click();

    // Add content without saving
    await page.locator(".cm-content").fill("# Unsaved Content");

    // Should show unsaved indicator
    await expect(page.locator("text=Unsaved changes")).toBeVisible();

    // Try to navigate away - should show warning
    page.on("dialog", (dialog) => {
      expect(dialog.message()).toContain("unsaved changes");
      dialog.accept();
    });

    await page.click("text=← Back to Dashboard");
  });

  test("should handle auto-save functionality", async ({ page }) => {
    // Create a note first by opening the New Note dialog
    const noteTitle = `AutoSave Test ${Date.now()}`;
    await page.waitForSelector('button:has-text("New Note")', {
      state: "visible",
    });
    await page.click('button:has-text("New Note")');
    await page.waitForSelector('input[name="title"]', { state: "visible" });
    await page.fill('input[name="title"]', noteTitle);
    await page.click('button[type="submit"]:has-text("Create")');
    await expect(page.locator('[role="dialog"]')).not.toBeVisible();

    // Open note editor
    const noteCard = page
      .locator('[data-testid="note-card"]')
      .filter({ hasText: noteTitle });
    await noteCard.locator('[data-testid="edit-note-btn"]').click();

    // Add content
    await page.locator(".cm-content").fill("# Auto-saved content");

    // Wait for auto-save indicator (if implemented)
    // This test assumes auto-save is implemented with visual feedback
    await page.waitForTimeout(3000); // Wait for potential auto-save

    // Navigate away and back to check if content persists
    await page.click("text=← Back to Dashboard");
    await noteCard.locator('[data-testid="edit-note-btn"]').click();

    // Content should be preserved
    await expect(page.locator(".cm-content")).toContainText(
      "# Auto-saved content",
    );
  });
});
