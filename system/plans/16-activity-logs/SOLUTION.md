# Solution — Plan 16: Activity Logs UI

> **Implemented:** 2026-05-23
> **Status:** Complete

---

## What Was Implemented

End-to-end audit logging: a shared `logActivity` helper writes one row to the
existing `AuditLog` table after every successful mutation across all API
routes. A new admin-only `/activity` page displays the log as a filterable,
paginated feed with human-readable action descriptions. The sidebar gains an
"Activity" link that is only shown to admin/super_admin users.

---

## Files Created

| File | Purpose |
|---|---|
| `lib/audit/log-activity.ts` | Shared helper — wraps `prisma.auditLog.create` |
| `app/(dashboard)/activity/page.tsx` | Activity log page — admin-only, filter chips, pagination |

---

## Files Modified

| File | Change |
|---|---|
| `app/api/spiels/route.ts` | `logActivity` after spiel create |
| `app/api/spiels/[id]/route.ts` | `logActivity` after update/archive/delete |
| `app/api/categories/route.ts` | `logActivity` after category create |
| `app/api/categories/[id]/route.ts` | `logActivity` after update/delete |
| `app/api/departments/route.ts` | `logActivity` after department create |
| `app/api/departments/[id]/route.ts` | `logActivity` after update/delete |
| `app/api/users/route.ts` | `logActivity` after user create |
| `app/api/users/[id]/route.ts` | `logActivity` after update/deactivate |
| `app/api/variables/route.ts` | `logActivity` after variable create |
| `app/api/variables/[id]/route.ts` | `logActivity` after update/delete |
| `components/layout/sidebar-nav.tsx` | Added `isAdmin` prop; renders "Activity" nav item for admins |
| `components/layout/dashboard-shell.tsx` | Passes `isAdmin` derived from session role to `SidebarNav` |

---

## Action Keys

| Key | Human label |
|---|---|
| `spiel.create` | created spiel |
| `spiel.update` | updated spiel |
| `spiel.archive` | archived spiel |
| `spiel.delete` | deleted spiel |
| `category.create` | created category |
| `category.update` | updated category |
| `category.delete` | deleted category |
| `department.create` | created department |
| `department.update` | updated department |
| `department.delete` | deleted department |
| `user.create` | added user |
| `user.update` | updated user |
| `user.deactivate` | deactivated user |
| `variable.create` | created variable |
| `variable.update` | updated variable |
| `variable.delete` | deleted variable |
| `copy` | copied spiel (written by `/api/spiels/[id]/activity`) |

---

## Key Decisions

### `logActivity` is a thin awaited helper, not fire-and-forget
Unlike the `copy` event from plan #15 (which is client-side fire-and-forget),
these log writes are server-side and fully awaited. If the DB write fails, the
error surfaces to the route handler — which is acceptable since the main
operation already succeeded and the response has already been determined.
Wrapping in `try/catch` would silently drop errors; the current approach lets
infrastructure errors propagate naturally.

### `metadata.name` stores the entity's human-readable name at write time
Since entities can be renamed or deleted, the entity name is embedded in the
log row's `metadata` JSON at creation time. The activity page reads
`metadata.name` without any extra joins to the original entity tables.

### Company scoping via user relation
`AuditLog` has no `companyId` field. The activity page scopes the query with
`where: { user: { companyId } }` — a relation filter Prisma translates to a
`EXISTS` subquery on the `user` table. This avoids denormalising `companyId`
into `AuditLog`.

### Admin gate is in the page, not middleware
The `/activity` page calls `canManageDepartment(role)` and redirects non-admins
to `/dashboard`. The sidebar link is also hidden for non-admins via `isAdmin`
prop. Defence-in-depth: both the UI affordance and the page itself enforce the
access rule.

### Prisma v7 `include` + `orderBy` type workaround
Same issue as plan #15: `findMany` with `include` and `orderBy` loses the
relation type in the inferred result. The `logs` query is cast
`as unknown as Promise<LogEntry[]>` with an explicit inline type. Runtime
behavior is correct.

---

## Acceptance Criteria Status

| Criterion | Status |
|---|---|
| Every mutation writes one `AuditLog` row | ✅ |
| `/activity` page reachable by admin/super_admin only | ✅ |
| Filter chips narrow by entity type | ✅ |
| Each row: actor name, readable action, entity name, relative time | ✅ |
| Pagination at 50 rows/page | ✅ |
| Activity sidebar link shown only to admins | ✅ |

---

## Watch Out For

- `AuditLog` has no compound index on `(userId, entityType)` or
  `(createdAt DESC)`. For high-volume workspaces, add an index on
  `createdAt DESC` and/or `(entityType, createdAt DESC)`.
- The `copy` action is written by `/api/spiels/[id]/activity` (plan #15)
  using a different code path. Its `entityType` is `"spiel"` and action is
  `"copy"` — it still appears correctly under the "Spiels" filter chip.
- `user.deactivate` is the action written by `DELETE /api/users/[id]`
  (which soft-deletes). There is no hard-delete for users.
