# Plan 11 — Add Server-Side Validation — Solution

> **Status:** ✅ Complete
> **Date:** 2026-05-23

## What Was Done

Introduced Zod as a validation library and applied it across all API route handlers for consistent request body validation.

## Changes

### New Files

| File | Purpose |
|---|---|
| `lib/validations/spiel.ts` | `createSpielSchema` and `updateSpielSchema` |
| `lib/validations/department.ts` | `createDepartmentSchema` and `updateDepartmentSchema` |
| `lib/validations/category.ts` | `createCategorySchema` and `updateCategorySchema` |
| `lib/validations/variable.ts` | `createVariableSchema` and `updateVariableSchema` |
| `lib/validations/user.ts` | `createUserSchema` and `updateUserSchema` |

### Modified Files

| File | Change |
|---|---|
| `package.json` | Added `zod` to dependencies |
| `app/api/spiels/route.ts` | POST now uses `createSpielSchema.safeParse()` |
| `app/api/spiels/[id]/route.ts` | PATCH now uses `updateSpielSchema.safeParse()` |
| `app/api/categories/route.ts` | POST now uses `createCategorySchema.safeParse()` |
| `app/api/categories/[id]/route.ts` | PATCH now uses `updateCategorySchema.safeParse()` |
| `app/api/departments/route.ts` | POST now uses `createDepartmentSchema.safeParse()` |
| `app/api/departments/[id]/route.ts` | PATCH now uses `updateDepartmentSchema.safeParse()` |
| `app/api/variables/route.ts` | POST now uses `createVariableSchema.safeParse()` |
| `app/api/variables/[id]/route.ts` | PATCH now uses `updateVariableSchema.safeParse()` |
| `app/api/users/route.ts` | POST now uses `createUserSchema.safeParse()` |
| `app/api/users/[id]/route.ts` | PATCH now uses `updateUserSchema.safeParse()` |

## Validation Behavior

- All routes use `safeParse()` instead of `parse()` to avoid throwing on malformed JSON bodies.
- The `req.json().catch(() => ({}))` pattern ensures that non-JSON bodies result in empty objects that fail validation cleanly.
- Errors are returned as structured field-level objects via `parsed.error.flatten().fieldErrors`.
- Inline type definitions (`CreateSpielBody`, `UpdateCategoryBody`, etc.) were removed and replaced by Zod inference.

## Decisions Made

- Used `safeParse` over `parse` throughout to catch malformed JSON gracefully (body parsing wrapped in `catch`).
- Kept business-rule validation (department access, duplicate checks, category existence) alongside Zod schema validation since those require database lookups.
- Changed the `createUserSchema` to use Zod's `.email()` validator instead of manual `trim().toLowerCase()` — this is stricter and provides better error messages.
