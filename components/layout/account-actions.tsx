"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { ChevronUp, LogOut, UserCircle2 } from "lucide-react";
import { authClient } from "@/lib/auth/auth-client";

type AccountActionsProps = {
  initial: string;
  name: string;
  email: string;
  role: string;
};

export function AccountActions({
  initial,
  name,
  email,
  role,
}: AccountActionsProps) {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [isSigningOut, setIsSigningOut] = useState(false);
  const containerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    function handlePointerDown(event: MouseEvent) {
      if (!containerRef.current?.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    function handleEscape(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setIsOpen(false);
      }
    }

    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("keydown", handleEscape);

    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("keydown", handleEscape);
    };
  }, []);

  async function handleSignOut() {
    setIsSigningOut(true);
    await authClient.signOut();
    router.push("/login");
    router.refresh();
  }

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        onClick={() => setIsOpen((open) => !open)}
        className="flex w-full items-center gap-3 rounded-lg border border-transparent px-3 py-2.5 text-left transition-colors hover:border-[#e8ecef] hover:bg-[#f6f8f9]"
        aria-haspopup="menu"
        aria-expanded={isOpen}
      >
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#d6e3ff]">
          <span className="text-[10px] font-bold text-[#005db5]">{initial}</span>
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate text-xs font-semibold text-[#2b3437]">{name}</p>
          <p className="truncate text-[10px] text-[#abb3b7]">
            {email} • {role}
          </p>
        </div>
        <ChevronUp
          className={`h-4 w-4 shrink-0 text-[#8a989e] transition-transform ${
            isOpen ? "rotate-0" : "rotate-180"
          }`}
        />
      </button>

      {isOpen && (
        <div className="absolute bottom-[calc(100%+0.5rem)] left-0 right-0 rounded-xl border border-[#e8ecef] bg-white p-1.5 shadow-[0_14px_40px_rgba(24,39,75,0.12)]">
          <Link
            href="/profile"
            onClick={() => setIsOpen(false)}
            className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-[#49636f] transition-colors hover:bg-[#f3f6f8] hover:text-[#2b3437]"
          >
            <UserCircle2 className="h-4 w-4" />
            Profile
          </Link>
          <button
            type="button"
            onClick={handleSignOut}
            disabled={isSigningOut}
            className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-[#49636f] transition-colors hover:bg-[#f3f6f8] hover:text-[#2b3437] disabled:cursor-not-allowed disabled:opacity-50"
          >
            <LogOut className="h-4 w-4" />
            {isSigningOut ? "Logging out..." : "Logout"}
          </button>
        </div>
      )}
    </div>
  );
}
