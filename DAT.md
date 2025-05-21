## Detailed Application Design (DAT) v.0.1: Self-Hosted AI-Powered Note-Taking App

**Document Version:** 0.1 (Pre-Development, All Features Integrated)
**Date:** 2025-05-21 (Updated from 2023-11-20)
**Status:** Refined Draft (Pre-Development)
**Author:** AI Assistant (Reviewed by Gemini)

### 1. Executive Summary & Project Idea

This document outlines the initial design for a robust, self-hosted web application aimed at redefining personal and collaborative note-taking. It will offer comprehensive organizational features (folders, Markdown notes), a granular permission system for secure sharing, and cutting-edge AI capabilities. A core distinguishing feature is its user-centric AI model integration: users will provide and manage their own API configurations (keys, base URLs, preferred models) for OpenAI-compatible LLMs and transcription services, putting them in control of AI providers, costs, and model choices. The application will facilitate contextual chat with documents (via Retrieval-Augmented Generation - RAG) and effortless voice-to-text transcription. Furthermore, it will support real-time collaboration, offline note-taking, advanced Markdown features, and optional cost tracking for AI usage. Built on a modern, type-safe stack (Next.js, TypeScript, PostgreSQL) and deployed via Docker Compose, the system emphasizes data ownership, security, and ease of setup.

---

### 2. Functional Requirements (FRs)

The system SHALL:

**2.1. User Management & Authentication**

- **FR-UM-001:** Allow users to register new accounts securely (email, password). **[DONE]**
- **FR-UM-002:** Authenticate users via login credentials and maintain secure sessions using JWTs.
- **FR-UM-003:** Provide a mechanism for secure password recovery (e.g., email-based token).

**2.2. Note-Taking & Organization**

- **FR-NT-001:** Allow users to create, view, edit, and delete notes.
- **FR-NT-002:** Store note content exclusively in Markdown format.
- **FR-NT-003:** Provide a real-time, side-by-side preview of Markdown notes.
- **FR-NT-004:** Support advanced Markdown features including tables, diagrams (e.g., Mermaid, PlantUML), code blocks with syntax highlighting, and potentially custom block plugins.
- **FR-NT-005:** Allow users to create, rename, move, and delete folders, supporting nested structures.
- **FR-NT-006:** Enable seamless movement of notes between folders.
- **FR-NT-007:** Export individual notes to PDF format, preserving Markdown rendering and styling.
- **FR-NT-008:** Implement version history for notes, allowing users to view and potentially revert to previous versions.

**2.3. Search & Retrieval**

- **FR-SR-001:** Allow users to search notes by title and content using keyword-based search.
- **FR-SR-002:** Implement full-text search across all notes accessible to the user.
- **FR-SR-003:** Support semantic search through notes based on query similarity via the RAG system, using user-configured embedding models.
- **FR-SR-004:** Implement advanced semantic search refinements such as re-ranking retrieved chunks and query expansion/rewriting using a user-configured (or a default small) LLM for improved contextual relevance.

**2.4. Collaboration & Permissions**

- **FR-CP-001:** Allow note/folder owners to mark content as "public" (viewable via a shareable, unguessable link).
- **FR-CP-002:** Enable owners to invite other registered users to specific notes or folders by email or username.
- **FR-CP-003:** Define granular access levels for invited users: "view-only" or "edit access."
- **FR-CP-004:** Strictly enforce permissions for all data access and modifications based on an RBAC/ACL model (e.g., CASL).
- **FR-CP-005:** Provide an invitation acceptance workflow for invited users (e.g., in-app notification, email link).
- **FR-CP-006:** Implement real-time collaborative editing of notes, allowing multiple users to edit the same note simultaneously with presence indicators.

**2.5. User-Configurable AI Capabilities**

- **FR-AI-001:** Provide a user interface for managing multiple AI API configurations (e.g., API key, base URL, custom name for easy identification).
- **FR-AI-002:** Support connecting to various OpenAI-compatible API endpoints (e.g., OpenAI cloud, self-hosted Ollama, Groq, Azure OpenAI). Provide a flexible mechanism for users to define parameters for new provider types if they adhere to a compatible API structure.
- **FR-AI-003:** For each configured API, allow users to select or specify available LLM models for chat, embedding generation, and transcription, potentially fetching available models from the provider's endpoint if supported.
- **FR-AI-004:** Enable users to chat with their notes using natural language, leveraging their chosen AI configuration and model for generation.
- **FR-AI-005:** Utilize a RAG system for context-aware AI responses, using the user's configured embedding model for document chunking and query embedding.
- **FR-AI-006:** Allow users to record voice notes directly in the browser.
- **FR-AI-007:** Transcribe recorded voice notes into text using their chosen transcription model/API.
- **FR-AI-008:** Automatically save transcribed text as new Markdown notes, optionally allowing users to edit/confirm before final save, and integrate them into the RAG indexing process.
- **FR-AI-009:** Provide an optional feature for users to track their AI API usage (e.g., token counts if returned by the provider API). Display this information within the application. Cost estimation will rely on user-inputted pricing or generic models due to provider API limitations.

**2.6. Data Resilience & Integrations**

- **FR-DR-001:** Allow users to enable an offline mode for basic note-taking (CRUD) and viewing, with automatic conflict resolution (e.g., last-write-wins or CRDT-based merge) and synchronization upon reconnection.
- **FR-DR-002:** Provide a utility (e.g., CLI or UI option) for backing up all application data (database dump) and restoring from a backup.
- **FR-DR-003:** Enable webhooks to trigger external actions based on configurable note events (e.g., `note.created`, `note.updated`, `note.deleted`).

---

