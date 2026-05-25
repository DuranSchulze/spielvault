import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { requireAccessContext } from "@/lib/auth/session";
import { db } from "@/lib/drizzle/db";
import { spiels, spielVersions, users } from "@/lib/drizzle/schema";
import { eq, and, desc } from "drizzle-orm";
import { VersionRestoreButton } from "./version-restore-button";

type PageParams = Promise<{ id: string }>;

export async function generateMetadata({ params }: { params: PageParams }) {
  const { id } = await params;
  return { title: `Version History — Spiel Vault` };
}

type VersionRow = {
  id: string;
  title: string;
  categoryId: string | null;
  createdAt: Date;
  savedBy: { name: string };
};

function formatDate(date: Date): string {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(date));
}

export default async function SpielHistoryPage({
  params,
}: {
  params: PageParams;
}) {
  const { id } = await params;
  const access = await requireAccessContext();

  const [spiel] = await db
    .select({ id: spiels.id, title: spiels.title, departmentId: spiels.departmentId })
    .from(spiels)
    .where(and(eq(spiels.id, id), eq(spiels.companyId, access.companyId)))
    .limit(1);

  if (!spiel) notFound();

  if (!access.departmentIds.includes(spiel.departmentId)) {
    redirect("/spiels");
  }

  const versionRows = await db
    .select({
      id: spielVersions.id,
      title: spielVersions.title,
      categoryId: spielVersions.categoryId,
      createdAt: spielVersions.createdAt,
      savedBy: { name: users.name },
    })
    .from(spielVersions)
    .leftJoin(users, eq(spielVersions.savedByUserId, users.id))
    .where(eq(spielVersions.spielId, id))
    .orderBy(desc(spielVersions.createdAt));

  const versions: VersionRow[] = versionRows.map((v) => ({
    id: v.id,
    title: v.title,
    categoryId: v.categoryId,
    createdAt: v.createdAt,
    savedBy: { name: v.savedBy?.name ?? "Unknown" },
  }));

  const totalVersions = versions.length;

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      {/* Header */}
      <div className="px-8 pt-8 pb-6 border-b border-border">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-[10px] font-semibold text-muted-foreground/60 uppercase tracking-widest mb-1">
              Version History
            </p>
            <h1 className="font-display text-2xl font-bold text-foreground tracking-tight truncate max-w-xl">
              {spiel.title}
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              {totalVersions} {totalVersions === 1 ? "version" : "versions"}{" "}
              saved. Restoring creates a new version.
            </p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <Link
              href={`/spiels/${id}/edit`}
              className="rounded-md border border-border px-4 py-2.5 text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
            >
              ← Back to Edit
            </Link>
          </div>
        </div>
      </div>

      {/* Version list */}
      <div className="flex-1 overflow-y-auto px-8 py-6">
        {versions.length === 0 ? (
          <div className="rounded-lg border border-dashed border-border bg-card px-6 py-12 text-center text-sm text-muted-foreground">
            No versions recorded yet. Versions are created each time a spiel is
            saved.
          </div>
        ) : (
          <div className="bg-card border border-border rounded-lg divide-y divide-border overflow-hidden">
            {versions.map((version, index) => {
              const versionNumber = totalVersions - index;
              const isLatest = index === 0;

              return (
                <div
                  key={version.id}
                  className="flex items-center gap-4 px-5 py-4"
                >
                  {/* Version badge */}
                  <div className="w-9 h-9 rounded-full bg-muted flex items-center justify-center shrink-0">
                    <span className="text-xs font-bold text-muted-foreground">
                      v{versionNumber}
                    </span>
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">
                      {version.title}
                      {isLatest && (
                        <span className="ml-2 inline-flex items-center rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-semibold text-primary uppercase tracking-widest">
                          Current
                        </span>
                      )}
                    </p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {version.savedBy.name} · {formatDate(version.createdAt)}
                    </p>
                  </div>

                  {/* Restore button — hidden on current version */}
                  {!isLatest && (
                    <VersionRestoreButton
                      spielId={id}
                      versionId={version.id}
                    />
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
