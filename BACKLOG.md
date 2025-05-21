## Project Backlog: Self-Hosted AI-Powered Note-Taking App

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

### EPIC-01: Project Setup & Core Infrastructure

- **US-SETUP-001:** As a Developer, I want a basic project structure for a unified Next.js application (frontend and backend) so that development can begin in an organized manner.
  - **Task-SETUP-001.1 (Infra):** Initialize Git repository with appropriate `.gitignore` for a Next.js project.
  - **Task-SETUP-001.2 (FE/API):** Setup Next.js project (App Router, TypeScript, Tailwind CSS).
  - **Task-SETUP-001.3 (Infra):** Create initial `Dockerfile` for the Next.js application.
  - **Task-SETUP-001.4 (DB):** Define initial `docker-compose.yml` with `nextjs-app` and `postgres` (with pgvector) services.
  - **Task-SETUP-001.5 (Infra):** Configure basic linting, formatting (ESLint, Prettier) for the Next.js project.
  - **Task-SETUP-001.6 (API, DB):** Setup Prisma client and initial schema connection to PostgreSQL from Next.js app.
  - **Task-SETUP-001.7 (API):** Implement basic health check API route in Next.js app (e.g., `/api/health`).
  - **Task-SETUP-001.8 (FE):** Implement basic health check page/route in Next.js app (e.g., `/health`) that calls the `/api/health` route.
  - **Task-SETUP-001.9 (Test):** Ensure basic `docker-compose up` brings all services online.
  - **Task-SETUP-001.10 (Docs):** Document initial project setup and how to run locally.

---

### EPIC-02: User Management & Authentication (FR-UM, NFR-SEC-002, NFR-SEC-004)

- **US-UM-001 (FR-UM-001):** As a new User, I want to register for an account using my email and a password so that I can access the application.

  - **Task-UM-001.1 (DB):** Design and migrate `users` table schema (id, email, password_hash, timestamps).
  - **Task-UM-001.2 (API):** Implement `/api/auth/register` API route.
  - **Task-UM-001.3 (API):** Add input validation (email format, password strength policy) in the API route.
  - **Task-UM-001.4 (API):** Implement logic to check for existing email in the API route.
  - **Task-UM-001.5 (API):** Implement password hashing using Argon2id in the API route.
  - **Task-UM-001.6 (API, DB):** Store new user in the database via Prisma from the API route.
  - **Task-UM-001.7 (FE):** Create Registration page/form UI (email, password, confirm password).
  - **Task-UM-001.8 (FE):** Implement client-side validation for registration form.
  - **Task-UM-001.9 (FE):** Implement API call to `/api/auth/register`.
  - **Task-UM-001.10 (FE):** Handle success (e.g., redirect to login) and error responses.
  - **Task-UM-001.11 (Test):** Unit tests for API registration logic (validation, hashing, conflicts).
  - **Task-UM-001.12 (Test):** Unit tests for FE registration form (validation, submission).
  - **Task-UM-001.13 (Test):** Integration test for `/api/auth/register` API route.
  - **Task-UM-001.14 (Test):** E2E test for the full registration flow.
  - **Task-UM-001.15 (Docs):** Document `/api/auth/register` API route.

- **US-UM-002 (FR-UM-002):** As a registered User, I want to log in with my email and password so that I can access my notes and application features.

  - **Task-UM-002.1 (API):** Implement `/api/auth/login` API route.
  - **Task-UM-002.2 (API):** Add input validation for login credentials in the API route.
  - **Task-UM-002.3 (API, DB):** Retrieve user by email and verify password hash (Argon2id) in the API route.
  - **Task-UM-002.4 (API):** Generate JWT (access token, refresh token) upon successful login in the API route.
  - **Task-UM-002.5 (API):** Configure JWT library (e.g., `jsonwebtoken` or `jose`) with appropriate secrets and expiry times within Next.js API logic.
  - **Task-UM-002.6 (FE):** Create Login page/form UI.
  - **Task-UM-002.7 (FE):** Implement client-side validation for login form.
  - **Task-UM-002.8 (FE):** Implement API call to `/api/auth/login`.
  - **Task-UM-002.9 (FE):** Securely store JWTs (e.g., access token in memory, refresh token in HttpOnly cookie or secure local storage if appropriate for token rotation strategy).
  - **Task-UM-002.10 (FE):** Implement redirect to dashboard/notes upon successful login.
  - **Task-UM-002.11 (FE):** Handle login errors (invalid credentials, etc.).
  - **Task-UM-002.12 (Test):** Unit tests for API login logic.
  - **Task-UM-002.13 (Test):** Integration test for `/api/auth/login` API route.
  - **Task-UM-002.14 (Test):** E2E test for the login flow.
  - **Task-UM-002.15 (Docs):** Document `/api/auth/login` API route.

