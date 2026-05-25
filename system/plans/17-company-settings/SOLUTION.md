# Solution — Plan 17: Company Settings Page

> **Implemented:** 2026-05-23
> **Status:** Complete

---

## What Was Implemented

The placeholder `/companies` page was replaced with a functional Company
Settings page. Super admins can view workspace stats, update the company name,
and see the immutable slug. A "Settings" sidebar link appears for super_admin
users only.

---

## Files Created

| File | Purpose |
|---|---|
| `app/api/companies/[id]/route.ts` | PATCH handler — updates company name; super_admin only |
| `app/(dashboard)/companies/company-settings-form.tsx` | Client form — controlled input, fetch PATCH, success/error feedback |

---

## Files Modified

| File | Change |
|---|---|
| `lib/permissions/index.ts` | Added `canManageCompany` (role ≥ super_admin) |
| `app/(dashboard)/companies/page.tsx` | Rewritten as server component: super_admin guard, stat cards, form |
| `components/layout/sidebar-nav.tsx` | Added `isSuperAdmin` prop + `superAdminNav` with "Settings" link |
| `components/layout/dashboard-shell.tsx` | Derives `isSuperAdmin` from session role; passes to `SidebarNav` |

---

## Key Decisions

### Slug is intentionally immutable
The API only accepts a `name` field. The slug field in the form uses
`readOnly` and the API ignores any `slug` in the request body. Changing a
slug would break any bookmarks or integrations using it.

### `canManageCompany` is separate from `canManageDepartment`
A new permission helper was added rather than reusing `canManageDepartment`
(which allows `admin` and above). Company-level settings are restricted to
`super_admin` only, so a dedicated function makes the intent explicit and
allows either gate to change independently in the future.

### Company ID guard in the API
The PATCH route checks `id !== access.companyId` and returns 403 if they
don't match. This prevents a super_admin from one company from modifying
another company's record (even though the slug is unique and cross-company
access is already unusual).

### `isSuperAdmin` is independent of `isAdmin` in the sidebar
Both props are passed separately. A `super_admin` sees both the "Activity"
link (via `isAdmin`) and the "Settings" link (via `isSuperAdmin`) because
`canManageDepartment` returns true for super_admin as well (role ≥ admin).

---

## Acceptance Criteria Status

| Criterion | Status |
|---|---|
| Non-super_admin redirected from `/companies` | ✅ |
| Super_admin sees name, slug, created date, four stat cards | ✅ |
| Name update saves, refreshes page, shows success | ✅ |
| Slug field is always read-only | ✅ |
| "Settings" sidebar link shown to super_admin only | ✅ |
| Name change logged to `AuditLog` as `company.update` | ✅ |

---

## Watch Out For

- The `company.update` action key is new — not covered by the `ACTION_LABELS`
  map in the `/activity` page. Add `"company.update": "updated company"`
  to that map if needed for the activity feed.
- There is no validation for duplicate company names — the schema has no
  unique constraint on `name`, only on `slug`.
