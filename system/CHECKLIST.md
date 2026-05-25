# Spiel Vault — Master Plan Checklist

> **Purpose:** Central tracking of all planned features, fixes, and enhancements.
> **How to use:** Each checklist item links to a folder under `system/plans/<id>-<slug>/`
>   containing a detailed spec. Mark items `[x]` when complete.
>
> **To add a new plan:**
> 1. Create a new folder `system/plans/<next-number>-<descriptive-slug>/`
> 2. Add a `README.md` with: What, Why, Requirements, Approach, Files Affected, Acceptance Criteria
> 3. Add an entry below in the appropriate section with `- [ ] **N. Title** → `plans/N-slug/``
>
> **When a plan is completed:**
> 1. Mark the checklist item `[x]`
> 2. Add a `SOLUTION.md` inside the plan's folder documenting:
>    - What was actually implemented (vs what was planned)
>    - Any deviations from the original plan
>    - Key files created or modified
>    - Decisions made during implementation
>    - Anything to watch out for in future changes
> 3. Update the Progress Summary table below
>
> <!-- When adding new items: pick the next sequential number, add to the correct
>      section (Critical / Medium / Minor / Future), and create the corresponding
>      folder with a README.md. Keep the numbering sequential within each section. -->

---

## 🔴 Critical Fixes

- [x] **1. Create Edit Spiel Route** → [`plans/01-edit-spiel-route/`](./plans/01-edit-spiel-route/)
  > Build the missing `/spiels/[id]/edit` page so users can update existing spiels.

- [x] **2. Add GET Handler for Spiel Detail** → [`plans/02-spiel-api-get/`](./plans/02-spiel-api-get/)
  > Export a `GET` handler in `api/spiels/[id]/route.ts` to fetch spiel data with relations.

- [x] **3. Extend PATCH for Content Updates** → [`plans/03-spiel-patch-update/`](./plans/03-spiel-patch-update/)
  > Allow `PATCH /api/spiels/[id]` to update title, content, category — not just archive.

---

## 🟡 Medium Improvements

- [x] **4. Add Pagination to Spiel Lists** → [`plans/04-pagination/`](./plans/04-pagination/)
  > Add `take`/`skip` to all `findMany` queries for spiels to prevent full-table scans.

- [x] **5. Create `.env.example` File** → [`plans/05-env-example/`](./plans/05-env-example/)
  > Document all required environment variables so new devs can onboard quickly.

- [x] **6. Add Full-Text Search** → [`plans/06-text-search/`](./plans/06-text-search/)
  > Add text search input to the library page that searches title + contentPlain.

- [x] **7. Build Categories Management Page** → [`plans/07-categories-page/`](./plans/07-categories-page/)
  > Replace the placeholder `/categories` page with full CRUD using existing API.

- [x] **8. Build Users Management Page** → [`plans/08-users-page/`](./plans/08-users-page/)
  > Replace the placeholder `/users` page with user listing and invite flow.

- [x] **9. Add Consistent Role Enforcement** → [`plans/09-role-enforcement/`](./plans/09-role-enforcement/)
  > Ensure all mutation API routes check `canManage*` permissions consistently.

---

## 🟢 Minor Housekeeping

- [x] **10. Remove Unused Dependencies** → [`plans/10-unused-deps/`](./plans/10-unused-deps/)
  > Cleaned up duplicate `postcss` entry. `framer-motion` kept as peer dep of `goey-toast`.

- [x] **11. Add Server-Side Validation** → [`plans/11-validation/`](./plans/11-validation/)
  > Introduced Zod with 5 schema files, applied to all 10 POST/PATCH handlers.

- [x] **12. Fix Seed Account ID Coupling** → [`plans/12-seed-account-id/`](./plans/12-seed-account-id/)
  > Replaced `upsert` with `findFirst` + create/update to decouple Account ID.

- [x] **13. Add Confirmation Modal Component** → [`plans/13-confirmation-modal/`](./plans/13-confirmation-modal/)
  > Replaced all `window.confirm()` calls with an accessible `ConfirmDialog`.

---

## 🚀 Future Features (Phase 2+)

<!-- Add new feature plans below as sequential numbers. Each should get its own
     folder under plans/ with a README.md describing the spec. -->

- [x] **14. Favorite / Pin Spiels** → [`plans/14-favorites/`](./plans/14-favorites/)
- [x] **15. Recent Spiels Section** → [`plans/15-recent-spiels/`](./plans/15-recent-spiels/)
- [x] **16. Activity Logs UI** → [`plans/16-activity-logs/`](./plans/16-activity-logs/)
- [x] **17. Company Settings Page** → [`plans/17-company-settings/`](./plans/17-company-settings/)
- [x] **18. Browser Extension** → [`plans/18-browser-extension/`](./plans/18-browser-extension/)
- [x] **19. Version History** → [`plans/19-version-history/`](./plans/19-version-history/)
- [x] **20. Approval Workflows** → [`plans/20-approval-workflows/`](./plans/20-approval-workflows/)
- [x] **21. Import / Export** → [`plans/21-import-export/`](./plans/21-import-export/)
- [x] **22. Usage Analytics** → [`plans/22-analytics/`](./plans/22-analytics/)
- [x] **23. Migrate from Prisma to Drizzle ORM** → [`plans/23-drizzle-orm/`](./plans/23-drizzle-orm/)
  > Replace Prisma with Drizzle ORM for a lighter, faster, and better Neon-integrated database layer.
- [ ] **24. Migrate to Neon Auth with Better Auth** → [`plans/24-neon-auth-migration/`](./plans/24-neon-auth-migration/)
  > Upgrade from legacy Stack Auth to Neon Auth with Better Auth for branching support and simplified configuration.
- [ ] **25. Teams & Invitations** → [`plans/25-teams-and-invites/`](./plans/25-teams-and-invites/)
  > Add a lightweight Teams layer for viral, user-driven group formation. Any user can create a team, invite others by email, and team members share access to spiels regardless of department boundaries.

---

## 📊 Progress Summary

| Category | Total | Done | Remaining |
|---|---|---|---|
| 🔴 Critical | 3 | 3 | 0 |
| 🟡 Medium | 6 | 6 | 0 |
| 🟢 Minor | 4 | 4 | 0 |
| 🚀 Future | 12 | 9 | 3 |
| **Total** | **25** | **22** | **3** |

> **Last updated:** 2026-05-23 (Plans 18–21 complete)