- **US-UM-003:** As an authenticated User, I want the application to maintain my session so that I don't have to log in repeatedly.

  - **Task-UM-003.1 (API):** Implement JWT authentication middleware/helper for protected API routes in Next.js.
  - **Task-UM-003.2 (API):** Implement `/api/auth/refresh-token` API route using refresh tokens to issue new access tokens.
  - **Task-UM-003.3 (FE):** Implement logic to attach JWT to outgoing API requests.
  - **Task-UM-003.4 (FE):** Implement automatic token refresh mechanism using the refresh token.
  - **Task-UM-003.5 (FE):** Handle session expiry and token refresh failures (e.g., redirect to login).
  - **Task-UM-003.6 (Test):** Test protected API routes access with valid/invalid/expired tokens.
  - **Task-UM-003.7 (Test):** Test token refresh flow.

- **US-UM-004 (FR-UM-003):** As a User, I want to be able to recover my password if I forget it so that I can regain access to my account.

  - **Task-UM-004.1 (DB):** Design schema for password reset tokens (token, user_id, expires_at).
  - **Task-UM-004.2 (API):** Implement `/api/auth/recover-password` API route (takes email).
  - **Task-UM-004.3 (API):** Generate a secure, unique, time-limited password reset token in the API route.
  - **Task-UM-004.4 (API, DB):** Store token hash in DB, associated with the user.
  - **Task-UM-004.5 (API):** Implement email sending service integration (e.g., SMTP or third-party API like SendGrid - requires setup) to send reset link from an API route or server-side module.
  - **Task-UM-004.6 (FE):** Create "Forgot Password" page/form (takes email).
  - **Task-UM-004.7 (FE):** Implement API call to `/api/auth/recover-password`.
  - **Task-UM-004.8 (API):** Implement `/api/auth/reset-password` API route (takes token, new password).
  - **Task-UM-004.9 (API):** Validate token (existence, expiry, not used) in the API route.
  - **Task-UM-004.10 (API, DB):** Update user's password_hash with new hashed password. Invalidate the reset token.
  - **Task-UM-004.11 (FE):** Create "Reset Password" page/form (takes new password, confirm password, token from URL).
  - **Task-UM-004.12 (FE):** Implement API call to `/api/auth/reset-password`.
  - **Task-UM-004.13 (Test):** Test password recovery request and reset flows.
  - **Task-UM-004.14 (Docs):** Document password recovery API routes.

- **US-UM-005:** As an authenticated User, I want to be able to log out so that I can securely end my session.

  - **Task-UM-005.1 (API):** Implement `/api/auth/logout` API route (if using server-side session invalidation for refresh tokens, e.g. blocklisting).
  - **Task-UM-005.2 (FE):** Implement logout button/action.
  - **Task-UM-005.3 (FE):** Clear stored JWTs from client-side.
  - **Task-UM-005.4 (FE):** Redirect to login page.
  - **Task-UM-005.5 (Test):** E2E test for logout flow.

- **US-UM-006:** As an authenticated User, I want to view my profile information (e.g., email) so that I can confirm my identity.
  - **Task-UM-006.1 (API):** Implement `/api/users/me` API route to return authenticated user's details (non-sensitive).
  - **Task-UM-006.2 (FE):** Create a basic User Profile page.
  - **Task-UM-006.3 (FE):** Fetch and display user data from `/api/users/me`.
  - **Task-UM-006.4 (Test):** Test `/api/users/me` API route.

---

### EPIC-03: Note-Taking & Organization (Core) (FR-NT, FR-NT-008)

