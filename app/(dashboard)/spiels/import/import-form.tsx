"use client";

import Link from "next/link";
import { useRef, useState } from "react";
import { useRouter } from "next/navigation";

type ImportRow = {
  title: string;
  department: string;
  category?: string | null;
  contentPlain?: string | null;
  contentHtml?: string | null;
};

type ImportResult = {
  created: number;
  errors: { row: number; message: string }[];
};

// Minimal RFC 4180-compliant CSV parser
function parseCsv(text: string): string[][] {
  const rows: string[][] = [];
  let field = "";
  let inQuotes = false;
  let row: string[] = [];
  const normalized = text.replace(/\r\n/g, "\n").replace(/\r/g, "\n");

  for (let i = 0; i < normalized.length; i++) {
    const ch = normalized[i];
    if (inQuotes) {
      if (ch === '"') {
        if (normalized[i + 1] === '"') {
          field += '"';
          i++;
        } else {
          inQuotes = false;
        }
      } else {
        field += ch;
      }
    } else if (ch === '"') {
      inQuotes = true;
    } else if (ch === ",") {
      row.push(field);
      field = "";
    } else if (ch === "\n") {
      row.push(field);
      field = "";
      rows.push(row);
      row = [];
    } else {
      field += ch;
    }
  }
  if (field || row.length > 0) {
    row.push(field);
    rows.push(row);
  }
  return rows;
}

function csvToRows(text: string): { rows: ImportRow[]; errors: string[] } {
  const allRows = parseCsv(text).filter((r) => r.some((c) => c.trim()));
  if (allRows.length < 2) {
    return { rows: [], errors: ["CSV must have a header row and at least one data row."] };
  }

  const header = allRows[0].map((h) => h.trim().toLowerCase());
  const titleIdx = header.indexOf("title");
  const deptIdx = header.indexOf("department");
  const catIdx = header.indexOf("category");
  const plainIdx = header.indexOf("contentplain");
  const htmlIdx = header.indexOf("contenthtml");

  if (titleIdx === -1 || deptIdx === -1) {
    return { rows: [], errors: ['CSV must have "title" and "department" columns.'] };
  }

  const rows: ImportRow[] = [];
  const errors: string[] = [];

  for (let i = 1; i < allRows.length; i++) {
    const cols = allRows[i];
    const title = cols[titleIdx]?.trim() ?? "";
    const department = cols[deptIdx]?.trim() ?? "";
    if (!title) { errors.push(`Row ${i + 1}: missing title.`); continue; }
    if (!department) { errors.push(`Row ${i + 1}: missing department.`); continue; }
    rows.push({
      title,
      department,
      category: catIdx >= 0 ? cols[catIdx]?.trim() || null : null,
      contentPlain: plainIdx >= 0 ? cols[plainIdx]?.trim() || null : null,
      contentHtml: htmlIdx >= 0 ? cols[htmlIdx]?.trim() || null : null,
    });
  }

  return { rows, errors };
}

function jsonToRows(text: string): { rows: ImportRow[]; errors: string[] } {
  try {
    const data = JSON.parse(text);
    if (!Array.isArray(data)) {
      return { rows: [], errors: ["JSON must be an array of spiel objects."] };
    }

    const rows: ImportRow[] = [];
    const errors: string[] = [];

    data.forEach((item: unknown, i: number) => {
      if (!item || typeof item !== "object") {
        errors.push(`Item ${i + 1}: not an object.`);
        return;
      }
      const obj = item as Record<string, unknown>;
      const title = typeof obj.title === "string" ? obj.title.trim() : "";
      const department = typeof obj.department === "string" ? obj.department.trim() : "";
      if (!title) { errors.push(`Item ${i + 1}: missing title.`); return; }
      if (!department) { errors.push(`Item ${i + 1}: missing department.`); return; }
      rows.push({
        title,
        department,
        category: typeof obj.category === "string" ? obj.category : null,
        contentPlain: typeof obj.contentPlain === "string" ? obj.contentPlain : null,
        contentHtml: typeof obj.contentHtml === "string" ? obj.contentHtml : null,
      });
    });

    return { rows, errors };
  } catch {
    return { rows: [], errors: ["Invalid JSON — could not parse file."] };
  }
}

