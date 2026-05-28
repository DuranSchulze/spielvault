import { requireAccessContext } from "@/lib/auth/session";
import { db } from "@/lib/drizzle/db";
import { auditLogs, users } from "@/lib/drizzle/schema";
import { eq, and, gte, count, inArray } from "drizzle-orm";
import { CopiesChart } from "@/components/analytics/copies-chart";

export const metadata = {
  title: "Analytics — RepFlow",
};

const DAYS = 30;

async function getAnalytics(companyId: string) {
  const since = new Date(Date.now() - DAYS * 24 * 60 * 60 * 1000);

  const companyUserIds = await db
    .select({ id: users.id })
    .from(users)
    .where(eq(users.companyId, companyId))
    .then((rows) => rows.map((r) => r.id));

  if (companyUserIds.length === 0) {
    return {
      totalCopies: 0,
      totalCreated: 0,
      activeUsers: 0,
      topSpiels: [] as { id: string; name: string; copies: number }[],
      topUsers: [] as { userId: string; name: string; actions: number }[],
      dailyCopies: [] as { date: string; copies: number }[],
    };
  }

  const [copyCountRow, createdCountRow, activeUserRows, copyLogs, userActionCounts] =
    await Promise.all([
      db.select({ count: count() }).from(auditLogs).where(and(inArray(auditLogs.userId, companyUserIds), eq(auditLogs.action, "copy"))),
      db.select({ count: count() }).from(auditLogs).where(and(inArray(auditLogs.userId, companyUserIds), eq(auditLogs.action, "spiel.create"), gte(auditLogs.createdAt, since))),
      db.selectDistinct({ userId: auditLogs.userId }).from(auditLogs).where(and(inArray(auditLogs.userId, companyUserIds), gte(auditLogs.createdAt, since))),
      db.select({ entityId: auditLogs.entityId, metadata: auditLogs.metadata, createdAt: auditLogs.createdAt })
        .from(auditLogs)
        .where(and(inArray(auditLogs.userId, companyUserIds), eq(auditLogs.action, "copy"), eq(auditLogs.entityType, "spiel"), gte(auditLogs.createdAt, since))),
      db.select({ userId: auditLogs.userId, count: count() })
        .from(auditLogs)
        .where(and(inArray(auditLogs.userId, companyUserIds), gte(auditLogs.createdAt, since)))
        .groupBy(auditLogs.userId)
        .limit(10),
    ]);

  const totalCopies = Number(copyCountRow[0].count);
  const totalCreated = Number(createdCountRow[0].count);
  const activeUsers = activeUserRows.length;

  // Top spiels
  const copyCountBySpiel = new Map<string, { count: number; name: string }>();
  for (const log of copyLogs) {
    const existing = copyCountBySpiel.get(log.entityId);
    const meta = log.metadata as Record<string, string> | null;
    const name = meta?.name ?? log.entityId.slice(0, 8);
    copyCountBySpiel.set(log.entityId, { count: (existing?.count ?? 0) + 1, name: existing?.name ?? name });
  }
  const topSpiels = [...copyCountBySpiel.entries()]
    .sort((a, b) => b[1].count - a[1].count)
    .slice(0, 10)
    .map(([id, { count: copies, name }]) => ({ id, name, copies }));

  // Top users
  const topUserIds = userActionCounts.map((r) => r.userId);
  const userRecords = topUserIds.length > 0
    ? await db.select({ id: users.id, name: users.name }).from(users).where(inArray(users.id, topUserIds))
    : [];
  const userNameMap = new Map(userRecords.map((u) => [u.id, u.name]));
  const topUsers = userActionCounts
    .sort((a, b) => Number(b.count) - Number(a.count))
    .map((r) => ({ userId: r.userId, name: userNameMap.get(r.userId) ?? "Unknown", actions: Number(r.count) }));

  // Daily copy counts
  const dailyMap = new Map<string, number>();
  for (let i = 0; i < DAYS; i++) {
    const d = new Date(since.getTime() + i * 24 * 60 * 60 * 1000);
    dailyMap.set(d.toISOString().slice(0, 10), 0);
  }
  for (const log of copyLogs) {
    const key = new Date(log.createdAt).toISOString().slice(0, 10);
    dailyMap.set(key, (dailyMap.get(key) ?? 0) + 1);
  }
  const dailyCopies = [...dailyMap.entries()].map(([date, copies]) => ({ date, copies }));

  return { totalCopies, totalCreated, activeUsers, topSpiels, topUsers, dailyCopies };
}

