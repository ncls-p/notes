## [Unreleased]

### Added
- Initial `Dockerfile` for Next.js application ([BACKLOG.md: Task-SETUP-001.3]).
- Initial `docker-compose.yml` with `nextjs-app` and `postgres` (with pgvector) services ([BACKLOG.md: Task-SETUP-001.4]).
- `.prettierrc.json` for code formatting ([BACKLOG.md: Task-SETUP-001.5]).
- Prisma schema for PostgreSQL connection (`prisma/schema.prisma`) ([BACKLOG.md: Task-SETUP-001.6]).
- Health check API route (`app/api/health/route.ts`) ([BACKLOG.md: Task-SETUP-001.7]).
- Utility function for class name merging (`lib/utils.ts`) ([BACKLOG.md: Task-SETUP-001.2]).
- Verified `docker-compose up` brings all services online ([BACKLOG.md: Task-SETUP-001.9]).

### Changed
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

---

_See [README.md], [BACKLOG.md], and [DAT.md] for project context and architecture._
