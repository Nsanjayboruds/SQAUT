<div align="center">
  <img src="https://img.icons8.com/color/120/000000/artificial-intelligence.png" alt="SQAUT Logo"/>
  <h1>AI-Powered Code Review Assistant (SQAUT)</h1>
  <p>A production-oriented full-stack application for automated code reviews, architecture analysis, and codebase chat using configurable AI providers (OpenAI, Ollama, LM Studio).</p>
  <p>
    <img src="https://img.shields.io/badge/Next.js-14-black" alt="Next.js" />
    <img src="https://img.shields.io/badge/NestJS-10-ea2845" alt="NestJS" />
    <img src="https://img.shields.io/badge/PostgreSQL-Prisma-336791" alt="PostgreSQL" />
    <img src="https://img.shields.io/badge/Tailwind-CSS-38bdf8" alt="Tailwind" />
  </p>
</div>

---

## 📖 Overview

This project was built to demonstrate full-stack engineering proficiency. It allows developers to upload source code repositories (via ZIP) and run sophisticated, AI-driven code reviews. 

The application is built with a focus on **security**, **architecture**, and **maintainability**, rather than just feature count. It features a custom AI integration layer that supports Bring-Your-Own-Key (BYOK) cloud models as well as 100% free, local inference via Ollama and LM Studio.

## ✨ Key Features

- **Bring Your Own AI**: Connect to any OpenAI-compatible API endpoint. Support for cloud models (OpenAI) and local models (Ollama, LM Studio).
- **Advanced Code Reviews**: Run targeted reviews for **Security**, **Performance**, or **Code Quality**. 
- **Bonus Capabilities**: Generate comprehensive **Project Documentation (README)** and perform deep **Architecture Analysis**.
- **Contextual Code Chat**: Have a conversation with your codebase. The backend uses context retrieval to feed the AI the most relevant files based on your queries.
- **Secure File Processing**: Upload ZIP files securely. The system prevents directory traversal attacks, ignores binary/build artifacts, and strictly limits file sizes to prevent denial of service.
- **Premium UI/UX**: A highly responsive, professional dark-mode interface featuring glassmorphic components and micro-animations.

---

## 🏗️ Architecture Overview

The application is structured as a decoupled Monorepo (conceptually) with entirely separate Frontend and Backend services communicating via REST APIs.

### Frontend Architecture
- **Framework**: Next.js 14 utilizing the App Router.
- **Styling**: Tailwind CSS extended with custom CSS variables for a dynamic, premium "glassmorphic" dark theme.
- **State & Data Fetching**: Standard React Hooks supplemented by custom service singletons (`api.service.ts`) using Axios for robust HTTP communication and interceptors.
- **Authentication**: JWT tokens stored securely in HttpOnly-like patterns or local storage with standard Bearer injection.

### Backend Architecture
- **Framework**: NestJS 10. Modular structure isolating concerns (e.g., `AuthModule`, `ProjectsModule`, `AIModule`).
- **Data Flow**: Controllers map HTTP requests to strongly-typed DTOs validated via `class-validator`. Services handle business logic and interact with the Database via Prisma.
- **AI Integration Flow**: The `AIService` acts as a facade pattern. It dynamically pulls prompts based on the requested template, constructs a context-aware prompt using the uploaded source code, and sends a strictly structured request to the configured provider to ensure a consistent JSON return format.
- **Security**: Passwords hashed with bcrypt. User API keys encrypted at rest using AES-256-GCM. 

---

## 🗄️ Database Design & Setup

The database runs on **PostgreSQL** and is managed via **Prisma ORM**. The schema strictly enforces referential integrity through cascading deletes.

### Core Entities
1. **User**: Handles authentication (`email`, `passwordHash`, `name`).
2. **Project**: Groups related files, reviews, and chat sessions (`userId`, `name`, `description`).
3. **File**: Stores extracted source code (`projectId`, `path`, `content`, `size`). Unique constraint on `[projectId, path]`.
4. **Review**: Stores the AI analysis results (`projectId`, `template`, `scope`, `result` as JSON).
5. **AIProvider**: Stores user-configured AI models (`baseUrl`, `modelName`, encrypted `apiKey`).
6. **ChatSession / Message**: Manages conversation history context for the AI Chat.

*(See `backend/prisma/schema.prisma` for the exact implementations)*

---

## ⚙️ Environment Variables

### Backend (`backend/.env`)
Create a `.env` file in the `backend` directory:
```env
# Database Connection (Adjust credentials as needed)
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/code_review_db?schema=public"

# JWT Secret for signing authentication tokens
JWT_SECRET="your-super-secret-jwt-key"

# AES-256-GCM Encryption Key for storing AI Provider API Keys
# MUST BE EXACTLY 64 HEX CHARACTERS (32 bytes)
AI_ENCRYPTION_KEY="0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef"

# Port (Optional, defaults to 4000)
PORT=4000
```

### Frontend (`frontend/.env.local`)
Create a `.env.local` file in the `frontend` directory:
```env
# URL to the NestJS Backend API
NEXT_PUBLIC_API_URL="http://localhost:4000/api"
```

---

## 🚀 Setup Instructions

### Prerequisites
- Node.js (v18+)
- PostgreSQL (running locally or via Docker)

### 1. Database Initialization
Ensure your PostgreSQL instance is running, then configure your `backend/.env` file with the correct `DATABASE_URL`.

### 2. Backend Setup
```bash
cd backend
npm install

# Generate Prisma Client and apply Database Migrations
npx prisma generate
npx prisma migrate dev --name init

# Start the NestJS Server in development mode
npm run start:dev
```
*(The backend will start on `http://localhost:4000`)*

### 3. Frontend Setup
```bash
# Open a new terminal
cd frontend
npm install

# Start the Next.js Server
npm run dev
```
*(The frontend will start on `http://localhost:3000`)*

---

## 🔒 Security Measures Implemented

1. **API Key Encryption**: AI Provider keys are never stored in plain text. They are encrypted using Node's `crypto` module (`aes-256-gcm`) before database insertion.
2. **Path Traversal Protection**: ZIP extraction uses strict sanitization to prevent `../../` exploits from overriding host system files.
3. **Payload Limitations**: ZIP uploads are restricted to 50MB, and individual files inside the ZIP are capped at 1MB to prevent processing massive binaries or malicious payloads.
4. **Input Validation**: All API endpoints use strict DTO validation ensuring malicious inputs are rejected before hitting business logic.

---

<div align="center">
  <i>Developed for the Full Stack Engineering Internship Assessment</i>
</div>