### 3. Non-Functional Requirements (NFRs)

**3.1. Performance**

- **NFR-PERF-001:** UI responsiveness for common actions (navigation, note rendering without complex diagrams) within 300ms. Complex diagram rendering may take longer.
- **NFR-PERF-002:** Keyword search queries return results within 1-2 seconds for typical datasets (e.g., 10,000 notes). Semantic search latency will depend on vector DB performance and result re-ranking.
- **NFR-PERF-003:** AI chat responses and voice transcriptions to complete within user-acceptable timeframes, clearly acknowledging dependence on user-configured external AI provider latency, model size, and network conditions. Provide visual feedback during these operations.

**3.2. Security**

- **NFR-SEC-001:** All client-server communication must be encrypted via HTTPS/WSS in production.
- **NFR-SEC-002:** User passwords must be stored using a strong, adaptive hashing algorithm like Argon2id (preferred) or bcrypt.
- **NFR-SEC-003:** User-provided AI API keys must be securely encrypted at rest in the database (e.g., AES-256 GCM).
- **NFR-SEC-004:** All API endpoints must enforce authentication and authorization.
- **NFR-SEC-005:** The system must be resilient to common web vulnerabilities (OWASP Top 10), including SQL injection, XSS (via proper output encoding and content sanitization), CSRF (using anti-CSRF tokens).
- **NFR-SEC-006:** Regular security audits of code and dependencies.

**3.3. Deployability & Maintainability**

- **NFR-DEP-001:** The core application must be deployable via a single `docker-compose up` command for simplified setup.
- **NFR-DEP-002:** The codebase must be type-safe (TypeScript) and follow modern best practices, including consistent coding standards, modular design, and comprehensive documentation.
- **NFR-DEP-003:** All application data must persist across container restarts via Docker volumes.
- **NFR-DEP-004:** Implement robust structured logging (e.g., JSON format), metrics collection (Prometheus compatible), and distributed tracing capabilities (OpenTelemetry) for all services to enhance observability and debugging.
- **NFR-DEP-005:** Database schema migrations must be managed and automated (e.g., using Prisma Migrate).

**3.4. Scalability**

- **NFR-SCL-001:** The database (PostgreSQL with pgvector) must handle tens of thousands of notes and millions of document chunks efficiently. Strategies for scaling vector search (e.g., sharding, dedicated vector DBs) should be considered for future growth beyond this.
- **NFR-SCL-002:** The backend API must support concurrent requests from hundreds of active users.
- **NFR-SCL-003:** The real-time collaboration system must efficiently handle concurrent edits from dozens of users on the same note.

**3.5. Usability**

- **NFR-USB-001:** Intuitive and accessible (WCAG 2.1 AA compliance as a target) UI for note-taking, organization, sharing, and AI configuration.
- **NFR-USB-002:** Comprehensive user documentation and in-app guidance for complex features like AI configuration and webhook setup.

---

### 4. Overall Architecture

The application adopts a consolidated architecture where the Next.js application serves both the frontend UI and the backend API logic. This is managed within a single Docker container for the Next.js app, simplifying deployment. Docker containers are still used for external services like the database. The externalization of AI model hosting remains: users integrate their own AI services.

```mermaid
graph TD
    A["User's Browser (Client)"] -- HTTP/S, WebSocket --> B["nginx-proxy (Reverse Proxy Container - Optional)"]

    subgraph Docker Network
        B -- HTTP/S (Frontend & API), WSS (Collaboration) --> C["nextjs-app (Combined Frontend & Backend Container)"]

        C -- SQL Queries --> E["postgres (DB Container with pgvector)"]

        subgraph "User-Provided AI Configuration & Interaction"
            C -- Retrieves User's AI Config (from DB) --> E
            E -- Encrypted API Keys & Config --> C
            C -- Decrypts & Uses Config --> F["External AI Service (OpenAI, User's Ollama, Groq, Azure OpenAI, etc.)"]
        end

        subgraph "Data Storage in PostgreSQL"
            E -- Stores --> G(User Accounts & Profiles)
            E -- Stores --> H(Notes, Folders, Permissions)
            E -- Stores --> I(Vector Embeddings for RAG)
            E -- Stores --> J(User AI Configurations - Encrypted)
            E -- Stores --> K(AI Usage Logs - Token counts)
            E -- Stores --> L(Webhook Configurations)
            E -- Stores --> M(Note Version History)
        end
    end

    %% Styling
    classDef default fill:#f9f9f9,stroke:#333,stroke-width:2px;
    classDef proxy fill:#e6f3ff,stroke:#007bff,stroke-width:2px;
    classDef app fill:#d4edda,stroke:#28a745,stroke-width:2px;
    classDef db fill:#f8d7da,stroke:#dc3545,stroke-width:2px;
    classDef external fill:#e2e3e5,stroke:#6c757d,stroke-width:2px;

    class A default;
    class B proxy;
    class C app;
    class E db;
    class F external;
```

**Core Services (Managed by `docker-compose.yml`):**

- **nginx-proxy (Optional but Recommended for Production):** Handles SSL termination, serves static assets, and acts as a reverse proxy for the `nextjs-app`.
- **nextjs-app:** Combined Frontend web application and Backend API server. Handles all UI, business logic, and WebSocket connections for real-time collaboration.
- **postgres:** PostgreSQL database with pgvector extension.

---

### 5. Detailed Design

**5.1. Frontend: Logic within `nextjs-app`**

