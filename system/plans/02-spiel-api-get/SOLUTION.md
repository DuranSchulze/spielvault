# Solution — Plan 02: Add GET Handler for Spiel Detail

> **Status:** ✅ Completed
> **Implementation Date:** 2026-05-23
> **Checklist Ref:** `CHECKLIST.md` → #2

---

## What Was Implemented

Added a `GET` export to `app/api/spiels/[id]/route.ts` that fetches a single spiel's full data including its relations (department, category, creator).

## Deviations from Plan

None. The implementation followed the plan exactly as specified.

## Key Decisions

| Decision | Rationale |
|---|---|
| Used `findFirst` with `companyId` filter | Ensures cross-company isolation — a spiel from Company A cannot be accessed by a user from Company B, even with a valid ID guess |
| Included department, category, and createdBy relations | Gives the front-end all data needed for detail/edit views without extra round trips |
| Reused a direct Prisma query instead of a service function | Consistent with the existing pattern in other route handlers; service layer refactor can come later |

## Files Created or Modified

| File | Change |
|---|---|
| `app/api/spiels/[id]/route.ts` | **Modified** — Added `GET` handler before existing `PATCH` and `DELETE` |

## Testing / Verification

- `GET /api/spiels/:id` with valid ID and auth → returns 200 with spiel + relations ✅
- `GET /api/spiels/:id` without auth → returns 401 ✅
- `GET /api/spiels/:id` with ID from another company → returns 404 ✅
- `GET /api/spiels/:id` with spiel in department user doesn't belong to → returns 403 ✅

## Watch Out For

- The `getSpielForAccess` helper used by PATCH/DELETE does NOT include full relations (it's a minimal selector for access checking only). The GET handler uses its own query with the full `include`. This is intentional — the access-check helper is lean on purpose.
- If the Prisma schema changes (e.g., new fields on Spiel), the `include` block may need updating to match what the front-end detail/edit pages expect.
