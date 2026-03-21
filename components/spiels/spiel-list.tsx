"use client";

import { startTransition, useState } from "react";
import { useRouter } from "next/navigation";
import { Archive, Trash2 } from "lucide-react";
import { SpielCard, type SpielCardData } from "@/components/spiels/spiel-card";

type SpielListMode = "library" | "archive";

type SpielListProps = {
  initialSpiels: SpielCardData[];
  mode: SpielListMode;
  emptyMessage: string;
};

export function SpielList({
  initialSpiels,
  mode,
  emptyMessage,
}: SpielListProps) {
  const router = useRouter();
  const [spiels, setSpiels] = useState(initialSpiels);
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const isArchiveMode = mode === "archive";

  async function handleAction(spiel: SpielCardData) {
    const confirmed = window.confirm(
      isArchiveMode
        ? `Permanently delete "${spiel.title}"? This cannot be undone.`
        : `Move "${spiel.title}" to archive?`,
    );

    if (!confirmed) {
      return;
    }

    setPendingId(spiel.id);
    setError(null);
    setSuccess(null);

    const response = await fetch(`/api/spiels/${spiel.id}`, {
      method: isArchiveMode ? "DELETE" : "PATCH",
    });

    setPendingId(null);

    if (!response.ok) {
      const body = (await response.json().catch(() => null)) as
        | { error?: string }
        | null;
      setError(body?.error ?? "Unable to update spiel.");
      return;
    }

    setSpiels((current) => current.filter((item) => item.id !== spiel.id));
    setSuccess(
      isArchiveMode
        ? `"${spiel.title}" was permanently deleted.`
        : `"${spiel.title}" moved to archive.`,
    );

    startTransition(() => {
      router.refresh();
    });
  }

  return (
    <div className="flex flex-col gap-3">
      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}
      {success && (
        <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
          {success}
        </div>
      )}

      {spiels.length === 0 ? (
        <div className="rounded-lg border border-dashed border-border bg-card px-6 py-10 text-center text-sm text-muted-foreground">
          {emptyMessage}
        </div>
      ) : (
        spiels.map((spiel) => (
          <SpielCard
            key={spiel.id}
            spiel={spiel}
            actionLabel={isArchiveMode ? "Delete permanently" : "Archive"}
            actionTitle={isArchiveMode ? "Delete permanently" : "Archive spiel"}
            actionIcon={isArchiveMode ? Trash2 : Archive}
            actionTone={isArchiveMode ? "destructive" : "default"}
            isActionPending={pendingId === spiel.id}
            onAction={handleAction}
            className="border border-border rounded-lg px-6 py-5 hover:border-primary/30 hover:shadow-[0_2px_12px_rgba(0,93,181,0.06)]"
          />
        ))
      )}
    </div>
  );
}