- **Purpose:** User interface for all application features, including advanced Markdown editing, real-time collaboration, offline mode, and AI configuration.
- **Technology Stack:**
  - Framework: Next.js (App Router) with React.js
  - Language: TypeScript
  - Styling: Tailwind CSS, Headless UI (or Radix UI) for accessible components.
  - Markdown Editor: CodeMirror 6 for advanced features, extensibility, and performance.
  - Markdown Renderer: `react-markdown` with `remark-gfm`, `rehype-sanitize` (configured for allowed tags/attributes), and custom plugins for diagrams (Mermaid.js, PlantUML client-side rendering or server-side generation) and syntax highlighting (`rehype-highlight`).
  - HTTP Client: `Workspace` API (native) or a lightweight wrapper like `ky`. API calls will be to relative paths like `/api/...`.
  - State Management: Zustand or Jotai for global state; React Context for localized state.
  - Voice Recording: Native browser `MediaRecorder` API.
  - Real-time Collaboration: Yjs for CRDTs, with a WebSocket provider (e.g., `y-websocket` client) connecting to the WebSocket endpoint on the `nextjs-app` itself (e.g., `/ws` or handled by a custom server integrated with Next.js).
  - Offline Mode: Service Workers for caching assets and API responses. IndexedDB (via a library like `Dexie.js`) for storing note data, Yjs state, and pending operations.
- **Key Modules/Pages:**
  - Authentication (Login, Register, Password Reset)
  - Dashboard/File Explorer (Folders, Notes hierarchy)
  - Note Editor (Markdown input, real-time preview, collaboration features, version history access)
  - AI Configuration Settings (Manage API providers, models, keys)
  - AI Chat Interface (Contextual chat with notes)
  - Voice Recorder UI (Record, playback, initiate transcription)
  - Sharing/Permissions Modal (Invite users, manage access levels, public links)
  - User Profile/Settings
  - Webhook Management UI
- **UI Indicators:**
  - Offline/Online status indicator.
  - Sync status for offline changes (e.g., "Syncing...", "All changes saved").
  - Presence indicators for collaborative editing.
- **Data Flow:** Client-side routing (Next.js App Router), form submissions, API calls to internal Next.js API routes (`/api/...`). WebSocket connections for real-time updates and collaboration.

**5.2. Backend Logic (within `nextjs-app`)**

