# Solution — Plan 21: Import / Export

> **Implemented:** 2026-05-23
> **Status:** Complete

---

## What Was Implemented

Admins can export all active spiels as a JSON or CSV file via direct download
links on the library page, and bulk-import spiels from a JSON or CSV file via
a dedicated import page. The import page parses the file in the browser, shows
a 5-row preview with total count, and displays per-row errors without aborting
the whole batch.

---

## Files Created

| File | Purpose |
|---|---|
| `app/api/spiels/export/route.ts` | GET — streams CSV or JSON download of active spiels |
| `app/api/spiels/import/route.ts` | POST — validates and bulk-creates spiels from parsed rows |
| `app/(dashboard)/spiels/import/page.tsx` | Server component — admin guard, renders `ImportForm` |
| `app/(dashboard)/spiels/import/import-form.tsx` | Client component — file drop, CSV/JSON parse, preview, import, result |

---

## Files Modified

| File | Change |
|---|---|
| `app/(dashboard)/spiels/page.tsx` | Added Import link + Export JSON / Export CSV links for admins |

---

## Key Decisions

### No new npm dependencies for CSV
CSV is parsed with a handwritten RFC 4180-compliant parser (handles quoted
fields with commas and embedded quotes via `""`). CSV is built for export with
a `csvCell()` helper that adds quotes when needed. Avoids adding `csv-parse` /
`papaparse` for what is a contained use case.

### Client-side file parsing
The uploaded file is read with `FileReader` in the browser and parsed to an
array of objects before POSTing as JSON. This avoids multipart form handling
in the Next.js route and keeps the API surface simple (`POST` with a JSON body).
Max 500 rows enforced at the API schema level (Zod).

### Static route priority over `[id]`
`app/api/spiels/export/` and `app/api/spiels/import/` are static route segments.
Next.js App Router gives static segments priority over dynamic `[id]` segments,
so `/api/spiels/export` and `/api/spiels/import` are served by the new routes,
not the `[id]` route.

### CSV export excludes `contentHtml`
HTML content contains angle brackets, quotes, and newlines that make it noisy
and fragile in CSV. CSV export is intentionally for plain-text use cases. JSON
export includes both `contentPlain` and `contentHtml`.

### Import generates HTML from plain text when not provided
If a CSV row (or JSON object) has no `contentHtml`, the import route splits
`contentPlain` on blank lines and wraps each paragraph in `<p>` tags. This
produces valid rich-text content without requiring the importer to provide HTML.

### Partial-success import
Row failures (bad department name, DB error) do not abort the whole batch. Each
row is processed independently; the response reports `created` count and an
array of `{ row, message }` errors. This matches the expectation for bulk
operations where some rows may be stale or mis-typed.

### Version snapshot + audit log on import
Each imported spiel fires `snapshotSpiel` (fire-and-forget) and `logActivity`
with `spiel.create`, consistent with the regular create flow. Import events
are visible in the Activity log.

---

## Acceptance Criteria Status

| Criterion | Status |
|---|---|
| `GET /api/spiels/export?format=json` downloads a valid JSON file | ✅ |
| `GET /api/spiels/export?format=csv` downloads a valid CSV file | ✅ |
| Export respects optional `department` and `category` query params | ✅ |
| `POST /api/spiels/import` creates valid rows and reports errors per row | ✅ |
| Import UI shows file preview before submitting | ✅ |
| Import result shows count created and any per-row errors | ✅ |
| Non-admins cannot access export or import endpoints (403) | ✅ |

---

## Watch Out For

- **500-row cap on import**: The Zod schema rejects bodies with more than 500
  rows. For larger imports, split the file or raise the cap in `importBodySchema`.
- **Department name matching is case-insensitive**: `"sales"` matches `"Sales"`.
  If two departments have names that differ only in case, the first match wins.
- **`contentJson` is stored as `""`**: Import doesn't produce TipTap JSON (it
  would require running the editor server-side). The edit form uses `contentJson`
  to initialise the editor; an imported spiel will open with the HTML pre-loaded
  (TipTap renders from `initialHtml`), so editing works, but the JSON field will
  be empty until the user saves via the editor.
- **Export does not include draft/pending spiels**: `status: "active"` filter is
  hard-coded. To export drafts, a `status` query param could be added.
