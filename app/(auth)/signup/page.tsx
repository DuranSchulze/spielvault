import Link from "next/link";

export const metadata = {
  title: "Create Account — Spiel Vault",
};

export default function SignupPage() {
  return (
    <div>
      <div className="mb-8">
        <h2 className="font-display text-2xl font-bold text-[#2b3437] tracking-tight">
          Sign-up Is Managed
        </h2>
        <p className="mt-1 text-sm text-[#49636f]">
          Accounts are provisioned by an administrator during this phase.
        </p>
      </div>

      <div className="rounded-lg border border-[#e8ecef] bg-white px-4 py-4 text-sm text-[#49636f]">
        Use the seeded admin account or ask your workspace admin to invite you.
      </div>

      <p className="mt-6 text-center text-sm text-[#49636f]">
        Already have an account?{" "}
        <Link
          href="/login"
          className="text-[#005db5] font-semibold hover:underline"
        >
          Sign in to Vault
        </Link>
      </p>
    </div>
  );
}
