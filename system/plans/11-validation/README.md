# Plan 11 — Add Server-Side Validation

> **Priority:** 🟢 Minor
> **Checklist Ref:** `CHECKLIST.md` → #11

---

## What

Introduce Zod (or Valibot) as a validation library and apply it across all API route handlers for consistent request body validation.

## Why

All current API routes validate manually — `body.name?.trim()`, checking `!body.title`, etc. This is error-prone, verbose, and inconsistent. A schema-based approach centralizes validation logic and generates better error messages.

## Requirements

- [ ] Add `zod` to dependencies
- [ ] Create a `lib/validations/` directory with shared schemas
- [ ] Apply validation to all POST, PATCH handlers
- [ ] Return structured 400 errors with field-level details

## Implementation

```ts
// lib/validations/spiel.ts
import { z } from "zod";

export const createSpielSchema = z.object({
  title: z.string().min(1, "Title is required").max(200),
  departmentId: z.string().min(1, "Department is required"),
  categoryId: z.string().nullable().optional(),
  contentHtml: z.string().min(1, "Content is required"),
  contentJson: z.string().optional(),
  contentPlain: z.string().optional(),
});

export const updateSpielSchema = z.object({
  title: z.string().min(1).max(200).optional(),
  departmentId: z.string().optional(),
  categoryId: z.string().nullable().optional(),
  contentHtml: z.string().optional(),
  contentJson: z.string().optional(),
  contentPlain: z.string().optional(),
  status: z.enum(["active", "archived"]).optional(),
});
```

```ts
// lib/validations/department.ts
export const createDepartmentSchema = z.object({
  name: z.string().min(1, "Department name is required").max(100),
  description: z.string().nullable().optional(),
});

export const updateDepartmentSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  description: z.string().nullable().optional(),
});
```

## Files Affected

| File | Change |
|---|---|
| `package.json` | **Modify** — Add `zod` |
| `lib/validations/spiel.ts` | **Create** — Spiel schemas |
| `lib/validations/department.ts` | **Create** — Department schemas |
| `lib/validations/category.ts` | **Create** — Category schemas |
| `lib/validations/variable.ts` | **Create** — Variable schemas |
| All route handlers | **Modify** — Use `.parse()` instead of manual checks |

## Dependencies

None.

## Acceptance Criteria

- [ ] Creating a spiel with empty title returns structured error
- [ ] Updating a department with empty name returns structured error
- [ ] Creating a category without name returns structured error
- [ ] All existing validations still pass (same business rules)