- **Purpose:** Core application logic, data persistence, dynamic AI service orchestration, real-time collaboration server, webhook dispatch. All implemented within the Next.js application structure using API Routes and potentially a custom server for advanced WebSocket handling.
- **Technology Stack:**
  - Runtime: Node.js (as part of Next.js)
  - Language: TypeScript
  - API Framework: Next.js API Routes (App Router).
  - ORM/QueryBuilder: Prisma.
  - Password Hashing: Argon2id (using a library like `argon2`).
  - Authentication: JWT handling (e.g., `jsonwebtoken`, `jose` libraries) within API routes.
  - Permission Management: CASL (or similar attribute-based access control library).
  - File Uploads (for audio): Handled by Next.js API routes (e.g., using `formidable` or similar).
  - PDF Generation: Puppeteer (run in a sandboxed environment, dependencies included in the Next.js app's Docker image).
  - AI Orchestration: Langchain.js (for RAG pipeline construction), `axios` or `node-fetch` (for HTTP client communication with external AI services).
  - Encryption: Node.js `crypto` module (AES-256 GCM) for API key encryption.
  - Real-time Collaboration: WebSockets. A WebSocket server (e.g., using `ws` package, compatible with `y-websocket` server component) integrated with Next.js. This may require a custom Next.js server (`server.js`) to manage WebSocket connections alongside Next.js request handling.
  - Webhooks: Implement a webhook manager to dispatch events. Use a robust HTTP client for sending POST requests. Consider a queue (e.g., Redis-based like BullMQ, if an external Redis service is added) for reliable webhook delivery.
  - Observability: Logging with Pino (or another structured logger compatible with Next.js), metrics collection (Prometheus compatible, e.g., via a custom server endpoint), tracing with OpenTelemetry SDK.
- **Core Logic & Algorithms:**
  - **Authentication & Authorization:** Standard JWT issuance and validation in API routes. CASL for granular permission checks on resources.
  - **CRUD Operations:** Prisma for all database interactions, called from API routes.
  - **User AI Configuration Management:**
    - Secure storage: Encryption of `api_key` using `APP_ENCRYPTION_KEY` before database persistence; decryption only when needed to make an API call. Logic resides in server-side modules.
  - **RAG Pipeline (using Langchain.js):**
    - A. **Document Ingestion & Indexing:**
      - Text Splitting: `RecursiveCharacterTextSplitter` or Markdown-aware splitter (e.g., `MarkdownTextSplitter` from Langchain) for chunking.
      - Embedding Generation: Use the user's selected embedding API/model via Langchain integrations.
      - Storage: Store chunks and their vector embeddings in `note_chunks` (PostgreSQL with pgvector).
    - B. **Retrieval & Generation (AI Chat):**
      - Query Embedding: Embed user query using the same model as document chunks.
      - Retrieval: pgvector k-NN search (cosine similarity or inner product) on `note_chunks`, filtered by user access permissions to the source notes.
      - Semantic Search Refinements:
        - _Re-ranking (Optional):_ After initial retrieval, pass top N chunks to a small, fast LLM (user-configurable or a default one like a small model via Ollama if the user set it up) to re-rank for relevance before passing to the main LLM.
        - _Query Expansion/Rewriting (Optional):_ Before embedding, use an LLM to rewrite or expand the user's query (e.g., HyDE - Hypothetical Document Embeddings approach).
      - Prompt Construction: Use Langchain's prompt templates to combine retrieved context, chat history, and user query.
      - LLM Inference: Call the user's selected chat API/model with the constructed prompt.
  - **Voice Transcription Integration:**
    - Receive audio file (e.g., WebM, MP3 via `formidable`).
    - Call user's selected transcription API with the audio data.
    - Create a new note with transcribed text.
    - Trigger RAG indexing for the new note.
  - **Real-time Collaboration Logic (Yjs):**
    - WebSocket Server: Handle client connections and Yjs protocol messages. This would be part of the custom Next.js server setup.
    - Document State Management: Persist Yjs document updates efficiently to the database (e.g., periodically or on significant changes) to allow for recovery and asynchronous collaboration. Store full document state or deltas. The `notes.content_markdown` could store a serialized version of the Yjs document or the rendered Markdown. `notes.version` can be managed by Yjs or a separate mechanism if optimistic locking is also desired at the application level.
    - Authentication: Secure WebSocket connections (e.g., using JWT passed during handshake, verified by the custom server).
  - **AI Usage Tracking:**
    - When an API route makes an AI API call, parse the response (if provider includes token usage, e.g., OpenAI API) for input/output tokens.
  - **Webhook Management:**
    - API endpoints to create, read, update, delete webhook configurations.
    - Event Emitter: Internal event system to capture relevant actions (e.g., `note.created`, `note.updated`).
    - Dispatch Logic: On event, iterate through matching webhooks, construct payload, sign it with HMAC-SHA256 using the webhook's secret, and send HTTP POST. Implement retries with backoff for failed deliveries, possibly using a job queue.
  - **Note Versioning:**
    - On note save (especially non-collaborative or as a snapshot from Yjs), create a new version entry if content changes significantly.
    - Store diffs or full snapshots depending on storage/performance trade-offs.
- **API Endpoints (Examples - RESTful where appropriate):**
  - Auth: `/api/auth/register`, `/api/auth/login`, `/api/auth/refresh-token`, `/api/auth/recover-password`, `/api/auth/reset-password`
  - Users: `/api/users/me`
  - Folders: `/api/folders`, `/api/folders/{folderId}`
  - Notes: `/api/notes`, `/api/notes/{noteId}`, `/api/notes/{noteId}/versions`, `/api/notes/{noteId}/versions/{versionId}`
  - Sharing/Permissions: `/api/notes/{noteId}/share`, `/api/folders/{folderId}/share`, `/api/invitations`, `/api/invitations/{invitationId}/accept`
  - AI: `/api/ai/chat`, `/api/ai/transcribe-voice`
  - AI Configurations: `/api/ai-configs`, `/api/ai-configs/{configId}`, `/api/ai-configs/{configId}/models` (to list/test models)
  - Webhooks: `/api/webhooks`, `/api/webhooks/{webhookId}`
  - AI Usage: `/api/ai-usage-logs` (for user's own logs, admin view if applicable)
  - WebSocket: `/ws` (path handled by the custom Next.js server for real-time collaboration)

**5.3. Database: `postgres` with `pgvector`**

- **Purpose:** Centralized, persistent storage for all structured application data, vector embeddings, and encrypted user-specific AI configurations.
- **Technology Stack:** PostgreSQL 16+ with `pgvector` extension (latest compatible version).
- **Schema Design (Conceptual - Key Tables):**
  - `users`:
    - `id` (UUID, PK)
    - `email` (TEXT, UNIQUE, NOT NULL)
    - `password_hash` (TEXT, NOT NULL)
    - `created_at` (TIMESTAMPTZ, DEFAULT NOW())
    - `updated_at` (TIMESTAMPTZ, DEFAULT NOW())
  - `folders`:
    - `id` (UUID, PK)
    - `name` (TEXT, NOT NULL)
    - `parent_folder_id` (UUID, FK to `folders.id`, nullable for root folders)
    - `owner_id` (UUID, FK to `users.id`, NOT NULL)
    - `created_at` (TIMESTAMPTZ, DEFAULT NOW())
    - `updated_at` (TIMESTAMPTZ, DEFAULT NOW())
  - `notes`:
    - `id` (UUID, PK)
    - `title` (TEXT, NOT NULL)
    - `content_markdown` (TEXT)
    - `yjs_doc_state` (BYTEA, nullable, for Yjs document persistence if storing binary state)
    - `folder_id` (UUID, FK to `folders.id`, nullable)
    - `owner_id` (UUID, FK to `users.id`, NOT NULL)
    - `is_public` (BOOLEAN, DEFAULT FALSE)
    - `public_share_token` (TEXT, UNIQUE, nullable)
    - `current_version_id` (UUID, FK to `note_versions.id`, nullable)
    - `created_at` (TIMESTAMPTZ, DEFAULT NOW())
    - `updated_at` (TIMESTAMPTZ, DEFAULT NOW())
  - `note_versions`:
    - `id` (UUID, PK)
    - `note_id` (UUID, FK to `notes.id` ON DELETE CASCADE, NOT NULL)
    - `content_diff` (JSONB, or TEXT for full content)
    - `created_at` (TIMESTAMPTZ, DEFAULT NOW())
    - `author_id` (UUID, FK to `users.id`, nullable if system-generated)
  - `note_chunks`:
    - `id` (UUID, PK)
    - `note_id` (UUID, FK to `notes.id` ON DELETE CASCADE, NOT NULL)
    - `chunk_text` (TEXT, NOT NULL)
    - `embedding` (vector(DIMENSION_SIZE), NOT NULL) \* `created_at` (TIMESTAMPTZ, DEFAULT NOW())
  - `permissions`: \* `id` (UUID, PK)
    - `user_id` (UUID, FK to `users.id` ON DELETE CASCADE, NOT NULL)
    - `entity_type` (TEXT, NOT NULL, e.g., 'note', 'folder')
    - `entity_id` (UUID, NOT NULL) \* `access_level` (TEXT, NOT NULL, e.g., 'view', 'edit')
    - `created_at` (TIMESTAMPTZ, DEFAULT NOW())
    - UNIQUE (`user_id`, `entity_type`, `entity_id`)
  - `invitations`:
    - `id` (UUID, PK)
    - `inviter_id` (UUID, FK to `users.id` ON DELETE CASCADE, NOT NULL)
    - `invitee_email` (TEXT, NOT NULL)
    - `entity_type` (TEXT, NOT NULL)
    - `entity_id` (UUID, NOT NULL)
    - `access_level` (TEXT, NOT NULL)
    - `status` (TEXT, NOT NULL, e.g., 'pending', 'accepted', 'declined', DEFAULT 'pending')
    - `token` (TEXT, UNIQUE, NOT NULL) \* `expires_at` (TIMESTAMPTZ, NOT NULL)
    - `created_at` (TIMESTAMPTZ, DEFAULT NOW())
  - `user_ai_configs`:
    - `id` (UUID, PK)
    - `user_id` (UUID, FK to `users.id` ON DELETE CASCADE, NOT NULL)
    - `name` (TEXT, NOT NULL) \* `api_provider_type` (TEXT, NOT NULL, e.g., 'openai', 'ollama', 'azure_openai', 'custom_openai_compatible')
    - `base_url` (TEXT, nullable)
    - `encrypted_api_key` (BYTEA, nullable) _ `models_config` (JSONB, nullable) _ `is_default_chat` (BOOLEAN, DEFAULT FALSE)
    - `is_default_embedding` (BOOLEAN, DEFAULT FALSE)
    - `is_default_transcription` (BOOLEAN, DEFAULT FALSE)
    - `created_at` (TIMESTAMPTZ, DEFAULT NOW())
    - `updated_at` (TIMESTAMPTZ, DEFAULT NOW())
    - UNIQUE (`user_id`, `name`)
  - `ai_usage_logs`:
    - `id` (UUID, PK)
    - `user_id` (UUID, FK to `users.id` ON DELETE CASCADE, NOT NULL)
    - `ai_config_id` (UUID, FK to `user_ai_configs.id` ON DELETE SET NULL, nullable)
    - `model_id` (TEXT, NOT NULL) \* `request_type` (TEXT, NOT NULL, e.g., 'chat', 'embedding', 'transcription')
    - `input_tokens` (INTEGER, nullable)
    - `output_tokens` (INTEGER, nullable)
    - `cost_estimate_usd` (DECIMAL(10, 6), nullable) \* `timestamp` (TIMESTAMPTZ, DEFAULT NOW())
  - `webhooks`:
    - `id` (UUID, PK)
    - `user_id` (UUID, FK to `users.id` ON DELETE CASCADE, NOT NULL)
    - `name` (TEXT, NOT NULL)
    - `target_url` (TEXT, NOT NULL) _ `encrypted_secret` (BYTEA, nullable) _ `events` (TEXT[], NOT NULL) \* `is_active` (BOOLEAN, DEFAULT TRUE)
    - `created_at` (TIMESTAMPTZ, DEFAULT NOW())
    - `updated_at` (TIMESTAMPTZ, DEFAULT NOW())
- **Indexing Strategy:**
  - Primary Keys: Automatically indexed.
  - Foreign Keys: B-tree indexes on all FKs for join performance.
  - `note_chunks.embedding`: HNSW or IVFFlat index using `pgvector` (choose based on dataset size and recall/performance needs). `USING hnsw (embedding vector_cosine_ops)` or `vector_ip_ops`.
  - `users.email`: Unique B-tree index.
  - `notes.title`, `notes.owner_id`, `notes.folder_id`: B-tree indexes. Consider `GIN` index on `content_markdown` for full-text search if using PostgreSQL's FTS.
  - `ai_usage_logs.user_id`, `ai_usage_logs.timestamp`: Composite B-tree index for querying user-specific logs over time.
  - `permissions`: Composite index on (`entity_type`, `entity_id`, `user_id`).
  - `invitations.token`: Unique B-tree index.
  - Trigger for `updated_at`: Use `CREATE TRIGGER set_timestamp BEFORE UPDATE ON table_name EXECUTE PROCEDURE trigger_set_timestamp();` function.

---

### 6. Docker Compose Deployment

The `docker-compose.yml` provides a streamlined setup for the Next.js application and its PostgreSQL database. A reverse proxy like Nginx or Caddy is recommended in front for production (handling SSL, etc.) but not included in this basic setup for brevity.

```yaml
version: "3.9"

services:
  # OPTIONAL but Recommended: Reverse Proxy (e.g., Nginx or Caddy)
  # nginx-proxy:
  #   image: nginx:alpine
  #   ports:
  #     - "80:80"
  #     - "443:443"
  #   volumes:
  #     - ./nginx/nginx.conf:/etc/nginx/nginx.conf:ro
  #     - ./nginx/certs:/etc/nginx/certs:ro # For SSL certificates
  #   depends_on:
  #     - nextjs-app

  # 1. Next.js Application (Frontend & Backend API)
  nextjs-app:
    build:
      context: . # Assuming Dockerfile is at the root of the Next.js project
      dockerfile: Dockerfile
    ports:
      - "3000:3000" # Exposed directly or via reverse proxy
    environment:
      # Frontend specific (can be prefixed with NEXT_PUBLIC_)
      NEXT_PUBLIC_APP_NAME: "MyNotesApp"
      # Backend specific (not prefixed with NEXT_PUBLIC_ unless needed by client)
      DATABASE_URL: ${DATABASE_URL}
      JWT_SECRET: ${JWT_SECRET}
      APP_ENCRYPTION_KEY: ${APP_ENCRYPTION_KEY} # For encrypting API keys and other sensitive data
      # Webhook queue configuration (e.g., Redis URL if using BullMQ and Redis service)
      # REDIS_URL: ${REDIS_URL:-redis://redis:6379}
      # Logging/Metrics/Tracing config
      LOG_LEVEL: ${LOG_LEVEL:-info}
      NODE_ENV: ${NODE_ENV:-development}
      # For Next.js custom server if used (e.g. for WebSockets)
      PORT: ${PORT:-3000}
      HOSTNAME: ${HOSTNAME:-localhost}
    depends_on:
      postgres:
        condition: service_healthy
      # redis: # If using Redis for queues/caching
      #   condition: service_healthy
    volumes:
      - .:/app # Mount current directory for development; adjust for production
      - /app/node_modules # Exclude node_modules from host mount
      - /app/.next # Exclude .next from host mount
      # - app_data:/app/data # For temporary files, logs if not sent to stdout and if needed
    restart: unless-stopped
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:3000/api/health"] # Assuming a /api/health endpoint
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 60s

  # 2. Database: PostgreSQL with pgvector
  postgres:
    image: pgvector/pgvector:pg16 # Pre-built image with pgvector for Postgres 16
    ports:
      - "${POSTGRES_PORT:-5432}:5432" # Optional: Expose Postgres for local tools
    environment:
      POSTGRES_USER: ${POSTGRES_USER}
      POSTGRES_PASSWORD: ${POSTGRES_PASSWORD}
      POSTGRES_DB: ${POSTGRES_DB}
    volumes:
      - postgres_db_data:/var/lib/postgresql/data # Persistent data volume
    restart: unless-stopped
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U ${POSTGRES_USER} -d ${POSTGRES_DB}"]
      interval: 10s
      timeout: 5s
      retries: 5

  # Optional: Redis for caching, job queues (webhooks, Yjs state persistence)
  # redis:
  #   image: redis:7-alpine
  #   ports:
  #     - "6379:6379"
  #   volumes:
  #     - redis_data:/data
  #   restart: unless-stopped
  #   healthcheck:
  #     test: ["CMD", "redis-cli", "ping"]
  #     interval: 5s
  #     timeout: 2s
  #     retries: 5

volumes:
  postgres_db_data:
  # app_data: # If used for persistent application data outside of DB
  # redis_data:
```

**Deployment Steps for v.0.1:**

1.  **Project Setup:** Ensure your Next.js project has a `Dockerfile`. If using a custom server for WebSockets, ensure it's correctly set up and used in the Dockerfile's CMD. Optionally, create an `nginx` directory for proxy configuration.
2.  **Environment File:** Create a `.env` file at the project root (`./.env`) with variables like:

    ```env
    # General
    NODE_ENV=development # or production
    LOG_LEVEL=info
    PORT=3000
    HOSTNAME=localhost

    # Next.js App (Backend Logic)
    DATABASE_URL="postgresql://notesuser:strongnotespassword@postgres:5432/notesdb"
    JWT_SECRET="your_very_strong_jwt_secret_here_at_least_64_chars_long_and_random"
    APP_ENCRYPTION_KEY="your_strong_32_byte_random_encryption_key_for_aes_256_gcm" # Must be exactly 32 chars (256 bits)

    # PostgreSQL
    POSTGRES_USER="notesuser"
    POSTGRES_PASSWORD="strongnotespassword"
    POSTGRES_DB="notesdb"
    POSTGRES_PORT="5432" # Optional: if you want to map it to a different host port

    # Redis (if used)
    # REDIS_URL="redis://redis:6379"
    ```

    **Crucial:** Generate cryptographically secure random values for `JWT_SECRET` and `APP_ENCRYPTION_KEY` for production. Use Docker secrets or a dedicated secrets management tool for production environments instead of `.env` files directly in containers.

3.  **Build & Run:** Navigate to the project root and execute: `docker-compose up --build -d`
4.  **Access:** Open your web browser to `http://localhost:3000` (or the port configured for your reverse proxy).

---

### 7. Security Considerations

- **HTTPS/WSS:** Mandatory for production. Use a reverse proxy (e.g., Nginx, Caddy, Traefik) to handle SSL/TLS termination.
- **Password Hashing:** Use **Argon2id** (preferred) or bcrypt with a high cost factor.
- **User API Key Encryption:**
  - Mechanism: AES-256 GCM using Node.js `crypto` module for authenticated symmetric encryption.
  - Key Management: `APP_ENCRYPTION_KEY` is critical. Store it as an environment variable, ideally injected via Docker secrets or a secure vault in production. Never commit to version control.
- **Authentication & Authorization:** JWTs for stateless session management. Granular permissions via CASL (or similar) on all Next.js API routes and WebSocket channels (if using custom server).
- **Input Validation & Sanitization:**
  - Validate all incoming data (body, params, query) in API routes using libraries like Zod.
  - Sanitize Markdown content on the server-side before storage or rendering (if server-rendering parts of it) and potentially on the client-side (e.g., `rehype-sanitize` or DOMPurify) before rendering to prevent XSS.
- **Rate Limiting:** Implement on authentication endpoints, API key configuration, and other sensitive or resource-intensive operations (e.g., using `fastify-rate-limit`).
- **CSRF Protection:** For traditional form submissions if any (Next.js often uses client-side fetches which can be protected differently). If using cookies for auth, ensure `SameSite` attributes are set correctly. JWTs in headers are generally not susceptible if cookies aren't the primary auth mechanism.
- **Webhook Security:**
  - Outgoing: Sign webhook payloads with HMAC-SHA256 using a user-configurable secret (`webhooks.encrypted_secret`).
  - User Responsibility: Advise users to use HTTPS for their webhook URLs and validate signatures.
- **Data Privacy (AI):** Clearly communicate that the application facilitates connections to user-chosen AI providers and does not handle AI inference directly. Users are responsible for the data policies and costs of their configured services.
- **Dependency Management:** Regularly scan dependencies for vulnerabilities (e.g., `npm audit`, Snyk, Dependabot).
- **Docker Security:**
  - Use official/verified base images.
  - Run containers as non-root users.
  - Keep images updated.
- **Content Security Policy (CSP):** Implement a strict CSP to mitigate XSS and other injection attacks.
- **HTTP Security Headers:** Use headers like `X-Content-Type-Options`, `X-Frame-Options`, `Strict-Transport-Security` (HSTS).

---

### 8. Testing Strategy

- **Unit Tests:** (Jest, Vitest)
  - Frontend (React Testing Library): Test individual React components, utility functions, state management logic.
  - Backend: Test individual server-side modules/utilities, API route handlers, API key encryption/decryption, permission logic (CASL rules), RAG pipeline components (chunking, prompt construction).
- **Integration Tests:** (Supertest for API routes, Vitest/Jest with DB test containers)
  - Backend: Test API routes, interactions between API logic and `postgres`, RAG pipeline flow with mock AI services or local Ollama. Test WebSocket connection (if custom server) and basic message passing. Test webhook triggering and signature generation with a mock receiver.
- **End-to-End (E2E) Tests:** (Playwright, Cypress)
  - Simulate full user flows: registration, login, note creation/editing (including Markdown features), folder management, AI configuration, real-time collaboration sessions (multiple users), voice transcription, semantic search, offline mode activation/sync, webhook creation and event triggering.
- **Performance Tests:** (k6, Artillery, Apache JMeter)
  - Focus on `nextjs-app` throughput, `postgres` query performance (especially vector search), and WebSocket concurrency and message latency.
- **Security Testing:**
  - Static Analysis Security Testing (SAST) tools.
  - Dynamic Analysis Security Testing (DAST) tools (e.g., OWASP ZAP).
  - Penetration testing (manual or automated) for common vulnerabilities.
  - Verify API key encryption/decryption, access control logic, input validation, and webhook signature verification.
- **Usability Testing/User Acceptance Testing (UAT):**
  - Manual testing with target users to verify complex workflows, intuitiveness of UI/UX, AI feature usability, collaboration experience, and offline mode behavior.

---

### 9. Risk Assessment

| Risk Category     | Identified Risks                                                                                                 | Mitigation Strategies                                                                                                                                                                                                                                                                                                                                                                           |
| :---------------- | :--------------------------------------------------------------------------------------------------------------- | :---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Technical**     | External AI API Latency/Downtime: App performance impacted by user's chosen AI providers.                        | Robust Error Handling: Implement retries with exponential backoff, circuit breakers, timeouts. Clear UI feedback if AI API is slow/unavailable. Caching: Cache embedding vectors. User Choice: Allow easy switching between configured AI APIs.                                                                                                                                                 |
|                   | `pgvector` Performance Limits: Potential bottlenecks with extremely large datasets (e.g., >100M vectors).        | Monitor Performance: Database query monitoring. Proper Indexing: Ensure HNSW/IVFFlat index is optimized. Scalability Plan: Document potential for read replicas, sharding, or future migration to dedicated vector databases if necessary. Limit query scope where possible.                                                                                                                    |
|                   | RAG Pipeline Complexity: Debugging issues in chunking, embedding accuracy, retrieval relevance, prompt crafting. | Modular Design: Isolate RAG components. Comprehensive Logging & Tracing: Detailed logs at each stage. Evaluation Framework: Develop an offline evaluation framework for RAG quality. Prompt Engineering: Version control prompts, allow A/B testing if possible.                                                                                                                                |
|                   | Real-time Collaboration Conflicts (Yjs): Data inconsistencies if Yjs persistence or network handling is flawed.  | Robust Yjs Implementation: Use established Yjs providers and persistence patterns. If using `y-websocket` with a custom Next.js server, ensure proper integration. Test thoroughly for edge cases (network interruptions, rapid conflicting edits). Version History: Supplement with note versions for manual rollback capability.                                                              |
|                   | Offline Sync Challenges: Data consistency, conflict resolution, large data sync.                                 | CRDT-based Sync: Leverage Yjs for conflict resolution. Clear Sync Logic: Incremental syncs. Robust Error Handling & UI Feedback: Inform users of sync status and any unresolved conflicts. Throttling/Batching: For large initial syncs or many pending changes. Rigorous testing of offline/online transitions.                                                                                |
|                   | PDF Generation Failures/Performance: Puppeteer can be resource-intensive.                                        | Asynchronous Processing: Generate PDFs in a background job/API route. Resource Management: Limit concurrent PDF generation tasks within Next.js server capabilities. Error Handling: Graceful error reporting. Consider alternative lightweight PDF libraries if Puppeteer is overkill for simple Markdown.                                                                                     |
| **Security**      | Insecure Storage/Handling of User AI API Keys: Compromise leads to misuse of user's AI accounts.                 | Mandatory Encryption: AES-256 GCM for API keys at rest. Secure `APP_ENCRYPTION_KEY` via environment variables/Docker secrets. Decryption on Demand: Keys decrypted only in memory by server-side logic when making requests. Least Privilege: Ensure server-side processes handling keys have minimal necessary permissions. Audit key access.                                                  |
|                   | Webhook Abuse: SSRF if target URLs are not validated; DoS if many webhooks are triggered rapidly.                | URL Validation: Validate webhook target URLs (e.g., deny internal network IPs) in API route logic. Rate Limiting: Limit webhook creation and firing frequency. Asynchronous Dispatch: Use a queue for webhook processing to absorb bursts (may require external service like Redis). User Responsibility: Educate users on securing their webhook endpoints.                                    |
|                   | Inadequate Input Sanitization: XSS through Markdown or other user inputs.                                        | Strict Sanitization: Use robust libraries (e.g., DOMPurify client-side, `rehype-sanitize` server-side) with a tight allow-list for HTML in Markdown. Validate all inputs. Content Security Policy (CSP).                                                                                                                                                                                        |
| **Operational**   | Data Loss/Corruption: Database failure, bugs in sync logic.                                                      | Automated Backups: Regular, automated database backups (e.g., pg_dump) with tested restore procedures. Point-in-Time Recovery (PITR) if feasible. Data Integrity Checks.                                                                                                                                                                                                                        |
|                   | Scalability Bottlenecks: Any component (API, DB, WebSocket server) hitting limits under load.                    | Monitoring & Alerting: Proactive monitoring of resource usage and performance metrics. Horizontal Scaling: Design API routes to be stateless for easier scaling (Next.js default on serverless platforms, ensure for containerized deployments). Database Optimization: Query optimization, connection pooling, read replicas. Load Testing: Regular performance tests to identify bottlenecks. |
| **User Adoption** | Complexity of AI Configuration: Users may find it difficult to set up their own AI providers.                    | Clear Documentation & UI/UX: Step-by-step guides, tooltips, pre-filled examples for common providers (Ollama, OpenAI). Test Connection Feature: Allow users to test their AI configuration from the UI (via an API route). Community Support/Forums.                                                                                                                                            |

**AI Interaction Flow (Conceptual - RAG & Transcription Focus):**

```mermaid
graph TD
    subgraph User Action
        U["User Initiates Action (Chat, Save Note, Upload Audio)"]
    end

    U -- Chat Query / Note Content / Audio File --> App["Next.js App (API Routes and Server Logic)"]

    subgraph "Next.js App Processing"
        App -- Determines Operation --> C{AI Operation Type?}

        C -- Chat Request --> ChatPath_Start
        C -- Note Create/Update (for Indexing) --> IndexingPath_Start
        C -- Audio Upload (for Transcription) --> TranscriptionPath_Start

        subgraph "RAG - Chat Process"
            ChatPath_Start["1. Get User's AI Config (DB, Decrypt Key)"]
            ChatPath_Start -- Config --> ChatPath_EmbedQuery["2. Embed User Query (via User's Ext. Embedding Model)"]
            ChatPath_EmbedQuery -- Embedded Query --> ChatPath_VectorSearch["3. Vector Search in Postgres (pgvector - Cosine Similarity/IP, filtered by permissions)"]
            ChatPath_VectorSearch -- Relevant Chunks --> ChatPath_ConstructPrompt["4. Construct Contextual Prompt (Chunks + Query + History)"]
            ChatPath_ConstructPrompt -- Prompt --> ChatPath_CallLLM["5. Call User's Ext. LLM API (Chat Model, using decrypted key)"]
            ChatPath_CallLLM -- LLM Response --> ChatPath_RecordUsage["6. Record AI Usage (tokens, model) in DB"]
            ChatPath_RecordUsage -- Formatted Response --> ChatPath_End[7. Return AI Response to User]
        end

        subgraph "RAG - Indexing Process"
            style IndexingPath fill:#ddf,stroke:#333,stroke-width:2px
            IndexingPath_Start["1. Get User's AI Config (DB, Decrypt Key)"]
            IndexingPath_Start -- Note Content & Config --> IndexingPath_Split["2. Split Note into Chunks (Text Splitter)"]
            IndexingPath_Split -- Chunks --> IndexingPath_EmbedChunks["3. Get Chunk Embeddings (via User's Ext. Embedding Model)"]
            IndexingPath_EmbedChunks -- Embedded Chunks --> IndexingPath_StoreEmbeddings["4. Store Chunks & Embeddings in Postgres (pgvector)"]
            IndexingPath_StoreEmbeddings --> IndexingPath_RecordUsage["5. Record AI Usage (tokens, model) in DB"]
            IndexingPath_RecordUsage --> IndexingPath_End[Indexing Complete]
        end

        subgraph "Transcription Process"
            TranscriptionPath_Start["1. Get User's AI Config (DB, Decrypt Key)"]
            TranscriptionPath_Start -- Audio File & Config --> TranscriptionPath_CallAPI["2. Call User's Ext. Transcription API (using decrypted key)"]
            TranscriptionPath_CallAPI -- Transcribed Text --> TranscriptionPath_SaveNote[3. Save Transcribed Text as New Note]
            TranscriptionPath_SaveNote -- triggers --> IndexingPath_Start
            %% Trigger RAG Indexing for the new note
            TranscriptionPath_SaveNote -- Transcribed Text & Usage Info --> TranscriptionPath_RecordUsage["4. Record AI Usage (duration/chars, model) in DB"]
            TranscriptionPath_RecordUsage -- New Note Info --> TranscriptionPath_End[5. Return New Note Info to User]
        end

        ChatPath_Start -- Failed Config --> Error["Error: Config Invalid/Unavailable"]
        IndexingPath_Start -- Failed Config --> Error["Error: Config Invalid/Unavailable"]
        TranscriptionPath_Start -- Failed Config --> Error["Error: Config Invalid/Unavailable"]
        Error --> App
    end

    App -- Response/Status --> U
```