- **US-NT-001 (FR-NT-005):** As a User, I want to create, rename, and delete folders, including nested folders, so that I can organize my notes hierarchically.

  - **Task-NT-001.1 (DB):** Design and migrate `folders` table schema (id, name, parent_folder_id, owner_id, timestamps).
  - **Task-NT-001.2 (API):** Implement `/api/folders` POST API route for creating folders.
  - **Task-NT-001.3 (API):** Implement `/api/folders/{folderId}` PUT API route for renaming folders.
  - **Task-NT-001.4 (API):** Implement `/api/folders/{folderId}` DELETE API route for deleting folders (handle non-empty folders - disallow or confirm recursive delete).
  - **Task-NT-001.5 (API):** Implement `/api/folders` GET API route to list folders (hierarchically or flat with parent IDs).
  - **Task-NT-001.6 (FE):** Develop Folder Tree/File Explorer UI component.
  - **Task-NT-001.7 (FE):** Implement "Create Folder" functionality (modal, inline).
  - **Task-NT-001.8 (FE):** Implement "Rename Folder" functionality (context menu, inline edit).
  - **Task-NT-001.9 (FE):** Implement "Delete Folder" functionality (with confirmation).
  - **Task-NT-001.10 (FE):** Display nested folder structure.
  - **Task-NT-001.11 (Test):** Unit and Integration tests for folder CRUD API logic.
  - **Task-NT-001.12 (Test):** E2E tests for folder management.
  - **Task-NT-001.13 (Docs):** Document folder API routes.

- **US-NT-002 (FR-NT-001, FR-NT-002):** As a User, I want to create, view, edit, and delete notes within folders or at the root level, with content stored in Markdown, so that I can manage my textual information.

  - **Task-NT-002.1 (DB):** Design and migrate `notes` table schema (id, title, content_markdown, folder_id, owner_id, timestamps, yjs_doc_state, public_share_token, is_public, current_version_id).
  - **Task-NT-002.2 (API):** Implement `/api/notes` POST API route for creating notes.
  - **Task-NT-002.3 (API):** Implement `/api/notes/{noteId}` GET API route for fetching a note.
  - **Task-NT-002.4 (API):** Implement `/api/notes/{noteId}` PUT API route for updating a note (title, content).
  - **Task-NT-002.5 (API):** Implement `/api/notes/{noteId}` DELETE API route for deleting notes.
  - **Task-NT-002.6 (API):** Implement GET API route to list notes within a folder or at root (e.g., `/api/folders/{folderId}/notes`, `/api/notes?folderId=null`).
  - **Task-NT-002.7 (FE):** Develop Note Editor UI using CodeMirror 6.
  - **Task-NT-002.8 (FE):** Implement "Create Note" functionality.
  - **Task-NT-002.9 (FE):** Display note content in editor when a note is selected/opened.
  - **Task-NT-002.10 (FE):** Implement saving mechanism for note content (auto-save, manual save button).
  - **Task-NT-002.11 (FE):** Implement "Delete Note" functionality (with confirmation).
  - **Task-NT-002.12 (FE):** Integrate note list within the File Explorer UI.
  - **Task-NT-002.13 (Test):** Unit and Integration tests for note CRUD API logic.
  - **Task-NT-002.14 (Test):** E2E tests for note creation, viewing, editing, deletion.
  - **Task-NT-002.15 (Docs):** Document note API routes.

- **US-NT-003 (FR-NT-003):** As a User, I want a real-time, side-by-side preview of my Markdown notes as I type so that I can see the rendered output immediately.

  - **Task-NT-003.1 (FE):** Integrate `react-markdown` (with `remark-gfm`, `rehype-sanitize`, `rehype-highlight`) for Markdown rendering.
  - **Task-NT-003.2 (FE):** Implement a two-pane layout in the Note Editor (CodeMirror input, rendered preview).
  - **Task-NT-003.3 (FE):** Update preview pane in real-time as content changes in CodeMirror.
  - **Task-NT-003.4 (FE):** Ensure synchronized scrolling between editor and preview panes (optional, but nice UX).
  - **Task-NT-003.5 (Test):** Test Markdown rendering for common elements (headers, lists, bold, italic, code blocks, links, images).

