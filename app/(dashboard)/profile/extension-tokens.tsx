"use client";

import { useState } from "react";

type TokenRow = {
  id: string;
  name: string;
  createdAt: string;
  lastUsedAt: string | null;
};

type Props = {
  initialTokens: TokenRow[];
};

function formatDate(iso: string | null): string {
  if (!iso) return "Never";
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(iso));
}

export function ExtensionTokens({ initialTokens }: Props) {
  const [tokens, setTokens] = useState<TokenRow[]>(initialTokens);
  const [newToken, setNewToken] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [revoking, setRevoking] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  async function handleGenerate() {
    setIsGenerating(true);
    setError(null);
    setNewToken(null);

    const res = await fetch("/api/extension/tokens", { method: "POST" });

    setIsGenerating(false);

    if (!res.ok) {
      setError("Failed to generate token. Please try again.");
      return;
    }

    const data = await res.json();
    setNewToken(data.token);
    setTokens((prev) => [
      { id: data.id, name: data.name, createdAt: data.createdAt, lastUsedAt: null },
      ...prev,
    ]);
  }

  async function handleRevoke(id: string) {
    setRevoking(id);
    const res = await fetch(`/api/extension/tokens/${id}`, { method: "DELETE" });
    setRevoking(null);

    if (res.ok) {
      setTokens((prev) => prev.filter((t) => t.id !== id));
      if (newToken) setNewToken(null);
    }
  }

  async function handleCopy() {
    if (!newToken) return;
    await navigator.clipboard.writeText(newToken);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="rounded-md border border-border bg-card p-6 lg:col-span-2">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="font-display text-lg font-semibold text-foreground">
            Browser Extension
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Generate a personal API token to authenticate the RepFlow Chrome
            extension. The token is shown only once — store it safely.
          </p>
        </div>
        <button
          onClick={handleGenerate}
          disabled={isGenerating}
          className="shrink-0 inline-flex items-center rounded-md bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-40"
        >
          {isGenerating ? "Generating…" : "Generate Token"}
        </button>
      </div>

      {error && (
        <p className="mt-4 text-sm text-red-600" role="alert">
          {error}
        </p>
      )}

      {newToken && (
        <div className="mt-4 rounded-md border border-amber-300 bg-amber-50 dark:bg-amber-950/20 dark:border-amber-800 p-4">
          <p className="text-xs font-semibold text-amber-800 dark:text-amber-400 uppercase tracking-widest mb-2">
            New token — copy it now, it won&apos;t be shown again
          </p>
          <div className="flex items-center gap-3">
            <code className="flex-1 rounded bg-background border border-border px-3 py-2 text-xs font-mono text-foreground break-all">
              {newToken}
            </code>
            <button
              onClick={handleCopy}
              className="shrink-0 rounded-md border border-border bg-background px-3 py-2 text-xs font-semibold text-foreground hover:bg-accent transition-colors"
            >
              {copied ? "Copied!" : "Copy"}
            </button>
          </div>
        </div>
      )}

      {tokens.length > 0 ? (
        <div className="mt-6">
          <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-3">
            Active Tokens
          </p>
          <div className="rounded-md border border-border divide-y divide-border overflow-hidden">
            {tokens.map((token) => (
              <div
                key={token.id}
                className="flex items-center gap-4 px-4 py-3"
              >
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground">
                    {token.name}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Created {formatDate(token.createdAt)} · Last used{" "}
                    {formatDate(token.lastUsedAt)}
                  </p>
                </div>
                <button
                  onClick={() => handleRevoke(token.id)}
                  disabled={revoking === token.id}
                  className="shrink-0 rounded-md border border-red-200 dark:border-red-900 px-3 py-1.5 text-xs font-semibold text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors disabled:opacity-40"
                >
                  {revoking === token.id ? "Revoking…" : "Revoke"}
                </button>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <p className="mt-6 text-sm text-muted-foreground">
          No tokens yet. Generate one to use with the browser extension.
        </p>
      )}
    </div>
  );
}
