import { redirect } from "next/navigation";
import Link from "next/link";
import { requireAccessContext } from "@/lib/auth/session";
import { canManageCompany } from "@/lib/permissions";
import { db } from "@/lib/drizzle/db";
import { companies, spiels, departments, categories, users } from "@/lib/drizzle/schema";
import { eq, and, count } from "drizzle-orm";
import { CompanySettingsForm } from "./company-settings-form";
import type { UserRole } from "@/types";

export const metadata = {
  title: "Company Settings — RepFlow",
};

function formatDate(date: Date): string {
  return new Intl.DateTimeFormat("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  }).format(date);
}

export default async function CompanySettingsPage() {
  const { session, companyId } = await requireAccessContext();

  if (!canManageCompany(session.user.role as UserRole)) {
    redirect("/dashboard");
  }

  const [[companyRow], [spielCountRow], [deptCountRow], [catCountRow], [userCountRow]] =
    await Promise.all([
      db.select({ id: companies.id, name: companies.name, slug: companies.slug, createdAt: companies.createdAt }).from(companies).where(eq(companies.id, companyId)).limit(1),
      db.select({ count: count() }).from(spiels).where(and(eq(spiels.companyId, companyId), eq(spiels.status, "active"))),
      db.select({ count: count() }).from(departments).where(eq(departments.companyId, companyId)),
      db.select({ count: count() }).from(categories).where(eq(categories.companyId, companyId)),
      db.select({ count: count() }).from(users).where(and(eq(users.companyId, companyId), eq(users.isActive, true))),
    ]);

  if (!companyRow) {
    redirect("/dashboard");
  }

  const stats = [
    { label: "Active Spiels", value: Number(spielCountRow.count), href: "/spiels" },
    { label: "Departments", value: Number(deptCountRow.count), href: "/departments" },
    { label: "Categories", value: Number(catCountRow.count), href: "/spiels" },
    { label: "Active Users", value: Number(userCountRow.count), href: "/users" },
  ];

  return (
    <div className="flex-1 px-8 py-8 overflow-y-auto">
      <div className="mb-8">
        <p className="text-[10px] font-semibold text-muted-foreground/60 uppercase tracking-widest mb-1">
          Super Admin
        </p>
        <h1 className="font-display text-2xl font-bold text-foreground tracking-tight">
          Company Settings
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Manage workspace-level settings for your organisation.
        </p>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
        {stats.map((stat) => (
          <Link
            key={stat.label}
            href={stat.href}
            className="group bg-card border border-border rounded-lg px-5 py-4 hover:border-primary/30 hover:shadow-[0_2px_12px_rgba(0,93,181,0.06)] transition-all"
          >
            <p className="text-[10px] font-semibold text-muted-foreground/60 uppercase tracking-widest mb-2">
              {stat.label}
            </p>
            <p className="font-display text-2xl font-bold text-foreground group-hover:text-primary transition-colors">
              {stat.value}
            </p>
          </Link>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_auto]">
        <div className="bg-card border border-border rounded-lg px-6 py-6">
          <h2 className="text-sm font-semibold text-foreground mb-1">
            Workspace Details
          </h2>
          <p className="text-xs text-muted-foreground mb-6">
            Created {formatDate(companyRow.createdAt)}
          </p>
          <CompanySettingsForm
            companyId={companyRow.id}
            initialName={companyRow.name}
            slug={companyRow.slug}
          />
        </div>

        <div className="bg-card border border-border rounded-lg px-6 py-6 w-72 shrink-0 self-start">
          <h2 className="text-sm font-semibold text-foreground mb-4">
            About this page
          </h2>
          <ul className="flex flex-col gap-3 text-xs text-muted-foreground">
            <li>Only <span className="font-semibold text-foreground">super admins</span> can access this page.</li>
            <li>The company slug is permanent and used in internal references. Changing it is not supported.</li>
            <li>Billing, branding, and SSO settings will appear here in a future update.</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
