# Plan 07 — Build Categories Management Page

> **Priority:** 🟡 Medium
> **Checklist Ref:** `CHECKLIST.md` → #7

---

## What

Replace the static placeholder at `/categories` with a full categories management page — list, create, edit, delete.

## Why

Category management currently only exists inside the "New Spiel" form modal. The dedicated `/categories` page is a static placeholder saying "No categories yet." The PRD requires a dedicated management view.

## Current State

- **`app/(dashboard)/categories/page.tsx`** — Static placeholder with "No categories yet" and a non-functional "+ New Category" button
- **Category API routes already exist** — `POST /api/categories`, `PATCH /api/categories/[id]`, `DELETE /api/categories/[id]`
- **`CategoryManagerModal`** — Existing modal in the new spiel form that can be reused

## Requirements

- [ ] Page lists all categories for the user's company
- [ ] Inline or modal create form (reuse `CategoryManagerModal` or build dedicated)
- [ ] Inline or modal edit form
- [ ] Delete with confirmation
- [ ] Works within the existing dashboard layout
- [ ] Uses existing API routes (no new backend code needed)

## Implementation Approach

1. Make the page a server component that fetches categories
2. Create a `CategoriesManager` client component (similar to `DepartmentsManager`)
3. Reuse the CRUD patterns from `DepartmentsManager` and `CategoryManagerModal`
4. Wire up to existing API endpoints

## Files Affected

| File | Change |
|---|---|
| `app/(dashboard)/categories/page.tsx` | **Rewrite** — Replace placeholder with full management UI |
| `components/categories/categories-manager.tsx` | **Create** — New client component for category CRUD |

## Dependencies

None (API already exists).

## Acceptance Criteria

- [ ] Page shows all categories for the user's company
- [ ] Admin users can create, edit, and delete categories
- [ ] Employee users see categories but cannot modify them
- [ ] Delete shows confirmation and nullifies category on spiels
- [ ] Creating a category here makes it available in the new spiel form
