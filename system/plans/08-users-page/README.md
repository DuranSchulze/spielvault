# Plan 08 — Build Users Management Page

> **Priority:** 🟡 Medium
> **Checklist Ref:** `CHECKLIST.md` → #8

---

## What

Replace the static placeholder at `/users` with a users management page that lists team members, shows their departments and roles, and allows admins to manage users.

## Why

The PRD requires user management (create, update, assign to departments, activate/deactivate). Currently the `/users` page is empty with a non-functional "Invite User" button.

## Current State

- **`app/(dashboard)/users/page.tsx`** — Static placeholder
- **`server/services/user.service.ts`** — Has `getUserById`, `getUsersByCompany` (unused)
- **`prisma/schema.prisma`** — User model has `role`, `isActive`, `companyId` ready
- **No user-related API routes** exist beyond Better Auth's built-in ones

## Requirements

- [ ] Page lists all users in the user's company (name, email, role, departments)
- [ ] Admin can create new users (set name, email, password, role, department assignment)
- [ ] Admin can edit user details (name, role, active status)
- [ ] Admin can assign/remove users from departments
- [ ] Admin can deactivate/reactivate users
- [ ] Employee users see the list but cannot modify it

## Implementation

Will need new API routes and/or server actions:

| Method | Path | Purpose |
|---|---|---|
| GET | `/api/users` | List company users |
| POST | `/api/users` | Create user (+ account seed) |
| PATCH | `/api/users/[id]` | Update name, role, active status |
| DELETE | `/api/users/[id]` | Deactivate/soft-delete |

## Files Affected

| File | Change |
|---|---|
| `app/(dashboard)/users/page.tsx` | **Rewrite** — Replace placeholder with user list |
| `app/api/users/route.ts` | **Create** — GET (list), POST (create) |
| `app/api/users/[id]/route.ts` | **Create** — PATCH (update), DELETE (deactivate) |

## Dependencies

None.

## Acceptance Criteria

- [ ] Admin can see all users in their company
- [ ] Admin can create a new user with name, email, password, role
- [ ] Admin can assign a user to one or more departments
- [ ] Admin can deactivate a user (they can no longer log in)
- [ ] Employee users see the user list but cannot create/edit/deactivate
