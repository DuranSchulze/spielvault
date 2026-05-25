# Plan 22 — Usage Analytics

> **Priority:** 🚀 Future (Phase 2+)
> **Checklist Ref:** `CHECKLIST.md` → #22

---

## What

Collect and display usage analytics — which spiels are most copied, most viewed, who uses them, and how often.

## Key Considerations

- Track: copy events, view events, insert events (from extension), search queries
- **New model:** `SpielAnalytics` or extend `AuditLog` with specific action types
- Dashboard shows: top copied spiels, active users, searches per day, spiels created vs copied
- Could use the existing `AuditLog` model with `action: "copy" | "view"` etc.
- Privacy: aggregate data, don't track individual copy events per user if not needed

## Files Likely Affected

| File | Change |
|---|---|
| `prisma/schema.prisma` | **Modify** — Extend AuditLog or add analytics model |
| Components | Dashboard widgets: bar charts, top lists |
| `app/api/analytics/route.ts` | **Create** — Aggregated analytics queries |

## Dependencies

Would benefit from charting library (recharts, chart.js, or D3).
