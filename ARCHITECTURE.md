# Architecture Overview

This application follows a modern, scalable monorepo-style setup with decoupled frontend and backend services.

## High-Level Architecture

\`\`\`
[ Next.js Frontend ] <--- REST API ---> [ NestJS Backend ] <---> [ PostgreSQL ]
                                                |
                                                v
                                       [ AI Providers (OpenAI, Ollama) ]
\`\`\`

## Backend (NestJS)

- **Domain-Driven Design (DDD) inspired**: The backend is organized into domain-specific modules (Auth, Users, Projects, Files, AI, Reviews, Chat).
- **Prisma ORM**: Used for database interactions. Configured specifically to support NestJS's CommonJS module structure with Prisma v7 by using the `@prisma/adapter-pg` driver.
- **Service Layer Pattern**: All business logic resides in injectable services. Controllers only handle HTTP routing and DTO validation.
- **Global Error Handling**: Uses `AllExceptionsFilter` to standardize API error responses and catch unhandled exceptions securely without leaking stack traces.
- **Security**: 
  - File uploads use `adm-zip` with strict memory constraints and path sanitization.
  - API keys are encrypted using Node's native `crypto` module (AES-256-GCM).

## Frontend (Next.js)

- **App Router**: Utilizes Next.js 14 App Router for layouts and routing.
- **Client Components**: Because the app relies heavily on dynamic user interactions and state (e.g., file explorer, chat, ZIP uploads), most dashboard pages are Client Components (`'use client'`).
- **Context API**: Auth state is managed via `AuthContext`, handling token persistence and redirection.
- **Axios Interceptors**: Global interceptors automatically inject the JWT token into requests and handle 401 Unauthorized responses by logging the user out.
- **Design System**: A custom CSS variable-based design system provides a modern, dark-themed, glassmorphic aesthetic without relying heavily on utility classes, ensuring clean markup.

## Data Flow (Code Review Example)

1. User uploads a ZIP file via Frontend.
2. NestJS `FilesController` pipes the stream to `FilesService`.
3. `FilesService` sanitizes paths, extracts valid source files, and bulk-inserts them into PostgreSQL.
4. User selects a template and triggers a review.
5. `ReviewsService` gathers the necessary file contents, respecting the 30k character limit.
6. `ReviewsService` fetches the AI provider config, decrypts the API key, and calls `AIService`.
7. `AIService` constructs the prompt and makes a REST call to the configured provider.
8. `AIService` safely parses the JSON response and returns the structured data.
9. `ReviewsService` persists the results in the database and returns them to the client.
