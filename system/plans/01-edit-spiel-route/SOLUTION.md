# Solution — Plan 01: Create Edit Spiel Route

> **Status:** ✅ Completed
> **Implementation Date:** 2026-05-23
> **Checklist Ref:** `CHECKLIST.md` → #1

---

## What Was Implemented

Built the missing `/spiels/[id]/edit` route that allows users to update an existing spiel's title, content, and category.

### Components Created/Modified

1. **`app/(dashboard)/spiels/[id]/edit/page.tsx`** — New server component page
   - Fetches the spiel via Prisma with company-scoped access check
   - Validates user has department access to the spiel
   - Fetches departments and categories for the form dropdowns
   - Passes `initialData` to the form

2. **`app/(dashboard)/spiels/new/new-spiel-form.tsx`** — Refactored to support edit mode
   - Added `initialData?: InitialSpielData` prop
   - When `initialData` is provided, pre-fills title, department, category, and editor content
   - Save button calls `PATCH /api/spiels/[id]` in edit mode instead of `POST /api/spiels`
   - Button label changes to "Update Spiel" in edit mode

## Deviations from Plan

- The `NewSpielForm` component was refactored in-place (Option A from the plan) — kept the same filename since it's now a dual-purpose create/edit form.
- The editor sync: used the existing `initialHtml` prop on `SpielEditor` plus a new `initialHtml` passthrough in `SpielEditorWithInsert`.

## Key Decisions

| Decision | Rationale |
|---|---|
| Reused `NewSpielForm` instead of creating a separate component | Avoids code duplication; the form's functionality is identical in both modes, only the API endpoint differs |
| Server-side fetch for initial data | Better UX — no loading state, immediate render of pre-filled form |
| `notFound()` for missing spiels | Standard Next.js 404 behavior |
| `redirect("/spiels")` for unauthorized access | Silent redirect instead of an error page — better for non-admin employees who may guess URLs |

## Files Created or Modified

| File | Change |
|---|---|
| `app/(dashboard)/spiels/[id]/edit/page.tsx` | **Created** — New edit route page |
| `app/(dashboard)/spiels/new/new-spiel-form.tsx` | **Modified** — Added `initialData` prop, edit mode save logic |

## Dependencies Fulfilled

This plan depended on:
- **Plan 02** (GET Handler) — Used as the API reference for fetching spiel data server-side
- **Plan 03** (PATCH Content Update) — The edit form uses PATCH to save changes

## Testing / Verification

- `GET /spiels/:id/edit` with valid spiel → renders pre-filled form ✅
- `GET /spiels/:id/edit` with non-existent spiel → 404 ✅
- `GET /spiels/:id/edit` with spiel in inaccessible department → redirects to /spiels ✅
- Editing title and saving → PATCH called, redirects to /spiels ✅
- Editing content and saving → PATCH called with updated content ✅

## Watch Out For

- The `SpielEditor` component uses `useEffect` to sync external `initialHtml` changes. Since the edit page passes initial data server-side, there's no async loading — the editor receives the HTML immediately and sets it correctly.
- If a spiel's department is changed (not currently exposed in the edit form), the PATCH handler would need `departmentId` in its payload. Currently the edit form does NOT allow changing the department — this was intentional to keep scope narrow.
