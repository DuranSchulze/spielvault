# Plan 19 — Version History

> **Priority:** 🚀 Future (Phase 2+)
> **Checklist Ref:** `CHECKLIST.md` → #19
> **Status:** Ready to implement

---

## What

Every time a spiel's content is saved (created or edited), a snapshot of that
state is written to a `SpielVersion` table. Users can browse the version
history for any spiel and restore any previous version with one click.

---

## Why

Prevents accidental content loss. Editors can confidently revise spiels knowing
they can roll back if something goes wrong.

---

## Requirements

1. A version snapshot is created on:
   - `POST /api/spiels` (initial creation — version 1)
   - `PATCH /api/spiels/[id]` when any content field is included in the request
     (`title`, `contentHtml`, `contentJson`, `contentPlain`, `categoryId`).
     Status-only patches (archive) do NOT create a version.
2. `GET /api/spiels/[id]/versions` lists all versions, newest first, with
   the editor's name and timestamp.
3. `POST /api/spiels/[id]/versions/[versionId]/restore` restores that version's
   content to the live spiel and records a new snapshot of the restored state.
4. A `/spiels/[id]/history` page shows the version list with per-row Restore
   buttons. The latest version row has no Restore button.
5. The edit page header links to the history page.

---

## Architecture

### Snapshot model

```prisma
model SpielVersion {
  id            String   @id @default(cuid())
  spielId       String
  savedByUserId String
  title         String
  contentHtml   String?  @db.Text
  contentJson   String?  @db.Text
  contentPlain  String?  @db.Text
  categoryId    String?
  createdAt     DateTime @default(now())

  spiel   Spiel @relation(fields: [spielId], references: [id], onDelete: Cascade)
  savedBy User  @relation(fields: [savedByUserId], references: [id])

  @@map("spiel_version")
}
```

### Snapshot helper

`lib/versioning/snapshot-spiel.ts` — accepts post-save spiel state + userId,
writes a `SpielVersion` row. Called fire-and-forget from API routes.

### Versioning trigger

Only fires when content fields are present in the PATCH payload. Archive-only
PATCHes (`status: "archived"` only) do not create a version.

### Restore flow

1. Fetch the `SpielVersion` row (company-scoped via join).
2. `prisma.spiel.update` with that version's fields.
3. Call `snapshotSpiel` with the restored state.
4. Log `spiel.restore` to AuditLog.

---

## Files Affected

| File | Change |
|---|---|
| `prisma/schema.prisma` | Add `SpielVersion` model + back-relations |
| `lib/versioning/snapshot-spiel.ts` | **Create** — snapshot helper |
| `app/api/spiels/route.ts` | Call `snapshotSpiel` after POST create |
| `app/api/spiels/[id]/route.ts` | Call `snapshotSpiel` after content PATCH |
| `app/api/spiels/[id]/versions/route.ts` | **Create** — GET list versions |
| `app/api/spiels/[id]/versions/[versionId]/restore/route.ts` | **Create** — POST restore |
| `app/(dashboard)/spiels/[id]/history/page.tsx` | **Create** — version history page |
| `app/(dashboard)/spiels/[id]/edit/page.tsx` | Add "History" link in header |
| `app/(dashboard)/activity/page.tsx` | Add `spiel.restore` to ACTION_LABELS |

---

## Acceptance Criteria

- [ ] Saving a new spiel creates a version record in `spiel_version`.
- [ ] Each content PATCH creates another version record.
- [ ] Archive-only PATCH does NOT create a version.
- [ ] `GET /api/spiels/[id]/versions` returns ordered list with editor name + timestamp.
- [ ] `/spiels/[id]/history` displays version list; latest row has no Restore button.
- [ ] Restore applies old content to live spiel, creates new version, logs activity.
- [ ] Edit page has a "History" link that navigates to `/spiels/[id]/history`.
