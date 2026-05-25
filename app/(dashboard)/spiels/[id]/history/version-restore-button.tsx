"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type Props = {
  spielId: string;
  versionId: string;
};

export function VersionRestoreButton({ spielId, versionId }: Props) {
  const router = useRouter();
  const [isPending, setIsPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleRestore() {
    setIsPending(true);
    setError(null);

    const res = await fetch(
      `/api/spiels/${spielId}/versions/${versionId}/restore`,
      { method: "POST" },
    );

    setIsPending(false);

    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error ?? "Restore failed.");
      return;
    }

    router.push(`/spiels/${spielId}/edit`);
    router.refresh();
  }

  return (
    <div className="flex items-center gap-2">
      {error && <span className="text-xs text-red-600">{error}</span>}
      <button
        onClick={handleRestore}
        disabled={isPending}
        className="rounded-md border border-border px-3 py-1.5 text-xs font-semibold text-foreground hover:border-primary/40 hover:text-primary transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
      >
        {isPending ? "Restoring…" : "Restore"}
      </button>
    </div>
  );
}
