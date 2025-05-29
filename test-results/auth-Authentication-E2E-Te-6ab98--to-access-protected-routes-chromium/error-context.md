# Test info

- Name: Authentication E2E Tests >> Protected Routes >> should allow authenticated users to access protected routes
- Location: /Users/ncls/work/perso/notes/e2e/auth.spec.ts:222:5

# Error details

```
Error: Timed out 5000ms waiting for expect(locator).toHaveURL(expected)

Locator: locator(':root')
Expected string: "http://localhost:3000/dashboard"
Received string: "http://localhost:3000/login"
Call log:
  - expect.toHaveURL with timeout 5000ms
  - waiting for locator(':root')
    9 × locator resolved to <html lang="en" class="light">…</html>
      - unexpected value "http://localhost:3000/login"

    at /Users/ncls/work/perso/notes/e2e/auth.spec.ts:229:26
```

# Page snapshot

```yaml
- img
- heading "Welcome Back" [level=3]
- paragraph: Sign in to your Noteworthy account
- text: Invalid credentials Email address
- textbox "Email address": existing@example.com
- text: Password
- textbox "Password": ExistingPassword123!
- button
- button "Sign In"
- text: Don't have an account?
- link "Create Account":
  - /url: /register
- paragraph: Secure, private, and always under your control
- alert
- button "Open Next.js Dev Tools":
  - img
```

# Test source

