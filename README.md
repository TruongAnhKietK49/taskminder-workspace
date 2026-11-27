# TaskMinder Workspace

A full-stack **Project Collaboration & Team Productivity Platform** built with **NestJS**, **React**, **TypeScript**, **PostgreSQL**, **Prisma 7**, **Redis**, and **Socket.IO**. Designed around multi-workspace **Role-Based Access Control (RBAC)**, Kanban & List task management, realtime chat & online presence, automated deadline reminders, analytics with CSV export, and audit logging.

---

## Tech Stack

| Layer | Technologies |
| --- | --- |
| **Frontend** | React 19, TypeScript 6, Vite 8, Tailwind CSS v4, TanStack Query v5, Zustand 5, React Router v7, Axios, Socket.IO Client |
| **Backend** | NestJS 11, TypeScript, Prisma 7 (`@prisma/adapter-pg`), Passport JWT, `bcrypt`, `class-validator`, Socket.IO |
| **Database & Infra** | PostgreSQL 16, Redis 7, Docker Compose, pnpm Workspaces |
| **Quality & Security** | Jest Unit Tests, ESLint, Strict TypeScript, Rate Limiting (`RateLimitGuard`), Security Headers, CSV Formula Sanitization |

---

## System Architecture

```mermaid
flowchart LR
  Client["React 19 + Vite 8 Web App"] -->|REST + JWT Bearer + HttpOnly Refresh Cookie| API["NestJS 11 API (/api)"]
  Client -->|WebSocket /realtime (Socket.IO + JWT)| Gateway["NestJS ChatGateway"]
  API --> RBAC["RBAC & RateLimit Guards"]
  RBAC --> Services["Modules: Auth, Workspaces, Projects, Tasks, Notifications, Chat, Reports, Search, ActivityLogs"]
  Services --> Prisma["Prisma 7 ORM"]
  Gateway --> Services
  Prisma --> PG[("PostgreSQL 16")]
  Services --> Redis[("Redis 7")]
```

---

## Key Features

### 1. Authentication & Security Hardening
- JWT Access Token (in-memory) + rotating **HttpOnly Refresh Cookie** (`AuthSession` tracking IP, User-Agent, revocation).
- Rate limiting on `register`, `login`, `refresh`, and `workspace invitations` (`429 Too Many Requests` + `Retry-After` & `X-RateLimit-*` headers).
- Configurable `CORS_ORIGIN`, `ValidationPipe` (`whitelist`, `forbidNonWhitelisted`), and security headers (`X-Content-Type-Options`, `X-Frame-Options`, `Referrer-Policy`, `Permissions-Policy`).

### 2. Multi-Workspace & RBAC
- Create/switch workspaces, manage members, invite via email/token link (`/workspace-invitations/:token`), and inspect **Incoming Invitations** directly on `/workspaces`.
- Granular permission matrix enforced on every API route & WebSocket room:

| Capability | `OWNER` | `ADMIN` | `MEMBER` |
| --- | :---: | :---: | :---: |
| Update Workspace Settings (`WORKSPACE_MANAGE`) | Yes | Yes | - |
| Delete Workspace / Change Member Roles | Yes | - | - |
| Invite & Remove Members | Yes | Yes (Members only) | - |
| Create / Update / Archive Projects | Yes | Yes | - |
| Assign Tasks (`TASK_ASSIGN`) | Yes | Yes | - |
| Create / Update Tasks & Comments | Yes | Yes | Yes |

### 3. Projects, Kanban Board & Task Detail Drawer
- Switchable **Kanban Board** (with optimistic status transitions & rollback) and **List View** with filters (status, priority, assignee, search, overdue).
- Rich **Task Detail Drawer**: threaded comments with `@mention` autocomplete, authenticated file attachments (10 MB limit, MIME validation, UUID storage keys), task activity timeline, and custom reminders.

