"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  BookOpen,
  PenLine,
  Users,
  Layers,
  HelpCircle,
  Archive,
  UserCircle2,
} from "lucide-react";

const mainNav = [
  { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { label: "Library", href: "/spiels", icon: BookOpen },
  { label: "Editor", href: "/spiels/new", icon: PenLine },
  { label: "Departments", href: "/departments", icon: Layers },
  { label: "Team", href: "/users", icon: Users },
];

const systemNav = [
  { label: "Profile", href: "/profile", icon: UserCircle2 },
  { label: "Support", href: "/support", icon: HelpCircle },
  { label: "Archive", href: "/archive", icon: Archive },
];

function NavItem({
  href,
  label,
  icon: Icon,
}: {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}) {
  const pathname = usePathname();
  const isActive =
    pathname === href ||
    (href !== "/spiels/new" && pathname.startsWith(href + "/"));

  return (
    <Link
      href={href}
      className={cn(
        "relative flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-colors group",
        isActive
          ? "text-[#005db5] bg-[#005db5]/8 font-semibold"
          : "text-[#49636f] hover:text-[#2b3437] hover:bg-[#e3e9ec]",
      )}
    >
      {isActive && (
        <span className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-5 bg-[#005db5] rounded-r-full" />
      )}
      <Icon
        className={cn(
          "w-4 h-4 shrink-0",
          isActive
            ? "text-[#005db5]"
            : "text-[#6f797c] group-hover:text-[#2b3437]",
        )}
      />
      <span>{label}</span>
    </Link>
  );
}

export function SidebarNav() {
  return (
    <nav className="flex flex-col gap-5 px-3">
      {/* Main section */}
      <div className="flex flex-col gap-0.5">
        {mainNav.map((item) => (
          <NavItem key={item.href} {...item} />
        ))}
      </div>

      {/* Divider */}
      <div>
        <p className="px-3 mb-1.5 text-[10px] font-semibold text-[#abb3b7] uppercase tracking-widest">
          Support &amp; System
        </p>
        <div className="flex flex-col gap-0.5">
          {systemNav.map((item) => (
            <NavItem key={item.href} {...item} />
          ))}
        </div>
      </div>
    </nav>
  );
}
