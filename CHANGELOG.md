# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

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