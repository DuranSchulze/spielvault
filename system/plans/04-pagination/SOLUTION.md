# Solution — Plan 04: Add Pagination to Spiel Lists

> **Status:** ✅ Completed
> **Implementation Date:** 2026-05-23
> **Checklist Ref:** `CHECKLIST.md` → #4

---

## What Was Implemented

Added offset-based pagination to both the spiel library page (`/spiels`) and the archive page (`/archive`).

### How It Works

- **Page size:** 50 items per page (configured via `PAGE_SIZE` constant)
- **Query approach:** Fetches `PAGE_SIZE + 1` items to detect next page without an extra count query for presence
- **Total pages:** Computed from a parallel `prisma.spiel.count()` query with the same filters
- **URL param:** `?page=2` — preserved across filter changes with page reset on filter change

## Deviations from Plan

- Filter chip links now explicitly set `page: undefined` to reset to page 1 when a filter changes — this ensures a filtered view always starts at the beginning
- Used `<a>` tags instead of `<button>` or `<Link>` for prev/next so they work as full page navigations (consistent with the server-rendered approach)

## Key Decisions

| Decision | Rationale |
|---|---|
| `take: PAGE_SIZE + 1` to detect next page | Avoids a full count query just for presence; `count()` is still used for total pages display |
| Pagination rendered inside `SpielList` (client component) | Keeps the page structure simple; prev/next are `<a>` tags so they trigger full server navigation |
| `buildPageHref` in `SpielList` | Constructs URLs with all current filters preserved plus the new page number |
| Reset page on filter change (`page: undefined`) | Ensures users don't land on an empty page after switching departments or categories |

## Files Created or Modified

| File | Change |
|---|---|
| `app/(dashboard)/spiels/page.tsx` | **Modified** — Added `PAGE_SIZE`, paginated queries, `pagination` prop, reset page on filter links |
| `app/(dashboard)/archive/page.tsx` | **Modified** — Same pagination logic as the spiels page |
| `components/spiels/spiel-list.tsx` | **Modified** — Added `PaginationInfo` type, `pagination` prop, prev/next UI, `buildPageHref` helper |

## Testing / Verification

- `/spiels` with < 50 spiels → no pagination controls shown ✅
- `/spiels?page=2` with > 50 spiels → shows next page of results ✅
- Previous/Next buttons preserve department and category filters ✅
- Clicking a department filter resets to page 1 ✅
- Archive page has the same pagination behavior ✅
- Single page of results → no pagination controls ✅
- Empty results → shows empty message, no pagination ✅

## Watch Out For

- The `count` query uses the same `whereClause` as `findMany`, so performance should be proportional. For very large datasets (>100K spiels), you may want to consider cursor-based pagination instead.
- When a user archives/deletes a spiel from a page, the list re-renders client-side but doesn't update pagination state. A full page refresh (router.refresh) is triggered to sync server state.