### 4. Notifications, Reminders & Preferences
- Header notification bell with 30s polling & dedicated `/notifications` center.
- Automated 60-second **Reminders Scheduler** with atomic claim & `dedupeKey` deduplication.
- Full notification settings on `/settings`: Do Not Disturb (DND), Quiet Hours (`22:00–07:00`), and per-project muting.

### 5. Realtime Chat & Multi-Tab Online Presence
- Socket.IO `/realtime` namespace with JWT handshake verification.
- Auto-provisioned `#general` workspace channel, project-scoped channels, and 1-on-1 Direct Messages.
- Live typing indicators, unread badges, cursor pagination, message edit/soft-delete, and multi-tab `UserPresence` tracking (`ONLINE`, `AWAY`, `BUSY`, `DO_NOT_DISTURB`, `OFFLINE`).

### 6. Analytics Reports, CSV Export, Audit Logs & Global Search
- **`/reports`**: Workspace KPIs (completion rate, overdue rate), project progress bars, 7-day activity chart, member workload table, and UTF-8 BOM **CSV Export** (protected against CSV formula injection).
- **Audit Logs**: Automatic `ActivityLog` recording across workspace, member, invitation, project, and task mutations; surfaced on both Dashboard and Reports.
- **Global Search (`Ctrl + K`)**: RBAC-scoped instant search across Projects, Tasks, Comments, Messages, and Members.
- **Light / Dark Mode** & **Global ~2s Toast Notifications** across every action.

---

## Database Schema (17 Prisma Models)

`User` · `AuthSession` · `Workspace` · `WorkspaceMember` · `WorkspaceInvitation` · `Project` · `ProjectMember` · `Task` · `TaskComment` · `TaskAttachment` · `TaskActivity` · `Notification` · `NotificationPreference` · `TaskReminder` · `Conversation` · `ConversationMember` · `Message` · `UserPresence` · `ActivityLog`

---

## Quick Start (Local Development)

### Prerequisites
- **Node.js** >= 20
- **pnpm** >= 10
- **Docker Desktop**

### 1. Install Dependencies & Start Infrastructure
```bash
pnpm install
pnpm db:up
```

### 2. Configure Environment Variables
```bash
cp apps/api/.env.example apps/api/.env
cp apps/web/.env.example apps/web/.env
```
> Update `DATABASE_URL` in `apps/api/.env` to match `docker-compose.yml` credentials if needed.

### 3. Run Migrations, Generate Client & Seed Demo Data
```bash
pnpm db:migrate
pnpm db:generate
pnpm db:seed
```

### 4. Start API & Web Servers
```bash
# Terminal 1 - NestJS API (http://localhost:3000/api)
pnpm dev:api

# Terminal 2 - React Vite App (http://localhost:5173)
pnpm dev:web
```

---

## Demo Accounts (Seeded by `pnpm db:seed`)

Password for all demo accounts: **`TaskMinder@2026`**

| Email | Role | Highlights |
| --- | --- | --- |
| `owner@taskminder.dev` | `OWNER` | Full access across 2 workspaces, all projects, reports & audit logs |
| `admin@taskminder.dev` | `ADMIN` | Project/member management, DM thread with Owner |
| `dev1@taskminder.dev` | `MEMBER` | Assigned tasks, `@mention` notification, project chat |
| `dev2@taskminder.dev` | `MEMBER` | Kanban & Design System tasks |
| `qa@taskminder.dev` | `MEMBER` | Has a pending invitation to *FIT_CV2026 Portfolio Studio* on `/workspaces` |

---

## Testing & Verification

```bash
# Backend unit tests
pnpm test:api

# Typecheck & Build
pnpm typecheck:api
pnpm build:api
pnpm typecheck:web
pnpm build:web
pnpm lint:web
```

---

## Author

**Trương Anh Kiệt** — Senior IT Student, Ho Chi Minh City University of Education (HCMUE)  
GitHub: [@TruongAnhKietK49](https://github.com/TruongAnhKietK49)
