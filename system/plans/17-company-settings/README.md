# Plan 17 — Company Settings Page

> **Priority:** 🚀 Future (Phase 2+)
> **Checklist Ref:** `CHECKLIST.md` → #17
> **Status:** Ready to implement

---

## What

Replace the placeholder at `/companies` with a functional Company Settings page
accessible only to `super_admin`. Shows company stats, lets the super_admin
update the company name, and exposes the slug as read-only.

---

## Why

Super admins need a place to manage workspace-level settings that don't belong
on a per-user profile page. Currently the route is a placeholder.

---

## Requirements

1. Only `super_admin` can access — all others redirect to `/dashboard`.
2. Display: company name (editable), slug (read-only), created date.
3. Display stats cards: total spiels, departments, categories, users.
4. The name change is saved via `PATCH /api/companies/[id]`; the slug never
   changes (it's used as a URL identifier).
5. A "Settings" sidebar link appears only for `super_admin`.
6. Audit-log the name change.

---

## Approach

### 1. API — `PATCH /api/companies/[id]/route.ts`

- Auth: `getAccessContextOrNull()`, role check `canManageCompany` (super_admin only).
- Body: `{ name: string }` — trim and validate min 2 chars.
- Update `company.name` only (slug stays immutable).
- Call `logActivity` after success.
- Returns updated `{ id, name, slug }`.

### 2. Page — `app/(dashboard)/companies/page.tsx`

Server component:
- `requireAccessContext()` → redirect non-super_admin to `/dashboard`.
- Parallel queries: company record + stats (spielCount, departmentCount,
  categoryCount, userCount).
- Renders stats cards and `<CompanySettingsForm>` client component.

### 3. Form — `app/(dashboard)/companies/company-settings-form.tsx`

Client component (same pattern as `profile-form.tsx`):
- Controlled name input.
- `PATCH /api/companies/${companyId}` on submit.
- Shows success / error message; calls `router.refresh()` on success.

### 4. Sidebar

Add `isSuperAdmin` prop to `SidebarNav`. Render a "Settings" nav item
(pointing to `/companies`) only when `isSuperAdmin` is true. Pass it from
`DashboardShell` via `session.user.role`.

### 5. Permissions

Add `canManageCompany` to `lib/permissions/index.ts`:
```ts
export function canManageCompany(role: UserRole): boolean {
  return hasRole(role, "super_admin");
}
```

---

## Files Affected

| File | Change |
|---|---|
| `lib/permissions/index.ts` | Add `canManageCompany` |
| `app/api/companies/[id]/route.ts` | **Create** — PATCH handler |
| `app/(dashboard)/companies/page.tsx` | **Rewrite** — live settings page |
| `app/(dashboard)/companies/company-settings-form.tsx` | **Create** — client form |
| `components/layout/sidebar-nav.tsx` | Add `isSuperAdmin` prop + Settings link |
| `components/layout/dashboard-shell.tsx` | Pass `isSuperAdmin` to sidebar |

---

## Acceptance Criteria

- [ ] Non-super_admin visiting `/companies` is redirected to `/dashboard`.
- [ ] Super_admin sees company name, slug, created date, and four stat cards.
- [ ] Updating the name saves to the DB, refreshes the page, shows success.
- [ ] The slug field is always read-only.
- [ ] A "Settings" link appears in the sidebar for super_admin only.
- [ ] Name change is recorded in `AuditLog`.
