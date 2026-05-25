# Solution — Plan 06: Add Full-Text Search

> **Status:** ✅ Completed
> **Implementation Date:** 2026-05-23
> **Checklist Ref:** `CHECKLIST.md` → #6

---

## What Was Implemented

Added a text search input to both the spiel library page (`/spiels`) and the archive page (`/archive`) that filters spiels by matching against `title` and `contentPlain`.

## How It Works

- **URL param:** `?q=search+term` — standard `GET` form submission, no JavaScript required
- **Search scope:** Matches against `title` (OR) `contentPlain` using Prisma's `contains` with `mode: 'insensitive'`
- **Combination:** Search combines with existing department/category filters (AND logic)
- **Pagination preserved:** Search query is carried through pagination links (`buildPageHref`)
- **Filters preserved:** Search query is carried through filter chip links
- **Hidden inputs:** Department and category filters are passed as hidden form fields so search doesn't reset them

## Deviations from Plan

| Aspect | Planned | Actual |
|---|---|---|
| Search input | Generic search input | Inline `<form method="GET">` with search icon button |
| Debounce | Mentioned as option | Not needed — form submit triggers full server navigation |
| Hidden fields | Not mentioned | Added to preserve department/category when searching |

## Key Decisions

| Decision | Rationale |
|---|---|
| `<form method="GET">` instead of client-side fetch | Simple, accessible, works without JS, aligns with server-rendered pattern |
| Hidden inputs for department/category | Ensures searching within a filtered view doesn't reset the filter |
| `mode: 'insensitive'` | Case-insensitive search feels more natural for text content |
| `search || undefined` in filter links | Avoids `?q=` in URL when search is empty (cleaner URLs) |

## Files Created or Modified

| File | Change |
|---|---|
| `app/(dashboard)/spiels/page.tsx` | **Modified** — Added `q` to `SearchParams`, search filter in `whereClause`, search form in header, `q` preserved on filter/pagination links |
| `app/(dashboard)/archive/page.tsx` | **Modified** — Same search logic mirroring the spiels page |
| `components/spiels/spiel-list.tsx` | **Modified** — Added `q` to `PaginationInfo.filterParams`, preserved in `buildPageHref` |

## Testing / Verification

- `/spiels?q=support` → shows only spiels with "support" in title or plain text ✅
- `/spiels?q=support&department=abc` → search within department ✅
- `/spiels?q=support&page=2` → paginated search results ✅
- Empty search → shows all spiels (no filter applied) ✅
- Archive page search works the same way ✅
- Changing filter chip preserves current search query ✅
- Pagination links preserve current search query ✅

## Watch Out For

- Prisma's `contains` with `mode: 'insensitive'` uses PostgreSQL `ILIKE` under the hood, which does not use standard indexes. For very large datasets (>50K spiels), consider adding a PostgreSQL `tsvector` full-text index for better performance.
- The search input has `type="search"` which provides a native clear button in some browsers — hitting clear and submitting removes the `q` param automatically.
