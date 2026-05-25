# Plan 04 — Add Pagination to Spiel Lists

> **Priority:** 🟡 Medium
> **Checklist Ref:** `CHECKLIST.md` → #4

---

## What

Add offset-based pagination (`take`/`skip`) to all spiel `findMany` queries so lists don't fetch all rows at once as the database grows.

## Why

Both `spiels/page.tsx` and `archive/page.tsx` use `prisma.spiel.findMany()` with no limit. With hundreds or thousands of spiels, these pages will fetch everything on every load, degrading performance and increasing memory usage.

## Requirements

- [ ] Add a `page` search param (`/spiels?page=2`) to spiel library and archive pages
- [ ] Use `PAGE_SIZE` constant (e.g. 50) for `take`
- [ ] Use `skip: (page - 1) * PAGE_SIZE` for offset
- [ ] Fetch `PAGE_SIZE + 1` to detect if there's a next page
- [ ] Show "previous" / "next" buttons or numbered pagination
- [ ] Maintain existing filter params across pagination (`/spiels?department=X&category=Y&page=2`)
- [ ] Update `SpielList` component to accept pagination state

## Implementation

```ts
const PAGE_SIZE = 50;
const page = params.page ? Math.max(1, Number(params.page)) : 1;

const [spiels, totalCount] = await Promise.all([
  prisma.spiel.findMany({
    take: PAGE_SIZE + 1,
    skip: (page - 1) * PAGE_SIZE,
    where: { /* existing filters */ },
    include: { /* existing includes */ },
    orderBy: { updatedAt: "desc" },
  }),
  prisma.spiel.count({ where: { /* same filters */ } }),
]);

const hasNextPage = spiels.length > PAGE_SIZE;
const displaySpiels = hasNextPage ? spiels.slice(0, PAGE_SIZE) : spiels;
const totalPages = Math.ceil(totalCount / PAGE_SIZE);
```

## Files Affected

| File | Change |
|---|---|
| `app/(dashboard)/spiels/page.tsx` | **Modify** — Add page param, pagination logic |
| `app/(dashboard)/archive/page.tsx` | **Modify** — Same pagination logic |
| `components/spiels/spiel-list.tsx` | **Modify** — Accept pagination controls |
| `components/spiels/spiel-card.tsx` | **No change** |

## Dependencies

None.

## Acceptance Criteria

- [ ] Loading `/spiels` with 60 spiels shows first 50, with "next" button
- [ ] Clicking "next" preserves department and category filter params
- [ ] The total page count is visible
- [ ] Works correctly on the archive page too
