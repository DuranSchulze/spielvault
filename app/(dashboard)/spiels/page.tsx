import Link from "next/link";
import { SpielList } from "@/components/spiels/spiel-list";
import { requireAccessContext } from "@/lib/auth/session";
import { canManageDepartment } from "@/lib/permissions";
import { db } from "@/lib/drizzle/db";
import { spiels, departments, categories, users, userSpielFavorites } from "@/lib/drizzle/schema";
import { eq, and, or, ilike, inArray, desc, asc, count, SQL } from "drizzle-orm";
import type { UserRole } from "@/types";

export const metadata = {
  title: "Library — RepFlow",
};

type SpielListItem = {
  id: string;
  title: string;
  contentHtml: string | null;
  contentPlain: string | null;
  updatedAt: Date;
  isFavorited: boolean;
  department: {
    id: string;
    name: string;
  };
  category: {
    id: string;
    name: string;
  } | null;
};

type FilterOption = {
  id: string;
  name: string;
};

const PAGE_SIZE = 50;

type SearchParams = Promise<{
  department?: string;
  category?: string;
  page?: string;
  q?: string;
  favorites?: string;
  view?: string;
}>;

function buildFilterHref(filters: {
  department?: string;
  category?: string;
  page?: string;
  q?: string;
  favorites?: string;
  view?: string;
}) {
  const params = new URLSearchParams();

  if (filters.view) params.set("view", filters.view);
  if (filters.department) params.set("department", filters.department);
  if (filters.category) params.set("category", filters.category);
  if (filters.page) params.set("page", filters.page);
  if (filters.q) params.set("q", filters.q);
  if (filters.favorites) params.set("favorites", filters.favorites);

  const query = params.toString();
  return query ? `/spiels?${query}` : "/spiels";
}

