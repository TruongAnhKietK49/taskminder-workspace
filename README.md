# TaskMinder Workspace

TaskMinder Workspace is a project collaboration platform designed for managing workspaces, projects, tasks, members, realtime chat, notifications, reminders and activity logs.

## Tech Stack

### Frontend

- React
- TypeScript
- Vite
- TailwindCSS
- React Router
- TanStack Query
- Axios

### Backend

- NestJS
- TypeScript
- PostgreSQL
- Prisma
- JWT Authentication
- Redis

### Local Infrastructure

- Docker Compose
- PostgreSQL
- Redis

## Project Structure

```txt
taskminder-workspace/
├── apps/
│   ├── web/
│   └── api/
├── packages/
│   └── shared/
├── docs/
├── docker-compose.yml
├── pnpm-workspace.yaml
└── README.md
```

## Frontend Structure

```txt
apps/web/src/
├── app/
│   ├── routes/
│   ├── providers/
│   └── layouts/
├── shared/
│   ├── components/
│   ├── hooks/
│   ├── lib/
│   └── types/
└── features/
    ├── auth/
    ├── workspaces/
    ├── projects/
    ├── members/
    ├── tasks/
    ├── notifications/
    ├── chat/
    ├── dashboard/
    ├── reports/
    └── settings/
```

## Backend Structure

```txt
apps/api/src/
├── common/
│   ├── decorators/
│   ├── filters/
│   ├── guards/
│   ├── interceptors/
│   └── utils/
├── config/
├── modules/
│   ├── auth/
│   ├── users/
│   ├── workspaces/
│   ├── projects/
│   ├── tasks/
│   ├── notifications/
│   └── audit-logs/
├── prisma/
├── app.module.ts
└── main.ts
```

## Requirements

- Node.js
- pnpm
- Docker Desktop

## Local Setup

Install dependencies:

```bash
pnpm install
```

Start local services:

```bash
pnpm db:up
```

Create backend env:

```bash
cp apps/api/.env.example apps/api/.env
```

Create frontend env:

```bash
cp apps/web/.env.example apps/web/.env
```

Run Prisma migration:

```bash
pnpm db:migrate
pnpm db:generate
```

Run backend:

```bash
pnpm dev:api
```

Run frontend:

```bash
pnpm dev:web
```

## Local URLs

Frontend:

```txt
http://localhost:5173
```

Backend health check:

```txt
http://localhost:3000/api/health
```

Prisma Studio:

```bash
pnpm db:studio
```

## Available Scripts

Run frontend:

```bash
pnpm dev:web
```

Run backend:

```bash
pnpm dev:api
```

Build frontend:

```bash
pnpm build:web
```

Build backend:

```bash
pnpm build:api
```

Run database containers:

```bash
pnpm db:up
```

Stop database containers:

```bash
pnpm db:down
```

Run Prisma migration:

```bash
pnpm db:migrate
```

Generate Prisma client:

```bash
pnpm db:generate
```

Open Prisma Studio:

```bash
pnpm db:studio
```

## Sprint 0 Status

Completed:

- Monorepo foundation
- Frontend scalable structure
- Backend NestJS foundation
- PostgreSQL and Redis with Docker Compose
- Prisma setup
- Health check API
- Frontend to backend API connection

## Git Workflow

Main branches:

- `main`: release branch
- `dev`: integration branch
- `feature/*`: feature branches

Example:

```bash
git checkout dev
git pull origin dev
git checkout -b feature/sprint-1-auth-rbac
```

## Notes

This project is currently in Sprint 0 foundation stage. Business features such as authentication, RBAC, workspace management, project management and task management will be implemented in later sprints.
