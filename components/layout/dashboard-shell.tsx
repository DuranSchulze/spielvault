import { SidebarNav } from "@/components/layout/sidebar-nav";
import { requireServerSession } from "@/lib/auth/session";
import Link from "next/link";

export async function DashboardShell({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await requireServerSession();
  const initial = session.user.name.trim().charAt(0).toUpperCase() || "U";

  return (
    <div className="flex min-h-screen bg-[#f8f9fa]">
      {/* Sidebar */}
      <aside className="w-[260px] shrink-0 bg-white border-r border-[#e8ecef] flex flex-col">
        {/* Logo */}
        <div className="px-6 pt-6 pb-5">
          <Link href="/dashboard" className="block">
            <span className="text-[10px] font-semibold text-[#abb3b7] uppercase tracking-widest block mb-0.5">
              The Digital Curator
            </span>
            <span className="font-display text-[17px] font-bold text-[#2b3437] tracking-tight">
              Spiel<span className="text-[#005db5]">Vault</span>
            </span>
          </Link>
        </div>

        <div className="mx-4 h-px bg-[#e8ecef] mb-4" />

        {/* Navigation */}
        <div className="flex-1 overflow-y-auto">
          <SidebarNav />
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-[#e8ecef]">
          <div className="flex items-center gap-3">
            <div className="w-7 h-7 rounded-full bg-[#d6e3ff] flex items-center justify-center">
              <span className="text-[10px] font-bold text-[#005db5]">
                {initial}
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold text-[#2b3437] truncate">
                {session.user.name}
              </p>
              <p className="text-[10px] text-[#abb3b7] truncate">
                {session.user.email} • {session.user.role}
              </p>
            </div>
          </div>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 flex flex-col overflow-hidden">{children}</main>
    </div>
  );
}
