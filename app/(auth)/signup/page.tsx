import Link from "next/link";

export const metadata = {
  title: "Create Account — Spiel Vault",
};

export default function SignupPage() {
  return (
    <div>
      <div className="mb-8">
        <h2 className="font-display text-2xl font-bold text-[#2b3437] tracking-tight">
          Create Your Account
        </h2>
        <p className="mt-1 text-sm text-[#49636f]">
          Join your team&apos;s curated workspace.
        </p>
      </div>

      <form className="space-y-4">
        <div className="space-y-1.5">
          <label
            className="text-xs font-semibold text-[#49636f] uppercase tracking-widest"
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
            placeholder="Jane Smith"
            className="w-full px-3 py-2.5 border border-[#e8ecef] rounded-md text-[#2b3437] text-sm placeholder:text-[#abb3b7] outline-none focus:border-[#005db5] focus:ring-2 focus:ring-[#005db5]/10 transition-all bg-white"
          />
        </div>

        <div className="space-y-1.5">
          <label
            className="text-xs font-semibold text-[#49636f] uppercase tracking-widest"
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
            placeholder="curator@email.com"
            className="w-full px-3 py-2.5 border border-[#e8ecef] rounded-md text-[#2b3437] text-sm placeholder:text-[#abb3b7] outline-none focus:border-[#005db5] focus:ring-2 focus:ring-[#005db5]/10 transition-all bg-white"
          />
        </div>

        <div className="space-y-1.5">
          <label
            className="text-xs font-semibold text-[#49636f] uppercase tracking-widest"
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
            placeholder="••••••••"
            className="w-full px-3 py-2.5 border border-[#e8ecef] rounded-md text-[#2b3437] text-sm placeholder:text-[#abb3b7] outline-none focus:border-[#005db5] focus:ring-2 focus:ring-[#005db5]/10 transition-all bg-white"
          />
        </div>

        <button
          type="submit"
          className="w-full py-2.5 px-4 rounded-md text-white font-semibold text-sm bg-[#005db5] hover:bg-[#0052a0] transition-colors mt-2"
        >
          Create Account
        </button>
      </form>

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
