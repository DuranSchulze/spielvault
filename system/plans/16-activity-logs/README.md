# Plan 16 — Activity Logs UI

> **Priority:** 🚀 Future (Phase 2+)
> **Checklist Ref:** `CHECKLIST.md` → #16
> **Status:** Ready to implement

---

## What

Wire the existing `AuditLog` model end-to-end: instrument every mutation route
to write a log entry, then build a dedicated `/activity` page (admin-only)
with filter chips, pagination, and human-readable action descriptions.

---

## Why

Admins need visibility into what changed and who changed it — especially for
compliance, onboarding, and debugging. The `AuditLog` table is already in the
schema but nothing writes to it (except `spiel.copy` added in #15).

---

## Requirements

1. A `logActivity` helper centralises all writes to `AuditLog`.
2. Every successful mutation (create / update / delete / archive) in every API
   route writes one log entry, fire-and-forget after the response data is ready.
3. A `/activity` page is accessible only to admins (employee → redirect to
   dashboard).
4. The page shows a list of log entries with: actor name, human-readable
   action + entity name, relative time.
5. Filter chips: **All | Spiels | Categories | Departments | Users | Variables**.
6. Pagination at 50 rows per page.
7. The sidebar shows an "Activity" link only to admin/super_admin users.

---

## Approach

### 1. `lib/audit/log-activity.ts` — shared helper

```ts
export async function logActivity(data: {
  userId: string;
  action: string;
  entityType: string;
  entityId: string;
  metadata?: Record<string, unknown>;
}): Promise<void> {
  await prisma.auditLog.create({ data });
}
```

### 2. Instrument all mutation routes

After each successful DB write, call `logActivity(...)`. The `metadata`
field stores `{ name: "..." }` — the human-readable entity name — so the
activity page can display it without extra joins.

| Route | Action key |
|---|---|
| `POST /api/spiels` | `spiel.create` |
| `PATCH /api/spiels/[id]` (content) | `spiel.update` |
| `PATCH /api/spiels/[id]` (archive) | `spiel.archive` |
| `DELETE /api/spiels/[id]` | `spiel.delete` |
| `POST /api/categories` | `category.create` |
| `PATCH /api/categories/[id]` | `category.update` |
| `DELETE /api/categories/[id]` | `category.delete` |
| `POST /api/departments` | `department.create` |
| `PATCH /api/departments/[id]` | `department.update` |
| `DELETE /api/departments/[id]` | `department.delete` |
| `POST /api/users` | `user.create` |
| `PATCH /api/users/[id]` | `user.update` |
| `POST /api/variables` | `variable.create` |
| `PATCH /api/variables/[id]` | `variable.update` |
| `DELETE /api/variables/[id]` | `variable.delete` |

### 3. `/activity` page — server component

- Call `requireAccessContext()` and redirect non-admin to `/dashboard`.
- Read `?type` (entity type filter) and `?page` from search params.
- Query `auditLog.findMany` with `include: { user: { select: { name: true } } }`,
  filtered by `companyId` via a join on the `User` model's `companyId`.
- Render filter chips and a paginated list of rows.

### 4. Sidebar — admin-only Activity link

Pass `role` from `DashboardShell` (server component) into `SidebarNav`
as a prop. Render the "Activity" nav item only when role ≥ admin.

---

## Files Affected

| File | Change |
|---|---|
| `lib/audit/log-activity.ts` | **Create** — shared `logActivity` helper |
| `app/api/spiels/route.ts` | Add `logActivity` after spiel create |
| `app/api/spiels/[id]/route.ts` | Add `logActivity` after update / archive / delete |
| `app/api/categories/route.ts` | Add `logActivity` after category create |
| `app/api/categories/[id]/route.ts` | Add `logActivity` after update / delete |
| `app/api/departments/route.ts` | Add `logActivity` after department create |
| `app/api/departments/[id]/route.ts` | Add `logActivity` after update / delete |
| `app/api/users/route.ts` | Add `logActivity` after user create |
| `app/api/users/[id]/route.ts` | Add `logActivity` after user update |
| `app/api/variables/route.ts` | Add `logActivity` after variable create |
| `app/api/variables/[id]/route.ts` | Add `logActivity` after update / delete |
| `app/(dashboard)/activity/page.tsx` | **Create** — Activity log page |
| `components/layout/sidebar-nav.tsx` | Accept `role` prop; show Activity link for admins |
| `components/layout/dashboard-shell.tsx` | Pass `session.user.role` to `SidebarNav` |

---

## Acceptance Criteria

- [ ] Every spiel/category/department/user/variable mutation writes one `AuditLog` row.
- [ ] The `/activity` page is only reachable by admin and super_admin users.
- [ ] Filter chips narrow the list by entity type.
- [ ] Each row shows actor name, readable action, entity name, relative time.
- [ ] Pagination works at 50 rows/page.
- [ ] The Activity link appears in the sidebar for admins only.
- [ ] Logging never blocks or errors the original response.
