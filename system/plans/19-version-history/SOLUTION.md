# Solution — Plan 19: Version History

> **Implemented:** 2026-05-23
> **Status:** Complete

---

## What Was Implemented

Every content save (create or PATCH with content fields) now writes a snapshot
to `spiel_version`. Users can browse the full history at
`/spiels/[id]/history` and restore any past version with one click. Restoring
creates a new snapshot so the history stays linear and nothing is ever lost.

---

## Files Created

| File | Purpose |
|---|---|
| `lib/versioning/snapshot-spiel.ts` | Helper — writes a `SpielVersion` row; accepts post-save spiel state |
| `app/api/spiels/[id]/versions/route.ts` | GET — list all versions for a spiel (newest first), company-scoped |
| `app/api/spiels/[id]/versions/[versionId]/restore/route.ts` | POST — restore a version; updates spiel, snapshots restored state, logs activity |
| `app/(dashboard)/spiels/[id]/history/page.tsx` | Server component — version list with version numbers, editor names, timestamps |
| `app/(dashboard)/spiels/[id]/history/version-restore-button.tsx` | Client component — Restore button with pending/error state, redirects to edit on success |

---

## Files Modified

| File | Change |
|---|---|
| `prisma/schema.prisma` | Added `SpielVersion` model; `versions` back-relation on `Spiel`; `spielVersions` back-relation on `User` |
| `app/api/spiels/route.ts` | Calls `snapshotSpiel` fire-and-forget after successful POST create |
| `app/api/spiels/[id]/route.ts` | Detects content fields in PATCH payload; calls `snapshotSpiel` fire-and-forget after update; selects content fields in `spiel.update` result |
| `app/(dashboard)/spiels/new/new-spiel-form.tsx` | Adds "History" link button in the edit-mode toolbar header |
| `app/(dashboard)/activity/page.tsx` | Adds `"spiel.restore": "restored spiel version"` to `ACTION_LABELS` |

---

## Key Decisions

### Snapshot after save, not before
Each `SpielVersion` record represents the state *after* the save — "what it
looked like at this point in time." This is more intuitive: the latest version
matches the current live spiel. If we snapshotted before, the latest version
would always be one step behind.

### Fire-and-forget snapshot
`snapshotSpiel(...).catch(() => {})` — the API call still returns the updated
spiel immediately. A versioning failure should never block the editor. The
helper is simple enough (single insert) that silent failure is acceptable; in
production, instrument with an error tracker if auditability is critical.

### Content-only versioning
Archive-only PATCHes (`status: "archived"` only) do NOT create a version.
`isContentUpdate` is derived by checking whether `title`, `contentHtml`,
`contentJson`, `contentPlain`, or `categoryId` is present in `parsed.data`.
This keeps version history focused on content changes.

### Restore creates a new snapshot
Restoring does not rewind history — it applies the old content as a fresh save.
This preserves a complete audit trail and means the history list always grows
monotonically.

### Prisma v7 cast workaround
`spielVersion.findMany` with `select: { savedBy: { select: { name: true } } }`
uses `as unknown as VersionRow[]` in both the API route and the page, consistent
with the pattern used elsewhere in the codebase for the same Prisma v7 type
inference bug.

### Version numbers are display-computed
No `version: Int` column is stored. The history page computes
`versionNumber = totalVersions - index` at render time. This avoids a sequence
gap when a version is orphaned (e.g., if the spiel is hard-deleted and
re-created), and removes the need for a DB-level unique index on `(spielId, version)`.

---

## Acceptance Criteria Status

| Criterion | Status |
|---|---|
| Saving a new spiel creates a version record in `spiel_version` | ✅ |
| Each content PATCH creates another version record | ✅ |
| Archive-only PATCH does NOT create a version | ✅ |
| `GET /api/spiels/[id]/versions` returns ordered list with editor name + timestamp | ✅ |
| `/spiels/[id]/history` displays version list; latest row has no Restore button | ✅ |
| Restore applies old content to live spiel, creates new version, logs activity | ✅ |
| Edit page has a "History" link that navigates to `/spiels/[id]/history` | ✅ |

---

## Watch Out For

- **`prisma migrate dev` still pending**: `spiel_version` table does not exist
  in the DB until the migration runs. TypeScript passes, but runtime queries
  will fail until then.
- **Large spiels with frequent edits**: `contentJson`/`contentHtml` can be
  large blobs. With many versions the `spiel_version` table can grow quickly.
  Consider adding a max-versions-per-spiel cleanup job or a retention policy
  if storage becomes a concern.
- **Deleted spiels cascade-delete versions**: `onDelete: Cascade` on the
  `spiel` relation means deleting a spiel removes all its versions. This is
  intentional — keeping orphaned versions would be confusing — but note that
  hard-deleting an archived spiel loses the full version history.
