"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { authClient } from "@/lib/auth/auth-client";
import { goeyToast } from "@/components/ui/goey-toaster";

export default function SignupPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    if (password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }

    setIsSubmitting(true);

    const result = await authClient.signUp.email({
      name,
      email,
      password,
    });

    setIsSubmitting(false);

    if (result.error) {
      const msg =
        (result.error as { message?: string }).message ||
        "Unable to create account. Please try again.";
      setError(msg);
      goeyToast.error("Sign-up failed", { description: msg });
      return;
    }

    goeyToast.success("Account created", {
      description: "Welcome to RepFlow.",
    });
    router.push("/dashboard");
    router.refresh();
  }

  return (
    <div>
      <div className="mb-8">
        <h2 className="font-display text-2xl font-bold text-foreground tracking-tight">
          Create Your Account
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Get started with RepFlow.
        </p>
      </div>

      <form className="space-y-4" onSubmit={handleSubmit}>
        <div className="space-y-1.5">
          <label
            className="text-xs font-semibold text-muted-foreground uppercase tracking-widest"
            htmlFor="name"
          >
            Full Name
          </label>
          <input
            id="name"
            name="name"
            type="text"
            autoComplete="name"
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Jane Smith"
            className="w-full px-3 py-2.5 border border-border rounded-md text-foreground text-sm placeholder:text-muted-foreground/50 outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 transition-all bg-background"
          />
        </div>

        <div className="space-y-1.5">
          <label
            className="text-xs font-semibold text-muted-foreground uppercase tracking-widest"
            htmlFor="email"
          >
            Email Address
          </label>
          <input
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="jane@company.com"
            className="w-full px-3 py-2.5 border border-border rounded-md text-foreground text-sm placeholder:text-muted-foreground/50 outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 transition-all bg-background"
          />
        </div>

        <div className="space-y-1.5">
          <label
            className="text-xs font-semibold text-muted-foreground uppercase tracking-widest"
            htmlFor="password"
          >
            Password
          </label>
          <input
            id="password"
            name="password"
            type="password"
            autoComplete="new-password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Min. 8 characters"
            className="w-full px-3 py-2.5 border border-border rounded-md text-foreground text-sm placeholder:text-muted-foreground/50 outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 transition-all bg-background"
          />
        </div>

        <div className="space-y-1.5">
          <label
            className="text-xs font-semibold text-muted-foreground uppercase tracking-widest"
            htmlFor="confirmPassword"
          >
            Confirm Password
          </label>
          <input
            id="confirmPassword"
            name="confirmPassword"
            type="password"
            autoComplete="new-password"
            required
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            placeholder="Re-enter your password"
            className="w-full px-3 py-2.5 border border-border rounded-md text-foreground text-sm placeholder:text-muted-foreground/50 outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 transition-all bg-background"
          />
        </div>

        {error && (
          <div
            className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
            role="alert"
          >
            <p className="font-medium">Unable to create account</p>
            <p className="mt-1">{error}</p>
          </div>
        )}

        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full py-2.5 px-4 rounded-md text-primary-foreground font-semibold text-sm bg-primary hover:bg-primary/90 transition-colors mt-2 disabled:opacity-40"
        >
          {isSubmitting ? "Creating Account..." : "Create Account"}
        </button>
      </form>

      <p className="mt-6 text-center text-sm text-muted-foreground">
        Already have an account?{" "}
        <Link href="/login" className="text-primary font-semibold hover:underline">
          Sign in
        </Link>
      </p>
    </div>
  );
}