```ts
  129 |       await page.click('[data-testid="login-link"]');
  130 |
  131 |       await expect(page).toHaveURL('/login');
  132 |     });
  133 |   });
  134 |
  135 |   test.describe('User Login', () => {
  136 |     test('should login with valid credentials', async ({ page }) => {
  137 |       // First register a user to ensure they exist
  138 |       const loginTestEmail = `login-test-${Date.now()}@example.com`;
  139 |       const loginTestPassword = 'LoginTest123!';
  140 |
  141 |       await page.goto('/register');
  142 |       await page.fill('[data-testid="email-input"]', loginTestEmail);
  143 |       await page.fill('[data-testid="password-input"]', loginTestPassword);
  144 |       await page.fill('[data-testid="confirm-password-input"]', loginTestPassword);
  145 |       await page.click('[data-testid="register-button"]');
  146 |
  147 |       // Should redirect to login page
  148 |       await expect(page).toHaveURL(/\/login/);
  149 |
  150 |       // Now login with the registered credentials
  151 |       await page.fill('[data-testid="email-input"]', loginTestEmail);
  152 |       await page.fill('[data-testid="password-input"]', loginTestPassword);
  153 |
  154 |       await page.click('[data-testid="login-button"]');
  155 |
  156 |       // Should redirect to dashboard
  157 |       await expect(page).toHaveURL('/dashboard');
  158 |
  159 |       // Should show user is logged in
  160 |       await expect(page.locator('[data-testid="user-menu"]')).toBeVisible();
  161 |     });
  162 |
  163 |     test('should show error for invalid credentials', async ({ page }) => {
  164 |       await page.goto('/login');
  165 |
  166 |       await page.fill('[data-testid="email-input"]', 'nonexistent@example.com');
  167 |       await page.fill('[data-testid="password-input"]', 'wrongpassword');
  168 |
  169 |       await page.click('[data-testid="login-button"]');
  170 |
  171 |       await expect(page.locator('[data-testid="error-message"]')).toContainText('Invalid');
  172 |       await expect(page).toHaveURL(/\/login/);
  173 |     });
  174 |
  175 |     test('should show validation errors for empty fields', async ({ page }) => {
  176 |       await page.goto('/login');
  177 |
  178 |       await page.click('[data-testid="login-button"]');
  179 |
  180 |       await expect(page.locator('[data-testid="email-error"]')).toBeVisible();
  181 |       await expect(page.locator('[data-testid="password-error"]')).toBeVisible();
  182 |     });
  183 |
  184 |     test('should have working navigation to register page', async ({ page }) => {
  185 |       await page.goto('/login');
  186 |
  187 |       await page.click('[data-testid="register-link"]');
  188 |
  189 |       await expect(page).toHaveURL('/register');
  190 |     });
  191 |
  192 |     test('should show loading state during login', async ({ page }) => {
  193 |       await page.goto('/login');
  194 |
  195 |       await page.fill('[data-testid="email-input"]', existingUser.email);
  196 |       await page.fill('[data-testid="password-input"]', existingUser.password);
  197 |
  198 |       // Start login process
  199 |       const loginPromise = page.click('[data-testid="login-button"]');
  200 |
  201 |       // Check for loading state (button disabled or loading indicator)
  202 |       await expect(page.locator('[data-testid="login-button"]')).toBeDisabled();
  203 |
  204 |       await loginPromise;
  205 |     });
  206 |   });
  207 |
  208 |   test.describe('Protected Routes', () => {
  209 |     test('should redirect unauthenticated users to login', async ({ page }) => {
  210 |       // Try to access protected route without authentication
  211 |       await page.goto('/dashboard');
  212 |
  213 |       await expect(page).toHaveURL(/\/login/);
  214 |     });
  215 |
  216 |     test('should redirect unauthenticated users from notes page', async ({ page }) => {
  217 |       await page.goto('/dashboard/notes/some-note-id');
  218 |
  219 |       await expect(page).toHaveURL(/\/login/);
  220 |     });
  221 |
  222 |     test('should allow authenticated users to access protected routes', async ({ page }) => {
  223 |       // First login
  224 |       await page.goto('/login');
  225 |       await page.fill('[data-testid="email-input"]', existingUser.email);
  226 |       await page.fill('[data-testid="password-input"]', existingUser.password);
  227 |       await page.click('[data-testid="login-button"]');
  228 |
> 229 |       await expect(page).toHaveURL('/dashboard');
      |                          ^ Error: Timed out 5000ms waiting for expect(locator).toHaveURL(expected)
  230 |
  231 |       // Now try to access other protected routes
  232 |       await page.goto('/dashboard/notes');
  233 |       await expect(page).toHaveURL('/dashboard/notes');
  234 |     });
  235 |   });
  236 |
  237 |   test.describe('Session Management', () => {
  238 |     test('should maintain session on page refresh', async ({ page }) => {
  239 |       // Login first
  240 |       await page.goto('/login');
  241 |       await page.fill('[data-testid="email-input"]', existingUser.email);
  242 |       await page.fill('[data-testid="password-input"]', existingUser.password);
  243 |       await page.click('[data-testid="login-button"]');
  244 |
  245 |       await expect(page).toHaveURL('/dashboard');
  246 |
  247 |       // Refresh the page
  248 |       await page.reload();
  249 |
  250 |       // Should still be on dashboard (session maintained)
  251 |       await expect(page).toHaveURL('/dashboard');
  252 |       await expect(page.locator('[data-testid="user-menu"]')).toBeVisible();
  253 |     });
  254 |
  255 |     test('should handle token expiry gracefully', async ({ page }) => {
  256 |       // This test would need to mock token expiry
  257 |       // For now, we can test the logout functionality
  258 |       await page.goto('/login');
  259 |       await page.fill('[data-testid="email-input"]', existingUser.email);
  260 |       await page.fill('[data-testid="password-input"]', existingUser.password);
  261 |       await page.click('[data-testid="login-button"]');
  262 |
  263 |       await expect(page).toHaveURL('/dashboard');
  264 |
  265 |       // Clear cookies to simulate token expiry
  266 |       await page.context().clearCookies();
  267 |
  268 |       // Try to access protected route
  269 |       await page.goto('/dashboard/notes');
  270 |
  271 |       // Should redirect to login
  272 |       await expect(page).toHaveURL(/\/login/);
  273 |     });
  274 |   });
  275 |
  276 |   test.describe('User Logout', () => {
  277 |     test('should logout user successfully', async ({ page }) => {
  278 |       // Login first
  279 |       await page.goto('/login');
  280 |       await page.fill('[data-testid="email-input"]', existingUser.email);
  281 |       await page.fill('[data-testid="password-input"]', existingUser.password);
  282 |       await page.click('[data-testid="login-button"]');
  283 |
  284 |       await expect(page).toHaveURL('/dashboard');
  285 |
  286 |       // Logout
  287 |       await page.click('[data-testid="user-menu"]');
  288 |       await page.click('[data-testid="logout-button"]');
  289 |
  290 |       // Should redirect to login
  291 |       await expect(page).toHaveURL(/\/login/);
  292 |
  293 |       // Try to access protected route after logout
  294 |       await page.goto('/dashboard');
  295 |       await expect(page).toHaveURL(/\/login/);
  296 |     });
  297 |
  298 |     test('should clear session data on logout', async ({ page }) => {
  299 |       // Login first
  300 |       await page.goto('/login');
  301 |       await page.fill('[data-testid="email-input"]', existingUser.email);
  302 |       await page.fill('[data-testid="password-input"]', existingUser.password);
  303 |       await page.click('[data-testid="login-button"]');
  304 |
  305 |       // Logout
  306 |       await page.click('[data-testid="user-menu"]');
  307 |       await page.click('[data-testid="logout-button"]');
  308 |
  309 |       // Check that session cookies are cleared
  310 |       const cookies = await page.context().cookies();
  311 |       const authCookies = cookies.filter(
  312 |         (cookie) =>
  313 |           cookie.name.includes('auth') ||
  314 |           cookie.name.includes('token') ||
  315 |           cookie.name.includes('session')
  316 |       );
  317 |
  318 |       expect(authCookies.filter((cookie) => cookie.value)).toHaveLength(0);
  319 |     });
  320 |   });
  321 |
  322 |   test.describe('User Flow Integration', () => {
  323 |     test('should complete full user journey: register -> login -> access dashboard -> logout', async ({
  324 |       page,
  325 |     }) => {
  326 |       const uniqueEmail = `test-${Date.now()}@example.com`;
  327 |
  328 |       // 1. Register
  329 |       await page.goto('/register');
```