- **US-NT-004 (FR-NT-006):** As a User, I want to move notes between folders and move folders into other folders (or to root) so that I can reorganize my content.

  - **Task-NT-004.1 (API):** Update `/api/notes/{noteId}` PUT API route to allow changing `folder_id`.
  - **Task-NT-004.2 (API):** Update `/api/folders/{folderId}` PUT API route to allow changing `parent_folder_id`.
  - **Task-NT-004.3 (API):** Add validation to prevent cyclical folder structures in API logic.
  - **Task-NT-004.4 (FE):** Implement drag-and-drop functionality in the File Explorer for moving notes and folders.
  - **Task-NT-004.5 (FE):** Alternatively, implement "Move to..." context menu option.
  - **Task-NT-004.6 (FE):** Update UI upon successful move.
  - **Task-NT-004.7 (Test):** Test moving notes and folders, including edge cases (to root, into deeply nested folders).

- **US-NT-005 (FR-NT-007):** As a User, I want to export individual notes to PDF format, preserving rendering and styling, so that I can share or archive them offline.

  - **Task-NT-005.1 (API):** Integrate Puppeteer for PDF generation within a Next.js API route or server-side module.
  - **Task-NT-005.2 (API):** Implement `/api/notes/{noteId}/export/pdf` GET API route.
  - **Task-NT-005.3 (API):** Logic to render note's Markdown content to HTML (server-side, reusing rendering logic or specific template for PDF).
  - **Task-NT-005.4 (API):** Use Puppeteer to convert the HTML to PDF. Include basic styling.
  - **Task-NT-005.5 (API):** Ensure proper headers for PDF download from the API route.
  - **Task-NT-005.6 (Infra):** Ensure Puppeteer dependencies are included in the Next.js app Docker image and it runs sandboxed if possible.
  - **Task-NT-005.7 (FE):** Add "Export to PDF" button/option for a note.
  - **Task-NT-005.8 (Test):** Test PDF export functionality, check rendering fidelity for various Markdown elements.
  - **Task-NT-005.9 (Docs):** Document PDF export API route.

- **US-NT-006 (FR-NT-008):** As a User, I want version history for my notes so that I can view and potentially revert to previous states of a note.
  - **Task-NT-006.1 (DB):** Design and migrate `note_versions` table (id, note_id, content_diff/full_content, created_at, author_id). Link to `notes.current_version_id`.
  - **Task-NT-006.2 (API):** Modify note update logic (`/api/notes/{noteId}` PUT) to create a new `note_version` entry upon significant changes.
  - **Task-NT-006.3 (API):** Decide on versioning strategy (full snapshots vs. diffs). For simplicity, start with full snapshots. Implement in API logic.
  - **Task-NT-006.4 (API):** Implement `/api/notes/{noteId}/versions` GET API route to list versions for a note.
  - **Task-NT-006.5 (API):** Implement `/api/notes/{noteId}/versions/{versionId}` GET API route to fetch a specific version's content.
  - **Task-NT-006.6 (API):** Implement `/api/notes/{noteId}/versions/{versionId}/revert` POST API route to revert note content to a specific version (creates a new version based on the old one).
  - **Task-NT-006.7 (FE):** Add "Version History" option/panel for a note.
  - **Task-NT-006.8 (FE):** Display list of versions with timestamps/authors.
  - **Task-NT-006.9 (FE):** Allow viewing content of a selected version (read-only).
  - **Task-NT-006.10 (FE):** Implement "Revert to this version" functionality.
  - **Task-NT-006.11 (Test):** Test version creation, listing, viewing, and reverting via API and UI.

---

### EPIC-04: Advanced Markdown Support (FR-NT-004)

- **US-MD-001 (FR-NT-004):** As a User, I want support for tables in Markdown so that I can organize structured data within my notes.

  - **Task-MD-001.1 (FE):** Ensure CodeMirror handles Markdown table syntax well.
  - **Task-MD-001.2 (FE):** Ensure `react-markdown` with `remark-gfm` correctly renders tables in the preview.
  - **Task-MD-001.3 (Test):** Test table creation and rendering.

