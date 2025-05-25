# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.2.1-alpha.1] - 2025-05-25

### Added
- **Enhanced Folder Management (Completes `Task-NT-001.8`):**
  - Implemented folder rename functionality with modal dialog in [`/dashboard`](app/dashboard/page.tsx:152).
  - Added edit button to folder cards with rename dialog and validation.
- **Note Editor Implementation (Implements `Task-NT-002.7`, `Task-NT-002.9`, `Task-NT-002.10`):**
  - Created dedicated note editor page at [`/notes/[noteId]`](app/notes/[noteId]/page.tsx:15) with CodeMirror 6 integration.
  - Implemented real-time Markdown editor with syntax highlighting using `@uiw/react-codemirror` and `@codemirror/lang-markdown`.
  - Added split-view functionality with live Markdown preview using `react-markdown`, `remark-gfm`, `rehype-sanitize`, and `rehype-highlight`.
  - Implemented auto-save detection with unsaved changes warnings and browser unload protection.
  - Added manual save functionality with visual feedback for save states.
  - Enhanced [`/dashboard`](app/dashboard/page.tsx:361) with functional edit buttons linking to note editor.
- **Markdown Preview Enhancement (Implements `US-NT-003`):**
  - Integrated comprehensive Markdown rendering with GitHub Flavored Markdown support.
  - Added syntax highlighting for code blocks using `rehype-highlight`.
  - Implemented sanitized HTML output for security using `rehype-sanitize`.
  - Enhanced CSS styling for prose content with proper typography and spacing.

### Fixed
- **Environment Configuration Issue:**
  - Resolved login 500 error by adding missing `REFRESH_TOKEN_SECRET` environment variable to [`.env`](.env:10).
  - Fixed "Internal server configuration error" in [`/api/auth/login`](app/api/auth/login/route.ts:36) endpoint.

### Technical Improvements
- Added comprehensive CSS styling for Markdown preview with proper typography, code highlighting, and table formatting.
- Enhanced error handling and loading states in note editor.
- Implemented proper TypeScript types for CodeMirror and Markdown components.
- Added responsive design for note editor with mobile-friendly interface.

### Dependencies
- Added `@uiw/react-codemirror` for advanced code editing capabilities.
- Added `@codemirror/lang-markdown` for Markdown syntax highlighting in editor.
- Added `react-markdown` ecosystem (`remark-gfm`, `rehype-sanitize`, `rehype-highlight`) for enhanced Markdown rendering.

## [0.1.0-alpha.1] - 2025-05-23

### Added
- **Core Infrastructure & Project Setup (Implements `MVP-EPIC-01` / `US-SETUP-001`):**
  - Initialized Git repository and Next.js project (App Router, TypeScript, Tailwind CSS). (`Task-SETUP-001.1`, `Task-SETUP-001.2`)
  - Created `Dockerfile` and `docker-compose.yml` for Next.js app and PostgreSQL (with pgvector). (`Task-SETUP-001.3`, `Task-SETUP-001.4`)
  - Configured ESLint and Prettier with explicit configuration files (`eslint.config.js`, `.prettierrc.json`) and necessary dependencies. (`Task-SETUP-001.5`)
  - Set up Prisma client and initial schema, connecting to PostgreSQL. (`Task-SETUP-001.6`)
  - Implemented `/api/health` API route and `/health` frontend page. (`Task-SETUP-001.7`, `Task-SETUP-001.8`)
  - Ensured `docker-compose up` brings services online (verified by health checks in `docker-compose.yml`). (`Task-SETUP-001.9`)
  - Documented initial project setup and local running instructions in `README.md`. (`Task-SETUP-001.10`)
