# Database Design

## Overview

TaskMinder Workspace uses PostgreSQL as the primary database and Prisma as the ORM.

The system is designed around these core concepts:

- User
- Workspace
- Workspace member
- Project
- Project member
- Task
- Notification
- Chat
- Activity log

Sprint 0 only implements the first `users` table. Other tables are planned for later sprints.

---

## Implemented in Sprint 0

## Users

Stores account information.

| Field         | Type            | Note                      |
| ------------- | --------------- | ------------------------- |
| id            | uuid            | Primary key               |
| email         | string          | Unique                    |
| password_hash | string          | Hashed password           |
| full_name     | string          | Display name              |
| avatar_url    | string nullable | User avatar               |
| status        | enum            | ACTIVE, INACTIVE, BLOCKED |
| created_at    | datetime        | Created time              |
| updated_at    | datetime        | Updated time              |

### User Status

```txt
ACTIVE
INACTIVE
BLOCKED
```

---

## Planned Tables

## Workspaces

Stores workspace information.

| Field       | Type            | Note                  |
| ----------- | --------------- | --------------------- |
| id          | uuid            | Primary key           |
| name        | string          | Workspace name        |
| description | string nullable | Workspace description |
| owner_id    | uuid            | References users.id   |
| created_at  | datetime        | Created time          |
| updated_at  | datetime        | Updated time          |

A workspace is the highest collaboration scope in the system.

---

## Workspace Members

Stores user membership and role in a workspace.

| Field        | Type              | Note                         |
| ------------ | ----------------- | ---------------------------- |
| id           | uuid              | Primary key                  |
| workspace_id | uuid              | References workspaces.id     |
| user_id      | uuid              | References users.id          |
| role         | enum              | OWNER, ADMIN, MEMBER, VIEWER |
| status       | enum              | ACTIVE, INVITED, REMOVED     |
| joined_at    | datetime nullable | Join time                    |
| created_at   | datetime          | Created time                 |
| updated_at   | datetime          | Updated time                 |

### Workspace Roles

```txt
OWNER
ADMIN
MEMBER
VIEWER
```

### Workspace Member Status

```txt
ACTIVE
INVITED
REMOVED
```

---

## Projects

Stores projects inside workspaces.

| Field         | Type            | Note                        |
| ------------- | --------------- | --------------------------- |
| id            | uuid            | Primary key                 |
| workspace_id  | uuid            | References workspaces.id    |
| name          | string          | Project name                |
| description   | string nullable | Project description         |
| status        | enum            | ACTIVE, ARCHIVED, COMPLETED |
| created_by_id | uuid            | References users.id         |
| created_at    | datetime        | Created time                |
| updated_at    | datetime        | Updated time                |

### Project Status

```txt
ACTIVE
ARCHIVED
COMPLETED
```

---

## Project Members

Stores project-specific members.

| Field      | Type     | Note                    |
| ---------- | -------- | ----------------------- |
| id         | uuid     | Primary key             |
| project_id | uuid     | References projects.id  |
| user_id    | uuid     | References users.id     |
| role       | enum     | MANAGER, MEMBER, VIEWER |
| created_at | datetime | Created time            |
| updated_at | datetime | Updated time            |

### Project Roles

```txt
MANAGER
MEMBER
VIEWER
```

---

## Tasks

Stores project tasks.

| Field         | Type              | Note                                          |
| ------------- | ----------------- | --------------------------------------------- |
| id            | uuid              | Primary key                                   |
| project_id    | uuid              | References projects.id                        |
| title         | string            | Task title                                    |
| description   | string nullable   | Task description                              |
| status        | enum              | TODO, IN_PROGRESS, IN_REVIEW, DONE, CANCELLED |
| priority      | enum              | LOW, MEDIUM, HIGH, URGENT                     |
| start_date    | datetime nullable | Start date                                    |
| due_date      | datetime nullable | Due date                                      |
| created_by_id | uuid              | References users.id                           |
| created_at    | datetime          | Created time                                  |
| updated_at    | datetime          | Updated time                                  |

### Task Status

```txt
TODO
IN_PROGRESS
IN_REVIEW
DONE
CANCELLED
```

### Task Priority

```txt
LOW
MEDIUM
HIGH
URGENT
```

---

## Task Assignees

Supports multiple assignees per task.

| Field          | Type     | Note                |
| -------------- | -------- | ------------------- |
| id             | uuid     | Primary key         |
| task_id        | uuid     | References tasks.id |
| user_id        | uuid     | References users.id |
| assigned_by_id | uuid     | References users.id |
| assigned_at    | datetime | Assigned time       |

---

## Invitations

Stores workspace/project invitations.