- **US-MD-002 (FR-NT-004):** As a User, I want to embed diagrams (e.g., Mermaid, PlantUML) in my notes using Markdown code blocks so that I can visualize information.

  - **Task-MD-002.1 (FE):** Integrate Mermaid.js library.
  - **Task-MD-002.2 (FE):** Create a custom `react-markdown` component to detect `mermaid` code blocks and render them using Mermaid.js.
  - **Task-MD-002.3 (FE):** For PlantUML, investigate client-side rendering (e.g., `plantuml-encoder` to generate image URLs from a PlantUML server, or a WASM-based renderer) or server-side generation via an external PlantUML service (called from Next.js API route if needed, though client-side is simpler if possible).
  - **Task-MD-002.4 (FE):** Implement rendering for chosen PlantUML solution.
  - **Task-MD-002.5 (Test):** Test rendering of various Mermaid diagram types (flowchart, sequence).
  - **Task-MD-002.6 (Test):** Test rendering of PlantUML diagrams.
  - **Task-MD-002.7 (Docs):** Document how to use Mermaid/PlantUML in notes.

- **US-MD-003 (FR-NT-004):** As a User, I want syntax highlighting for code blocks in Markdown so that my code snippets are readable.
  - **Task-MD-003.1 (FE):** Ensure `rehype-highlight` (or similar like `react-syntax-highlighter`) is integrated with `react-markdown`.
  - **Task-MD-003.2 (FE):** Ensure CodeMirror 6 is configured for syntax highlighting of various languages within Markdown fenced code blocks.
  - **Task-MD-003.3 (Test):** Test syntax highlighting for common languages (JavaScript, Python, Java, Shell).

_(Note: Custom block plugins are a more advanced feature, potentially for a later iteration unless critical)_

---

### EPIC-05: Search & Retrieval (FR-SR)

- **US-SR-001 (FR-SR-001, FR-SR-002):** As a User, I want to search my notes by title and content using keywords (full-text search) so that I can quickly find relevant information.

  - **Task-SR-001.1 (DB):** Configure PostgreSQL FTS (e.g., GIN index on `title` and `content_markdown` `tsvector` columns).
  - **Task-SR-001.2 (API):** Implement `/api/search` GET API route that accepts a query string.
  - **Task-SR-001.3 (API, DB):** Logic to use PostgreSQL FTS to search `notes` table (title, content), respecting user ownership and permissions, from the API route.
  - **Task-SR-001.4 (API):** Rank results (e.g., by relevance score from FTS) in the API route.
  - **Task-SR-001.5 (FE):** Implement search bar UI.
  - **Task-SR-001.6 (FE):** Display search results (note titles, snippets, link to note).
  - **Task-SR-001.7 (FE):** Debounce search input to avoid excessive API calls.
  - **Task-SR-001.8 (Test):** Test FTS with various queries, including partial matches, phrases.
  - **Task-SR-001.9 (Docs):** Document search API route.

- **US-SR-002 (FR-SR-003, FR-AI-005 - Indexing Part):** As a System, I want to automatically chunk and create vector embeddings for notes when they are created or updated, so that they are available for semantic search. (This is a server-side story for RAG setup)

  - **Task-SR-002.1 (DB):** Design and migrate `note_chunks` table (id, note_id, chunk_text, embedding vector(DIMENSION_SIZE), created_at).
  - **Task-SR-002.2 (DB):** Create HNSW/IVFFlat index on `note_chunks.embedding` using `pgvector`.
  - **Task-SR-002.3 (API):** Integrate Langchain.js for text splitting (`RecursiveCharacterTextSplitter` or `MarkdownTextSplitter`) in server-side logic.
  - **Task-SR-002.4 (API):** Implement logic to process note content in a server-side module or API route triggered by note changes:
    - On note create/update, fetch the note content.
    - Split content into manageable chunks.
  - **Task-SR-002.5 (API):** Implement logic to generate embeddings for chunks in server-side modules:
    - Retrieve user's configured embedding model API details (from `user_ai_configs`).
    - Call external embedding API (via Langchain.js integration or direct HTTP call) for each chunk.
    - Handle API errors, rate limits from external service.
  - **Task-SR-002.6 (API, DB):** Store chunks and their embeddings in `note_chunks` table, linked to the parent note.
  - **Task-SR-002.7 (API):** Make this process asynchronous (e.g., background job/queue like BullMQ, if Redis is integrated, or using serverless functions if applicable) to avoid blocking note save operations. Initial implementation can be synchronous within an API route, then refactored.
  - **Task-SR-002.8 (API):** Handle re-indexing if a note is updated (delete old chunks/embeddings, create new ones).
  - **Task-SR-002.9 (Test):** Unit test chunking and embedding generation logic (with mock AI service).
  - **Task-SR-002.10 (Test):** Test storage and retrieval of embeddings from `pgvector`.