- User registration API endpoint (`/api/auth/register`) with input validation (email format, password strength) and password hashing using Argon2id. (Implements `Task-UM-001.2`, `Task-UM-001.3`, `Task-UM-001.4`, `Task-UM-001.5`, `Task-UM-001.6`)
- Registration page UI (`/register`) with email, password, and confirm password fields. (Implements `Task-UM-001.7`)
- Client-side validation for the registration form using `react-hook-form` and `zod`. (Implements `Task-UM-001.8`)
- API call from registration form to the backend endpoint, with success and error handling. (Implements `Task-UM-001.9`, `Task-UM-001.10`)
- Unit tests for the `/api/auth/register` endpoint, covering validation, hashing, and conflict scenarios. (Implements `Task-UM-001.11`)
- Unit tests for the frontend registration form (`/register`), covering input validation, form submission, and API interaction/error handling. (Implements `Task-UM-001.12`)
- Integration tests for the `/api/auth/register` API route using `supertest` with mocked database and hashing. (Implements `Task-UM-001.13`)
- Setup Playwright for E2E testing, including configuration and scripts.
- E2E test for the full user registration flow, covering successful registration, existing user conflict, and form validation. (Implements `Task-UM-001.14`)
- Documented the `/api/auth/register` API endpoint in `README.md`. (Implements `Task-UM-001.15`)
- User login API endpoint (`/api/auth/login`) with input validation, password verification (Argon2id), and JWT (access and refresh token) generation. Refresh token set as HttpOnly cookie. (Implements `Task-UM-002.1`, `Task-UM-002.2`, `Task-UM-002.3`, `Task-UM-002.4`, `Task-UM-002.5`)
- Login page UI (`/login`) with email and password fields. (Implements `Task-UM-002.6`)
- Client-side validation for the login form using `react-hook-form` and `zod`. (Implements `Task-UM-002.7`)
- API call from login form to the backend endpoint, with success (redirect to `/dashboard`) and error handling. (Implements `Task-UM-002.8`, `Task-UM-002.9`, `Task-UM-002.10`, `Task-UM-002.11`)
- Unit tests for the `/api/auth/login` endpoint. (Implements `Task-UM-002.12`)
- Integration tests for the `/api/auth/login` API route. (Implements `Task-UM-002.13`)
- E2E test for the full user login flow, including success and failure scenarios. (Implements `Task-UM-002.14`)
- Documented the `/api/auth/login` API endpoint in `README.md`. (Implements `Task-UM-002.15`)
- **Session Management & Token Refresh (Implements `US-UM-003`):**
  - JWT authentication middleware/helper for protected API routes in [`lib/auth/serverAuth.ts`](lib/auth/serverAuth.ts:14). (Implements `Task-UM-003.1`)
  - [`/api/auth/refresh-token`](app/api/auth/refresh-token/route.ts:8) API route using refresh tokens to issue new access tokens. (Implements `Task-UM-003.2`)
  - Enhanced [`apiClient`](lib/apiClient.ts:69) with logic to attach JWT to outgoing API requests and automatic token refresh mechanism. (Implements `Task-UM-003.3`, `Task-UM-003.4`)
  - Session expiry and token refresh failure handling with automatic logout in [`AuthContext`](contexts/AuthContext.tsx:86). (Implements `Task-UM-003.5`)
  - Unit tests for refresh token API logic and token refresh flow. (Implements `Task-UM-003.6`, `Task-UM-003.7`)
- **User Logout Functionality (Implements `US-UM-005`):**
  - [`/api/auth/logout`](app/api/auth/logout/route.ts:8) API route for server-side refresh token clearing. (Implements `Task-UM-005.1`)
  - Enhanced logout functionality in [`AuthContext`](contexts/AuthContext.tsx:71) with logout button/action, client-side token clearing, and redirect to login page. (Implements `Task-UM-005.2`, `Task-UM-005.3`, `Task-UM-005.4`)
  - Basic [`/dashboard`](app/dashboard/page.tsx:12) page with logout functionality and protected route behavior. (Implements `Task-UM-005.5`)
- **Additional Testing & Infrastructure:**
  - Unit tests for [`/api/auth/refresh-token`](app/api/auth/refresh-token/route.ts:8) and [`/api/auth/logout`](app/api/auth/logout/route.ts:8) endpoints.
  - E2E tests for session management and logout flow in [`e2e/auth/session.spec.ts`](e2e/auth/session.spec.ts:4).
  - Enhanced test infrastructure with improved mocking for authentication flows.

### Fixed
- Resolved Next.js build conflict between Turbopack/Babel and `next/font` when a custom `babel.config.js` is present. This involved:
  - Removing the `--turbopack` flag from the `dev` script in `package.json`.
  - Creating `babel.jest.config.js` for Jest's Babel transformations.
  - Updating `jest.config.js` to use `babel.jest.config.js`.
  - Removing the original `babel.config.js` to allow Next.js to default to SWC, resolving `next/font` issues.
