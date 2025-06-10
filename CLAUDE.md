# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

### Development

- `npm run dev` - Start the development server (http://localhost:3000)
- `npm run build` - Build the Next.js application for production
- `npm start` - Start the production server

### Testing

- `npm test` - Run unit tests with Jest
- `npm run e2e` - Run end-to-end tests with Playwright
- `npm run e2e:ui` - Run Playwright tests with UI mode
- To run a single test file: `npm test -- path/to/test.test.ts`
- To run tests in watch mode: `npm test -- --watch`

### Code Quality

- `npm run lint` - Run ESLint to check code quality
- No typecheck command is defined, but TypeScript compilation happens during build

### Database

- `npm run prisma:generate` - Generate Prisma client
- `npm run prisma:migrate:dev` - Run database migrations in development
- `npm run prisma:migrate` - Deploy database migrations in production
- `npm run prisma:studio` - Open Prisma Studio for database management
- `npm run prisma:reset` - Reset the database (WARNING: destructive)

### Deployment

- Docker: `docker-compose up --build -d` - Build and run the application with PostgreSQL
- Kubernetes: `./deploy.sh` - Deploy using Helm chart to Kubernetes cluster

## Architecture Overview

### Tech Stack

- **Frontend**: Next.js 15 (App Router), React 19, TypeScript, Tailwind CSS
- **Backend**: Next.js API Routes, Prisma ORM, PostgreSQL with pgvector
- **Authentication**: JWT-based with access/refresh tokens
- **State Management**: Zustand for client state
- **UI Components**: Radix UI primitives with custom styling
- **Testing**: Jest for unit tests, Playwright for E2E tests
- **Deployment**: Docker, Kubernetes with Helm

### Project Structure

- `/app` - Next.js App Router pages and API routes
  - `/api` - Backend API endpoints (auth, notes, folders, search)
  - Pages use `.tsx` extension, API routes use `route.ts` convention
- `/components` - Reusable React components
  - `/ui` - Base UI components from shadcn/ui
- `/lib` - Shared utilities and server-side logic
  - `/auth` - Authentication utilities
  - Database client initialization
  - Logging configuration
- `/contexts` - React contexts (e.g., AuthContext)
- `/hooks` - Custom React hooks
- `/prisma` - Database schema and migrations
- `/__tests__` - Test files organized by domain

### Key Patterns

#### Authentication Flow

- Registration/login endpoints create JWT access tokens and HttpOnly refresh tokens
- `serverAuth.ts` handles server-side auth validation
- `AuthContext` manages client-side auth state
- Protected routes check authentication status

#### Database Models

- **User**: Core user entity with email/password auth
- **Note**: Markdown notes with folder organization, versioning, and sharing
- **Folder**: Hierarchical folder structure for note organization
- **Permission**: RBAC permissions for notes/folders
- **UserAiConfig**: User's AI provider configurations (encrypted)
- **NoteChunk**: Vector embeddings for semantic search

#### API Conventions

- RESTful endpoints under `/api`
- Consistent error handling with appropriate HTTP status codes
- Request validation using Zod schemas
- Structured logging with Pino

#### Security Measures

- Passwords hashed with Argon2id
- JWT secrets required in environment variables
- API keys encrypted with AES-256-GCM
- HTTPS enforcement in production
- Input validation and sanitization

### Environment Configuration

Required environment variables:

- `DATABASE_URL` - PostgreSQL connection string
- `JWT_SECRET` - Secret for JWT signing (min 64 chars)
- `APP_ENCRYPTION_KEY` - 32-character key for AES-256 encryption
- `NEXT_PUBLIC_BACKEND_URL` - Backend API URL for client
- `POSTGRES_USER/PASSWORD/DB` - PostgreSQL credentials

### Development Workflow

1. Database changes: Update schema.prisma → Run migrations → Generate client
2. API changes: Implement in `/app/api/*/route.ts` → Add tests
3. UI changes: Create/update components → Update pages → Test responsiveness
4. Always run `npm run lint` before committing
5. Write tests for new features (unit tests in `__tests__`, E2E in `/e2e`)

### Current Implementation Status

- ✅ User authentication (register, login, logout, refresh tokens)
- ✅ Basic folder CRUD operations
- ✅ Note CRUD with markdown support
- ✅ Search functionality
- ✅ Docker deployment setup
- ✅ Kubernetes Helm chart
- 🚧 Real-time collaboration
- 🚧 AI integration (RAG, voice transcription)
- 🚧 Advanced permissions system
- 🚧 Offline mode
