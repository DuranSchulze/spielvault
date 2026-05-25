# Plan 01 — Create Edit Spiel Route

> **Priority:** 🔴 Critical
> **Checklist Ref:** `CHECKLIST.md` → #1

---

## What

Build the missing `/spiels/[id]/edit` page that allows users to edit an existing spiel's title, content, department, and category.

## Why

The spiel detail page (`/spiels/[id]`) has an "Edit" button linking to `/spiels/${params.id}/edit`, but no route exists — clicking it returns a 404. This breaks a core CRUD requirement from the PRD and makes spiels effectively write-once.

## Current State

- **`app/(dashboard)/spiels/[id]/page.tsx`** — Links to `/spiels/${params.id}/edit` (~line 21) but the route doesn't exist
- **`app/(dashboard)/spiels/new/new-spiel-form.tsx`** — The create form exists and can be reused with pre-filled data
- **`app/api/spiels/[id]/route.ts`** — PATCH handler exists but only archives (needs extension — see Plan 03)
- **No `GET` handler** exists for fetching spiel data (see Plan 02)

## Requirements

- [ ] Route exists at `app/(dashboard)/spiels/[id]/edit/page.tsx`
- [ ] Page fetches the spiel by ID (using Plan 02's GET handler or server-side fetch)
- [ ] Page pre-fills the editor with existing content (title, HTML, JSON, plain)
- [ ] Page pre-selects the existing department and category
- [ ] Save button triggers PATCH (using Plan 03's extended handler)
- [ ] Successful save redirects back to `/spiels` or `/spiels/[id]`
- [ ] Cancel/back button returns to the spiel list or detail page
- [ ] Access control: user must have access to the spiel's department

## Implementation Approach

**Option A: Reuse `NewSpielForm` as an edit form (recommended)**
1. Refactor `NewSpielForm` to accept optional `initialData` prop
2. Create edit page that fetches data server-side, then passes it to the form
3. Change save button to call `PATCH` instead of `POST` when in edit mode

**Option B: Create a separate `EditSpielForm` component**
1. Duplicate the form logic but with edit-specific wiring
2. Pros: independent evolution; Cons: code duplication

**Recommended: Option A** — The form components (`SpielEditor`, `VariablePanel`, `CategoryManagerModal`) are already decoupled and reusable.

## Files Affected

| File | Change |
|---|---|
| `app/(dashboard)/spiels/[id]/edit/page.tsx` | **Create** — New route page, fetches spiel data |
| `app/(dashboard)/spiels/new/new-spiel-form.tsx` | **Modify** — Accept optional `initialData` and mode prop |
| `app/(dashboard)/spiels/new/page.tsx` | **No change** — still works as create |

## Dependencies

- **Plan 02** (`spiel-api-get`) — Must exist first to fetch spiel data
- **Plan 03** (`spiel-patch-update`) — Must exist first to save edits

## Acceptance Criteria

- [ ] Navigating to `/spiels/[id]/edit` shows a form pre-filled with existing data
- [ ] Changing title/content/category and saving updates the spiel
- [ ] The edit page is not accessible for spiels the user doesn't have access to
- [ ] Cancel returns to the spiel list
- [ ] After save, user is redirected and sees the updated data
