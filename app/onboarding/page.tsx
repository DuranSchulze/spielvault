"use client";

import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { goeyToast } from "@/components/ui/goey-toaster";

export default function OnboardingPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setIsSubmitting(true);

    const res = await fetch("/api/companies", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name }),
    });

    const data = await res.json() as { error?: string };

    if (!res.ok) {
      const msg = data.error ?? "Failed to create company. Please try again.";
      setError(msg);
      goeyToast.error("Setup failed", { description: msg });
      setIsSubmitting(false);
      return;
    }

    goeyToast.success("Company created", {
      description: "Your workspace is ready.",
    });
    router.push("/dashboard");
    router.refresh();
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-8 py-12">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="flex items-center gap-2.5 mb-10">
          <svg width="22" height="22" viewBox="0 0 22 22" fill="none" aria-hidden>
            <rect width="22" height="22" rx="4" fill="#005db5" />
            <path d="M6 11h10M6 7h10M6 15h6" stroke="white" strokeWidth="1.8" strokeLinecap="round" />
          </svg>
          <span className="font-display text-base font-semibold tracking-tight text-foreground">
            RepFlow
          </span>
        </div>

        <div className="mb-8">
          <h2 className="font-display text-2xl font-bold text-foreground tracking-tight">
            Set Up Your Workspace
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Give your company a name to get started.
          </p>
        </div>

        <form className="space-y-4" onSubmit={handleSubmit}>
          <div className="space-y-1.5">
            <label
              className="text-xs font-semibold text-muted-foreground uppercase tracking-widest"
              htmlFor="companyName"
            >
              Company Name
            </label>
            <input
              id="companyName"
              name="companyName"
              type="text"
              required
              autoFocus
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Acme Sales Co."
              className="w-full px-3 py-2.5 border border-border rounded-md text-foreground text-sm placeholder:text-muted-foreground/50 outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 transition-all bg-background"
            />
          </div>

          {error && (
            <div
              className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
              role="alert"
            >
              <p className="font-medium">Setup failed</p>
              <p className="mt-1">{error}</p>
            </div>
          )}

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full py-2.5 px-4 rounded-md text-primary-foreground font-semibold text-sm bg-primary hover:bg-primary/90 transition-colors mt-2 disabled:opacity-40"
          >
            {isSubmitting ? "Creating Workspace..." : "Create Workspace"}
          </button>
        </form>

        <p className="mt-6 text-center text-xs text-muted-foreground">
          You'll be set as the Super Admin of your workspace.
        </p>
      </div>
    </div>
  );
}
