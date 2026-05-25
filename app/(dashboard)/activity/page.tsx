import { redirect } from "next/navigation";
import Link from "next/link";
import { requireAccessContext } from "@/lib/auth/session";
import { canManageDepartment } from "@/lib/permissions";
import { db } from "@/lib/drizzle/db";
import { auditLogs, users } from "@/lib/drizzle/schema";
import { eq, and, desc, count, inArray } from "drizzle-orm";
import type { UserRole } from "@/types";

export const metadata = {
  title: "Activity — Spiel Vault",
};

const PAGE_SIZE = 50;

const ENTITY_FILTERS = [
  { label: "All", value: "" },
  { label: "Spiels", value: "spiel" },
  { label: "Categories", value: "category" },
  { label: "Departments", value: "department" },
  { label: "Users", value: "user" },
  { label: "Variables", value: "variable" },
] as const;

const ACTION_LABELS: Record<string, string> = {
  "spiel.create": "created spiel",
  "spiel.update": "updated spiel",
  "spiel.archive": "archived spiel",
  "spiel.delete": "deleted spiel",
  "spiel.restore": "restored spiel version",
  "spiel.submit": "submitted spiel for review",
  "spiel.approve": "approved spiel",
  "spiel.reject": "rejected spiel",
  "category.create": "created category",
  "category.update": "updated category",
  "category.delete": "deleted category",
  "department.create": "created department",
  "department.update": "updated department",
  "department.delete": "deleted department",
  "user.create": "added user",
  "user.update": "updated user",
  "user.deactivate": "deactivated user",
  "variable.create": "created variable",
  "variable.update": "updated variable",
  "variable.delete": "deleted variable",
  "company.update": "updated company settings",
  copy: "copied spiel",
};

function formatRelativeTime(date: Date): string {
  const diffMs = Date.now() - new Date(date).getTime();
  const diffMin = Math.floor(diffMs / 60_000);
  if (diffMin < 1) return "just now";
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffHr = Math.floor(diffMin / 60);
  if (diffHr < 24) return `${diffHr}h ago`;
  const diffDay = Math.floor(diffHr / 24);
  if (diffDay < 30) return `${diffDay}d ago`;
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(date));
}

function getEntityName(
  action: string,
  metadata: unknown,
  entityId: string,
): string {
  if (
    metadata &&
    typeof metadata === "object" &&
    "name" in metadata &&
    typeof (metadata as Record<string, unknown>).name === "string"
  ) {
    return (metadata as Record<string, string>).name;
  }
  return entityId.slice(0, 8);
}

type SearchParams = Promise<{ type?: string; page?: string }>;

