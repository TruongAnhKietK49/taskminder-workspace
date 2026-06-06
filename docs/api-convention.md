# API Convention

## Base URL

```txt
/api
```

Example:

```txt
GET /api/health
```

## Response Format

All business APIs should follow a consistent response format.

## Success Response

```json
{
  "success": true,
  "message": "Success",
  "data": {}
}
```

Example:

```json
{
  "success": true,
  "message": "Workspace created successfully",
  "data": {
    "id": "a7f5b55f-6f0d-4e62-9c8f-1ecfa54dcb83",
    "name": "Development Team"
  }
}
```

## Error Response

```json
{
  "success": false,
  "message": "Validation failed",
  "errors": [
    {
      "field": "email",
      "message": "Email is required"
    }
  ]
}
```

## Pagination Response

```json
{
  "success": true,
  "message": "Success",
  "data": {
    "items": [],
    "meta": {
      "page": 1,
      "limit": 10,
      "total": 100,
      "totalPages": 10
    }
  }
}
```

## HTTP Status Rules

| Status | Meaning               |
| ------ | --------------------- |
| 200    | Request success       |
| 201    | Resource created      |
| 400    | Invalid request       |
| 401    | Unauthorized          |
| 403    | Forbidden             |
| 404    | Resource not found    |
| 409    | Conflict              |
| 422    | Validation error      |
| 500    | Internal server error |

## Resource Naming Rules

Use plural resource names:

```txt
/users
/workspaces
/projects
/tasks
/notifications
```

Use nested routes only when ownership or scope is important:

```txt
GET /workspaces/:workspaceId/projects
GET /projects/:projectId/tasks
GET /workspaces/:workspaceId/members
```

Avoid deeply nested routes when not necessary.

Bad:

```txt
GET /workspaces/:workspaceId/projects/:projectId/tasks/:taskId/comments/:commentId
```

Prefer:

```txt
GET /tasks/:taskId/comments
GET /comments/:commentId
```

## Query Convention

Pagination:

```txt
?page=1&limit=10
```

Search:

```txt
?search=keyword
```

Sorting:

```txt
?sortBy=createdAt&sortOrder=desc
```

Filtering:

```txt
?status=ACTIVE
?priority=HIGH
?assigneeId=user_id
```

Combined example:

```txt
GET /api/tasks?page=1&limit=10&search=design&status=TODO&sortBy=createdAt&sortOrder=desc
```

## Auth Header

Protected APIs require Bearer token:

```txt
Authorization: Bearer <access_token>
```

## Auth API Draft

Register:

```txt
POST /api/auth/register
```

Login:

```txt
POST /api/auth/login
```

Get current user:

```txt
GET /api/auth/me
```

Refresh token:

```txt
POST /api/auth/refresh
```

Logout:

```txt
POST /api/auth/logout
```

## Workspace API Draft

```txt
GET    /api/workspaces
POST   /api/workspaces
GET    /api/workspaces/:workspaceId
PATCH  /api/workspaces/:workspaceId
DELETE /api/workspaces/:workspaceId
```

## Project API Draft

```txt
GET    /api/workspaces/:workspaceId/projects
POST   /api/workspaces/:workspaceId/projects
GET    /api/projects/:projectId
PATCH  /api/projects/:projectId
DELETE /api/projects/:projectId
```

## Task API Draft

```txt
GET    /api/projects/:projectId/tasks
POST   /api/projects/:projectId/tasks
GET    /api/tasks/:taskId
PATCH  /api/tasks/:taskId
DELETE /api/tasks/:taskId
```

## Notification API Draft

```txt
GET    /api/notifications
PATCH  /api/notifications/:notificationId/read
PATCH  /api/notifications/read-all
GET    /api/notification-settings
PATCH  /api/notification-settings
```

## Validation Rules

DTO validation should be handled by NestJS `ValidationPipe`.

Rules:

- Reject unknown fields.
- Validate required fields.
- Transform query params to correct types when needed.
- Keep error messages clear enough for frontend display.

## Security Rules

- Never return `passwordHash`.
- Never expose refresh token in API response if using HTTP-only cookie.
- Validate workspace membership before accessing workspace resources.
- Validate project membership before accessing project resources.
- Apply role-based authorization at API level, not only at frontend level.
