# Solution — Plan 20: Approval Workflows

> **Implemented:** 2026-05-23
> **Status:** Complete

---

## What Was Implemented

Spiels now move through a lifecycle: employees save as `draft`, submit for
review (`pending_review`), and admins approve (`active`) or reject (back to
`draft` with a comment). The spiel library has three tabs — Library, Drafts,
and Review Queue (admin only). The edit form shows status-aware action buttons
and displays rejection comments as an amber banner.

---

## Files Created

| File | Purpose |
|---|---|
| `app/api/spiels/[id]/submit/route.ts` | POST — employee submits draft → pending_review |
| `app/api/spiels/[id]/review/route.ts` | POST — admin approves or rejects; creates SpielApproval record |

---

## Files Modified

| File | Change |
|---|---|
| `prisma/schema.prisma` | Added `SpielApproval` model; `approvals` on `Spiel`, `spielApprovals` on `User` |
| `lib/validations/spiel.ts` | Added `reviewSpielSchema` (`action: approve/reject`, optional `comment`) |
| `app/api/spiels/route.ts` | POST creates `status: "draft"` for employees, `status: "active"` for admins |
| `app/api/spiels/[id]/route.ts` | PATCH returns 400 if `status === "pending_review"` and user is not admin |
| `app/(dashboard)/spiels/[id]/edit/page.tsx` | Fetches `status`, `latestRejection`; passes `isAdmin`, `userRole`, `latestRejection` to form |
| `app/(dashboard)/spiels/new/new-spiel-form.tsx` | Added `status`, `isAdmin`, `latestRejection` props; status badge; Submit/Approve/Reject buttons; inline reject comment input; amber rejection banner; Save disabled for pending_review non-admins |
| `app/(dashboard)/spiels/page.tsx` | Added `view` param (`library`/`drafts`/`review`); view tabs; different where clauses per view; simplified list for non-library views |
| `app/(dashboard)/activity/page.tsx` | Added `spiel.submit`, `spiel.approve`, `spiel.reject` to ACTION_LABELS |

---

## Key Decisions

### Admins bypass the workflow on creation
`POST /api/spiels` checks `canManageDepartment`. Admins create as `active`
(preserving existing behaviour); employees get `draft`. This means existing
admin workflows are uninterrupted.

### SpielApproval records only on review actions
Only Approve and Reject write a `SpielApproval` row. Submit does not create
one — the audit log entry is sufficient for tracking the submission. This keeps
the approval table focused on reviewer decisions and makes querying for the
"latest rejection comment" straightforward.

### Rejection comment via inline input, not a modal
Clicking "Reject" in the toolbar reveals a text input and "Confirm Reject"
button inline. This avoids needing a separate `ConfirmDialog` component for
the comment case and keeps all review UI in the toolbar.

### PATCH blocked for pending_review non-admins at API level
Returns 400 with a human-readable message. The form also disables the Save
button in this state, but the API guard is the authoritative enforcement.

### Drafts tab shows both `draft` and `pending_review`
An employee's "in-progress" spiels include ones they submitted (pending_review)
because they still own them and need visibility into their review status. The
`status` badge on each row distinguishes the two states.

### Review Queue tab is admin-only
The tab is not rendered for non-admins in the UI. The API (`pending_review`
query) is not separately guarded at the page level — the page just won't show
the review queue tab — but the `review` route itself is admin-gated.

### `latestRejection` is fetched only when status === "draft"
Avoids a DB round-trip for spiels that aren't drafts. The most recent
`SpielApproval` is fetched ordered by `createdAt desc`; if it's a `rejected`
action, the comment is shown. Once the spiel is approved or resubmitted, the
status changes and the banner naturally disappears.

---

## Acceptance Criteria Status

| Criterion | Status |
|---|---|
| Employee creates spiel → saved as `draft` | ✅ |
| Admin creates spiel → saved as `active` | ✅ |
| Employee can submit a draft for review; status becomes `pending_review` | ✅ |
| Admin can approve → `active`; reject → `draft` with comment recorded | ✅ |
| Rejection comment appears as amber banner on the edit page | ✅ |
| Library page has Library / Drafts / Review Queue tabs | ✅ |
| PATCH on a `pending_review` spiel returns 400 for non-admins | ✅ |

---

## Watch Out For

- **`prisma migrate dev` pending**: The `spiel_approval` table doesn't exist
  until the migration runs.
- **Existing active spiels**: Spiels created before this plan are `active` and
  bypass the new workflow entirely. This is intentional — no retroactive status
  change needed.
- **Employee submits, admin edits**: If an admin makes content edits to a
  `pending_review` spiel (e.g., to fix a typo before approving), the PATCH
  succeeds (admin is allowed). The spiel version snapshot will capture that
  edit. The SpielApproval record will then reflect the admin's reviewed content,
  not the original submission.
- **No email/notification on submit**: The plan deferred in-app notifications.
  Admins need to remember to check the Review Queue tab. If notifications are
  added later, wire them in `app/api/spiels/[id]/submit/route.ts`.
