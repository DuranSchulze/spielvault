# Plan 21 — Import / Export

> **Priority:** 🚀 Future (Phase 2+)
> **Checklist Ref:** `CHECKLIST.md` → #21
> **Status:** Ready to implement

---

## What

Admins can export all active spiels as JSON or CSV, and bulk-import spiels from
a JSON or CSV file. Import resolves departments and categories by name, shows a
preview before committing, and reports per-row errors without aborting the
whole batch.

---

## Why

Enables migrating content from legacy systems, sharing spiel libraries across
workspaces, and creating offline backups.

---

## Requirements

1. **Export** — `GET /api/spiels/export?format=json|csv&department=&category=`
   - Admin only. Returns a file download.
   - JSON: array of `{ title, department, category, contentPlain, contentHtml }` objects.
   - CSV: `title,department,category,contentPlain` (HTML excluded — too noisy).
   - Filtered by department and/or category if query params provided.

2. **Import** — `POST /api/spiels/import`
   - Admin only. Body: `{ rows: ImportRow[] }` (client parses the file).
   - Resolves department and category by name inside the company.
   - Creates spiels with `status: "active"` (admin bypass).
   - Returns `{ created: number, errors: { row: number, message: string }[] }`.

3. **Import UI** — `/spiels/import`
   - File drop zone (JSON or CSV). Client-side parse → preview table.
   - Confirm → POST → result summary with error list.
   - Link back to library.

4. **Library page** — add Export dropdown (JSON / CSV) and Import link.

---

## Format

### JSON (export and import)
```json
[
  {
    "title": "Opening Greeting",
    "department": "Sales",
    "category": "Greetings",
    "contentPlain": "Hello, thanks for calling...",
    "contentHtml": "<p>Hello, thanks for calling...</p>"
  }
]
```

### CSV (export and import)
```
title,department,category,contentPlain
"Opening Greeting","Sales","Greetings","Hello, thanks for calling..."
```

---

## Architecture Notes

- **No new dependencies.** CSV is built/parsed with plain string operations.
- Static route `app/api/spiels/export/` takes priority over `[id]` in Next.js.
- Client parses the uploaded file before POSTing — avoids multipart complexity.
- Import batch is processed row-by-row; failures don't abort the whole import.

---

## Files Affected

| File | Change |
|---|---|
| `app/api/spiels/export/route.ts` | **Create** — GET, streams CSV or JSON |
| `app/api/spiels/import/route.ts` | **Create** — POST, bulk create |
| `app/(dashboard)/spiels/import/page.tsx` | **Create** — import UI with preview |
| `app/(dashboard)/spiels/page.tsx` | Add Export links + Import button |

---

## Acceptance Criteria

- [ ] `GET /api/spiels/export?format=json` downloads a valid JSON file.
- [ ] `GET /api/spiels/export?format=csv` downloads a valid CSV file.
- [ ] Export respects optional `department` and `category` query params.
- [ ] `POST /api/spiels/import` creates valid rows and reports errors per row.
- [ ] Import UI shows file preview before submitting.
- [ ] Import result shows count created and any per-row errors.
- [ ] Non-admins cannot access export or import endpoints (403).
