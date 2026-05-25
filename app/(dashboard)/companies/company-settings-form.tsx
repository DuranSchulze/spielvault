"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type CompanySettingsFormProps = {
  companyId: string;
  initialName: string;
  slug: string;
};

export function CompanySettingsForm({
  companyId,
  initialName,
  slug,
}: CompanySettingsFormProps) {
  const router = useRouter();
  const [name, setName] = useState(initialName);
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setMessage(null);
    setError(null);
    setIsSaving(true);

    const res = await fetch(`/api/companies/${companyId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: name.trim() }),
    });

    setIsSaving(false);

    if (!res.ok) {
      const body = (await res.json().catch(() => null)) as { error?: string } | null;
      setError(body?.error ?? "Failed to update company name.");
      return;
    }

    setMessage("Company name updated.");
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <div className="flex flex-col gap-1.5">
        <label className="text-xs font-semibold text-muted-foreground uppercase tracking-widest">
          Company Name
        </label>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
          minLength={2}
          className="w-full max-w-sm px-3 py-2 text-sm border border-border rounded-md bg-background text-foreground outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 transition-all"
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <label className="text-xs font-semibold text-muted-foreground uppercase tracking-widest">
          Slug
        </label>
        <input
          type="text"
          value={slug}
          readOnly
          className="w-full max-w-sm px-3 py-2 text-sm border border-border rounded-md bg-accent text-muted-foreground cursor-not-allowed"
        />
        <p className="text-xs text-muted-foreground/60">
          The slug is a permanent identifier and cannot be changed.
        </p>
      </div>

      <div className="flex items-center gap-4">
        <button
          type="submit"
          disabled={isSaving || name.trim().length < 2}
          className="inline-flex items-center px-4 py-2 rounded-md text-sm font-semibold text-primary-foreground bg-primary hover:bg-primary/90 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {isSaving ? "Saving…" : "Save Changes"}
        </button>
        {message && (
          <p className="text-sm text-green-600 font-medium">{message}</p>
        )}
        {error && (
          <p className="text-sm text-red-600 font-medium">{error}</p>
        )}
      </div>
    </form>
  );
}
