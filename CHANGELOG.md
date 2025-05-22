## [Unreleased]

### Added
- User registration API route (`app/api/auth/register/route.ts`) ([BACKLOG.md: Task-UM-001.2]).
- Prisma `User` model and migration for users table ([BACKLOG.md: Task-UM-001.1]).
- Passing Jest test for user registration ([BACKLOG.md: Task-UM-001.2, Task-UM-001.11, Task-UM-001.13]).
- Permission system foundation with CASL integration ([BACKLOG.md: Task-CP-001.3, Task-CP-001.4, Task-CP-001.5]).
- Prisma models for `permissions` and `invitations` tables ([BACKLOG.md: Task-CP-001.1, Task-CP-001.2]).
- Invitation management API routes ([BACKLOG.md: Task-CP-003.1, Task-CP-003.3, Task-CP-003.4]).
- Permission management API routes ([BACKLOG.md: Task-CP-003.5, Task-CP-003.6]).
- Frontend components for sharing system ([BACKLOG.md: Task-CP-003.7, Task-CP-003.8]).
- Comprehensive tests for permission system ([BACKLOG.md: Task-CP-001.6]).
- API documentation for sharing system ([BACKLOG.md: Task-CP-003.10]).
- Public sharing feature with database fields (`is_public` and `public_share_token`) ([BACKLOG.md: Task-CP-002.1]).
- API endpoints for public access ([BACKLOG.md: Task-CP-002.2, Task-CP-002.3]).
- Public view pages for notes and folders ([BACKLOG.md: Task-CP-002.6]).
- PublicToggle UI component ([BACKLOG.md: Task-CP-002.4, Task-CP-002.5]).
- Tests for public sharing functionality ([BACKLOG.md: Task-CP-002.7]).

### Changed
- Initial `Dockerfile` for Next.js application ([BACKLOG.md: Task-SETUP-001.3]).
- Initial `docker-compose.yml` with `nextjs-app` and `postgres` (with pgvector) services ([BACKLOG.md: Task-SETUP-001.4]).
- `.prettierrc.json` for code formatting ([BACKLOG.md: Task-SETUP-001.5]).
- Prisma schema for PostgreSQL connection (`prisma/schema.prisma`) ([BACKLOG.md: Task-SETUP-001.6]).
- Health check API route (`app/api/health/route.ts`) ([BACKLOG.md: Task-SETUP-001.7]).
- Utility function for class name merging (`lib/utils.ts`) ([BACKLOG.md: Task-SETUP-001.2]).
- Verified `docker-compose up` brings all services online ([BACKLOG.md: Task-SETUP-001.9]).
- Setup Next.js project structure with App Router, TypeScript, and Tailwind CSS ([BACKLOG.md: Task-SETUP-001.2]).
- **Production fix:** Updated `docker-compose.yml` to remove the `- .:/app` and `- /app/node_modules` volumes from the `nextjs-app` service to prevent overwriting the production build output. ([BACKLOG.md: Task-SETUP-001.4])

### Fixed
- Fixed Docker build/type error caused by `react-day-picker` API changes in `components/ui/calendar.tsx`.
- Removed invalid `IconLeft` and `IconRight` properties from `components/ui/calendar.tsx`.
- Removed unused imports (`ChevronLeft`, `ChevronRight`) from `components/ui/calendar.tsx` to resolve ESLint errors.
- Rebuilt Docker image and containers after code and lint fixes.
- Confirmed Docker build and startup process completed successfully.
- Fixed production startup error: Next.js could not find a production build in the `.next` directory due to volume mount overwriting. This is now resolved by updating the compose file as above.

---

**BACKLOG.md Tasks Completed:**
- SETUP-001.2 (FE/API): Setup Next.js project (App Router, TypeScript, Tailwind CSS).
- SETUP-001.3 (Infra): Create initial `Dockerfile` for the Next.js application.
- SETUP-001.4 (DB): Define initial `docker-compose.yml` with `nextjs-app` and `postgres` (with pgvector) services.
- SETUP-001.5 (Infra): Configure basic formatting with `.prettierrc.json`.
- SETUP-001.6 (API, DB): Setup Prisma client and initial schema connection to PostgreSQL from Next.js app.
- SETUP-001.7 (API): Implement basic health check API route in Next.js app (`/api/health`).
- SETUP-001.9 (Test): Ensure basic `docker-compose up` brings all services online.
- UM-001.1 (DB): Design and migrate `users` table schema.
- UM-001.2 (API): Implement `/api/auth/register` API route.
- UM-001.11 (Test): Unit test for registration logic.
- UM-001.13 (Test): Integration test for `/api/auth/register` API route.

**EPIC-06: Collaboration & Permissions**
- CP-001.1 (DB): Design and migrate `permissions` table.
- CP-001.2 (DB): Design and migrate `invitations` table.
- CP-001.3 (API): Integrate CASL for permission management.
- CP-001.4 (API): Create authentication middleware for permission checking.
- CP-001.5 (API): Implement logic for determining permissions.
- CP-001.6 (Test): Create unit tests for the permission system.
- CP-003.1 (API): Create invitation API endpoint.
- CP-003.3 (API): Create API endpoint to list pending invitations.
- CP-003.4 (API): Create API endpoints to accept/decline invitations.
- CP-003.5 (API): Create API endpoint to list collaborators.
- CP-003.6 (API): Create API endpoints to grant/revoke/update access.
- CP-003.7 (FE): Implement ShareModal component.
- CP-003.8 (FE): Create PendingInvitations component.
- CP-003.10 (Docs): Add API documentation for the sharing system.

**EPIC-07: Public Sharing**
- CP-002.1 (DB): Add `is_public` and `public_share_token` fields to tables.
- CP-002.2 (API): Implement API route to toggle public status and generate/revoke share token.
- CP-002.3 (API, FE): Implement public access pages/routes.
- CP-002.4 (FE): Create UI options to "Make Public" / "Share via Link".
- CP-002.5 (FE): Display shareable link when public.
- CP-002.6 (FE): Develop public view page for notes/folders.
- CP-002.7 (Test): Test public link functionality.

---

_See [README.md], [BACKLOG.md], and [DAT.md] for project context and architecture._

---

_See [README.md], [BACKLOG.md], and [DAT.md] for project context and architecture._
