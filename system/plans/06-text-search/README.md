# Plan 06 — Add Full-Text Search

> **Priority:** 🟡 Medium
> **Checklist Ref:** `CHECKLIST.md` → #6

---

## What

Add a text search input to the spiel library page that filters spiels by matching against `title` and `contentPlain` using Prisma's `contains` with case-insensitive mode.

## Why

The PRD requires search by title and text content. Currently the library page only filters by department and category — no text-based search exists.

## Requirements

- [ ] Add a search input at the top of the spiels page
- [ ] Use a `q` query parameter (`/spiels?q=customer+support`)
- [ ] Search matches against `title` (OR) `contentPlain` using `contains` + `mode: 'insensitive'`
- [ ] Existing department/category filters combine with search (AND)
- [ ] Search works on both library and archive pages
- [ ] Debounce or submit-on-enter pattern (avoid per-character API calls)

## Implementation

```ts
// In the page component
const search = params.q?.trim() || "";

// In the Prisma where clause
where: {
  companyId,
  status: "active",
  departmentId: { in: departmentIds },
  ...(params.department ? { departmentId: params.department } : {}),
  ...(params.category ? { categoryId: params.category } : {}),
  ...(search ? {
    OR: [
      { title: { contains: search, mode: 'insensitive' } },
      { contentPlain: { contains: search, mode: 'insensitive' } },
    ],
  } : {}),
},
```

## Files Affected

| File | Change |
|---|---|
| `app/(dashboard)/spiels/page.tsx` | **Modify** — Add `q` param, extend where clause |
| `app/(dashboard)/archive/page.tsx` | **Modify** — Same search logic |
| `components/spiels/spiel-list.tsx` | **No change** — already renders passed spiels |

## Dependencies

None.

## Acceptance Criteria

- [ ] Searching "support" shows only spiels with "support" in title or plain text
- [ ] Search combined with department filter works (AND)
- [ ] Search combined with category filter works (AND)
- [ ] Empty search shows all spiels (no filter applied)
- [ ] Archive page also has search
