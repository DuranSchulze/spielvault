# Solution — Plan 15: Recent Spiels Section

> **Implemented:** 2026-05-23
> **Status:** Complete

---

## What Was Implemented

The "Recent Activity" placeholder on the dashboard was replaced with a live
"Recently Copied" section. Each time a user copies a spiel from the library,
it is logged to the existing `AuditLog` table. The dashboard reads those logs
and shows the user's last 5 distinct copied spiels — with quick Copy and Edit
buttons on each row. Users with no copy history see a "From Your Library"
fallback showing the 5 most recently updated spiels in their departments.

---

## Files Created

| File | Purpose |
|---|---|
| `app/api/spiels/[id]/activity/route.ts` | POST handler — writes `action: "copy"` to `AuditLog` |
| `components/dashboard/recent-spiel-row.tsx` | Client component — handles clipboard copy + activity log from the dashboard row |

---

## Files Modified

| File | Change |
|---|---|
| `components/spiels/spiel-card.tsx` | `handleCopy` fires a fire-and-forget POST to `/api/spiels/[id]/activity` after a successful clipboard write |
| `app/(dashboard)/dashboard/page.tsx` | Replaced placeholder with `getRecentSpiels()` helper + `RecentSpielRow` list; imported `requireAccessContext` to get `session.user.id` for scoped queries |

---

## Key Decisions

### No new DB model — uses existing `AuditLog`
The `AuditLog` model was already in the schema with `userId`, `action`,
`entityType`, `entityId`. This is exactly what's needed for copy tracking.
Adding a new model would have required another migration with no benefit.

### Fire-and-forget logging — errors never reach the user
The `fetch` call in `SpielCard.handleCopy` and `RecentSpielRow.handleCopy`
is not awaited and has `.catch(() => {})`. If the logging call fails (network
error, auth timeout) the user's copy still succeeds silently.

### Activity route returns 204 on all paths
Even if the user isn't authenticated or the spiel isn't found, the route
returns `204 No Content` — never an error. This prevents any activity
fire-and-forget call from producing console errors in the browser.

### Fallback is always warm
If a user has no copy history (first login, fresh account), the dashboard
shows the 5 most recently updated spiels in their departments. The section
label changes from "Recently Copied" to "From Your Library" so the user
understands the distinction.

### `RecentSpielRow` as a separate client component
The dashboard page is a server component. Clipboard access requires
`navigator.clipboard`, which only exists in the browser. Extracting the row
into `components/dashboard/recent-spiel-row.tsx` with `"use client"` keeps
the server component pure while enabling the copy button.

### Prisma v7 type inference workaround
Using `include` with `orderBy` + `take` in the same `findMany` call causes
the Prisma v7 TypeScript type system to drop the inferred relation types from
the result. The fallback query is cast `as unknown as FallbackSpiel[]` with
an explicit inline type definition to work around this. The runtime behavior
is correct — only TypeScript's static inference is affected. The first (copy
history) query avoids the issue because it doesn't use `orderBy`/`take`.

---

## Acceptance Criteria Status

| Criterion | Status |
|---|---|
| Copying a spiel logs to `AuditLog` | ✅ |
| Dashboard shows up to 5 recently copied distinct spiels | ✅ |
| Each row has title, department, relative time, Copy + Edit buttons | ✅ |
| Copy button on dashboard row also logs to AuditLog | ✅ |
| Fallback shows 5 recent library spiels when no copy history | ✅ |
| Fallback uses "From Your Library" label instead of a timestamp | ✅ |
| Logging failure never surfaces a UI error | ✅ |
| Archived spiels excluded from recent list | ✅ (`status: "active"` in both queries) |

---

## Watch Out For

- The deduplication of logs is done in memory (iterating the last 50 log
  rows). If a very active user copies one spiel hundreds of times, we still
  read at most 50 rows per page load. This is sufficient for the intended
  use-case but could be revisited with a DB-level `GROUP BY` if needed.
- The dashboard query is NOT paginated — it always shows exactly 5 rows.
  This is intentional for the dashboard context.
- The `AuditLog` table currently has no index on `(userId, action, entityType)`.
  For large datasets, adding a compound index would improve the dashboard
  query performance.
