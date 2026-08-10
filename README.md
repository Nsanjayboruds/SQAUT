# AI-Powered Code Review Assistant

A full-stack, production-oriented application for analyzing code quality, security, and performance using configurable AI providers. Built for a 3-day engineering assessment.

## Features

- **Project Management**: Group your code uploads logically.
- **Secure File Processing**: Safely upload ZIP files. The system guards against path traversal, ignores binary/build files, and respects size limits.
- **Code Explorer**: Syntax-highlighted viewer to browse your uploaded source code.
- **AI Providers System**: Bring your own keys (OpenAI) or use local AI (LM Studio, Ollama). API keys are stored securely using AES-256-GCM encryption.
- **Code Reviews**: Run automated reviews targeting Security, Performance, or Code Quality. Context-aware file selection respects token limits.
- **AI Chat**: Have contextual conversations with your codebase. The system retrieves relevant files automatically based on keyword scoring.

## Tech Stack

**Frontend**:
- Next.js 14 (App Router)
- React 18, TypeScript, Tailwind CSS
- Axios, React Hot Toast, React Syntax Highlighter

**Backend**:
- NestJS 10, TypeScript
- PostgreSQL with Prisma ORM
- JWT Authentication (Passport), Bcrypt
- Adm-zip for file extraction
- AES-256-GCM cryptography for API keys

## Local Setup

1. **Clone the repository**:
   \`\`\`bash
   git clone <repo-url>
   cd SQAUT
   \`\`\`

2. **Backend Setup**:
   \`\`\`bash
   cd backend
   npm install
   # Configure your .env based on .env.example
   npx prisma migrate dev
   npm run start:dev
   \`\`\`
   *The backend runs on port 4000.*

3. **Frontend Setup**:
   \`\`\`bash
   cd frontend
   npm install
   # Configure your .env.local
   npm run dev
   \`\`\`
   *The frontend runs on port 3000.*

## Security Considerations

- API keys are encrypted at rest with AES-256-GCM and a unique Initialization Vector (IV) per key.
- File uploads are validated to prevent directory traversal attacks (e.g., `../../../etc/passwd`).
- File uploads enforce a 50MB ZIP limit and 1MB per-file limit.
- Passwords are hashed using bcrypt with 12 rounds.
- JWT tokens expire in 24 hours.

## License
MIT
