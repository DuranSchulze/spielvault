# Solution — Plan 09: Add Consistent Role Enforcement

> **Status:** ✅ Completed
> **Implementation Date:** 2026-05-23
> **Checklist Ref:** `CHECKLIST.md` → #9

---

## What Was Implemented

Audited and fixed all mutation API routes to consistently check `canManageDepartment` (admin+) before allowing management operations.

## Role Checks Applied

### Before (Inconsistent)

| Route | Role Checked | Status |
|---|---|---|
| `POST /api/departments` | ✅ `canManageDepartment` | Already correct |
| `PATCH /api/departments/[id]` | ✅ `canManageDepartment` | Already correct |
| `DELETE /api/departments/[id]` | ✅ `canManageDepartment` | Already correct |
| `POST /api/spiels` | ❌ None | Employees can create (intentional) |
| `PATCH /api/spiels/[id]` | ❌ None | Was missing — added for archive |
| `DELETE /api/spiels/[id]` | ❌ None | Was missing — added |
| `POST /api/categories` | ❌ None | Added |
| `PATCH /api/categories/[id]` | ❌ None | Added |
| `DELETE /api/categories/[id]` | ❌ None | Added |
| `POST /api/variables` | ❌ None | Added |
| `PATCH /api/variables/[id]` | ❌ None | Added |
| `DELETE /api/variables/[id]` | ❌ None | Added |
| `POST /api/users` | ✅ `canManageDepartment` | Already correct (from Plan 08) |
| `PATCH /api/users/[id]` | ✅ `canManageDepartment` | Already correct (from Plan 08) |
| `DELETE /api/users/[id]` | ✅ `canManageDepartment` | Already correct (from Plan 08) |

### After (All Consistent)

| Resource | Create | Edit | Delete |
|---|---|---|---|
| Spiels | Employee+ | Employee+ (archive: Admin+) | Admin+ |
| Categories | Admin+ | Admin+ | Admin+ |
| Departments | Admin+ | Admin+ | Admin+ |
| Variables | Admin+ | Admin+ | Admin+ |
| Users | Admin+ | Admin+ | Admin+ |

## Implementation Notes

- **Spiels are unique**: Employees CAN create spiels (PRD requirement), and can edit their content. Only **archiving** and **deleting** require admin.
- **`canManageDepartment`** is the permission gate — it checks for `admin` or `super_admin` role. This is consistent because department management is an admin-level operation.
- All checks use the same pattern: `canManageDepartment(access.session.user.role as UserRole)` after the auth check.

## Files Modified

| File | Change |
|---|---|
| `app/api/categories/route.ts` | **Modified** — Added `canManageDepartment` + imports to POST |
| `app/api/categories/[id]/route.ts` | **Modified** — Added `canManageDepartment` + imports to PATCH and DELETE |
| `app/api/variables/route.ts` | **Modified** — Added `canManageDepartment` + imports to POST |
| `app/api/variables/[id]/route.ts` | **Modified** — Added `canManageDepartment` + imports to PATCH and DELETE |
| `app/api/spiels/[id]/route.ts` | **Modified** — Added `canManageDepartment` + imports to PATCH (archive) and DELETE |

## Acceptance Criteria

- [x] Employees cannot create categories, departments, or variables
- [x] Employees can create spiels and update their content
- [x] Employees cannot archive or delete spiels
- [x] Admin can do all management operations
- [x] Super admin can do all operations