export default async function ActivityPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const { session, companyId } = await requireAccessContext();

  if (!canManageDepartment(session.user.role as UserRole)) {
    redirect("/dashboard");
  }

  const params = await searchParams;
  const typeFilter = params.type ?? "";
  const page = params.page ? Math.max(1, Number(params.page)) : 1;

  // Fetch all user IDs in this company first
  const companyUserIds = await db
    .select({ id: users.id })
    .from(users)
    .where(eq(users.companyId, companyId))
    .then((rows) => rows.map((r) => r.id));

  const logConditions = companyUserIds.length > 0 ? [inArray(auditLogs.userId, companyUserIds)] : [eq(auditLogs.userId, "__none__")];
  if (typeFilter) logConditions.push(eq(auditLogs.entityType, typeFilter));
  const logWhere = and(...logConditions);

  type LogEntry = {
    id: string;
    action: string;
    entityType: string;
    entityId: string;
    metadata: unknown;
    createdAt: Date;
    user: { name: string };
  };

  const [logRows, countRow] = await Promise.all([
    db
      .select({
        id: auditLogs.id,
        action: auditLogs.action,
        entityType: auditLogs.entityType,
        entityId: auditLogs.entityId,
        metadata: auditLogs.metadata,
        createdAt: auditLogs.createdAt,
        userId: auditLogs.userId,
      })
      .from(auditLogs)
      .where(logWhere)
      .orderBy(desc(auditLogs.createdAt))
      .limit(PAGE_SIZE)
      .offset((page - 1) * PAGE_SIZE),
    db.select({ count: count() }).from(auditLogs).where(logWhere),
  ]);

  const totalCount = Number(countRow[0].count);

  // Fetch user names for the log rows
  const userIds = [...new Set(logRows.map((r) => r.userId))];
  const userRecords = userIds.length > 0
    ? await db.select({ id: users.id, name: users.name }).from(users).where(inArray(users.id, userIds))
    : [];
  const userNameMap = new Map(userRecords.map((u) => [u.id, u.name]));

  const logs: LogEntry[] = logRows.map((r) => ({
    id: r.id,
    action: r.action,
    entityType: r.entityType,
    entityId: r.entityId,
    metadata: r.metadata,
    createdAt: r.createdAt,
    user: { name: userNameMap.get(r.userId) ?? "Unknown" },
  }));

  const totalPages = Math.ceil(totalCount / PAGE_SIZE);

  function buildHref(overrides: { type?: string; page?: number }) {
    const p = new URLSearchParams();
    const t = overrides.type !== undefined ? overrides.type : typeFilter;
    if (t) p.set("type", t);
    const pg = overrides.page ?? page;
    if (pg > 1) p.set("page", String(pg));
    const qs = p.toString();
    return qs ? `/activity?${qs}` : "/activity";
  }

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      {/* Header */}
      <div className="px-8 pt-8 pb-0">
        <div className="mb-6">
          <p className="text-[10px] font-semibold text-muted-foreground/60 uppercase tracking-widest mb-1">
            Admin
          </p>
          <h1 className="font-display text-2xl font-bold text-foreground tracking-tight">
            Activity Log
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            All changes made within your workspace.
          </p>
        </div>

        {/* Filter chips */}
        <div className="flex items-center gap-1 border-b border-border pb-0">
          {ENTITY_FILTERS.map((f) => (
            <Link
              key={f.value}
              href={buildHref({ type: f.value, page: 1 })}
              className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                typeFilter === f.value
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:bg-accent"
              }`}
            >
              {f.label}
            </Link>
          ))}
          <span className="ml-auto text-xs text-muted-foreground/60">
            {totalCount} {totalCount === 1 ? "event" : "events"}
          </span>
        </div>
      </div>

      {/* Log list */}
      <div className="flex-1 overflow-y-auto px-8 py-6">
        {logs.length === 0 ? (
          <div className="rounded-lg border border-dashed border-border bg-card px-6 py-12 text-center text-sm text-muted-foreground">
            No activity yet
            {typeFilter ? ` for ${typeFilter}s` : ""}.
          </div>
        ) : (
          <div className="flex flex-col gap-0">
            <div className="bg-card border border-border rounded-lg divide-y divide-border overflow-hidden">
              {logs.map((log) => {
                const label =
                  ACTION_LABELS[log.action] ?? log.action.replace(".", " ");
                const entityName = getEntityName(
                  log.action,
                  log.metadata,
                  log.entityId,
                );

                return (
                  <div
                    key={log.id}
                    className="flex items-center gap-4 px-5 py-3.5"
                  >
                    {/* Actor avatar */}
                    <div className="w-7 h-7 rounded-full bg-primary/10 text-primary text-xs font-semibold flex items-center justify-center shrink-0">
                      {log.user.name.trim().charAt(0).toUpperCase()}
                    </div>

                    {/* Description */}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-foreground">
                        <span className="font-medium">{log.user.name}</span>{" "}
                        <span className="text-muted-foreground">{label}</span>{" "}
                        <span className="font-medium truncate">
                          &ldquo;{entityName}&rdquo;
                        </span>
                      </p>
                    </div>

                    {/* Entity type badge */}
                    <span className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/50 shrink-0">
                      {log.entityType}
                    </span>

                    {/* Time */}
                    <span className="text-xs text-muted-foreground/60 shrink-0 tabular-nums">
                      {formatRelativeTime(log.createdAt)}
                    </span>
                  </div>
                );
              })}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between border-t border-border pt-4 mt-2">
                <p className="text-xs text-muted-foreground">
                  Page {page} of {totalPages}
                </p>
                <div className="flex items-center gap-2">
                  {page > 1 && (
                    <Link
                      href={buildHref({ page: page - 1 })}
                      className="inline-flex items-center gap-1 rounded-md border border-border px-3 py-1.5 text-xs font-medium text-muted-foreground hover:border-primary/30 hover:text-primary transition-colors"
                    >
                      ← Previous
                    </Link>
                  )}
                  {page < totalPages && (
                    <Link
                      href={buildHref({ page: page + 1 })}
                      className="inline-flex items-center gap-1 rounded-md border border-border px-3 py-1.5 text-xs font-medium text-muted-foreground hover:border-primary/30 hover:text-primary transition-colors"
                    >
                      Next →
                    </Link>
                  )}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
