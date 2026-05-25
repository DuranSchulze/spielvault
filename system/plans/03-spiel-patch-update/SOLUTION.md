# Solution — Plan 03: Extend PATCH for Content Updates

> **Status:** ✅ Completed
> **Implementation Date:** 2026-05-23
> **Checklist Ref:** `CHECKLIST.md` → #3

---

## What Was Implemented

Replaced the hardcoded `{ status: "archived" }` PATCH handler in `app/api/spiels/[id]/route.ts` with a dynamic builder that accepts optional fields: `title`, `contentHtml`, `contentJson`, `contentPlain`, `categoryId`, and `status`.

## Deviations from Plan

- Did not add a role/permission check (`canManageSpiels`) yet — that's covered by **Plan 09** (Role Enforcement) which will audit all routes at once
- The existing archive flow is preserved: sending `{ status: "archived" }` still works

## Key Decisions

| Decision | Rationale |
|---|---|
| Dynamic `data` object built from request body | Only updates fields that were actually sent — avoids overwriting unmodified fields |
| `categoryId: null` explicitly sets category to null | Allows removing a category from a spiel, not just changing it |
| Category validation checks company scope | Prevents assigning a category from another company |

## Files Created or Modified

| File | Change |
|---|---|
| `app/api/spiels/[id]/route.ts` | **Modified** — Dynamic PATCH handler replacing hardcoded archive |

## Testing / Verification

- `PATCH /api/spiels/:id` with `{ title: "New Title" }` → updates only title ✅
- `PATCH /api/spiels/:id` with `{ status: "archived" }` → archives the spiel ✅
- `PATCH /api/spiels/:id` with `{ categoryId: null }` → removes category ✅
- `PATCH /api/spiels/:id` with invalid `categoryId` → returns 404 ✅
- `PATCH /api/spiels/:id` with empty body `{}` → returns 400 ✅
- Auth and department access checks preserved ✅

## Watch Out For

- The dynamic builder uses `body.field !== undefined` checks, so sending `{ title: "" }` WILL set title to empty string. The front-end should validate before sending.
- No character limits enforced server-side yet (covered by Plan 11 — Validation).
