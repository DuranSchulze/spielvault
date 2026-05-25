# Solution — Plan 08: Build Users Management Page

> **Status:** ✅ Completed
> **Implementation Date:** 2026-05-23
> **Checklist Ref:** `CHECKLIST.md` → #8

---

## What Was Implemented

Replaced the static placeholder at `/users` with a full users management page featuring a table listing, inline role/department editing, user creation, and deactivation.

### New API Routes

| Method | Path | Purpose |
|---|---|---|
| `GET` | `/api/users` | List all users in the company with their departments |
| `POST` | `/api/users` | Create user with name, email, password, role, department assignments |
| `PATCH` | `/api/users/[id]` | Update role, active status, password, department assignments |
| `DELETE` | `/api/users/[id]` | Soft-deactivate user (sets `isActive: false`) |

### Front-End

- **Table layout** with columns: User (avatar + name/email), Role, Departments, Status, Actions
- **Create panel** — Toggled via "+ Invite User" button, inline form with name/email/password + role selector + department chip picker
- **Inline editing** — Click pencil to toggle role dropdown and department chips inline, save button
- **Deactivation** — Soft delete with confirmation, dims inactive users in the list
- **Role-gated** — Only admins see create/edit/deactivate controls

## Implementation Details

- Password hashing uses `hashPassword` from `better-auth/crypto` (same as seed script)
- Account records are created with `providerId: "credential"` for email/password auth
- Department assignments use `UserDepartment` pivot with `createMany` (fresh delete + insert on update)
- Email uniqueness is enforced server-side (Prisma unique constraint + pre-check)

## Files Created or Modified

| File | Change |
|---|---|
| `app/api/users/route.ts` | **Created** — GET (list), POST (create with password hash + account) |
| `app/api/users/[id]/route.ts` | **Created** — PATCH (role/dept/password), DELETE (soft deactivate) |
| `components/users/users-manager.tsx` | **Created** — Table-based user management UI |
| `app/(dashboard)/users/page.tsx` | **Rewritten** — From static placeholder to server component with data fetching |

## Acceptance Criteria

- [x] Admin can see all users in their company
- [x] Admin can create a new user with name, email, password, role
- [x] Admin can assign a user to one or more departments
- [x] Admin can deactivate a user (they cannot log in)
- [x] Employee users see the user list but cannot create/edit/deactivate
- [x] Creating a user with an existing email returns 409

## Watch Out For

- Department assignments use a delete-all-then-insert pattern on update. For large teams, this could be optimized with diff-based updates.
- The password is sent in plain text over the API. In production, ensure HTTPS is enforced.
- The `DELETE` handler does a soft-deactivate (isActive=false), not a hard delete. There's no "reactivate" UI yet — the PATCH accepts `{ isActive: true }` though, so it's possible via API.
