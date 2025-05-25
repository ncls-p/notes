## Project Backlog: Self-Hosted AI-Powered Note-Taking App

**Goal:** Achieve a functional, self-hosted note-taking application (MVP) as quickly as possible, focusing on core features. Subsequent iterations will add advanced capabilities.

**Key:**

- **EPIC:** A large body of work/major feature area.
- **US:** User Story (As a [user type], I want [action] so that [benefit/goal]).
- **Task:** A specific development or technical task.
  - **FE:** Frontend (Client-side React components and logic)
  - **API:** API Route and Server-Side Logic (within Next.js app)
  - **DB:** Database
  - **Test:** Testing
  - **Docs:** Documentation
  - **Infra:** Infrastructure / DevOps

---

## MVP: Core Note-Taking Application (Target: ASAP)

This section outlines the essential features required for the initial, usable version of the application.

### MVP-EPIC-01: Project Setup & Core Infrastructure (Foundation)

- **US-SETUP-001:** As a Developer, I want a basic project structure for a unified Next.js application (frontend and backend) so that development can begin in an organized manner.
  - **Task-SETUP-001.1 (Infra):** Initialize Git repository with appropriate `.gitignore` for a Next.js project. **[DONE]**
  - **Task-SETUP-001.2 (FE/API):** Setup Next.js project (App Router, TypeScript, Tailwind CSS). **[DONE]**
  - **Task-SETUP-001.3 (Infra):** Create initial `Dockerfile` for the Next.js application. **[DONE]**
  - **Task-SETUP-001.4 (DB):** Define initial `docker-compose.yml` with `nextjs-app` and `postgres` services. (pgvector can be included now, but not actively used by MVP features). **[DONE]**
  - **Task-SETUP-001.5 (Infra):** Configure basic linting, formatting (ESLint, Prettier) for the Next.js project. **[DONE]**
  - **Task-SETUP-001.6 (API, DB):** Setup Prisma client and initial schema connection to PostgreSQL from Next.js app. **[DONE]**
  - **Task-SETUP-001.7 (API):** Implement basic health check API route in Next.js app (e.g., `/api/health`). **[DONE]**
  - **Task-SETUP-001.8 (FE):** Implement basic health check page/route in Next.js app (e.g., `/health`) that calls the `/api/health` route. **[DONE]**
  - **Task-SETUP-001.9 (Test):** Ensure basic `docker-compose up` brings all services online. **[DONE]**
  - **Task-SETUP-001.10 (Docs):** Document initial project setup and how to run locally. **[DONE]**

---

### MVP-EPIC-02: User Management & Authentication (Core)

- **US-UM-001 (FR-UM-001):** As a new User, I want to register for an account using my email and a password so that I can access the application.
  - **Task-UM-001.1 (DB):** Design and migrate `users` table schema (id, email, password_hash, timestamps). **[DONE]**
  - **Task-UM-001.2 (API):** Implement `/api/auth/register` API route. **[DONE]**
  - **Task-UM-001.3 (API):** Add input validation (email format, password strength policy) in the API route. **[DONE]**
  - **Task-UM-001.4 (API):** Implement logic to check for existing email in the API route. **[DONE]**
  - **Task-UM-001.5 (API):** Implement password hashing using Argon2id in the API route. **[DONE]**
  - **Task-UM-001.6 (API, DB):** Store new user in the database via Prisma from the API route. **[DONE]**
  - **Task-UM-001.7 (FE):** Create Registration page/form UI (email, password, confirm password). **[DONE]**
  - **Task-UM-001.8 (FE):** Implement client-side validation for registration form. **[DONE]**
  - **Task-UM-001.9 (FE):** Implement API call to `/api/auth/register`. **[DONE]**
  - **Task-UM-001.10 (FE):** Handle success (e.g., redirect to login) and error responses. **[DONE]**
  - **Task-UM-001.11 (Test):** Unit tests for API registration logic (validation, hashing, conflicts). **[DONE]**
  - **Task-UM-001.12 (Test):** Unit tests for FE registration form (validation, submission). **[DONE]**
  - **Task-UM-001.13 (Test):** Integration test for `/api/auth/register` API route. **[DONE]**
  - **Task-UM-001.14 (Test):** E2E test for the full registration flow. **[DONE]**
  - **Task-UM-001.15 (Docs):** Document `/api/auth/register` API route. **[DONE]**