- **US-SR-003 (FR-SR-003 - Retrieval Part):** As a User, I want to perform a semantic search on my notes using natural language queries so that I can find notes based on meaning and context, not just keywords.

  - **Task-SR-003.1 (API):** Extend `/api/search` API route or create `/api/search/semantic` to handle semantic queries.
  - **Task-SR-003.2 (API):** Retrieve user's configured embedding model API details in the API route.
  - **Task-SR-003.3 (API):** Embed the user's search query using the same embedding model via server-side logic.
  - **Task-SR-003.4 (API, DB):** Perform k-NN similarity search in `note_chunks.embedding` using `pgvector` (cosine similarity/inner product), filtering by user's accessible notes.
  - **Task-SR-003.5 (API):** Aggregate results from chunks to parent notes, rank notes by relevance in the API route.
  - **Task-SR-003.6 (FE):** Allow users to specify semantic search mode or combine results.
  - **Task-SR-003.7 (FE):** Display semantic search results, potentially highlighting relevant chunks or providing context.
  - **Task-SR-003.8 (Test):** Test semantic search with various queries, compare with keyword search.

- **US-SR-004 (FR-SR-004):** As a User, I want advanced semantic search refinements like re-ranking or query expansion so that my search results are even more relevant.
  - **Task-SR-004.1 (API):** (Re-ranking) After initial k-NN retrieval, implement logic in an API route to pass top N chunks to a small re-ranking LLM (user-configured or default).
  - **Task-SR-004.2 (API):** (Query Expansion/Rewriting - e.g., HyDE) Before embedding the query, implement logic in an API route to use an LLM to rewrite/expand it.
  - **Task-SR-004.3 (API):** Integrate these steps into the semantic search flow, making them optional based on user settings or system configuration.
  - **Task-SR-004.4 (FE):** (Optional) UI to toggle these advanced refinements.
  - **Task-SR-004.5 (Test):** Evaluate impact of re-ranking/query expansion on search quality.

---

### EPIC-06: Collaboration & Permissions (FR-CP)

- **US-CP-001 (FR-CP-004):** As a System, I need a robust permission system so that all data access and modifications are strictly enforced.

  - **Task-CP-001.1 (DB):** Design and migrate `permissions` table (id, user_id, entity_type, entity_id, access_level).
  - **Task-CP-001.2 (DB):** Design and migrate `invitations` table (id, inviter_id, invitee_email, entity_type, entity_id, access_level, status, token, expires_at).
  - **Task-CP-001.3 (API):** Integrate CASL (or similar RBAC/ABAC library) within Next.js server-side logic. Define abilities (e.g., `view`, `edit`, `manage`) and subjects (`note`, `folder`).
  - **Task-CP-001.4 (API):** Implement middleware/decorators/helpers to check permissions on all relevant API routes for notes and folders (CRUD, sharing).
  - **Task-CP-001.5 (API):** Logic to determine permissions based on ownership (`notes.owner_id`, `folders.owner_id`) and explicit grants in `permissions` table, used in API routes.
  - **Task-CP-001.6 (Test):** Extensive unit and integration tests for permission logic across various scenarios in API routes.

