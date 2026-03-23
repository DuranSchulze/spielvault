import Link from "next/link";

export const metadata = {
  title: "Create Account — Spiel Vault",
};

export default function SignupPage() {
  return (
    <div>
      <div className="mb-8">
        <h2 className="font-display text-2xl font-bold text-foreground tracking-tight">
          Account Creation Is Disabled
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">
          You cannot create your own account from this page in the current release.
        </p>
      </div>

      <div className="rounded-lg border border-border bg-card px-4 py-4 text-sm text-muted-foreground">
        <p className="font-medium text-foreground">Why this page does not have a sign-up form</p>
        <p className="mt-2">
          Self-serve registration is intentionally turned off. Accounts must be created by an administrator, then you can sign in from the login page.
        </p>
        <p className="mt-2">
          If you already have an account but still cannot log in, go back to login and double-check your email, password, and deployment configuration.
        </p>
      </div>

      <p className="mt-6 text-center text-sm text-muted-foreground">
        Already have an account?{" "}
        <Link
          href="/login"
          className="text-primary font-semibold hover:underline"
        >
          Sign in to Vault
        </Link>
      </p>
    </div>
  );
}
