# Sprint 0 - Project Foundation

## Goal

Prepare the technical foundation for TaskMinder Workspace before implementing business features.

Sprint 0 focuses on project structure, development environment, frontend foundation, backend foundation, database connection and documentation.

---

## Scope

Sprint 0 does not implement business features yet.

Out of scope:

- Real authentication
- RBAC enforcement
- Workspace CRUD
- Project CRUD
- Task CRUD
- Realtime chat
- Notification logic
- Reminder logic

These features will be implemented in later sprints.

---

## Completed Items

## Repository

- Initialized monorepo structure
- Added frontend app
- Added backend app
- Added shared package placeholder
- Added documentation folder

Project structure:

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

---

## Frontend

Completed:

- React + TypeScript + Vite setup
- Scalable folder structure
- React Router setup
- App providers setup
- TanStack Query setup
- Axios API client setup
- AuthLayout setup
- DashboardLayout setup
- Placeholder pages for core modules
- Dashboard connected to backend health check API

Frontend structure:

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

Available frontend routes:

```txt
/login
/register
/dashboard
/workspaces
/projects
/members
/tasks
/notifications
/chat
/reports
/settings
```

---

## Backend

Completed:

- NestJS setup
- Global API prefix `/api`
- Global validation pipe
- CORS enabled for frontend
- ConfigModule setup
- Prisma setup
- PostgreSQL connection
- Health check API

Backend structure:

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
├── prisma/
├── app.module.ts
└── main.ts
```

---

## Infrastructure

Completed:

- Docker Compose setup
- PostgreSQL service
- Redis service

Local services:

```txt
PostgreSQL: localhost:5432
Redis: localhost:6379
```

---

## Health Check

Endpoint:

```txt
GET /api/health
```

Expected response:

```json
{
  "status": "ok",
  "service": "taskminder-api",
  "database": "connected",
  "timestamp": "..."
}
```

Purpose:

- Confirm backend is running.
- Confirm PostgreSQL connection works.
- Confirm frontend can call backend API.

---

## Environment Files

Backend env example:

```txt
apps/api/.env.example
```

Frontend env example:

```txt
apps/web/.env.example
```

Actual `.env` files should not be committed.

---

## Definition of Done

Sprint 0 is done when:

- Frontend runs locally.
- Backend runs locally.
- PostgreSQL runs with Docker.
- Redis runs with Docker.
- Frontend can call backend health API.
- Backend can connect PostgreSQL.
- README exists.
- API convention exists.
- Database design exists.
- Git workflow exists.

---

## Verification Commands

Start database services:

```bash
pnpm db:up
```

Run backend:

```bash
pnpm dev:api
```

Run frontend:

```bash
pnpm dev:web
```

Build frontend:

```bash
pnpm build:web
```

Build backend:

```bash
pnpm build:api
```

Test backend health API:

```bash
curl http://localhost:3000/api/health
```

---

## Recommended Commit

```bash
git add .
git commit -m "docs: complete sprint 0 project foundation"
```

---

## Next Sprint

Sprint 1 should focus on:

- User model improvement
- Register API
- Login API
- Password hashing
- JWT access token
- Refresh token strategy
- Current user API
- Auth guard
- Basic RBAC model
- Frontend login/register integration# Sprint 0 - Project Foundation

## Goal

Prepare the technical foundation for TaskMinder Workspace before implementing business features.

Sprint 0 focuses on project structure, development environment, frontend foundation, backend foundation, database connection and documentation.

---

## Scope

Sprint 0 does not implement business features yet.

Out of scope:

- Real authentication
- RBAC enforcement
- Workspace CRUD
- Project CRUD
- Task CRUD
- Realtime chat
- Notification logic
- Reminder logic

These features will be implemented in later sprints.

---

## Completed Items

## Repository

- Initialized monorepo structure
- Added frontend app
- Added backend app
- Added shared package placeholder
- Added documentation folder

Project structure:

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

---

## Frontend

Completed:

- React + TypeScript + Vite setup
- Scalable folder structure
- React Router setup
- App providers setup
- TanStack Query setup
- Axios API client setup
- AuthLayout setup
- DashboardLayout setup
- Placeholder pages for core modules
- Dashboard connected to backend health check API

Frontend structure:

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

Available frontend routes:

```txt
/login
/register
/dashboard
/workspaces
/projects
/members
/tasks
/notifications
/chat
/reports
/settings
```

---

## Backend

Completed:

- NestJS setup
- Global API prefix `/api`
- Global validation pipe
- CORS enabled for frontend
- ConfigModule setup
- Prisma setup
- PostgreSQL connection
- Health check API

Backend structure:

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
├── prisma/
├── app.module.ts
└── main.ts
```

---

## Infrastructure

Completed:

- Docker Compose setup
- PostgreSQL service
- Redis service

Local services:

```txt
PostgreSQL: localhost:5432
Redis: localhost:6379
```

---

## Health Check

Endpoint:

```txt
GET /api/health
```

Expected response:

```json
{
  "status": "ok",
  "service": "taskminder-api",
  "database": "connected",
  "timestamp": "..."
}
```

Purpose:

- Confirm backend is running.
- Confirm PostgreSQL connection works.
- Confirm frontend can call backend API.

---

## Environment Files

Backend env example:

```txt
apps/api/.env.example
```

Frontend env example:

```txt
apps/web/.env.example
```

Actual `.env` files should not be committed.

---

## Definition of Done

Sprint 0 is done when:

- Frontend runs locally.
- Backend runs locally.
- PostgreSQL runs with Docker.
- Redis runs with Docker.
- Frontend can call backend health API.
- Backend can connect PostgreSQL.
- README exists.
- API convention exists.
- Database design exists.
- Git workflow exists.

---

## Verification Commands

Start database services:

```bash
pnpm db:up
```

Run backend:

```bash
pnpm dev:api
```

Run frontend:

```bash
pnpm dev:web
```

Build frontend:

```bash
pnpm build:web
```

Build backend:

```bash
pnpm build:api
```

Test backend health API:

```bash
curl http://localhost:3000/api/health
```

---

## Recommended Commit

```bash
git add .
git commit -m "docs: complete sprint 0 project foundation"
```

---

## Next Sprint

Sprint 1 should focus on:

- User model improvement
- Register API
- Login API
- Password hashing
- JWT access token
- Refresh token strategy
- Current user API
- Auth guard
- Basic RBAC model
- Frontend login/register integration
