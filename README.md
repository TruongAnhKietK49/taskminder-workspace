# TaskMinder Workspace

TaskMinder Workspace is a project collaboration platform with RBAC, workspace management, project/task tracking, invitations, realtime chat, notifications, reminders, and activity logs.

## Tech Stack

- Frontend: React, TypeScript, Vite, TailwindCSS
- Backend: NestJS, PostgreSQL, Prisma
- Realtime: Socket.IO
- Cache/Queue: Redis
- DevOps: Docker Compose

## Local Setup

```bash
pnpm install
docker compose up -d
```

## Run frontend:

```bash
cd apps/web
pnpm dev
```

## Run backend:

```bash
cd apps/api
pnpm start:dev
```