- **US-UM-002 (FR-UM-002):** As a registered User, I want to log in with my email and password so that I can access my notes and application features.
  - **Task-UM-002.1 (API):** Implement `/api/auth/login` API route. **[DONE]**
  - **Task-UM-002.2 (API):** Add input validation for login credentials in the API route. **[DONE]**
  - **Task-UM-002.3 (API, DB):** Retrieve user by email and verify password hash (Argon2id) in the API route. **[DONE]**
  - **Task-UM-002.4 (API):** Generate JWT (access token, refresh token) upon successful login in the API route. **[DONE]**
  - **Task-UM-002.5 (API):** Configure JWT library (e.g., `jsonwebtoken` or `jose`) with appropriate secrets and expiry times within Next.js API logic. **[DONE]**
  - **Task-UM-002.6 (FE):** Create Login page/form UI. **[DONE]**
  - **Task-UM-002.7 (FE):** Implement client-side validation for login form. **[DONE]**
  - **Task-UM-002.8 (FE):** Implement API call to `/api/auth/login`. **[DONE]**
  - **Task-UM-002.9 (FE):** Securely store JWTs (e.g., access token in memory, refresh token in HttpOnly cookie). **[DONE]**
  - **Task-UM-002.10 (FE):** Implement redirect to dashboard/notes upon successful login. **[DONE]**
  - **Task-UM-002.11 (FE):** Handle login errors (invalid credentials, etc.). **[DONE]**
  - **Task-UM-002.12 (Test):** Unit tests for API login logic. **[DONE]**
  - **Task-UM-002.13 (Test):** Integration test for `/api/auth/login` API route. **[DONE]**
  - **Task-UM-002.14 (Test):** E2E test for the login flow. **[DONE]**
  - **Task-UM-002.15 (Docs):** Document `/api/auth/login` API route. **[DONE]**

- **US-UM-003:** As an authenticated User, I want the application to maintain my session so that I don't have to log in repeatedly.
  - **Task-UM-003.1 (API):** Implement JWT authentication middleware/helper for protected API routes in Next.js. **[DONE]**
  - **Task-UM-003.2 (API):** Implement `/api/auth/refresh-token` API route using refresh tokens to issue new access tokens. **[DONE]**
  - **Task-UM-003.3 (FE):** Implement logic to attach JWT to outgoing API requests. **[DONE]**
  - **Task-UM-003.4 (FE):** Implement automatic token refresh mechanism using the refresh token. **[DONE]**
  - **Task-UM-003.5 (FE):** Handle session expiry and token refresh failures (e.g., redirect to login). **[DONE]**
  - **Task-UM-003.6 (Test):** Test protected API routes access with valid/invalid/expired tokens. **[DONE]**
  - **Task-UM-003.7 (Test):** Test token refresh flow. **[DONE]**

- **US-UM-005:** As an authenticated User, I want to be able to log out so that I can securely end my session.
  - **Task-UM-005.1 (API):** Implement `/api/auth/logout` API route (if using server-side session invalidation for refresh tokens, e.g. blocklisting - simpler client-side only logout for MVP). **[DONE]**
  - **Task-UM-005.2 (FE):** Implement logout button/action. **[DONE]**
  - **Task-UM-005.3 (FE):** Clear stored JWTs from client-side. **[DONE]**
  - **Task-UM-005.4 (FE):** Redirect to login page. **[DONE]**
  - **Task-UM-005.5 (Test):** E2E test for logout flow. **[DONE]**

---

### MVP-EPIC-03: Core Note-Taking & Organization

