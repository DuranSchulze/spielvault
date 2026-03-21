export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen flex">
      {/* Left — brand panel */}
      <div className="hidden lg:flex lg:w-[45%] xl:w-[40%] flex-col justify-between bg-[#005db5] p-12 text-white">
        {/* Logo */}
        <div className="flex items-center gap-2.5">
          <svg
            width="22"
            height="22"
            viewBox="0 0 22 22"
            fill="none"
            aria-hidden
          >
            <rect
              width="22"
              height="22"
              rx="4"
              fill="white"
              fillOpacity="0.2"
            />
            <path
              d="M6 11h10M6 7h10M6 15h6"
              stroke="white"
              strokeWidth="1.8"
              strokeLinecap="round"
            />
          </svg>
          <span className="font-display text-base font-semibold tracking-tight">
            Spiel Vault
          </span>
        </div>

        {/* Headline */}
        <div className="space-y-5">
          <h1 className="font-display text-4xl xl:text-5xl font-bold leading-tight tracking-tight">
            The Digital Curator
            <br />
            for Modern Teams.
          </h1>
          <p className="text-[15px] text-white/70 leading-relaxed max-w-xs">
            Elevate your productivity through an editorial lens. Organize, edit,
            and curate your most vital spiels in a space designed for clarity
            and authority.
          </p>
        </div>

        {/* Footer */}
        <p className="text-xs text-white/40 tracking-widest uppercase">
          V1.0 &nbsp;·&nbsp; Established 2024 &nbsp;·&nbsp; Privacy First
        </p>
      </div>

      {/* Right — form panel */}
      <div className="flex-1 flex items-center justify-center bg-background px-8 py-12">
        <div className="w-full max-w-sm">{children}</div>
      </div>
    </div>
  );
}
