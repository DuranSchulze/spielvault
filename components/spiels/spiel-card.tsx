"use client";

import Link from "next/link";
import { cn } from "@/lib/utils";
import { Copy, Loader2, Pencil, Tag, type LucideIcon } from "lucide-react";
import { formatDate } from "@/lib/utils/index";

export type SpielCardData = {
  id: string;
  title: string;
  contentHtml: string | null;
  contentPlain: string | null;
  updatedAt: Date;
  department: {
    id: string;
    name: string;
  };
  category: {
    id: string;
    name: string;
  } | null;
};

interface SpielCardProps {
  spiel: SpielCardData;
  className?: string;
  actionLabel?: string;
  actionTitle?: string;
  actionIcon?: LucideIcon;
  actionTone?: "default" | "destructive";
  isActionPending?: boolean;
  onAction?: (spiel: SpielCardData) => void;
}

export function SpielCard({
  spiel,
  className,
  actionLabel,
  actionTitle,
  actionIcon: ActionIcon,
  actionTone = "default",
  isActionPending = false,
  onAction,
}: SpielCardProps) {
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
  }

  return (
    <div
      className={cn(
        "group relative bg-card rounded-md px-5 py-4 transition-colors hover:bg-card",
        className,
      )}
    >
      {/* Hover toolbar */}
      <div className="absolute top-3 right-3 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
        <button
          onClick={handleCopy}
          title="Copy spiel"
          className="p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
        >
          <Copy className="w-3.5 h-3.5" />
        </button>
        <Link
          href={`/spiels/${spiel.id}`}
          title="Edit spiel"
          className="p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
        >
          <Pencil className="w-3.5 h-3.5" />
        </Link>
        {onAction && ActionIcon ? (
          <button
            type="button"
            onClick={() => onAction(spiel)}
            disabled={isActionPending}
            title={actionTitle ?? actionLabel}
            className={cn(
              "inline-flex items-center gap-1 rounded-md px-2 py-1.5 text-xs font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-60",
              actionTone === "destructive"
                ? "text-red-700 hover:bg-red-50 hover:text-red-800"
                : "text-muted-foreground hover:bg-accent hover:text-foreground",
            )}
          >
            {isActionPending ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <ActionIcon className="h-3.5 w-3.5" />
            )}
            <span>{actionLabel}</span>
          </button>
        ) : null}
      </div>

      {/* Title */}
      <h3 className="font-display text-sm font-semibold text-foreground pr-16 leading-snug">
        {spiel.title}
      </h3>

      {/* Preview */}
      {spiel.contentPlain && (
        <p className="mt-1.5 text-sm text-muted-foreground line-clamp-2 leading-relaxed">
          {spiel.contentPlain}
        </p>
      )}

      {/* Meta */}
      <div className="mt-3 flex items-center gap-3 flex-wrap">
        <span className="text-xs text-muted-foreground">
          {spiel.department.name}
        </span>
        {spiel.category && (
          <span className="inline-flex items-center gap-1 text-xs text-primary bg-primary/10 px-2 py-0.5 rounded-full">
            <Tag className="w-3 h-3" />
            {spiel.category.name}
          </span>
        )}
        <span className="text-xs text-muted-foreground/60 ml-auto">
          {formatDate(spiel.updatedAt)}
        </span>
      </div>
    </div>
  );
}
