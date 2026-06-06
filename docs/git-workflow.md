# Git Workflow

## Branches

## main

`main` is the release branch.

Only stable and reviewed code should be merged into this branch.

Recommended rules:

- Protected branch
- Direct push disabled
- Merge only from `dev`
- Owner or maintainer approval required

---

## dev

`dev` is the integration branch.

All feature branches should target this branch.

Recommended rules:

- Protected branch
- Direct push disabled
- Merge Request required
- Build should pass before merge

---

## Feature Branches

Naming:

```txt
feature/<task-name>
```

Examples:

```txt
feature/sprint-0-project-setup
feature/sprint-1-auth-rbac
feature/workspace-management
feature/task-management
```

---

## Fix Branches

Naming:

```txt
fix/<bug-name>
```

Examples:

```txt
fix/login-validation-error
fix/dashboard-health-check-error
fix/prisma-connection-error
```

---

## Chore Branches

Naming:

```txt
chore/<task-name>
```

Examples:

```txt
chore/update-dependencies
chore/setup-eslint
chore/update-readme
```

---

## Commit Convention

Use conventional commits.

Format:

```txt
<type>(scope): <message>
```

Scope is optional but recommended.

Examples:

```txt
chore: initialize project foundation
feat(api): setup prisma and health check
feat(web): setup scalable frontend foundation
fix(web): resolve dashboard api connection error
docs: add api and database conventions
refactor(api): improve prisma service structure
```

## Commit Types

| Type     | Meaning                                    |
| -------- | ------------------------------------------ |
| feat     | New feature                                |
| fix      | Bug fix                                    |
| docs     | Documentation only                         |
| style    | Code style change without logic change     |
| refactor | Code restructuring without behavior change |
| perf     | Performance improvement                    |
| test     | Add or update tests                        |
| chore    | Tooling, config, setup, dependency update  |
| build    | Build system or dependency change          |
| ci       | CI/CD configuration                        |

---

## Recommended Flow

Start from `dev`:

```bash
git checkout dev
git pull origin dev
```

Create feature branch:

```bash
git checkout -b feature/sprint-1-auth-rbac
```

Work on code, then commit:

```bash
git add .
git commit -m "feat(auth): implement login and register api"
```

Push branch:

```bash
git push origin feature/sprint-1-auth-rbac
```

Create Merge Request:

```txt
source: feature/sprint-1-auth-rbac
target: dev
```

---

## Before Creating Merge Request

Run frontend build:

```bash
pnpm build:web
```

Run backend build:

```bash
pnpm build:api
```

If available, run lint:

```bash
pnpm lint:web
pnpm lint:api
```

Check Git status:

```bash
git status
```

---

## Merge Request Checklist

Before requesting review:

- Code builds successfully.
- No unrelated files are included.
- No `.env` file is committed.
- No console/debug code remains unless intentional.
- Feature follows project structure.
- API response format follows convention.
- Frontend handles loading/error/empty states when needed.
- Protected routes and backend authorization are both considered.

---

## Squash Rule

For small tasks, prefer one clean commit.

Example:

```txt
feat(web): setup scalable frontend foundation
```

For larger tasks, multiple commits are acceptable during development, then squash before merge if the team requires a clean history.

---

## Main Release Flow

Only merge `dev` into `main` when the version is stable.

Recommended:

```bash
git checkout main
git pull origin main
git merge dev
git push origin main
```

Or create a Merge Request:

```txt
source: dev
target: main
```