- **US-NT-001 (FR-NT-005):** As a User, I want to create, rename, and delete folders, including nested folders, so that I can organize my notes hierarchically.
  - **Task-NT-001.1 (DB):** Design and migrate `folders` table schema (id, name, parent_folder_id, owner_id, timestamps). **[DONE]**
  - **Task-NT-001.2 (API):** Implement `/api/folders` POST API route for creating folders. **[DONE]**
  - **Task-NT-001.3 (API):** Implement `/api/folders/{folderId}` PUT API route for renaming folders. **[DONE]**
  - **Task-NT-001.4 (API):** Implement `/api/folders/{folderId}` DELETE API route for deleting folders (MVP: disallow deleting non-empty folders). **[DONE]**
  - **Task-NT-001.5 (API):** Implement `/api/folders` GET API route to list folders (hierarchically or flat with parent IDs, for user). **[DONE]**
  - **Task-NT-001.6 (FE):** Develop Folder Tree/File Explorer UI component (basic version for MVP). **[DONE]**
  - **Task-NT-001.7 (FE):** Implement "Create Folder" functionality (modal or inline). **[DONE]**
  - **Task-NT-001.8 (FE):** Implement "Rename Folder" functionality. **[DONE]**
  - **Task-NT-001.9 (FE):** Implement "Delete Folder" functionality (with confirmation). **[DONE]**
  - **Task-NT-001.10 (FE):** Display nested folder structure. **[PARTIALLY DONE - basic display implemented, navigation works]**
  - **Task-NT-001.11 (Test):** Unit and Integration tests for folder CRUD API logic. **[IN PROGRESS]**
  - **Task-NT-001.12 (Test):** E2E tests for basic folder management.
  - **Task-NT-001.13 (Docs):** Document folder API routes. **[DONE - in README.md updates needed]**

- **US-NT-002 (FR-NT-001, FR-NT-002):** As a User, I want to create, view, edit, and delete notes within folders or at the root level, with content stored in Markdown, so that I can manage my textual information.
  - **Task-NT-002.1 (DB):** Design and migrate `notes` table schema (id, title, content_markdown, folder_id, owner_id, timestamps). (Defer `yjs_doc_state`, `public_share_token`, `is_public`, `current_version_id` for MVP). **[DONE]**
  - **Task-NT-002.2 (API):** Implement `/api/notes` POST API route for creating notes. **[DONE]**
  - **Task-NT-002.3 (API):** Implement `/api/notes/{noteId}` GET API route for fetching a note. **[DONE]**
  - **Task-NT-002.4 (API):** Implement `/api/notes/{noteId}` PUT API route for updating a note (title, content). **[DONE]**
  - **Task-NT-002.5 (API):** Implement `/api/notes/{noteId}` DELETE API route for deleting notes. **[DONE]**
  - **Task-NT-002.6 (API):** Implement GET API route to list notes within a folder or at root (e.g., `/api/folders/{folderId}/notes`, `/api/notes?folderId=null`). **[DONE]**
  - **Task-NT-002.7 (FE):** Develop Note Editor UI using CodeMirror 6 (basic setup for MVP). **[DONE]**
  - **Task-NT-002.8 (FE):** Implement "Create Note" functionality. **[DONE]**
  - **Task-NT-002.9 (FE):** Display note content in editor when a note is selected/opened. **[DONE]**
  - **Task-NT-002.10 (FE):** Implement saving mechanism for note content (manual save button for MVP, auto-save can be post-MVP). **[DONE]**
  - **Task-NT-002.11 (FE):** Implement "Delete Note" functionality (with confirmation). **[DONE]**
  - **Task-NT-002.12 (FE):** Integrate note list within the File Explorer UI. **[DONE]**
  - **Task-NT-002.13 (Test):** Unit and Integration tests for note CRUD API logic. **[TODO]**
  - **Task-NT-002.14 (Test):** E2E tests for note creation, viewing, editing, deletion. **[TODO]**
  - **Task-NT-002.15 (Docs):** Document note API routes. **[DONE - in README.md updates needed]**

