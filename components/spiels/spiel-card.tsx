"use client";

import { cn } from "@/lib/utils";
import { Copy, Pencil, Tag } from "lucide-react";
import type { SpielWithRelations } from "@/types";
import { formatDate } from "@/lib/utils";

interface SpielCardProps {
  spiel: SpielWithRelations;
  className?: string;
}

export function SpielCard({ spiel, className }: SpielCardProps) {
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
        "group relative bg-white rounded-md px-5 py-4 transition-colors hover:bg-white",
        className,
      )}
    >
      {/* Hover toolbar */}
      <div className="absolute top-3 right-3 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
        <button
          onClick={handleCopy}
          title="Copy spiel"
          className="p-1.5 rounded-md text-[#49636f] hover:text-[#2b3437] hover:bg-[#e3e9ec] transition-colors"
        >
          <Copy className="w-3.5 h-3.5" />
        </button>
        <button
          title="Edit spiel"
          className="p-1.5 rounded-md text-[#49636f] hover:text-[#2b3437] hover:bg-[#e3e9ec] transition-colors"
        >
          <Pencil className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Title */}
      <h3 className="font-display text-sm font-semibold text-[#2b3437] pr-16 leading-snug">
        {spiel.title}
      </h3>

      {/* Preview */}
      {spiel.contentPlain && (
        <p className="mt-1.5 text-sm text-[#49636f] line-clamp-2 leading-relaxed">
          {spiel.contentPlain}
        </p>
      )}

      {/* Meta */}
      <div className="mt-3 flex items-center gap-3 flex-wrap">
        <span className="text-xs text-[#49636f]">{spiel.department.name}</span>
        {spiel.category && (
          <span className="inline-flex items-center gap-1 text-xs text-[#005db5] bg-[#d6e3ff]/50 px-2 py-0.5 rounded-full">
            <Tag className="w-3 h-3" />
            {spiel.category.name}
          </span>
        )}
        <span className="text-xs text-[#abb3b7] ml-auto">
          {formatDate(spiel.updatedAt)}
        </span>
      </div>
    </div>
  );
}