export function ImportForm() {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  const [parseErrors, setParseErrors] = useState<string[]>([]);
  const [preview, setPreview] = useState<ImportRow[]>([]);
  const [totalRows, setTotalRows] = useState(0);
  const [isImporting, setIsImporting] = useState(false);
  const [result, setResult] = useState<ImportResult | null>(null);
  const [apiError, setApiError] = useState<string | null>(null);

  // Stored for the actual import call
  const allRowsRef = useRef<ImportRow[]>([]);

  function handleFile(file: File) {
    setFileName(file.name);
    setParseErrors([]);
    setPreview([]);
    setResult(null);
    setApiError(null);
    allRowsRef.current = [];

    const reader = new FileReader();
    reader.onload = (e) => {
      const text = (e.target?.result as string) ?? "";
      const isJson = file.name.toLowerCase().endsWith(".json");
      const { rows, errors } = isJson ? jsonToRows(text) : csvToRows(text);
      setParseErrors(errors);
      setTotalRows(rows.length);
      setPreview(rows.slice(0, 5));
      allRowsRef.current = rows;
    };
    reader.readAsText(file);
  }

  function handleInputChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
  }

  function handleDrop(e: React.DragEvent<HTMLDivElement>) {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (file) handleFile(file);
  }

  async function handleImport() {
    if (!allRowsRef.current.length) return;
    setIsImporting(true);
    setApiError(null);
    setResult(null);

    const res = await fetch("/api/spiels/import", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ rows: allRowsRef.current }),
    });

    setIsImporting(false);

    if (!res.ok) {
      const data = await res.json().catch(() => null) as { error?: string } | null;
      setApiError(data?.error ? String(data.error) : "Import failed. Please try again.");
      return;
    }

    const data = await res.json() as ImportResult;
    setResult(data);
    router.refresh();
  }

  const canImport = allRowsRef.current.length > 0 && parseErrors.length === 0 && !result;

  return (
    <div className="space-y-6">
      {/* Format guide */}
      <div className="rounded-md border border-border bg-card p-5">
        <h2 className="text-sm font-semibold text-foreground mb-3">Expected Format</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-widest mb-1">JSON</p>
            <pre className="text-[11px] bg-muted rounded p-3 overflow-x-auto text-muted-foreground">{`[
  {
    "title": "Opening Greeting",
    "department": "Sales",
    "category": "Greetings",
    "contentPlain": "Hello...",
    "contentHtml": "<p>Hello...</p>"
  }
]`}</pre>
          </div>
          <div>
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-widest mb-1">CSV</p>
            <pre className="text-[11px] bg-muted rounded p-3 overflow-x-auto text-muted-foreground">{`title,department,category,contentPlain
"Opening Greeting","Sales","Greetings","Hello..."`}</pre>
          </div>
        </div>
      </div>

      {/* Drop zone */}
      <div
        onDrop={handleDrop}
        onDragOver={(e) => e.preventDefault()}
        onClick={() => inputRef.current?.click()}
        className="rounded-lg border-2 border-dashed border-border bg-card hover:border-primary/40 hover:bg-accent/30 transition-colors cursor-pointer px-6 py-10 text-center"
      >
        <input
          ref={inputRef}
          type="file"
          accept=".json,.csv"
          className="hidden"
          onChange={handleInputChange}
        />
        {fileName ? (
          <p className="text-sm font-medium text-foreground">{fileName}</p>
        ) : (
          <>
            <p className="text-sm font-medium text-foreground">Drop a file here or click to browse</p>
            <p className="mt-1 text-xs text-muted-foreground">Accepts .json or .csv</p>
          </>
        )}
      </div>

      {/* Parse errors */}
      {parseErrors.length > 0 && (
        <div className="rounded-md border border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-950/20 p-4">
          <p className="text-sm font-semibold text-red-700 dark:text-red-400 mb-2">Parse errors</p>
          <ul className="list-disc list-inside space-y-0.5">
            {parseErrors.map((e, i) => (
              <li key={i} className="text-xs text-red-600 dark:text-red-400">{e}</li>
            ))}
          </ul>
        </div>
      )}

      {/* Preview */}
      {preview.length > 0 && (
        <div>
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-widest mb-2">
            Preview — {totalRows} {totalRows === 1 ? "row" : "rows"} ready
            {totalRows > 5 && ` (showing first 5)`}
          </p>
          <div className="rounded-md border border-border overflow-hidden">
            <table className="w-full text-xs">
              <thead className="bg-muted">
                <tr>
                  {["Title", "Department", "Category", "Content (truncated)"].map((h) => (
                    <th key={h} className="px-3 py-2 text-left font-semibold text-muted-foreground">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {preview.map((row, i) => (
                  <tr key={i} className="bg-card">
                    <td className="px-3 py-2 font-medium text-foreground max-w-[140px] truncate">{row.title}</td>
                    <td className="px-3 py-2 text-muted-foreground">{row.department}</td>
                    <td className="px-3 py-2 text-muted-foreground">{row.category ?? "—"}</td>
                    <td className="px-3 py-2 text-muted-foreground max-w-[180px] truncate">
                      {row.contentPlain ?? row.contentHtml ?? "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {!result && (
            <button
              onClick={handleImport}
              disabled={!canImport || isImporting}
              className="mt-4 inline-flex items-center rounded-md bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {isImporting ? "Importing…" : `Import ${totalRows} ${totalRows === 1 ? "spiel" : "spiels"}`}
            </button>
          )}
        </div>
      )}

      {/* API error */}
      {apiError && (
        <p className="text-sm text-red-600 dark:text-red-400">{apiError}</p>
      )}

      {/* Result */}
      {result && (
        <div className={`rounded-md border p-5 ${result.errors.length === 0 ? "border-green-200 dark:border-green-800 bg-green-50 dark:bg-green-950/20" : "border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-950/20"}`}>
          <p className="text-sm font-semibold text-foreground mb-1">
            Import complete — {result.created} {result.created === 1 ? "spiel" : "spiels"} created.
          </p>
          {result.errors.length > 0 && (
            <div className="mt-3">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-widest mb-2">
                {result.errors.length} {result.errors.length === 1 ? "row" : "rows"} failed
              </p>
              <ul className="space-y-1">
                {result.errors.map((e, i) => (
                  <li key={i} className="text-xs text-amber-800 dark:text-amber-300">
                    Row {e.row}: {e.message}
                  </li>
                ))}
              </ul>
            </div>
          )}
          <Link
            href="/spiels"
            className="mt-4 inline-flex items-center rounded-md border border-border px-4 py-2 text-sm font-medium text-foreground hover:bg-accent transition-colors"
          >
            Back to Library
          </Link>
        </div>
      )}
    </div>
  );
}
