# Plan for Documentation and Configuration Fixes

This document outlines the plan to address inconsistencies and missing elements in the project's documentation and configuration files.

## Summary of Identified Issues:

1.  **Missing `.env.example`**: Essential for project setup.
2.  **`docker-compose.yml` Inconsistencies**: Version mismatch with `DAT.md`, hardcoded credentials (security risk), and differing PostgreSQL image suggestion.
3.  **`README.md` Architecture Diagram**: Misrepresents the container setup compared to `DAT.md` and `docker-compose.yml`.
4.  **Missing Documentation Files**: `CONTRIBUTING.md` and `LICENSE.md` are referenced but not present.
5.  **Project Status Clarity**: `README.md` status doesn't fully align with completed tasks in `BACKLOG.md` and existing files/migrations.

## Approved Plan:

1.  **Create `.env.example`**:
    *   A new file named `.env.example` will be created at the project root.
    *   It will be populated with the example environment variables found in `DAT.md` (lines 458-478) and `README.md` (lines 120-138).

2.  **Update `docker-compose.yml`**:
    *   Change the `version` from `3.8` to `3.9`.
    *   Update the `postgres` service `image` from `ankane/pgvector:latest` to `pgvector/pgvector:pg16`.
    *   Modify the `postgres` service `environment` to use environment variable references:
        *   `POSTGRES_DB: ${POSTGRES_DB}`
        *   `POSTGRES_USER: ${POSTGRES_USER}`
        *   `POSTGRES_PASSWORD: ${POSTGRES_PASSWORD}`
    *   Add the following environment variable references to the `nextjs-app` service:
        *   `JWT_SECRET: ${JWT_SECRET}`
        *   `APP_ENCRYPTION_KEY: ${APP_ENCRYPTION_KEY}`
    *   Add the healthcheck configuration to the `nextjs-app` service as specified in `DAT.md` (lines 408-413):
        ```yaml
        healthcheck:
          test: ["CMD", "curl", "-f", "http://localhost:3000/api/health"]
          interval: 30s
          timeout: 10s
          retries: 3
          start_period: 60s
        ```
    *   (Optional but Recommended) Include the commented-out `nginx-proxy` and `redis` service examples from `DAT.md` (lines 363-373 and 434-445 respectively) for completeness, ensuring they are properly commented out.

3.  **Update `README.md`**:
    *   Modify the Mermaid architecture diagram (lines 72-88) to accurately represent the consolidated Next.js app container as described in `DAT.md` (lines 113-151). The diagram should show a single `nextjs-app` container handling both Frontend and API, and interacting with `postgres` and external AI services.
    *   Update the Docker Compose version mentioned in the "Installation & Setup" section (around line 153) from `docker-compose up --build -d` to reflect version `3.9` if any specific version command was mentioned (though it's usually just the command itself). More importantly, ensure the surrounding text aligns with the `docker-compose.yml` changes.

4.  **Update `DAT.md`**:
    *   Ensure the Docker Compose version in its example YAML (line 360) is `3.9` to match the updated `docker-compose.yml`.

5.  **Create Placeholder Files**:
    *   Create an empty file named `CONTRIBUTING.md` at the project root.
    *   Create an empty file named `LICENSE.md` at the project root.

6.  **Refine Project Status in `README.md`**:
    *   Update the "Project Status" section (lines 164-170) to better reflect that initial setup and some core foundational components (like user registration API and database migrations) are already in place, moving beyond a pure "Pre-Development" stage. For example: "🚧 **Initial Foundation Laid / Core Development Underway** 🚧 This project has moved beyond initial setup. Core infrastructure, including user authentication and basic data structures, is in place. We are actively developing the primary features."