- Corrected Tailwind CSS setup to resolve "unknown utility class" errors (e.g., `border-border`). This involved:
  - Creating a `tailwind.config.ts` file with a Shadcn UI compatible configuration.
  - Updating `app/globals.css` with the necessary Shadcn UI CSS variables for theming and removing problematic base styles.

### Changed
- Replaced the previously empty `app/page.tsx` with a new, modern, and responsive landing page.
  - The new landing page utilizes Shadcn UI components (`Card`, `Button`, etc.) and features improved styling with a gradient background, enhanced typography, and icons.
  - Content for the landing page is inspired by `README.md`.

## [0.2.0-alpha.1] - 2025-05-24

### Added
- **Core Note-Taking & Organization (Implements `MVP-EPIC-03`):**
  - **Folder Management API (Implements `US-NT-001`):**
    - [`/api/folders`](app/api/folders/route.ts:8) POST route for creating folders with validation and duplicate checking. (Implements `Task-NT-001.2`)
    - [`/api/folders`](app/api/folders/route.ts:8) GET route for listing folders by parent with hierarchical support. (Implements `Task-NT-001.5`)
    - [`/api/folders/[folderId]`](app/api/folders/[folderId]/route.ts:8) PUT route for renaming and moving folders with cyclical structure prevention. (Implements `Task-NT-001.3`)
    - [`/api/folders/[folderId]`](app/api/folders/[folderId]/route.ts:8) DELETE route for deleting empty folders (MVP restriction). (Implements `Task-NT-001.4`)
    - Enhanced [`verifyJWT`](lib/auth/serverAuth.ts:58) function in serverAuth for standalone JWT verification in API routes. (Supporting infrastructure)
  - **Notes Management API (Implements `US-NT-002`):**
    - [`/api/notes`](app/api/notes/route.ts:8) POST route for creating notes with folder validation and duplicate title checking. (Implements `Task-NT-002.2`)
    - [`/api/notes`](app/api/notes/route.ts:8) GET route for listing notes by folder with filtering support. (Implements `Task-NT-002.6`)
    - [`/api/notes/[noteId]`](app/api/notes/[noteId]/route.ts:8) GET route for fetching individual notes. (Implements `Task-NT-002.3`)
    - [`/api/notes/[noteId]`](app/api/notes/[noteId]/route.ts:8) PUT route for updating note title, content, and folder location. (Implements `Task-NT-002.4`)
    - [`/api/notes/[noteId]`](app/api/notes/[noteId]/route.ts:8) DELETE route for deleting notes. (Implements `Task-NT-002.5`)
  - **Dashboard UI (Implements folder and note management frontend):**
    - Complete [`/dashboard`](app/dashboard/page.tsx:12) page with folder tree navigation and note listing. (Implements `Task-NT-001.6`, `Task-NT-002.12`)
    - Modal-based "Create Folder" and "Create Note" functionality with form validation. (Implements `Task-NT-001.7`, `Task-NT-002.8`)
    - Delete functionality for both folders and notes with confirmation dialogs. (Implements `Task-NT-001.9`, `Task-NT-002.11`)
    - Basic folder navigation with breadcrumb support (root level). (Implements `Task-NT-001.10`)
    - Error handling and loading states for all operations.
    - Responsive grid layout showing folders and notes with metadata (counts, dates).
- **Enhanced Project Scripts:**
  - Added Prisma management scripts to [`package.json`](package.json:12): `prisma:generate`, `prisma:migrate`, `prisma:migrate:dev`, `prisma:studio`, `prisma:reset`.
- **Database Schema Implementation:**
  - Complete `folders` and `notes` table schemas with proper relationships and constraints. (Implements `Task-NT-001.1`, `Task-NT-002.1`)
  - Support for hierarchical folder structure with parent-child relationships.
  - Note-to-folder associations with optional folder placement (root level notes).

### Technical Improvements
- All API routes include comprehensive input validation using Zod schemas.
- Proper error handling with descriptive messages and appropriate HTTP status codes.
- Authorization checks on all protected endpoints using JWT verification.
- Prevention of cyclical folder structures in move operations.
- Duplicate name checking within the same parent folder for both folders and notes.
- Integration with existing authentication system and protected route middleware.

### Notes
- Note editing functionality (CodeMirror 6 integration) is planned for the next iteration.
- Advanced features like real-time collaboration, version history, and AI integration are scheduled for post-MVP.
- Current folder navigation is basic; full breadcrumb support for nested folders will be enhanced in future versions.