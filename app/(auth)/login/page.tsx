import Link from "next/link";

export const metadata = {
  title: "Sign In — Spiel Vault",
};

export default function LoginPage() {
  return (
    <div>
      <div className="mb-8">
        <h2 className="font-display text-2xl font-bold text-[#2b3437] tracking-tight">
          Welcome Back
        </h2>
        <p className="mt-1 text-sm text-[#49636f]">
          Sign in to your curated workspace.
        </p>
      </div>

      <form className="space-y-4">
        <div className="space-y-1.5">
          <label
            className="text-xs font-semibold text-[#49636f] uppercase tracking-widest"
            htmlFor="email"
          >
            Email Address
          </label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[#abb3b7]">
              <svg
                width="15"
                height="15"
                viewBox="0 0 15 15"
                fill="none"
                aria-hidden
              >
                <path
                  d="M1 3.5A1.5 1.5 0 0 1 2.5 2h10A1.5 1.5 0 0 1 14 3.5v8A1.5 1.5 0 0 1 12.5 13h-10A1.5 1.5 0 0 1 1 11.5v-8Zm1.5-.5a.5.5 0 0 0-.5.5V4l5.5 3.5L13 4V3.5a.5.5 0 0 0-.5-.5h-10ZM13 5.236l-5.22 3.326a.5.5 0 0 1-.56 0L2 5.236V11.5a.5.5 0 0 0 .5.5h10a.5.5 0 0 0 .5-.5V5.236Z"
                  fill="currentColor"
                />
              </svg>
            </span>
            <input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              required
              placeholder="curator@email.com"
              className="w-full pl-9 pr-3 py-2.5 border border-[#e8ecef] rounded-md text-[#2b3437] text-sm placeholder:text-[#abb3b7] outline-none focus:border-[#005db5] focus:ring-2 focus:ring-[#005db5]/10 transition-all bg-white"
            />
          </div>
        </div>

        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <label
              className="text-xs font-semibold text-[#49636f] uppercase tracking-widest"
              htmlFor="password"
            >
              Password
            </label>
            <Link
              href="#"
              className="text-xs text-[#005db5] hover:underline font-medium"
            >
              Forgot Password?
            </Link>
          </div>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[#abb3b7]">
              <svg
                width="15"
                height="15"
                viewBox="0 0 15 15"
                fill="none"
                aria-hidden
              >
                <path
                  d="M5 4.63601C5 3.76031 5.24219 3.1 5.65801 2.66255C6.07066 2.22838 6.88572 1.9 8 1.9C9.11428 1.9 9.92934 2.22838 10.342 2.66255C10.7578 3.1 11 3.76031 11 4.63601V6H5V4.63601ZM4 6V4.63601C4 3.59447 4.30252 2.65511 4.94199 1.99015C5.58462 1.32195 6.56572 0.9 8 0.9C9.43428 0.9 10.4154 1.32195 11.058 1.99015C11.6975 2.65511 12 3.59447 12 4.63601V6H13C13.5523 6 14 6.44772 14 7V13C14 13.5523 13.5523 14 13 14H3C2.44772 14 2 13.5523 2 13V7C2 6.44772 2.44772 6 3 6H4ZM3 7V13H13V7H3ZM8 9C8.55228 9 9 8.55228 9 8C9 7.44772 8.55228 7 8 7C7.44772 7 7 7.44772 7 8C7 8.55228 7.44772 9 8 9ZM8 10C8.55228 10 9 10.4477 9 11C9 11.5523 8.55228 12 8 12C7.44772 12 7 11.5523 7 11C7 10.4477 7.44772 10 8 10Z"
                  fill="currentColor"
                  fillRule="evenodd"
                  clipRule="evenodd"
                />
              </svg>
            </span>
            <input
              id="password"
              name="password"
              type="password"
              autoComplete="current-password"
              required
              placeholder="••••••••"
              className="w-full pl-9 pr-3 py-2.5 border border-[#e8ecef] rounded-md text-[#2b3437] text-sm placeholder:text-[#abb3b7] outline-none focus:border-[#005db5] focus:ring-2 focus:ring-[#005db5]/10 transition-all bg-white"
            />
          </div>
        </div>

        <label className="flex items-center gap-2.5 cursor-pointer select-none">
          <input
            type="checkbox"
            className="w-4 h-4 rounded border-[#abb3b7] accent-[#005db5]"
          />
          <span className="text-sm text-[#49636f]">
            Keep me signed in for 30 days
          </span>
        </label>

        <button
          type="submit"
          className="w-full py-2.5 px-4 rounded-md text-white font-semibold text-sm bg-[#005db5] hover:bg-[#0052a0] transition-colors mt-2"
        >
          Sign in to Vault
        </button>
      </form>

      <p className="mt-6 text-center text-sm text-[#49636f]">
        New to Spiel Vault?{" "}
        <Link
          href="/signup"
          className="text-[#005db5] font-semibold hover:underline"
        >
          Create an account
        </Link>
      </p>
    </div>
  );
}