- **US-CP-002 (FR-CP-001):** As a Note/Folder Owner, I want to mark my content as "public" (viewable via a shareable link) so that anyone with the link can view it without an account.

  - **Task-CP-002.1 (DB):** Add `is_public` (boolean) and `public_share_token` (text, unique) fields to `notes` and `folders` tables.
  - **Task-CP-002.2 (API):** Implement API route to toggle public status and generate/revoke a unique, unguessable share token.
  - **Task-CP-002.3 (API, FE):** Implement public access pages/routes (e.g., `/public/notes/{token}`) that bypass standard auth but validate the token. The API route will fetch data, the FE page will render it.
  - **Task-CP-002.4 (FE):** UI option in note/folder settings to "Make Public" / "Share via Link".
  - **Task-CP-002.5 (FE):** Display shareable link when public.
  - **Task-CP-002.6 (FE):** Develop public view page for notes/folders (read-only).
  - **Task-CP-002.7 (Test):** Test public link generation, access, and revocation.

- **US-CP-003 (FR-CP-002, FR-CP-003, FR-CP-005):** As a Note/Folder Owner, I want to invite other registered users by email or username to collaborate with specific access levels ("view-only" or "edit access") so that we can work together securely.

  - **Task-CP-003.1 (API):** Implement API route to create an invitation (`/api/invitations` POST).
    - Takes `entity_id`, `entity_type`, `invitee_email/username`, `access_level`.
    - Generates unique token for invitation.
    - Stores invitation in `invitations` table with 'pending' status and expiry.
  - **Task-CP-003.2 (API):** (Optional Email) Send email notification to invitee with invitation link using a server-side email service.
  - **Task-CP-003.3 (API):** Implement API route for invitee to list their pending invitations (`/api/invitations/pending` GET).
  - **Task-CP-003.4 (API):** Implement API routes to accept/decline invitation (`/api/invitations/{invitationId}/accept` POST, `/api/invitations/{invitationId}/decline` POST).
    - On accept: create entry in `permissions` table, update invitation status.
  - **Task-CP-003.5 (API):** Implement API route to list current collaborators and their permissions for a note/folder.
  - **Task-CP-003.6 (API):** Implement API route to revoke access/remove collaborator.
  - **Task-CP-003.7 (FE):** Develop "Share" modal for notes/folders.
    - Input for username/email, dropdown for access level.
    - Display list of current collaborators and their access, with option to change/revoke.
  - **Task-CP-003.8 (FE):** UI for users to see and manage their pending invitations (e.g., in a notifications area).
  - **Task-CP-003.9 (Test):** Test invitation flow (create, accept, decline, revoke), permission enforcement for shared items via API routes.
  - **Task-CP-003.10 (Docs):** Document sharing and invitation API routes.

- **US-CP-004 (FR-CP-006):** As a User with edit access, I want to collaboratively edit notes in real-time with other users so that we can work simultaneously and see each other's changes instantly.
  - **Task-CP-004.1 (API, Infra):** Setup WebSocket server within Next.js (e.g., using a custom server and the `ws` package, integrated with `y-websocket` server component).
  - **Task-CP-004.2 (API):** Authenticate WebSocket connections (e.g., JWT in handshake, verified by custom server logic).
  - **Task-CP-004.3 (API, DB):** Implement Yjs document persistence strategy within Next.js server logic:
    - Load Yjs document state from `notes.yjs_doc_state` (or `content_markdown`) when first user joins a document room.
    - Periodically or on significant changes, persist Yjs document updates back to the database.
  - **Task-CP-004.4 (API):** Ensure Yjs documents are scoped per note ID and respect permissions (checked by WebSocket server logic).
  - **Task-CP-004.5 (FE):** Integrate Yjs client-side with CodeMirror 6 (using Yjs binding for CodeMirror).
  - **Task-CP-004.6 (FE):** Connect to WebSocket server (e.g. `/ws` endpoint on the Next.js app) for the currently open note.
  - **Task-CP-004.7 (FE):** Implement presence indicators (e.g., showing cursors/selection of other users, list of active collaborators).
  - **Task-CP-004.8 (FE):** Handle connection/disconnection events gracefully.
  - **Task-CP-004.9 (Test):** Test real-time collaboration with multiple clients, concurrent edits, conflict resolution (handled by Yjs), persistence.
  - **Task-CP-004.10 (Docs):** Document WebSocket endpoint and collaboration setup.

---

This is a substantial part of the backlog. I will continue with the AI features, data resilience, webhooks, security, deployment, and testing in subsequent responses if you'd like to proceed. Let me know how you want to continue!
