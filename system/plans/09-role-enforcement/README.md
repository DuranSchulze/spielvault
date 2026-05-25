# Plan 09 — Add Consistent Role Enforcement

> **Priority:** 🟡 Medium
> **Checklist Ref:** `CHECKLIST.md` → #9

---

## What

Audit and fix all API route handlers to consistently check role-based permissions (`canManageDepartment`, `canManageSpiels`, etc.) before allowing mutation operations.

## Why

Role enforcement is currently inconsistent:

| Route | Role Checked | Status |
|---|---|---|
| `POST /api/departments` | `canManageDepartment` | ✅ |
| `PATCH /api/departments/[id]` | `canManageDepartment` | ✅ |
| `DELETE /api/departments/[id]` | `canManageDepartment` | ✅ |
| `POST /api/spiels` | ❌ None (only dept access) | ❌ |
| `PATCH /api/spiels/[id]` | ❌ None (only dept access) | ❌ |
| `POST /api/categories` | ❌ None | ❌ |
| `PATCH /api/categories/[id]` | ❌ None | ❌ |
| `DELETE /api/categories/[id]` | ❌ None | ❌ |
| `POST /api/variables` | ❌ None | ❌ |
| `PATCH /api/variables/[id]` | ❌ None | ❌ |
| `DELETE /api/variables/[id]` | ❌ None | ❌ |

An employee could technically create/update/delete spiels, categories, and variables.

## Requirements

- [ ] Audit every mutation API route for missing role checks
- [ ] Add `canManage*` checks where missing
- [ ] Create a helper function like `requireManageAccess()` if the pattern repeats
- [ ] Keep a clear rule: employees can VIEW, admins can MANAGE, super_admins can do everything

## Permissions Mapping

| Resource | View | Create | Edit | Delete |
|---|---|---|---|---|
| Spiels | Employee+ | Employee+ | Owner/Admin+ | Admin+ |
| Categories | Employee+ | Admin+ | Admin+ | Admin+ |
| Departments | Employee+ | Admin+ | Admin+ | Admin+ |
| Variables | Employee+ | Admin+ | Admin+ | Admin+ |
| Users | Employee+ | SuperAdmin/Admin | Admin+ | Admin+ |
| Company | Employee+ | SuperAdmin | SuperAdmin | SuperAdmin |

## Files Affected

| File | Change |
|---|---|
| `app/api/spiels/route.ts` | **Modify** — Add `canManageSpiels` check to POST |
| `app/api/spiels/[id]/route.ts` | **Modify** — Add role check to PATCH, DELETE |
| `app/api/categories/route.ts` | **Modify** — Add role check to POST |
| `app/api/categories/[id]/route.ts` | **Modify** — Add role check to PATCH, DELETE |
| `app/api/variables/route.ts` | **Modify** — Add role check to POST |
| `app/api/variables/[id]/route.ts` | **Modify** — Add role check to PATCH, DELETE |

## Dependencies

None.

## Acceptance Criteria

- [ ] Employees cannot create categories, departments, or variables
- [ ] Employees cannot delete spiels or categories
- [ ] Admin can do all management operations
- [ ] Super admin can do all operations across all companies (where applicable)
