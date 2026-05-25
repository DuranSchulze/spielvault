# Plan 15 — Recent Spiels Section

> **Priority:** 🚀 Future (Phase 2+)
> **Checklist Ref:** `CHECKLIST.md` → #15
> **Status:** Ready to implement

---

## What

Replace the "Recent Activity" placeholder on the dashboard with a live
"Recently Copied" section showing the user's last 5 spiels they copied to
clipboard — with quick-copy and edit links on each row.

---

## Why

The dashboard is currently static. Users want a fast path back to spiels they
actively use without hunting through the full library.

---

## Requirements

1. Show the last 5 distinct spiels the current user copied, most recent first.
2. Each row: title, department/category badge, relative time, Copy + Edit buttons.
3. If the user has no copy history, show the 5 most recently updated spiels in
   their accessible departments (a warm fallback — never empty on first load).
4. Copies are logged via a lightweight fire-and-forget API call from `SpielCard`
   after the clipboard write succeeds.
5. No new DB model — use the existing `AuditLog` table
   (`action: "copy"`, `entityType: "spiel"`, `entityId: spielId`).

---

## Approach

### 1. API — `POST /api/spiels/[id]/activity`

Thin route that writes one `AuditLog` row. Accepts `{ action: "copy" }` in
body. Returns `204` with no body. Access check: user must belong to the
spiel's company (same pattern as other routes).

No Zod schema needed — the body is trivial and the route is fire-and-forget;
a malformed call just fails silently on the client.

### 2. SpielCard — log copy event

After the clipboard write succeeds in `handleCopy()`, fire a non-blocking
`fetch` to `/api/spiels/[spiel.id]/activity` with `{ action: "copy" }`.
Wrapped in `.catch(() => {})` so it never surfaces an error to the user.

### 3. Dashboard — query and render

Replace the "Recent Activity" placeholder with a `RecentSpiels` server
component (inline in the dashboard page):

```ts
// Step 1: get recent copy log for this user (last 50 entries, deduplicate)
const recentLogs = await prisma.auditLog.findMany({
  where: { userId, action: "copy", entityType: "spiel" },
  orderBy: { createdAt: "desc" },
  take: 50,
  select: { entityId: true, createdAt: true },
});

// Deduplicate — keep only the first (most recent) occurrence of each spielId
const seen = new Set<string>();
const recentIds: { id: string; copiedAt: Date }[] = [];
for (const log of recentLogs) {
  if (!seen.has(log.entityId) && recentIds.length < 5) {
    seen.add(log.entityId);
    recentIds.push({ id: log.entityId, copiedAt: log.createdAt });
  }
}

// Step 2: fetch spiel data for those IDs (scoped to user's company + active)
const spiels = recentIds.length > 0
  ? await prisma.spiel.findMany({
      where: { id: { in: recentIds.map(r => r.id) }, companyId, status: "active" },
      select: { id, title, department, category, updatedAt },
    })
  : [];

// Re-sort to match log order and merge copiedAt
const orderedSpiels = recentIds
  .map(r => ({ ...spiels.find(s => s.id === r.id), copiedAt: r.copiedAt }))
  .filter(s => s.id);
```

**Fallback**: if `orderedSpiels.length === 0`, run a second query for the 5
most recently updated spiels in `departmentIds`.

Render each spiel as a compact row (not a full `SpielCard`) since the
dashboard already has SpielCard-style interaction on the library page.

---

## Files Affected

| File | Change |
|---|---|
| `app/api/spiels/[id]/activity/route.ts` | **Create** — POST handler to log copy events |
| `components/spiels/spiel-card.tsx` | **Modify** — fire activity log after successful copy |
| `app/(dashboard)/dashboard/page.tsx` | **Modify** — replace placeholder with live recent-spiels list |

---

## Acceptance Criteria

- [ ] Copying a spiel from the library logs an entry to `AuditLog`.
- [ ] Dashboard "Recently Copied" section shows up to 5 distinct spiels,
      most recent first.
- [ ] Each row has: title, department, relative time ("2 minutes ago"), quick
      Copy button, Edit link.
- [ ] User with no copy history sees 5 most recently updated spiels
      (fallback), with a subtle "From your library" label instead of a timestamp.
- [ ] Logging failure never surfaces an error in the UI.
- [ ] Spiels that have been archived are excluded from the recent list.
