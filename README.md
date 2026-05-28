# VedaAI - AI Assessment Creator

VedaAI is a full-stack tool for teachers to create assessment papers from subject details, question distribution, optional reference material, and teacher instructions. It generates structured question papers, tracks generation progress in real time, stores generated output, and exports the result as a PDF.

## Features
- Teacher registration and login with JWT access tokens and HttpOnly refresh-token rotation.
- Protected Next.js dashboard with responsive desktop sidebar and mobile bottom tabs.
- Multi-step assignment creator with file upload, due date validation, question distribution, live totals, and progress overlay.
- Express API with MongoDB schemas for users, refresh tokens, assignments, and generated papers.
- BullMQ + Redis queue for background AI paper generation with Socket.io progress updates.
- AI generation through Mistral, Anthropic Claude, or OpenAI depending on configured API keys, with a deterministic local fallback.
- Redis paper cache, regeneration flow, Cloudinary PDF storage, and PDF download/export.

## Tech Stack
- Frontend: Next.js 14 App Router, TypeScript, Zustand, Axios, React Hook Form, Zod, Socket.io Client, Tailwind CSS.
- Backend: Node.js, Express, TypeScript, MongoDB/Mongoose, Redis/ioredis, BullMQ, Socket.io, JWT, bcrypt, Multer.
- Infrastructure: Docker Compose with frontend, backend, MongoDB, and Redis.
- External services: AI model provider APIs and Cloudinary for generated PDF storage.

## Architecture Overview

VedaAI is organized as a monorepo with two application packages:

- `frontend`: a Next.js application that owns the teacher-facing UI, authentication state, assignment creation flow, library/result screens, PDF actions, and Socket.io client subscriptions.
- `backend`: an Express API that owns authentication, assignment CRUD, file extraction, queue orchestration, AI generation, paper persistence, PDF generation, caching, and websocket progress events.

The main generation flow is asynchronous:

1. A teacher creates an assignment from the frontend, including subject, class, due date, question types, marks, optional notes, and an optional uploaded file.
2. The Express API validates the request, extracts uploaded file text when present, stores an `Assignment` document in MongoDB, and enqueues a BullMQ job in Redis.
3. The generation worker picks up the job, marks the assignment as processing, builds the AI prompt, calls the configured model provider, validates and normalizes the structured paper, and stores it as a `GeneratedPaper`.
4. Redis caches the generated paper for faster reads, while MongoDB remains the durable source of truth.
5. The worker emits progress events through Socket.io rooms scoped to `assignment:{id}`, so only the owning teacher receives updates.
6. The worker attempts PDF generation and Cloudinary upload. If PDF generation fails, the paper still completes and the PDF can be generated later on download.

```text
Next.js Frontend
  |  Axios + JWT access token + HttpOnly refresh cookie
  v
Express API ---- MongoDB
  |              users, refresh tokens, assignments, generated papers
  |
  +---- BullMQ Queue ---- Redis
  |          |            paper cache, queue state, generation locks
  |          v
  |     Generation Worker ---- AI Provider
  |          |
  |          v
  |     PDF Service ---- Cloudinary
  |
  +---- Socket.io rooms: assignment:{id}
             ^
             |
       Frontend progress overlay
```

## Approach

The implementation separates interactive teacher workflows from long-running generation work. Assignment creation returns quickly after queueing a job, while BullMQ handles generation in the background. This keeps the API responsive and makes retries, duplicate-job prevention, and progress reporting easier to reason about.

Authentication uses short-lived JWT access tokens for API and websocket authorization, with refresh tokens stored in HttpOnly cookies. The backend verifies assignment ownership before returning data, joining websocket rooms, regenerating papers, or deleting records.

Generated papers are treated as structured data first and files second. The AI response is parsed, normalized, schema-validated, and post-processed against teacher requirements before it is persisted. PDF generation is downstream of that structured paper, which allows the app to recover by regenerating or downloading PDFs without losing the core paper content.

The frontend keeps form state, auth state, library state, and generation state in focused Zustand stores. The assignment creator validates inputs before submission, subscribes to websocket progress after queueing, and redirects to the result view when generation completes.

The system is designed to work in development even without AI credentials by using deterministic fallback questions. With provider keys configured, it prefers the available AI provider and still keeps schema validation and repair paths around model output.

## Getting Started

### Prerequisites

- Node.js 18+
- Docker
- AI provider API key for production-quality generation
- Cloudinary credentials if generated PDFs should be stored remotely

### Quick Start (Docker)

```bash
docker-compose up -d
```

Open http://localhost:3000.

### Manual Start

```bash
# Terminal 1: MongoDB + Redis
docker-compose up -d mongo redis

# Terminal 2: Backend
cd backend && npm install && npm run dev

# Terminal 3: Frontend
cd frontend && npm install && npm run dev
```

## Environment Variables

| App | Variable | Description |
| --- | --- | --- |
| Backend | PORT | API port, default 4000 |
| Backend | NODE_ENV | development or production |
| Backend | MONGODB_URI | MongoDB connection string |
| Backend | REDIS_URL | Redis connection string |
| Backend | JWT_ACCESS_SECRET | 32+ char access-token signing secret |
| Backend | JWT_REFRESH_SECRET | 32+ char refresh-token signing secret |
| Backend | ANTHROPIC_API_KEY | Claude API key |
| Backend | MISTRAL_API_KEY | Mistral API key |
| Backend | OPENAI_API_KEY | OpenAI fallback key |
| Backend | FRONTEND_URL | Frontend origin for CORS |
| Backend | UPLOAD_DIR | Multer upload path |
| Backend | CLOUDINARY_CLOUD_NAME | Cloudinary cloud name |
| Backend | CLOUDINARY_API_KEY | Cloudinary API key |
| Backend | CLOUDINARY_API_SECRET | Cloudinary API secret |
| Frontend | NEXT_PUBLIC_API_URL | API base URL |
| Frontend | NEXT_PUBLIC_WS_URL | Socket.io base URL |

## API Documentation

- `POST /api/auth/register` creates a teacher account and sets refresh cookie.
- `POST /api/auth/login` authenticates and sets refresh cookie.
- `POST /api/auth/refresh` rotates refresh token and returns a new access token.
- `POST /api/auth/logout` deletes the refresh token and clears cookie.
- `GET /api/auth/me` returns current user and a fresh access token.
- `PATCH /api/auth/me` updates profile fields.
- `POST /api/assignments` creates an assignment and queues paper generation.
- `GET /api/assignments` lists teacher assignments.
- `GET /api/assignments/:id` returns one owned assignment.
- `GET /api/assignments/:id/paper` returns generated paper with Redis cache.
- `POST /api/assignments/:id/regenerate` queues a replacement paper.
- `GET /api/assignments/:id/pdf/download` streams the generated PDF.
- `POST /api/assignments/:id/pdf/regenerate` regenerates and uploads a PDF from stored paper data.
- `POST /api/assignments/:id/pdf` uploads an externally generated PDF for an assignment.
- `DELETE /api/assignments/:id` deletes assignment, paper, and cache.
