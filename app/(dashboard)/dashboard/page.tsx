import Link from "next/link";
import { requireAccessContext } from "@/lib/auth/session";
import { db } from "@/lib/drizzle/db";
import { spiels, departments, categories, users, auditLogs } from "@/lib/drizzle/schema";
import { eq, and, inArray, desc, count } from "drizzle-orm";
import { RecentSpielRow } from "@/components/dashboard/recent-spiel-row";

export const metadata = {
  title: "Dashboard — RepFlow",
};

type RecentSpiel = {
  id: string;
  title: string;
  contentHtml: string | null;
  contentPlain: string | null;
  department: { name: string };
  category: { name: string } | null;
  timestamp: Date;
  mode: "copied" | "library";
};

async function getRecentSpiels(
  userId: string,
  companyId: string,
  departmentIds: string[],
): Promise<RecentSpiel[]> {
  const logs = await db
    .select({ entityId: auditLogs.entityId, createdAt: auditLogs.createdAt })
    .from(auditLogs)
    .where(and(eq(auditLogs.userId, userId), eq(auditLogs.action, "copy"), eq(auditLogs.entityType, "spiel")))
    .orderBy(desc(auditLogs.createdAt))
    .limit(50);

  const seen = new Set<string>();
  const recentEntries: { id: string; copiedAt: Date }[] = [];
  for (const log of logs) {
    if (!seen.has(log.entityId) && recentEntries.length < 5) {
      seen.add(log.entityId);
      recentEntries.push({ id: log.entityId, copiedAt: log.createdAt });
    }
  }

  if (recentEntries.length > 0) {
    const spielRows = await db
      .select({
        id: spiels.id,
        title: spiels.title,
        contentHtml: spiels.contentHtml,
        contentPlain: spiels.contentPlain,
        department: { name: departments.name },
        category: { name: categories.name },
      })
      .from(spiels)
      .leftJoin(departments, eq(spiels.departmentId, departments.id))
      .leftJoin(categories, eq(spiels.categoryId, categories.id))
      .where(and(inArray(spiels.id, recentEntries.map((r) => r.id)), eq(spiels.companyId, companyId), eq(spiels.status, "active")));

    const result: RecentSpiel[] = recentEntries.flatMap((entry) => {
      const spiel = spielRows.find((s) => s.id === entry.id);
      if (!spiel) return [];
      return [
        {
          id: spiel.id,
          title: spiel.title,
          contentHtml: spiel.contentHtml,
          contentPlain: spiel.contentPlain,
          department: spiel.department as { name: string },
          category: spiel.category?.name ? { name: spiel.category.name } : null,
          timestamp: entry.copiedAt,
          mode: "copied" as const,
        },
      ];
    });

    if (result.length > 0) return result;
  }

  const fallbackRows = await db
    .select({
      id: spiels.id,
      title: spiels.title,
      contentHtml: spiels.contentHtml,
      contentPlain: spiels.contentPlain,
      updatedAt: spiels.updatedAt,
      department: { name: departments.name },
      category: { name: categories.name },
    })
    .from(spiels)
    .leftJoin(departments, eq(spiels.departmentId, departments.id))
    .leftJoin(categories, eq(spiels.categoryId, categories.id))
    .where(
      and(
        eq(spiels.companyId, companyId),
        eq(spiels.status, "active"),
        departmentIds.length > 0 ? inArray(spiels.departmentId, departmentIds) : eq(spiels.departmentId, "__none__"),
      ),
    )
    .orderBy(desc(spiels.updatedAt))
    .limit(5);

  return fallbackRows.map((s) => ({
    id: s.id,
    title: s.title,
    contentHtml: s.contentHtml,
    contentPlain: s.contentPlain,
    department: s.department as { name: string },
    category: s.category?.name ? { name: s.category.name } : null,
    timestamp: s.updatedAt,
    mode: "library" as const,
  }));
}

export default async function DashboardPage() {
  const { session, companyId, departmentIds } = await requireAccessContext();
  const userId = session.user.id;

  const [spielCountRow, departmentCountRow, userCountRow, recentSpiels] =
    await Promise.all([
      db.select({ count: count() }).from(spiels).where(and(eq(spiels.companyId, companyId), eq(spiels.status, "active"))),
      db.select({ count: count() }).from(departments).where(eq(departments.companyId, companyId)),
      db.select({ count: count() }).from(users).where(eq(users.companyId, companyId)),
      getRecentSpiels(userId, companyId, departmentIds),
    ]);

  const spielCount = Number(spielCountRow[0].count);
  const departmentCount = Number(departmentCountRow[0].count);
  const userCount = Number(userCountRow[0].count);

  const stats = [
    { label: "Total Spiels", value: String(spielCount), href: "/spiels" },
    { label: "Departments", value: String(departmentCount), href: "/departments" },
    { label: "Team Members", value: String(userCount), href: "/users" },
  ];

  const isFallback = recentSpiels.length > 0 && recentSpiels[0].mode === "library";

  return (
    <div className="flex-1 px-8 py-8 overflow-y-auto">
      <div className="mb-8">
        <p className="text-[10px] font-semibold text-muted-foreground/60 uppercase tracking-widest mb-1">
          Overview
        </p>
        <h1 className="font-display text-2xl font-bold text-foreground tracking-tight">
          Dashboard
        </h1>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        {stats.map((stat) => (
          <Link
            key={stat.label}
            href={stat.href}
            className="group bg-card border border-border rounded-lg px-6 py-5 hover:border-primary/30 hover:shadow-[0_2px_12px_rgba(0,93,181,0.06)] transition-all"
          >
            <p className="text-[10px] font-semibold text-muted-foreground/60 uppercase tracking-widest mb-3">
              {stat.label}
            </p>
            <p className="font-display text-3xl font-bold text-foreground group-hover:text-primary transition-colors">
              {stat.value}
            </p>
          </Link>
        ))}
      </div>

      {/* Quick actions */}
      <div className="mb-8">
        <p className="text-[10px] font-semibold text-muted-foreground/60 uppercase tracking-widest mb-3">
          Quick Actions
        </p>
        <div className="flex gap-3">
          <Link
            href="/spiels/new"
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-md text-primary-foreground text-sm font-semibold bg-primary hover:bg-primary/90 transition-colors"
          >
            + New Spiel
          </Link>
          <Link
            href="/spiels"
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-md text-sm font-semibold text-muted-foreground bg-card border border-border hover:border-primary/30 transition-colors"
          >
            Browse Library
          </Link>
        </div>
      </div>

      {/* Recent spiels */}
      <div>
        <div className="flex items-baseline gap-3 mb-3">
          <p className="text-[10px] font-semibold text-muted-foreground/60 uppercase tracking-widest">
            {isFallback ? "From Your Library" : "Recently Copied"}
          </p>
          {!isFallback && recentSpiels.length > 0 && (
            <Link
              href="/spiels"
              className="text-[10px] font-medium text-primary hover:underline"
            >
              View all →
            </Link>
          )}
        </div>

        {recentSpiels.length === 0 ? (
          <div className="bg-card border border-border rounded-lg px-6 py-10 text-center">
            <p className="text-sm text-muted-foreground">
              Copy a spiel from the{" "}
              <Link href="/spiels" className="text-primary hover:underline">
                library
              </Link>{" "}
              and it will appear here.
            </p>
          </div>
        ) : (
          <div className="bg-card border border-border rounded-lg divide-y divide-border overflow-hidden">
            {recentSpiels.map((spiel) => (
              <RecentSpielRow key={spiel.id} spiel={spiel} isFallback={isFallback} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