export default async function AnalyticsPage() {
  const { companyId } = await requireAccessContext();
  const data = await getAnalytics(companyId);

  const maxCopies = data.topSpiels[0]?.copies ?? 1;
  const maxActions = data.topUsers[0]?.actions ?? 1;

  const summaryCards = [
    { label: "Total Copies (all time)", value: data.totalCopies },
    { label: `Spiels Created (${DAYS}d)`, value: data.totalCreated },
    { label: `Active Users (${DAYS}d)`, value: data.activeUsers },
  ];

  return (
    <div className="flex-1 px-8 py-8 overflow-y-auto">
      <div className="mb-8">
        <p className="text-[10px] font-semibold text-muted-foreground/60 uppercase tracking-widest mb-1">
          Insights
        </p>
        <h1 className="font-display text-2xl font-bold text-foreground tracking-tight">
          Analytics
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Usage trends for the last {DAYS} days.
        </p>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        {summaryCards.map((card) => (
          <div
            key={card.label}
            className="bg-card border border-border rounded-lg px-6 py-5"
          >
            <p className="text-[10px] font-semibold text-muted-foreground/60 uppercase tracking-widest mb-3">
              {card.label}
            </p>
            <p className="font-display text-3xl font-bold text-foreground">
              {card.value}
            </p>
          </div>
        ))}
      </div>

      {/* Copies chart */}
      <div className="bg-card border border-border rounded-lg px-6 py-5 mb-6">
        <p className="text-[10px] font-semibold text-muted-foreground/60 uppercase tracking-widest mb-4">
          Copies per Day
        </p>
        {data.dailyCopies.every((d) => d.copies === 0) ? (
          <p className="text-sm text-muted-foreground py-8 text-center">
            No copy events in this period.
          </p>
        ) : (
          <CopiesChart data={data.dailyCopies} />
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top spiels */}
        <div className="bg-card border border-border rounded-lg px-6 py-5">
          <p className="text-[10px] font-semibold text-muted-foreground/60 uppercase tracking-widest mb-4">
            Most Copied Spiels
          </p>
          {data.topSpiels.length === 0 ? (
            <p className="text-sm text-muted-foreground py-4 text-center">
              No copy events yet.
            </p>
          ) : (
            <ol className="flex flex-col gap-3">
              {data.topSpiels.map((spiel, i) => (
                <li key={spiel.id} className="flex items-center gap-3">
                  <span className="text-xs font-mono text-muted-foreground/50 w-5 text-right shrink-0">
                    {i + 1}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{spiel.name}</p>
                    <div className="mt-1 h-1.5 rounded-full bg-muted overflow-hidden">
                      <div
                        className="h-full rounded-full bg-primary"
                        style={{
                          width: `${Math.round((spiel.copies / maxCopies) * 100)}%`,
                        }}
                      />
                    </div>
                  </div>
                  <span className="text-xs tabular-nums text-muted-foreground shrink-0">
                    {spiel.copies}
                  </span>
                </li>
              ))}
            </ol>
          )}
        </div>

        {/* Top users */}
        <div className="bg-card border border-border rounded-lg px-6 py-5">
          <p className="text-[10px] font-semibold text-muted-foreground/60 uppercase tracking-widest mb-4">
            Most Active Users
          </p>
          {data.topUsers.length === 0 ? (
            <p className="text-sm text-muted-foreground py-4 text-center">
              No activity yet.
            </p>
          ) : (
            <ol className="flex flex-col gap-3">
              {data.topUsers.map((user, i) => (
                <li key={user.userId} className="flex items-center gap-3">
                  <span className="text-xs font-mono text-muted-foreground/50 w-5 text-right shrink-0">
                    {i + 1}
                  </span>
                  <div className="w-7 h-7 rounded-full bg-primary/10 text-primary text-xs font-semibold flex items-center justify-center shrink-0">
                    {user.name.trim().charAt(0).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{user.name}</p>
                    <div className="mt-1 h-1.5 rounded-full bg-muted overflow-hidden">
                      <div
                        className="h-full rounded-full bg-primary/60"
                        style={{
                          width: `${Math.round((user.actions / maxActions) * 100)}%`,
                        }}
                      />
                    </div>
                  </div>
                  <span className="text-xs tabular-nums text-muted-foreground shrink-0">
                    {user.actions}
                  </span>
                </li>
              ))}
            </ol>
          )}
        </div>
      </div>
    </div>
  );
}