- **US-NT-003 (FR-NT-003):** As a User, I want a real-time, side-by-side preview of my Markdown notes as I type so that I can see the rendered output immediately.
   - **Task-NT-003.1 (FE):** Integrate `react-markdown` (with `remark-gfm`, `rehype-sanitize`, `rehype-highlight`) for Markdown rendering. **[DONE]**
   - **Task-NT-003.2 (FE):** Implement a two-pane layout in the Note Editor (CodeMirror input, rendered preview). **[DONE]**
   - **Task-NT-003.3 (FE):** Update preview pane in real-time as content changes in CodeMirror. **[DONE]**
   - **Task-NT-003.4 (FE):** (Optional for MVP, Nice to have) Ensure synchronized scrolling between editor and preview panes. **[TODO - enhancement for future version]**
   - **Task-NT-003.5 (Test):** Test Markdown rendering for common elements (headers, lists, bold, italic, code blocks, links). **[TODO]**

---
## Post-MVP Enhancements (Future Iterations)

This section includes features and improvements planned for development after the core MVP is stable and functional.

### EPIC-02: User Management & Authentication (Enhancements)
  - **US-UM-004 (FR-UM-003):** As a User, I want to be able to recover my password if I forget it so that I can regain access to my account.
    - **Task-UM-004.1 (DB):** Design schema for password reset tokens (token, user_id, expires_at).
    - **Task-UM-004.2 (API):** Implement `/api/auth/recover-password` API route (takes email).
    - **Task-UM-004.3 (API):** Generate a secure, unique, time-limited password reset token.
    - **Task-UM-004.4 (API, DB):** Store token hash in DB, associated with the user.
    - **Task-UM-004.5 (API):** Implement email sending service integration.
    - **Task-UM-004.6 (FE):** Create "Forgot Password" page/form.
    - **Task-UM-004.7 (FE):** Implement API call to `/api/auth/recover-password`.
    - **Task-UM-004.8 (API):** Implement `/api/auth/reset-password` API route.
    - **Task-UM-004.9 (API):** Validate token.
    - **Task-UM-004.10 (API, DB):** Update user's password_hash.
    - **Task-UM-004.11 (FE):** Create "Reset Password" page/form.
    - **Task-UM-004.12 (FE):** Implement API call to `/api/auth/reset-password`.
    - **Task-UM-004.13 (Test):** Test password recovery.
    - **Task-UM-004.14 (Docs):** Document password recovery API.

  - **US-UM-006:** As an authenticated User, I want to view my profile information (e.g., email) so that I can confirm my identity.
    - **Task-UM-006.1 (API):** Implement `/api/users/me` API route.
    - **Task-UM-006.2 (FE):** Create a basic User Profile page.
    - **Task-UM-006.3 (FE):** Fetch and display user data.
    - **Task-UM-006.4 (Test):** Test `/api/users/me` API route.

---

