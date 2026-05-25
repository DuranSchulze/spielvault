"use client";

import Link from "next/link";
import { Copy, Pencil, Tag } from "lucide-react";

type RecentSpiel = {
  id: string;
  title: string;
  contentHtml: string | null;
  contentPlain: string | null;
  department: { name: string };
  category: { name: string } | null;
  timestamp: Date;
  mode: "copied" | "library";
};

function formatRelativeTime(date: Date): string {
  const diffMs = Date.now() - new Date(date).getTime();
  const diffMin = Math.floor(diffMs / 60_000);
  if (diffMin < 1) return "just now";
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffHr = Math.floor(diffMin / 60);
  if (diffHr < 24) return `${diffHr}h ago`;
  const diffDay = Math.floor(diffHr / 24);
  if (diffDay < 30) return `${diffDay}d ago`;
  return new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric" }).format(
    new Date(date),
  );
}

export function RecentSpielRow({
  spiel,
  isFallback,
}: {
  spiel: RecentSpiel;
  isFallback: boolean;
}) {
  async function handleCopy() {
    const html = spiel.contentHtml;
    const plain = spiel.contentPlain ?? "";
    if (!html && !plain) return;
    try {
      await navigator.clipboard.write([
        new ClipboardItem({
          ...(html && { "text/html": new Blob([html], { type: "text/html" }) }),
          "text/plain": new Blob([plain], { type: "text/plain" }),
        }),
      ]);
    } catch {
      if (plain) await navigator.clipboard.writeText(plain);
    }
    fetch(`/api/spiels/${spiel.id}/activity`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "copy" }),
    }).catch(() => {});
  }

  return (
    <div className="group flex items-center gap-4 px-5 py-3.5 hover:bg-accent/40 transition-colors">
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-foreground truncate">{spiel.title}</p>
        <div className="flex items-center gap-2 mt-0.5">
          <span className="text-xs text-muted-foreground">{spiel.department.name}</span>
          {spiel.category && (
            <span className="inline-flex items-center gap-1 text-xs text-primary bg-primary/10 px-1.5 py-0.5 rounded-full">
              <Tag className="w-2.5 h-2.5" />
              {spiel.category.name}
            </span>
          )}
        </div>
      </div>

      <span className="text-xs text-muted-foreground/60 shrink-0">
        {isFallback ? "updated " : ""}
        {formatRelativeTime(spiel.timestamp)}
      </span>

      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
        <button
          onClick={handleCopy}
          title="Copy spiel"
          className="p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
        >
          <Copy className="w-3.5 h-3.5" />
        </button>
        <Link
          href={`/spiels/${spiel.id}/edit`}
          title="Edit spiel"
          className="p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
        >
          <Pencil className="w-3.5 h-3.5" />
        </Link>
      </div>
    </div>
  );
}
