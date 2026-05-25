# Solution — Plan 14: Favorite / Pin Spiels

> **Implemented:** 2026-05-23
> **Status:** Complete (pending DB migration on a live environment)

---

## What Was Implemented

A per-user favorites system that lets any authenticated user star spiels.
Favorited spiels surface at the top of the library list and can be isolated
via a "Favorites" filter chip.

---

## Files Created

| File | Purpose |
|---|---|
| `app/api/spiels/[id]/favorite/route.ts` | POST (add) and DELETE (remove) favorite; uses upsert on POST for idempotency |

---

## Files Modified

| File | Change |
|---|---|
| `prisma/schema.prisma` | Added `UserSpielFavorite` model; added `favorites` back-relation to `User`; added `favoritedBy` back-relation to `Spiel` |
| `components/spiels/spiel-card.tsx` | Added `isFavorited` to `SpielCardData` type; added `onFavoriteToggle` + `isFavoritePending` props; added star icon button to hover toolbar (always visible when favorited, hover-only otherwise; filled amber when active) |
| `components/spiels/spiel-list.tsx` | Added `favoritePendingId` state; added `sortFavoritesFirst` helper; added `handleFavoriteToggle` with optimistic update + rollback on error; wired `onFavoriteToggle` to `SpielCard` (library mode only); added `favorites` to `PaginationInfo.filterParams` and `buildPageHref` |
| `app/(dashboard)/spiels/page.tsx` | Added `favorites` URL param; `favoritesOnly` flag drives a `favoritedBy.some` Prisma filter; parallel `userSpielFavorite.findMany` query after main fetch; `isFavorited` mapped onto each spiel; added ★ Favorites filter chip to the filter bar; `buildFilterHref` now accepts and forwards `favorites` |
| `app/(dashboard)/archive/page.tsx` | Added `isFavorited: false` to archived spiel items (archive mode never shows the favorite toggle, so always-false is correct) |

---

## Key Decisions

### Optimistic toggle with client-side re-sort
The star toggle flips immediately in local React state before the API call
resolves. On success the list is re-sorted (favorites first) in place without
a full page refresh. On error the state is rolled back and an error toast is
shown. This keeps the UX snappy without the complexity of server actions or
SWR mutation patterns.

### `sortFavoritesFirst` is client-side only
Sorting favorites to the top is done in `SpielList` rather than as a DB-level
`orderBy`. The page size is 50, so a JS sort over ≤50 items is negligible.
Avoiding a composite `orderBy` with a subquery keeps the Prisma query simple
and avoids an index on `user_spiel_favorite` for sort purposes.

### `favorites` filter uses a Prisma `some` relation filter
`?favorites=1` adds `{ favoritedBy: { some: { userId } } }` to the `where`
clause. Prisma translates this to an `EXISTS` subquery — no separate join or
raw SQL required. Pagination and all other filters (department, category,
search) still compose correctly on top of it.

### Archive page always passes `isFavorited: false`
The archive page doesn't render the favorite toggle (`onFavoriteToggle` is
`undefined` in archive mode). Hardcoding `false` avoids an extra DB query
for a feature that doesn't apply in that context.

### POST uses upsert, DELETE uses deleteMany
- `upsert` on POST: double-clicking the star doesn't throw a unique-constraint
  error; it's a no-op on the second click.
- `deleteMany` on DELETE: if the record doesn't exist (already unfavorited),
  it returns 0 rows deleted without throwing a 404, keeping the API idempotent.

---

## Migration Required

The `UserSpielFavorite` model was added to `prisma/schema.prisma` and the
Prisma client was regenerated (`prisma generate`). The actual SQL migration
**has not been run** because no database connection was available in this
environment. Before deploying, run:

```bash
npx prisma migrate dev --name add-favorites
```

This will create the `user_spiel_favorite` table with the unique index
`(userId, spielId)` and cascade delete constraints.

---

## Acceptance Criteria Status

| Criterion | Status |
|---|---|
| Star toggles immediately (optimistic) | ✅ |
| Favorited cards always show filled amber star | ✅ |
| Page refresh preserves favorite state | ✅ (DB-backed) |
| "★ Favorites" chip filters to user's starred spiels | ✅ |
| Favorites are per-user | ✅ (userId scoped at DB level) |
| Network error rolls back + shows toast | ✅ |
| Deleting a spiel cascades to favorites | ✅ (onDelete: Cascade in schema) |
| All roles can favorite | ✅ (no role gate on the API) |

---

## Watch Out For

- **Run the migration before deploying.** The Prisma client is already
  regenerated, but the table doesn't exist until `prisma migrate dev` runs.
- The `?favorites=1` convention is intentional (not `true`/`false`). The chip
  toggles by setting `favorites=1` or omitting the param entirely.
- The star button sits inside the `group-hover:opacity-100` toolbar but gets
  `!opacity-100` when `isFavorited` is true so it stays visible at all times.