### EPIC-03: Note-Taking & Organization (Enhancements)
  - **US-NT-004 (FR-NT-006):** As a User, I want to move notes between folders and move folders into other folders (or to root) so that I can reorganize my content.
    - **Task-NT-004.1 (API):** Update `/api/notes/{noteId}` PUT to allow changing `folder_id`.
    - **Task-NT-004.2 (API):** Update `/api/folders/{folderId}` PUT to allow changing `parent_folder_id`.
    - **Task-NT-004.3 (API):** Add validation to prevent cyclical folder structures.
    - **Task-NT-004.4 (FE):** Implement drag-and-drop or "Move to..." functionality.
    - **Task-NT-004.6 (FE):** Update UI upon successful move.
    - **Task-NT-004.7 (Test):** Test moving notes and folders.

  - **US-NT-005 (FR-NT-007):** As a User, I want to export individual notes to PDF format.
    - **Task-NT-005.1 (API):** Integrate Puppeteer for PDF generation.
    - **Task-NT-005.2 (API):** Implement `/api/notes/{noteId}/export/pdf` GET API route.
    - **Task-NT-005.3 (API):** Logic to render Markdown to HTML for PDF.
    - **Task-NT-005.4 (API):** Use Puppeteer to convert HTML to PDF.
    - **Task-NT-005.5 (API):** Ensure proper headers for PDF download.
    - **Task-NT-005.6 (Infra):** Ensure Puppeteer dependencies in Docker image.
    - **Task-NT-005.7 (FE):** Add "Export to PDF" button.
    - **Task-NT-005.8 (Test):** Test PDF export.
    - **Task-NT-005.9 (Docs):** Document PDF export API.

  - **US-NT-006 (FR-NT-008):** As a User, I want version history for my notes.
    - **Task-NT-006.1 (DB):** Design and migrate `note_versions` table. Add `current_version_id` to `notes` table.
    - **Task-NT-006.2 (API):** Modify note update logic to create `note_version`.
    - **Task-NT-006.3 (API):** Decide on versioning strategy (full snapshots vs. diffs).
    - **Task-NT-006.4 (API):** Implement `/api/notes/{noteId}/versions` GET API route.
    - **Task-NT-006.5 (API):** Implement `/api/notes/{noteId}/versions/{versionId}` GET API route.
    - **Task-NT-006.6 (API):** Implement `/api/notes/{noteId}/versions/{versionId}/revert` POST API route.
    - **Task-NT-006.7 (FE):** Add "Version History" option/panel.
    - **Task-NT-006.8 (FE):** Display list of versions.
    - **Task-NT-006.9 (FE):** Allow viewing content of a selected version.
    - **Task-NT-006.10 (FE):** Implement "Revert to this version".
    - **Task-NT-006.11 (Test):** Test versioning features.

---

### EPIC-04: Advanced Markdown Support (FR-NT-004)
  - **US-MD-001 (FR-NT-004):** As a User, I want support for tables in Markdown.
    - **Task-MD-001.1 (FE):** Ensure CodeMirror handles Markdown table syntax well.
    - **Task-MD-001.2 (FE):** Ensure `react-markdown` with `remark-gfm` correctly renders tables.
    - **Task-MD-001.3 (Test):** Test table creation and rendering.

  - **US-MD-002 (FR-NT-004):** As a User, I want to embed diagrams (e.g., Mermaid, PlantUML).
    - **Task-MD-002.1 (FE):** Integrate Mermaid.js library.
    - **Task-MD-002.2 (FE):** Create custom `react-markdown` component for `mermaid` code blocks.
    - **Task-MD-002.3 (FE):** Investigate/Implement PlantUML rendering.
    - **Task-MD-002.5 (Test):** Test Mermaid diagram rendering.
    - **Task-MD-002.6 (Test):** Test PlantUML diagram rendering.
    - **Task-MD-002.7 (Docs):** Document diagram usage.

  - **US-MD-003 (FR-NT-004):** As a User, I want syntax highlighting for code blocks.
    - **Task-MD-003.1 (FE):** Ensure `rehype-highlight` is integrated with `react-markdown`.
    - **Task-MD-003.2 (FE):** Ensure CodeMirror 6 is configured for syntax highlighting.
    - **Task-MD-003.3 (Test):** Test syntax highlighting.

  _(Note: Custom block plugins are a more advanced feature, potentially for a later iteration unless critical)_

---

