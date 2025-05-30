# 🧠 Noteworthy: Your Self-Hosted, AI-Powered Knowledge Hub 🚀

### Take control of your notes, your data, and your AI.

[![Project Status: Pre-Development](https://img.shields.io/badge/status-pre--development-orange.svg)](./BACKLOG.md)
[![GitHub last commit](https://img.shields.io/github/last-commit/ncls-p/notes)](https://github.com/ncls-p/notes/commits/main)
[![GitHub issues](https://img.shields.io/github/issues/ncls-p/notes)](https://github.com/ncls-p/notes/issues)
[![GitHub stars](https://img.shields.io/github/stars/ncls-p/notes?style=social)](https://github.com/ncls-p/notes/stargazers)
[![License: MIT (Placeholder)](https://img.shields.io/badge/License-MIT-yellow.svg)](./LICENSE.md) <!-- To be created -->

---

**Noteworthy** is a next-generation, self-hosted note-taking application designed for privacy-conscious individuals and teams who want to leverage the power of AI _on their own terms_. Bring your own AI models (OpenAI, Ollama, Groq, Azure OpenAI, etc.), chat with your documents using advanced Retrieval-Augmented Generation (RAG), transcribe voice notes effortlessly, and collaborate in real-time, all while maintaining full ownership of your data. Secure, flexible, and powerful – Noteworthy aims to be the ultimate personal and collaborative knowledge management system.

---

## 📋 Table of Contents

- [🧠 Noteworthy: Your Self-Hosted, AI-Powered Knowledge Hub 🚀](#-noteworthy-your-self-hosted-ai-powered-knowledge-hub-)
    - [Take control of your notes, your data, and your AI.](#take-control-of-your-notes-your-data-and-your-ai)
  - [📋 Table of Contents](#-table-of-contents)
  - [🌟 Key Features](#-key-features)
  - [🛠️ Tech Stack](#️-tech-stack)
  - [🏗️ Architecture Overview](#️-architecture-overview)
  - [🚀 Getting Started](#-getting-started)
    - [Prerequisites](#prerequisites)
    - [Installation \& Setup](#installation--setup)
    - [Running the App](#running-the-app)
    - [Kubernetes Deployment with Helm](#kubernetes-deployment-with-helm)
      - [Using the Deploy Script](#using-the-deploy-script)
      - [Prerequisites for Kubernetes Deployment](#prerequisites-for-kubernetes-deployment)
      - [Post-Deployment](#post-deployment)
      - [Manual Helm Deployment](#manual-helm-deployment)
  - [📈 Project Status](#-project-status)
  - [🗺️ Roadmap](#️-roadmap)
  - [📖 API Documentation](#-api-documentation)
    - [Authentication Endpoints](#authentication-endpoints)
      - [`POST /api/auth/register`](#post-apiauthregister)
      - [`POST /api/auth/login`](#post-apiauthlogin)
  - [🤝 Contributing](#-contributing)
  - [📜 License](#-license)
  - [🧑‍💻 Author](#-author)
  - [🔗 Important Links](#-important-links)

---

## 🌟 Key Features

- 🔐 **Self-Hosted & Secure:** Full data ownership. Deploy with Docker, encrypt your AI keys.
- 📝 **Advanced Markdown Editor:** Real-time preview, tables, diagrams (Mermaid, PlantUML), syntax highlighting.
- 🗂️ **Versatile Organization:** Nested folders, note movement, PDF export, version history.
- 🤝 **Real-Time Collaboration:** Edit notes simultaneously with presence indicators (powered by Yjs).
- 🔗 **Granular Sharing & Permissions:** Public links, invite registered users with view/edit access.
- 🤖 **User-Configurable AI:** Connect YOUR OpenAI, Ollama, Groq, Azure, or any OpenAI-compatible LLM.
- 💬 **Contextual AI Chat (RAG):** Chat _with your notes_ using your chosen LLMs and embedding models.
- 🎤 **Voice-to-Text Transcription:** Record voice notes and transcribe them using your chosen AI service.
- 🔍 **Powerful Search:** Keyword-based full-text search and semantic search capabilities.
- 💸 **Optional AI Cost Tracking:** Monitor token usage for your configured AI services (provider-dependent).
- 🌐 **Offline Mode:** Basic note-taking (CRUD) and viewing even when offline, with automatic synchronization upon reconnection.
- 훅 **Webhooks:** Trigger external actions based on configurable note events (e.g., `note.created`, `note.updated`).
- 🛡️ **Built for Security:** Emphasis on HTTPS, strong password hashing (Argon2id), encrypted API keys, and resilience against common web vulnerabilities (OWASP Top 10).

---

## 🛠️ Tech Stack

A modern, robust, and type-safe stack:

- 💻 **Frontend:** Next.js (App Router), React, TypeScript, Tailwind CSS, CodeMirror 6, Yjs, Zustand/Jotai.
- ⚙️ **Backend:** Node.js, Fastify, TypeScript, Prisma (ORM), Langchain.js, Yjs, Argon2id (hashing).
- 🗄️ **Database:** PostgreSQL (16+) with the `pgvector` extension for efficient similarity search.
- 🐳 **Deployment:** Docker Compose for easy, multi-container setup.
- 📊 **Observability:** Structured Logging (Pino), Prometheus-compatible Metrics, OpenTelemetry Tracing.

---

## 🏗️ Architecture Overview

Noteworthy employs a microservice-oriented architecture, containerized with Docker. The core idea is that _you_ provide and manage your AI model integrations, ensuring data privacy and cost control.

```mermaid
graph TD
    A["User's Browser (Client)"] -- HTTP/S, WebSocket --> B["nginx-proxy (Reverse Proxy, Optional)"]

    subgraph "Docker Network (Managed by docker-compose)"
        B -- HTTP/S (Frontend & API), WSS (Collaboration) --> C["nextjs-app (Combined Frontend & Backend Container)"]

        C -- SQL Queries --> E["postgres (DB Container with pgvector)"]

        subgraph "User-Provided AI Integration"
            C -- Retrieves User's AI Config (from DB) --> E
            E -- Encrypted API Keys & Config --> C
            C -- Decrypts & Uses Config --> F["External AI Service (OpenAI, User's Ollama, Groq, etc.)"]
        end
    end
```

_For a more in-depth look at the system design, please refer to our [Detailed Application Design (DAT.md)](./DAT.md#4-overall-architecture)._

---

## 🚀 Getting Started

Get your Noteworthy instance up and running with these steps:

### Prerequisites

- [Git](https://git-scm.com/)
- [Docker](https://www.docker.com/get-started) & [Docker Compose](https://docs.docker.com/compose/install/)
- (Optional) Node.js & npm/yarn/pnpm for local development outside Docker.

### Installation & Setup

1.  **Clone the Repository:**

    ```bash
    git clone https://github.com/ncls-p/notes.git
    cd notes
    ```

2.  **Configure Environment Variables:**
    The application requires several environment variables for configuration (database credentials, security keys, etc.). We use a `.env` file for this.
    A `docker-compose.yml` is provided, and it expects a `.env` file in the project root.
    _You'll need to create this file first._ We recommend copying from `.env.example` (which you should create based on the [Deployment Section of DAT.md](./DAT.md#6-docker-compose-deployment)) if it exists, or create it manually.

    Create a `.env` file at the project root (`./.env`) with variables like:

    ```env
    # General
    NODE_ENV=development # or production
    LOG_LEVEL=info

    # Backend API
    DATABASE_URL="postgresql://notesuser:strongnotespassword@postgres:5432/notesdb"
    JWT_SECRET="your_very_strong_jwt_secret_here_at_least_64_chars_long_and_random"
    APP_ENCRYPTION_KEY="your_strong_32_byte_random_encryption_key_for_aes_256_gcm" # Must be 32 chars

    # Frontend (Ensure these match how Docker services will communicate)
    NEXT_PUBLIC_BACKEND_URL="http://localhost:3001/api"
    NEXT_PUBLIC_WS_URL="ws://localhost:3001"

    # PostgreSQL
    POSTGRES_USER="notesuser"
    POSTGRES_PASSWORD="strongnotespassword"
    POSTGRES_DB="notesdb"
    POSTGRES_PORT="5432" # Host port mapping, if you expose it
    ```

    **⚠️ CRUCIAL SECURITY NOTE:**

    - Generate **cryptographically secure random values** for `JWT_SECRET` and `APP_ENCRYPTION_KEY`.
    - For production, use Docker secrets or a dedicated secrets management tool instead of committing `.env` files directly or including them in container images.
    - The `APP_ENCRYPTION_KEY` **must be exactly 32 characters long** (256 bits) for AES-256 GCM.

### Running the App

1.  **Build and Run with Docker Compose:**
    Navigate to the project root directory (where `docker-compose.yml` is located) and run:

    ```bash
    docker-compose up --build -d
    ```

    The `--build` flag ensures images are built if they don't exist or if Dockerfiles change. `-d` runs containers in detached mode.

2.  **Access Noteworthy:**
    Once the services are up (you can check with `docker-compose ps`), open your web browser and navigate to:
    `http://localhost:3000` (or the port configured for the `nextjs-app` service if you changed it).

### Kubernetes Deployment with Helm

For production environments or when you prefer Kubernetes deployment, Noteworthy includes a Helm chart and an automated deployment script.

#### Using the Deploy Script

The `deploy.sh` script automates the installation or upgrade of the Noteworthy Helm chart:

1.  **Basic deployment with default settings:**
    ```bash
    ./deploy.sh
    ```
    This deploys Noteworthy with:
    - Release name: `noteworthy`
    - Namespace: `noteworthy`
    - Default values from [`noteworthy-chart/values.yaml`](noteworthy-chart/values.yaml)

2.  **Custom release name and namespace:**
    ```bash
    ./deploy.sh --release-name my-noteworthy --namespace noteworthy-prod
    ```

3.  **Using a custom values file:**
    ```bash
    ./deploy.sh --values ./my-custom-values.yaml
    ```

4.  **Complete example with all options:**
    ```bash
    ./deploy.sh \
      --release-name noteworthy-staging \
      --namespace noteworthy-staging \
      --values ./staging-values.yaml
    ```

5.  **View help and all available options:**
    ```bash
    ./deploy.sh --help
    ```

#### Prerequisites for Kubernetes Deployment

- [Helm 3.x](https://helm.sh/docs/intro/install/) installed and configured
- Access to a Kubernetes cluster with `kubectl` configured
- Sufficient permissions to create namespaces and deploy resources
- **Important:** Ensure any conflicting old Helm releases (like `mynotesapp-v1` in the `default` namespace) are uninstalled before running the script for the first time in the new namespace: `helm uninstall mynotesapp-v1 -n default`

#### Post-Deployment

After successful deployment, the script will provide commands to check the deployment status:

```bash
# Check Helm release status
helm status noteworthy -n noteworthy

# View services (including NodePort if applicable)
kubectl get svc -n noteworthy -l app.kubernetes.io/instance=noteworthy
```

**Note:** The script will automatically create the `noteworthy` namespace if it doesn't exist (due to the `--create-namespace` flag in the Helm command).

#### Manual Helm Deployment

If you prefer to use Helm directly without the script:

```bash
helm upgrade --install noteworthy ./noteworthy-chart \
  --namespace noteworthy \
  --create-namespace \
  --values ./noteworthy-chart/values.yaml
```

---

## 📈 Project Status

🚧 **Initial Foundation Laid / Core Development Underway** 🚧

This project has moved beyond initial setup. Core infrastructure, including user authentication and basic data structures, is in place. We are actively developing the primary features.

Follow our progress and see what's planned by checking out our [Project Backlog (BACKLOG.md)](./BACKLOG.md)!

---

## 🗺️ Roadmap

We have a comprehensive vision for Noteworthy! Our development is guided by a detailed backlog, broken down into epics and user stories.

Key epics include:

- `EPIC-01`: Project Setup & Core Infrastructure
- `EPIC-02`: User Management & Authentication
- `EPIC-03`: Note-Taking & Organization (Core)
- `EPIC-04`: Advanced Markdown Support
- `EPIC-05`: Search & Retrieval (Keyword & Semantic/RAG)
- `EPIC-06`: Collaboration & Permissions
- And many more, such as AI-powered voice transcription, offline mode, webhooks, and advanced AI configuration.

Dive into the details: [Project Backlog (BACKLOG.md)](./BACKLOG.md)

---

## 📖 API Documentation

This section will grow as more API endpoints are developed.

### Authentication Endpoints

#### `POST /api/auth/register`

Registers a new user.

**Request Body:**

```json
{
  "email": "user@example.com",
  "password": "YourStrongPassword123!"
}
```

- `email` (string, required): The user's email address. Must be a valid email format.
- `password` (string, required): The user's password. Must be at least 8 characters long and contain at least one uppercase letter, one lowercase letter, one number, and one special character.

**Responses:**

- **`201 Created`**: User successfully registered.
  ```json
  {
    "id": "user_uuid",
    "email": "user@example.com",
    "createdAt": "iso_timestamp"
  }
  ```
- **`400 Bad Request`**: Invalid input (e.g., email format, password policy).
  ```json
  {
    "error": "Invalid input",
    "details": {
      "email": ["Invalid email address"], // if email is invalid
      "password": ["Password must be at least 8 characters long"] // if password is too short
    }
  }
  ```
- **`409 Conflict`**: Email already registered.
  ```json
  {
    "error": "Email already registered"
  }
  ```
- **`500 Internal Server Error`**: Server-side error during registration.
  ```json
  {
    "error": "Internal server error"
  }
  ```

#### `POST /api/auth/login`

Logs in an existing user.

**Request Body:**

```json
{
  "email": "user@example.com",
  "password": "YourStrongPassword123!"
}
```

- `email` (string, required): The user's email address.
- `password` (string, required): The user's password.

**Responses:**

- **`200 OK`**: User successfully logged in.
  - The response body includes user information and an access token.
  - An HttpOnly cookie named `refreshToken` is set.
  ```json
  {
    "message": "Login successful",
    "user": {
      "id": "user_uuid",
      "email": "user@example.com"
    },
    "accessToken": "your_access_token_here"
  }
  ```
- **`400 Bad Request`**: Invalid input (e.g., missing fields, invalid email format).
  ```json
  {
    "error": "Invalid input",
    "details": {
      "email": ["Invalid email address"] // if email is invalid
    }
  }
  ```
- **`401 Unauthorized`**: Invalid credentials (user not found or password mismatch).
  ```json
  {
    "error": "Invalid credentials"
  }
  ```
- **`500 Internal Server Error`**: Server-side error during login (e.g., JWT secrets not configured).
  ```json
  {
    "error": "Internal server error"
    // or "Internal server configuration error"
  }
  ```

---

## 🤝 Contributing

We're building Noteworthy as an open-source project and welcome contributions from the community! Whether you're a developer, designer, or documentation enthusiast, there are many ways to help.

- Check out our [Contribution Guidelines (CONTRIBUTING.md)](CONTRIBUTING.md) (to be created).
- Browse [open issues](https://github.com/ncls-p/notes/issues) for areas where you can help.
- Pick up a task from our [Project Backlog (BACKLOG.md)](./BACKLOG.md).

Let's build something amazing together!

---

## 📜 License

This project is intended to be licensed under the MIT License.
A `LICENSE.md` file will be added to the repository soon.

---

## 🧑‍💻 Author

Noteworthy is being developed with ❤️ by [ncls-p](https://github.com/ncls-p).

---

## 🔗 Important Links

- **GitHub Repository:** [https://github.com/ncls-p/notes](https://github.com/ncls-p/notes)
- **Detailed Application Design:** [DAT.md](./DAT.md)
- **Project Backlog & Roadmap:** [BACKLOG.md](./BACKLOG.md)
