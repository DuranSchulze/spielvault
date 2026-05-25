# Plan 20 — Approval Workflows

> **Priority:** 🚀 Future (Phase 2+)
> **Checklist Ref:** `CHECKLIST.md` → #20
> **Status:** Ready to implement

---

## What

Spiels now move through a lifecycle before they are published. Employees save
as `draft`, submit for admin review (`pending_review`), and admins approve
(`active`) or reject (back to `draft` with a comment). A "Review Queue" view
in the library lets admins see all spiels awaiting approval.

---

## Why

Prevents unreviewed content from appearing in the live library. Gives admins
a checkpoint before new or edited spiels go out to the team.

---

## Status Flow

```
draft  ──[Submit for Review]──►  pending_review  ──[Approve]──►  active
                                      │
                                      └──[Reject]──►  draft  (with comment)
```

- Admins bypass the workflow on creation — their spiels are `active` immediately.
- Archived spiels are a separate terminal state; archiving remains admin-only.

---

## Requirements

1. `POST /api/spiels` creates as `draft` for employees, `active` for admins.
2. `POST /api/spiels/[id]/submit` — employee submits a `draft` → `pending_review`.
3. `POST /api/spiels/[id]/review` — admin action: `approve` → `active`;
   `reject` → `draft` + records a `SpielApproval` row with optional comment.
4. Edit page shows status badge; shows Submit / Approve / Reject buttons as
   appropriate for the user's role and the spiel's status.
5. Rejection comment shown as amber banner on the edit page when status is `draft`
   and the most recent approval record was a rejection.
6. Spiel library adds tabs: **Library** (active), **Drafts** (user's own drafts),
   **Review Queue** (admin: all pending_review).
7. Editing a `pending_review` spiel is blocked at the API level (only admin can).

---

## Schema

```prisma
model SpielApproval {
  id         String   @id @default(cuid())
  spielId    String
  reviewerId String
  action     String   // "approved" | "rejected"
  comment    String?
  createdAt  DateTime @default(now())

  spiel    Spiel @relation(fields: [spielId], references: [id], onDelete: Cascade)
  reviewer User  @relation(fields: [reviewerId], references: [id])

  @@map("spiel_approval")
}
```

---

## Files Affected

| File | Change |
|---|---|
| `prisma/schema.prisma` | Add `SpielApproval` model + back-relations |
| `lib/validations/spiel.ts` | Add `reviewSpielSchema` |
| `app/api/spiels/route.ts` | POST sets `status: "draft"` for employees |
| `app/api/spiels/[id]/route.ts` | Block PATCH on `pending_review` for non-admins |
| `app/api/spiels/[id]/submit/route.ts` | **Create** — submit for review |
| `app/api/spiels/[id]/review/route.ts` | **Create** — approve or reject |
| `app/(dashboard)/spiels/[id]/edit/page.tsx` | Pass `status`, `userRole`, `latestRejection` to form |
| `app/(dashboard)/spiels/new/new-spiel-form.tsx` | Status banner, action buttons per role/status |
| `app/(dashboard)/spiels/page.tsx` | Add `view` param, Library/Drafts/Review tabs |
| `app/(dashboard)/activity/page.tsx` | Add `spiel.submit`, `spiel.approve`, `spiel.reject` labels |

---

## Acceptance Criteria

- [ ] Employee creates spiel → saved as `draft`.
- [ ] Admin creates spiel → saved as `active`.
- [ ] Employee can submit a draft for review; status becomes `pending_review`.
- [ ] Admin can approve → `active`; reject → `draft` with comment recorded.
- [ ] Rejection comment appears as amber banner on the edit page.
- [ ] Library page has Library / Drafts / Review Queue tabs.
- [ ] PATCH on a `pending_review` spiel returns 400 for non-admins.