### EPIC-05: Search & Retrieval (FR-SR)
  - **US-SR-001 (FR-SR-001, FR-SR-002):** As a User, I want keyword-based full-text search.
    - **Task-SR-001.1 (DB):** Configure PostgreSQL FTS.
    - **Task-SR-001.2 (API):** Implement `/api/search` GET API route.
    - **Task-SR-001.3 (API, DB):** Logic to use PostgreSQL FTS.
    - **Task-SR-001.4 (API):** Rank results.
    - **Task-SR-001.5 (FE):** Implement search bar UI.
    - **Task-SR-001.6 (FE):** Display search results.
    - **Task-SR-001.7 (FE):** Debounce search input.
    - **Task-SR-001.8 (Test):** Test FTS.
    - **Task-SR-001.9 (Docs):** Document search API.

  - **US-SR-002 (FR-SR-003, FR-AI-005 - Indexing Part):** As a System, I want to automatically chunk and create vector embeddings for notes for semantic search.
    - **Task-SR-002.1 (DB):** Design and migrate `note_chunks` table. Add `embedding` column to `notes` table.
    - **Task-SR-002.2 (DB):** Create HNSW/IVFFlat index on `note_chunks.embedding`.
    - **Task-SR-002.3 (API):** Integrate Langchain.js for text splitting.
    - **Task-SR-002.4 (API):** Implement logic to process note content for chunking.
    - **Task-SR-002.5 (API):** Implement logic to generate embeddings for chunks.
    - **Task-SR-002.6 (API, DB):** Store chunks and embeddings.
    - **Task-SR-002.7 (API):** Make this process asynchronous.
    - **Task-SR-002.8 (API):** Handle re-indexing on update.
    - **Task-SR-002.9 (Test):** Unit test chunking and embedding.
    - **Task-SR-002.10 (Test):** Test storage/retrieval of embeddings.

  - **US-SR-003 (FR-SR-003 - Retrieval Part):** As a User, I want semantic search.
    - **Task-SR-003.1 (API):** Extend `/api/search` or create `/api/search/semantic`.
    - **Task-SR-003.2 (API):** Retrieve user's embedding model config.
    - **Task-SR-003.3 (API):** Embed search query.
    - **Task-SR-003.4 (API, DB):** Perform k-NN similarity search.
    - **Task-SR-003.5 (API):** Aggregate results.
    - **Task-SR-003.6 (FE):** UI for semantic search mode.
    - **Task-SR-003.7 (FE):** Display semantic search results.
    - **Task-SR-003.8 (Test):** Test semantic search.

  - **US-SR-004 (FR-SR-004):** As a User, I want advanced semantic search refinements.
    - **Task-SR-004.1 (API):** Implement re-ranking.
    - **Task-SR-004.2 (API):** Implement query expansion/rewriting.
    - **Task-SR-004.3 (API):** Integrate into semantic search flow.
    - **Task-SR-004.4 (FE):** (Optional) UI to toggle refinements.
    - **Task-SR-004.5 (Test):** Evaluate impact of refinements.

---

### EPIC-06: Collaboration & Permissions (FR-CP)
  - **US-CP-001 (FR-CP-004):** As a System, I need a robust permission system.
    - **Task-CP-001.1 (DB):** Design and migrate `permissions` table.
    - **Task-CP-001.2 (DB):** Design and migrate `invitations` table.
    - **Task-CP-001.3 (API):** Integrate CASL (or similar).
    - **Task-CP-001.4 (API):** Implement permission checking middleware/helpers.
    - **Task-CP-001.5 (API):** Logic to determine permissions.
    - **Task-CP-001.6 (Test):** Test permission logic.

  - **US-CP-002 (FR-CP-001):** As a Note/Folder Owner, I want to mark content as "public".
    - **Task-CP-002.1 (DB):** Add `is_public`, `public_share_token` to `notes` and `folders`.
    - **Task-CP-002.2 (API):** API to toggle public status and manage token.
    - **Task-CP-002.3 (API, FE):** Implement public access pages/routes.
    - **Task-CP-002.4 (FE):** UI option to "Make Public".
    - **Task-CP-002.5 (FE):** Display shareable link.
    - **Task-CP-002.6 (FE):** Develop public view page.
    - **Task-CP-002.7 (Test):** Test public link functionality.

  - **US-CP-003 (FR-CP-002, FR-CP-003, FR-CP-005):** As a Note/Folder Owner, I want to invite other registered users to collaborate.
    - **Task-CP-003.1 (API):** Implement API to create an invitation.
    - **Task-CP-003.2 (API):** (Optional Email) Send email notification.
    - **Task-CP-003.3 (API):** API for invitee to list pending invitations.
    - **Task-CP-003.4 (API):** API to accept/decline invitation.
    - **Task-CP-003.5 (API):** API to list collaborators.
    - **Task-CP-003.6 (API):** API to revoke access.
    - **Task-CP-003.7 (FE):** Develop "Share" modal.
    - **Task-CP-003.8 (FE):** UI for pending invitations.
    - **Task-CP-003.9 (Test):** Test invitation flow.
    - **Task-CP-003.10 (Docs):** Document sharing/invitation API.

  - **US-CP-004 (FR-CP-006):** As a User with edit access, I want real-time collaborative editing.
    - **Task-CP-004.1 (API, Infra):** Setup WebSocket server with Yjs.
    - **Task-CP-004.2 (API):** Authenticate WebSocket connections.
    - **Task-CP-004.3 (API, DB):** Implement Yjs document persistence (add `yjs_doc_state` to `notes` table).
    - **Task-CP-004.4 (API):** Ensure Yjs documents respect permissions.
    - **Task-CP-004.5 (FE):** Integrate Yjs client-side with CodeMirror 6.
    - **Task-CP-004.6 (FE):** Connect to WebSocket server.
    - **Task-CP-004.7 (FE):** Implement presence indicators.
    - **Task-CP-004.8 (FE):** Handle connection/disconnection events.
    - **Task-CP-004.9 (Test):** Test real-time collaboration.
    - **Task-CP-004.10 (Docs):** Document WebSocket endpoint.

