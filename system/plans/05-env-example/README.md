# Plan 05 — Create `.env.example` File

> **Priority:** 🟡 Medium
> **Checklist Ref:** `CHECKLIST.md` → #5

---

## What

Create an `.env.example` file at the project root documenting all required and optional environment variables.

## Why

The README instructs developers to "Copy `.env.example .env`" but no `.env.example` exists. New contributors don't know what environment variables to configure.

## Requirements

- [ ] Located at `repflow/.env.example`
- [ ] Documents every variable used in the codebase
- [ ] Includes placeholder values and descriptions
- [ ] Marks required vs optional variables

## Content

```env
# ─── Database ──────────────────────────────────────────────────────────────
# PostgreSQL connection string
# Required for Prisma to connect
DATABASE_URL=postgresql://user:password@localhost:5432/repflow

# ─── Authentication (Better Auth) ───────────────────────────────────────────
# Secret used to encrypt session tokens. Generate with: openssl rand -hex 32
# Required for authentication to work
BETTER_AUTH_SECRET=your-random-secret-here

# Full URL of the application (used for auth redirects)
# Required
BETTER_AUTH_URL=http://localhost:3000

# ─── Application ────────────────────────────────────────────────────────────
# Public-facing URL of the app (used by auth client)
# Required
NEXT_PUBLIC_APP_URL=http://localhost:3000

# ─── Database Seeding ───────────────────────────────────────────────────────
# Admin credentials seeded via `npm run db:seed`
# Required only if running the seed script
SEED_ADMIN_EMAIL=admin@example.com
SEED_ADMIN_PASSWORD=your-secure-admin-password
```

## Files Affected

| File | Change |
|---|---|
| `repflow/.env.example` | **Create** — New file |

## Dependencies

None.

## Acceptance Criteria

- [ ] File exists at `.env.example`
- [ ] All 6 environment variables documented
- [ ] Each variable has a description and indicates if required