export default async function SpielsPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const params = await searchParams;
  const { session, companyId, departmentIds } = await requireAccessContext();

  const page = params.page ? Math.max(1, Number(params.page)) : 1;
  const search = params.q?.trim() || "";
  const favoritesOnly = params.favorites === "1";
  const userId = session.user.id;
  const view = params.view ?? "library"; // "library" | "drafts" | "review"
  const isAdmin = canManageDepartment(session.user.role as UserRole);

  // Non-admins can't access the review queue
  const activeView = view === "review" && !isAdmin ? "library" : view;

  // Build where conditions per view
  let favoriteSpielIds: string[] | null = null;
  if (activeView === "library" && favoritesOnly) {
    const favRows = await db
      .select({ spielId: userSpielFavorites.spielId })
      .from(userSpielFavorites)
      .where(eq(userSpielFavorites.userId, userId));
    favoriteSpielIds = favRows.map((r) => r.spielId);
  }

  const whereConditions: SQL[] = [];

  if (activeView === "drafts") {
    whereConditions.push(
      eq(spiels.companyId, companyId),
      eq(spiels.createdByUserId, userId),
      or(eq(spiels.status, "draft"), eq(spiels.status, "pending_review"))!,
    );
  } else if (activeView === "review") {
    whereConditions.push(eq(spiels.companyId, companyId), eq(spiels.status, "pending_review"));
  } else {
    whereConditions.push(
      eq(spiels.companyId, companyId),
      eq(spiels.status, "active"),
      departmentIds.length > 0 ? inArray(spiels.departmentId, departmentIds) : eq(spiels.departmentId, "__none__"),
    );
    if (params.department) whereConditions.push(eq(spiels.departmentId, params.department));
    if (params.category) whereConditions.push(eq(spiels.categoryId, params.category));
    if (search) whereConditions.push(or(ilike(spiels.title, `%${search}%`), ilike(spiels.contentPlain!, `%${search}%`))!);
    if (favoriteSpielIds !== null) {
      whereConditions.push(
        favoriteSpielIds.length > 0 ? inArray(spiels.id, favoriteSpielIds) : eq(spiels.id, "__none__"),
      );
    }
  }

  const whereClause = and(...whereConditions);

  const [filterDepartments, filterCategories, spielRows, countRow] = await Promise.all([
    db
      .select({ id: departments.id, name: departments.name })
      .from(departments)
      .where(
        and(
          eq(departments.companyId, companyId),
          departmentIds.length > 0 ? inArray(departments.id, departmentIds) : eq(departments.id, "__none__"),
        ),
      )
      .orderBy(asc(departments.name)),
    db
      .select({ id: categories.id, name: categories.name })
      .from(categories)
      .where(eq(categories.companyId, companyId))
      .orderBy(asc(categories.name)),
    db
      .select({
        id: spiels.id,
        title: spiels.title,
        contentHtml: spiels.contentHtml,
        contentPlain: spiels.contentPlain,
        updatedAt: spiels.updatedAt,
        status: spiels.status,
        department: { id: departments.id, name: departments.name },
        category: { id: categories.id, name: categories.name },
        createdBy: { id: users.id, name: users.name },
      })
      .from(spiels)
      .leftJoin(departments, eq(spiels.departmentId, departments.id))
      .leftJoin(categories, eq(spiels.categoryId, categories.id))
      .leftJoin(users, eq(spiels.createdByUserId, users.id))
      .where(whereClause)
      .orderBy(desc(spiels.updatedAt))
      .limit(PAGE_SIZE + 1)
      .offset((page - 1) * PAGE_SIZE),
    db.select({ count: count() }).from(spiels).where(whereClause),
  ]);

  const totalCount = Number(countRow[0].count);
  const hasNextPage = spielRows.length > PAGE_SIZE;
  const displaySpiels = hasNextPage ? spielRows.slice(0, PAGE_SIZE) : spielRows;

  const favoriteRecords =
    activeView === "library" && displaySpiels.length > 0
      ? await db
          .select({ spielId: userSpielFavorites.spielId })
          .from(userSpielFavorites)
          .where(and(eq(userSpielFavorites.userId, userId), inArray(userSpielFavorites.spielId, displaySpiels.map((s) => s.id))))
      : [];
  const favoriteIds = new Set(favoriteRecords.map((f) => f.spielId));
  const totalPages = Math.ceil(totalCount / PAGE_SIZE);

  const spielItems = displaySpiels.map((spiel) => ({
    ...spiel,
    isFavorited: favoriteIds.has(spiel.id),
  })) as unknown as SpielListItem[];

  const pagination = {
    currentPage: page,
    totalPages,
    hasNextPage,
    hasPrevPage: page > 1,
    baseHref: "/spiels",
    filterParams: {
      department: params.department,
      category: params.category,
      q: search,
      favorites: favoritesOnly ? "1" : undefined,
      view: activeView !== "library" ? activeView : undefined,
    },
  };

  const viewTabs = [
    { label: "Library", value: "library", href: "/spiels" },
    { label: "Drafts", value: "drafts", href: "/spiels?view=drafts" },
    ...(isAdmin
      ? [{ label: "Review Queue", value: "review", href: "/spiels?view=review" }]
      : []),
  ];

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      {/* Top bar */}
      <div className="px-8 pt-8 pb-0">
        <div className="flex items-start justify-between gap-4 mb-4">
          <div>
            <h1 className="font-display text-2xl font-bold text-foreground tracking-tight">
              Spiel Library
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Your curated collection of high-impact communications.
            </p>
          </div>
          <div className="flex items-center gap-3">
            {/* Search */}
            <form action="/spiels" method="GET" className="relative">
              {params.department && (
                <input
                  type="hidden"
                  name="department"
                  value={params.department}
                />
              )}
              {params.category && (
                <input type="hidden" name="category" value={params.category} />
              )}
              <input
                type="search"
                name="q"
                defaultValue={search}
                placeholder="Search spiels…"
                className="w-56 pl-3 pr-8 py-2 text-sm border border-border rounded-md bg-background text-foreground placeholder:text-muted-foreground/50 outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 transition-all"
              />
              <button
                type="submit"
                className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                aria-label="Search"
              >
                <svg
                  width="14"
                  height="14"
                  viewBox="0 0 15 15"
                  fill="none"
                  aria-hidden
                >
                  <path
                    d="M10 6.5C10 8.433 8.433 10 6.5 10S3 8.433 3 6.5 4.567 3 6.5 3 10 4.567 10 6.5Zm-.936 3.564a5.5 5.5 0 1 1 .707-.707l3.186 3.186a.5.5 0 1 1-.707.707l-3.186-3.186Z"
                    fill="currentColor"
                    fillRule="evenodd"
                    clipRule="evenodd"
                  />
                </svg>
              </button>
            </form>
            {isAdmin && (
              <>
                <Link
                  href="/spiels/import"
                  className="shrink-0 inline-flex items-center gap-2 px-3.5 py-2.5 rounded-md text-sm font-medium text-muted-foreground border border-border hover:border-primary/30 hover:text-primary transition-colors"
                >
                  Import
                </Link>
                <Link
                  href="/api/spiels/export?format=json"
                  className="shrink-0 inline-flex items-center gap-2 px-3.5 py-2.5 rounded-md text-sm font-medium text-muted-foreground border border-border hover:border-primary/30 hover:text-primary transition-colors"
                >
                  Export JSON
                </Link>
                <Link
                  href="/api/spiels/export?format=csv"
                  className="shrink-0 inline-flex items-center gap-2 px-3.5 py-2.5 rounded-md text-sm font-medium text-muted-foreground border border-border hover:border-primary/30 hover:text-primary transition-colors"
                >
                  Export CSV
                </Link>
              </>
            )}
            <Link
              href="/spiels/new"
              className="shrink-0 inline-flex items-center gap-2 px-4 py-2.5 rounded-md text-primary-foreground text-sm font-semibold bg-primary hover:bg-primary/90 transition-colors"
            >
              + New Spiel
            </Link>
          </div>
        </div>

        {/* View tabs */}
        <div className="flex items-center gap-1 mb-4">
          {viewTabs.map((tab) => (
            <Link
              key={tab.value}
              href={tab.href}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                activeView === tab.value
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:bg-accent"
              }`}
            >
              {tab.label}
            </Link>
          ))}
        </div>

        {/* Filters — only shown in library view */}
        {activeView === "library" && (
        <div className="flex items-center gap-6 border-b border-border pb-0">
          <div className="flex items-center gap-1">
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-widest mr-2">
              Departments
            </span>
            <Link
              href={buildFilterHref({
                category: params.category,
                page: undefined,
                q: search || undefined,
                favorites: params.favorites,
              })}
              className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                !params.department
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:bg-accent"
              }`}
            >
              All
            </Link>
            {filterDepartments.map((department) => (
              <Link
                key={department.id}
                href={buildFilterHref({
                  department: department.id,
                  category: params.category,
                  page: undefined,
                  q: search || undefined,
                  favorites: params.favorites,
                })}
                className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                  params.department === department.id
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:bg-accent"
                }`}
              >
                {department.name}
              </Link>
            ))}
          </div>
          <div className="flex items-center gap-1 ml-auto">
            {/* Favorites chip */}
            <Link
              href={buildFilterHref({
                department: params.department,
                category: params.category,
                page: undefined,
                q: search || undefined,
                favorites: favoritesOnly ? undefined : "1",
              })}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-colors mr-3 ${
                favoritesOnly
                  ? "bg-amber-400 text-amber-900 hover:bg-amber-300"
                  : "text-muted-foreground hover:bg-accent"
              }`}
            >
              <svg
                viewBox="0 0 16 16"
                className="w-3 h-3"
                fill={favoritesOnly ? "currentColor" : "none"}
                stroke="currentColor"
                strokeWidth="1.5"
                aria-hidden
              >
                <path d="M8 1.5l1.75 3.55 3.92.57-2.84 2.77.67 3.91L8 10.35l-3.5 1.95.67-3.91-2.84-2.77 3.92-.57L8 1.5z" />
              </svg>
              Favorites
            </Link>

            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-widest mr-2">
              Categories
            </span>
            <Link
              href={buildFilterHref({
                department: params.department,
                page: undefined,
                q: search || undefined,
                favorites: params.favorites,
              })}
              className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                !params.category
                  ? "bg-foreground text-background"
                  : "text-muted-foreground hover:bg-accent"
              }`}
            >
              All Categories
            </Link>
            {filterCategories.map((category) => (
              <Link
                key={category.id}
                href={buildFilterHref({
                  department: params.department,
                  category: category.id,
                  page: undefined,
                  q: search || undefined,
                  favorites: params.favorites,
                })}
                className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                  params.category === category.id
                    ? "bg-foreground text-background"
                    : "text-muted-foreground hover:bg-accent"
                }`}
              >
                {category.name}
              </Link>
            ))}
          </div>
        </div>
        )}
      </div>

      {/* Spiel list */}
      <div className="flex-1 overflow-y-auto px-8 py-6">
        {activeView === "library" ? (
          <SpielList
            initialSpiels={spielItems}
            mode="library"
            emptyMessage="No spiels found for the current filters."
            pagination={pagination}
          />
        ) : (
          <div>
            {spielItems.length === 0 ? (
              <div className="rounded-lg border border-dashed border-border bg-card px-6 py-12 text-center text-sm text-muted-foreground">
                {activeView === "drafts"
                  ? "No drafts or pending spiels yet."
                  : "No spiels awaiting review."}
              </div>
            ) : (
              <div className="bg-card border border-border rounded-lg divide-y divide-border overflow-hidden">
                {spielItems.map((spiel) => {
                  const s = spiel as SpielListItem & { status?: string; createdBy?: { name: string } };
                  return (
                    <div key={spiel.id} className="flex items-center gap-4 px-5 py-3.5">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-medium text-foreground truncate">
                            {spiel.title}
                          </p>
                          {s.status && s.status !== "active" && (
                            <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-widest shrink-0 ${
                              s.status === "draft"
                                ? "bg-muted text-muted-foreground"
                                : "bg-amber-100 text-amber-800 dark:bg-amber-950/40 dark:text-amber-400"
                            }`}>
                              {s.status === "draft" ? "Draft" : "Pending Review"}
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {spiel.department.name}
                          {s.createdBy && activeView === "review" && ` · by ${s.createdBy.name}`}
                        </p>
                      </div>
                      <Link
                        href={`/spiels/${spiel.id}/edit`}
                        className="shrink-0 rounded-md border border-border px-3 py-1.5 text-xs font-semibold text-foreground hover:border-primary/40 hover:text-primary transition-colors"
                      >
                        {activeView === "review" ? "Review" : "Edit"}
                      </Link>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