---

### EPIC-07: AI Capabilities & Integration (FR-AI)
  - **US-AI-001 (FR-AI-001, FR-AI-002, FR-AI-003):** As a User, I want to configure and manage connections to my preferred AI providers.
    - **Task-AI-001.1 (DB):** Design and migrate `user_ai_configs` table.
    - **Task-AI-001.2 (API):** Implement `/api/ai-configs` CRUD API.
    - **Task-AI-001.3 (API):** Implement API key encryption/decryption.
    - **Task-AI-001.4 (API):** Logic to test AI provider connection.
    - **Task-AI-001.5 (API):** Logic to list compatible models.
    - **Task-AI-001.6 (FE):** UI for managing AI configurations.
    - **Task-AI-001.7 (Test):** Test AI config API.
    - **Task-AI-001.8 (Docs):** Document AI configuration.

  - **US-AI-002 (FR-AI-004, FR-AI-005 - Chat Part):** As a User, I want to chat with my notes using my chosen AI.
    - **Task-AI-002.1 (API):** Implement `/api/ai/chat` API route.
    - **Task-AI-002.2 (API):** Integrate RAG pipeline.
    - **Task-AI-002.3 (API):** Construct prompts.
    - **Task-AI-002.4 (API):** Call user's configured LLM.
    - **Task-AI-002.5 (FE):** Develop AI Chat Interface UI.
    - **Task-AI-002.6 (FE):** Implement API call and display responses.
    - **Task-AI-002.7 (Test):** Test AI chat functionality.
    - **Task-AI-002.8 (Docs):** Document `/api/ai/chat` API.

  - **US-AI-003 (FR-AI-006, FR-AI-007, FR-AI-008):** As a User, I want to record and transcribe voice notes.
    - **Task-AI-003.1 (API):** Implement `/api/ai/transcribe-voice` API route.
    - **Task-AI-003.2 (API):** Call user's transcription API.
    - **Task-AI-003.3 (API, DB):** Save transcribed text as a new note.
    - **Task-AI-003.4 (API):** Trigger RAG indexing for new note.
    - **Task-AI-003.5 (FE):** Implement voice recording UI.
    - **Task-AI-003.6 (FE):** Implement audio upload and API call.
    - **Task-AI-003.7 (FE):** Display transcription result.
    - **Task-AI-003.8 (Test):** Test voice note feature.
    - **Task-AI-003.9 (Docs):** Document voice note API.

  - **US-AI-004 (FR-AI-009):** As a User, I want to optionally track my AI API usage.
    - **Task-AI-004.1 (DB):** Design and migrate `ai_usage_logs` table.
    - **Task-AI-004.2 (API):** Parse token usage from provider responses.
    - **Task-AI-004.3 (API, DB):** Store usage data.
    - **Task-AI-004.4 (API):** Implement `/api/ai-usage-logs` GET API.
    - **Task-AI-004.5 (FE):** Create UI to display AI usage.
    - **Task-AI-004.6 (Test):** Test AI usage logging.
    - **Task-AI-004.7 (Docs):** Document AI usage logging.