| Field         | Type          | Note                                |
| ------------- | ------------- | ----------------------------------- |
| id            | uuid          | Primary key                         |
| email         | string        | Invited email                       |
| workspace_id  | uuid nullable | Workspace scope                     |
| project_id    | uuid nullable | Project scope                       |
| invited_by_id | uuid          | References users.id                 |
| token         | string        | Invitation token                    |
| status        | enum          | PENDING, ACCEPTED, EXPIRED, REVOKED |
| expires_at    | datetime      | Expiration time                     |
| created_at    | datetime      | Created time                        |
| updated_at    | datetime      | Updated time                        |

### Invitation Status

```txt
PENDING
ACCEPTED
EXPIRED
REVOKED
```

---

## Notifications

Stores user notifications.

| Field      | Type          | Note                 |
| ---------- | ------------- | -------------------- |
| id         | uuid          | Primary key          |
| user_id    | uuid          | Receiver             |
| type       | enum          | Notification type    |
| title      | string        | Notification title   |
| message    | string        | Notification content |
| is_read    | boolean       | Read status          |
| metadata   | json nullable | Extra data           |
| created_at | datetime      | Created time         |

### Notification Types

```txt
TASK_ASSIGNED
TASK_UPDATED
TASK_DUE_SOON
TASK_OVERDUE
PROJECT_INVITATION
WORKSPACE_INVITATION
MENTION
CHAT_MESSAGE
SYSTEM
```

---

## Notification Settings

Stores user notification preferences.

| Field                | Type            | Note                             |
| -------------------- | --------------- | -------------------------------- |
| id                   | uuid            | Primary key                      |
| user_id              | uuid            | References users.id              |
| task_updates_enabled | boolean         | Enable task update notifications |
| reminders_enabled    | boolean         | Enable reminders                 |
| chat_enabled         | boolean         | Enable chat notifications        |
| email_enabled        | boolean         | Enable email notifications       |
| quiet_hours_enabled  | boolean         | Enable quiet hours               |
| quiet_hours_start    | string nullable | Example: 22:00                   |
| quiet_hours_end      | string nullable | Example: 07:00                   |
| created_at           | datetime        | Created time                     |
| updated_at           | datetime        | Updated time                     |

---

## Chat Rooms

Stores direct/project/workspace chat rooms.

| Field        | Type          | Note                       |
| ------------ | ------------- | -------------------------- |
| id           | uuid          | Primary key                |
| type         | enum          | DIRECT, PROJECT, WORKSPACE |
| workspace_id | uuid nullable | Workspace scope            |
| project_id   | uuid nullable | Project scope              |
| created_at   | datetime      | Created time               |
| updated_at   | datetime      | Updated time               |

### Chat Room Types

```txt
DIRECT
PROJECT
WORKSPACE
```

---

## Chat Room Members

Stores chat room participants.

| Field     | Type     | Note                     |
| --------- | -------- | ------------------------ |
| id        | uuid     | Primary key              |
| room_id   | uuid     | References chat_rooms.id |
| user_id   | uuid     | References users.id      |
| joined_at | datetime | Join time                |

---

## Chat Messages

Stores chat messages.

| Field      | Type          | Note                     |
| ---------- | ------------- | ------------------------ |
| id         | uuid          | Primary key              |
| room_id    | uuid          | References chat_rooms.id |
| sender_id  | uuid          | References users.id      |
| content    | text          | Message content          |
| type       | enum          | TEXT, FILE, SYSTEM       |
| metadata   | json nullable | Extra data               |
| created_at | datetime      | Created time             |
| updated_at | datetime      | Updated time             |

---

## Activity Logs

Stores audit/activity records for important actions.

| Field        | Type          | Note                              |
| ------------ | ------------- | --------------------------------- |
| id           | uuid          | Primary key                       |
| actor_id     | uuid          | User who performed the action     |
| workspace_id | uuid nullable | Workspace scope                   |
| project_id   | uuid nullable | Project scope                     |
| entity_type  | string        | Example: TASK, PROJECT, WORKSPACE |
| entity_id    | uuid nullable | Target entity                     |
| action       | string        | Example: CREATE, UPDATE, DELETE   |
| old_value    | json nullable | Previous value                    |
| new_value    | json nullable | New value                         |
| created_at   | datetime      | Created time                      |

---

## Important Design Notes

- RBAC should be scoped by workspace.
- A user can belong to many workspaces.
- A workspace can have many projects.
- A project belongs to one workspace.
- A task belongs to one project.
- Task assignment should support one or many assignees.
- Notification settings should be per user.
- Activity logs should record critical changes like create/update/delete, invite, role change and task status change.
- Soft delete can be considered for workspaces, projects and tasks in later phases.
