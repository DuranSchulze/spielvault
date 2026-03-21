import Link from "next/link";
import { requireAccessContext } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma/client";

export const metadata = {
  title: "Dashboard — Spiel Vault",
};

export default async function DashboardPage() {
  const { companyId } = await requireAccessContext();
  const [spielCount, departmentCount, userCount] = await Promise.all([
    prisma.spiel.count({ where: { companyId } }),
    prisma.department.count({ where: { companyId } }),
    prisma.user.count({ where: { companyId } }),
  ]);

  const stats = [
    { label: "Total Spiels", value: String(spielCount), href: "/spiels" },
    { label: "Departments", value: String(departmentCount), href: "/departments" },
    { label: "Team Members", value: String(userCount), href: "/users" },
  ];

  return (
    <div className="flex-1 px-8 py-8 overflow-y-auto">
      <div className="mb-8">
        <p className="text-[10px] font-semibold text-[#abb3b7] uppercase tracking-widest mb-1">
          Overview
        </p>
        <h1 className="font-display text-2xl font-bold text-[#2b3437] tracking-tight">
          Dashboard
        </h1>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        {stats.map((stat) => (
          <Link
            key={stat.label}
            href={stat.href}
            className="group bg-white border border-[#e8ecef] rounded-lg px-6 py-5 hover:border-[#005db5]/30 hover:shadow-[0_2px_12px_rgba(0,93,181,0.06)] transition-all"
          >
            <p className="text-[10px] font-semibold text-[#abb3b7] uppercase tracking-widest mb-3">
              {stat.label}
            </p>
            <p className="font-display text-3xl font-bold text-[#2b3437] group-hover:text-[#005db5] transition-colors">
              {stat.value}
            </p>
          </Link>
        ))}
      </div>

      {/* Quick actions */}
      <div className="mb-8">
        <p className="text-[10px] font-semibold text-[#abb3b7] uppercase tracking-widest mb-3">
          Quick Actions
        </p>
        <div className="flex gap-3">
          <Link
            href="/spiels/new"
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-md text-white text-sm font-semibold bg-[#005db5] hover:bg-[#0052a0] transition-colors"
          >
            + New Spiel
          </Link>
          <Link
            href="/spiels"
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-md text-sm font-semibold text-[#49636f] bg-white border border-[#e8ecef] hover:border-[#005db5]/30 transition-colors"
          >
            Browse Library
          </Link>
        </div>
      </div>

      {/* Recent activity placeholder */}
      <div>
        <p className="text-[10px] font-semibold text-[#abb3b7] uppercase tracking-widest mb-3">
          Recent Activity
        </p>
        <div className="bg-white border border-[#e8ecef] rounded-lg px-6 py-10 text-center">
          <p className="text-sm text-[#abb3b7]">
            Live activity wiring comes next. Your workspace is now reading counts from PostgreSQL.
          </p>
        </div>
      </div>
    </div>
  );
}