---

### EPIC-08: Data Resilience & Offline Mode (FR-DR)
  - **US-DR-001 (FR-DR-001):** As a User, I want offline mode for basic note-taking.
    - **Task-DR-001.1 (FE, Infra):** Implement Service Worker.
    - **Task-DR-001.2 (FE, DB Client-side):** Utilize IndexedDB.
    - **Task-DR-001.3 (FE):** Adapt Yjs for offline (if Yjs is used in MVP editor).
    - **Task-DR-001.4 (FE):** Implement synchronization logic.
    - **Task-DR-001.5 (FE):** Develop UI indicators for offline/sync status.
    - **Task-DR-001.6 (Test):** E2E tests for offline mode.
    - **Task-DR-001.7 (Docs):** Document offline mode.

  - **US-DR-002 (FR-DR-002):** As a User, I want to back up and restore my data.
    - **Task-DR-002.1 (Infra, DB):** Develop script for DB dump.
    - **Task-DR-002.2 (Infra, DB):** Develop script for DB restore.
    - **Task-DR-002.3 (API, FE):** (Stretch Goal) UI/API for backup.
    - **Task-DR-002.4 (Docs):** Document backup/restore procedures.

---

### EPIC-09: Webhooks (FR-DR-003)
  - **US-WH-001 (FR-DR-003):** As a Developer/Power User, I want to configure webhooks.
    - **Task-WH-001.1 (DB):** Design and migrate `webhooks` table.
    - **Task-WH-001.2 (API):** Implement `/api/webhooks` CRUD API.
    - **Task-WH-001.3 (API):** Implement webhook secret encryption.
    - **Task-WH-001.4 (API):** Implement internal event emitter.
    - **Task-WH-001.5 (API):** Implement webhook dispatch logic.
    - **Task-WH-001.6 (API):** Implement retry mechanism.
    - **Task-WH-001.7 (FE):** Create UI for managing webhooks.
    - **Task-WH-001.8 (Test):** Test webhook functionality.
    - **Task-WH-001.9 (Docs):** Document webhooks.

---

### EPIC-10: Advanced Security Hardening (NFR-SEC)
  - **US-SEC-001 (NFR-SEC-001, NFR-SEC-005):** As a System Admin/User, I want robust web security.
    - **Task-SEC-001.1 (Infra):** Guide reverse proxy setup for HTTPS.
    - **Task-SEC-001.2 (API):** Implement CSRF protection (if needed beyond JWT).
    - **Task-SEC-001.3 (API, FE):** Ensure consistent input validation/sanitization.
    - **Task-SEC-001.4 (API):** Implement rate limiting.
    - **Task-SEC-001.5 (Infra, API):** Implement HTTP Security Headers (CSP, HSTS, etc.).
    - **Task-SEC-001.6 (Docs):** Document security configurations.
    - **Task-SEC-001.7 (Test):** Incorporate security testing.

---

### EPIC-11: Observability & Monitoring (NFR-DEP-004)
  - **US-OBS-001 (NFR-DEP-004):** As a System Admin/Developer, I want robust logging, metrics, and tracing.
    - **Task-OBS-001.1 (API, Infra):** Implement structured logging (Pino).
    - **Task-OBS-001.2 (API, Infra):** Integrate Prometheus-compatible metrics.
    - **Task-OBS-001.3 (API, Infra):** Implement distributed tracing (OpenTelemetry).
    - **Task-OBS-001.4 (Infra):** Document integration with monitoring tools.
    - **Task-OBS-001.5 (Docs):** Document observability features.
