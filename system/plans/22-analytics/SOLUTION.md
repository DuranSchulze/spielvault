# Solution — Plan 22: Usage Analytics

## What was implemented

- **`app/api/analytics/route.ts`** — GET endpoint returning aggregated metrics: total copies (all-time), spiels created (30d window), active users (30d), top 10 copied spiels, top 10 active users, daily copy counts for chart.
- **`components/analytics/copies-chart.tsx`** — Client component using recharts `BarChart` to render daily copy counts.
- **`app/(dashboard)/analytics/page.tsx`** — Server-rendered analytics page (accessible to all roles) showing 3 summary cards, the bar chart, and two ranked lists.
- **`components/layout/sidebar-nav.tsx`** — Added "Analytics" entry to `mainNav` (visible to all roles).
- Installed `recharts` v3.

## Deviations from plan

- Used the existing `AuditLog` model directly — no schema changes needed. The plan mentioned possibly adding a `SpielAnalytics` model; that was unnecessary given the data already captured.
- The API route (`/api/analytics`) was built but the page fetches data directly via Prisma (server component pattern) — the REST route still exists for external consumers (e.g., the browser extension).
- Analytics are scoped to the user's company automatically.

## Key files

| File | Role |
|---|---|
| `app/api/analytics/route.ts` | REST endpoint |
| `components/analytics/copies-chart.tsx` | Recharts bar chart (client) |
| `app/(dashboard)/analytics/page.tsx` | Analytics dashboard page |
| `components/layout/sidebar-nav.tsx` | Sidebar link added |

## Decisions

- 30-day default window is hardcoded in the page; the API supports a `?days=` param up to 90.
- "All roles" access — no role gate, just requires a valid session with a companyId.
- Chart ticks are sparse (max 7 labels) to avoid crowding on 30-day views.
