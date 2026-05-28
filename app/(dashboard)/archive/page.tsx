import Link from "next/link";
import { PageHeader } from "@/components/layout/page-header";
import { SpielList } from "@/components/spiels/spiel-list";
import { requireAccessContext } from "@/lib/auth/session";
import { db } from "@/lib/drizzle/db";
import { spiels, departments, categories } from "@/lib/drizzle/schema";
import { eq, and, or, ilike, inArray, desc, asc, count } from "drizzle-orm";

export const metadata = {
  title: "Archive — RepFlow",
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
}>;

function buildFilterHref(filters: {
  department?: string;
  category?: string;
  page?: string;
  q?: string;
}) {
  const params = new URLSearchParams();

  if (filters.department) {
    params.set("department", filters.department);
  }

  if (filters.category) {
    params.set("category", filters.category);
  }

  if (filters.page) {
    params.set("page", filters.page);
  }

  if (filters.q) {
    params.set("q", filters.q);
  }

  const query = params.toString();
  return query ? `/archive?${query}` : "/archive";
}

export default async function ArchivePage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const params = await searchParams;
  const { companyId, departmentIds } = await requireAccessContext();

  const page = params.page ? Math.max(1, Number(params.page)) : 1;
  const search = params.q?.trim() || "";

  const conditions = [
    eq(spiels.companyId, companyId),
    eq(spiels.status, "archived"),
    departmentIds.length > 0 ? inArray(spiels.departmentId, departmentIds) : eq(spiels.departmentId, "__none__"),
  ];
  if (params.department) conditions.push(eq(spiels.departmentId, params.department));
  if (params.category) conditions.push(eq(spiels.categoryId, params.category));
  if (search) conditions.push(or(ilike(spiels.title, `%${search}%`), ilike(spiels.contentPlain!, `%${search}%`))!);

  const whereClause = and(...conditions);

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
        department: { id: departments.id, name: departments.name },
        category: { id: categories.id, name: categories.name },
      })
      .from(spiels)
      .leftJoin(departments, eq(spiels.departmentId, departments.id))
      .leftJoin(categories, eq(spiels.categoryId, categories.id))
      .where(whereClause)
      .orderBy(desc(spiels.updatedAt))
      .limit(PAGE_SIZE + 1)
      .offset((page - 1) * PAGE_SIZE),
    db.select({ count: count() }).from(spiels).where(whereClause),
  ]);

  const totalCount = Number(countRow[0].count);
  const hasNextPage = spielRows.length > PAGE_SIZE;
  const displaySpiels = hasNextPage ? spielRows.slice(0, PAGE_SIZE) : spielRows;
  const totalPages = Math.ceil(totalCount / PAGE_SIZE);

  const archivedSpiels = displaySpiels.map((spiel) => ({
    ...spiel,
    isFavorited: false,
  })) as unknown as SpielListItem[];

  const pagination = {
    currentPage: page,
    totalPages,
    hasNextPage,
    hasPrevPage: page > 1,
    baseHref: "/archive",
    filterParams: {
      department: params.department,
      category: params.category,
      q: search,
    },
  };

  return (
    <div className="flex-1 overflow-y-auto px-8 py-8">
      <PageHeader
        title="Archive"
        description="Archived spiels stay here until they are permanently deleted."
        actions={
          <div className="flex items-center gap-3">
            {/* Search */}
            <form action="/archive" method="GET" className="relative">
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
                placeholder="Search archived…"
                className="w-48 pl-3 pr-8 py-2 text-sm border border-border rounded-md bg-background text-foreground placeholder:text-muted-foreground/50 outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 transition-all"
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
            <Link
              href="/spiels"
              className="inline-flex items-center gap-2 rounded-md border border-border bg-card px-4 py-2.5 text-sm font-medium text-muted-foreground transition-colors hover:border-primary/30 hover:text-foreground"
            >
              Back to Library
            </Link>
          </div>
        }
      />

      <div className="mb-6 flex items-center gap-6 border-b border-border pb-4">
        <div className="flex items-center gap-1">
          <span className="mr-2 text-xs font-semibold uppercase tracking-widest text-muted-foreground">
            Departments
          </span>
          <Link
            href={buildFilterHref({
              category: params.category,
              page: undefined,
              q: search || undefined,
            })}
            className={`rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${
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
              })}
              className={`rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${
                params.department === department.id
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:bg-accent"
              }`}
            >
              {department.name}
            </Link>
          ))}
        </div>

        <div className="ml-auto flex items-center gap-1">
          <span className="mr-2 text-xs font-semibold uppercase tracking-widest text-muted-foreground">
            Categories
          </span>
          <Link
            href={buildFilterHref({
              department: params.department,
              page: undefined,
              q: search || undefined,
            })}
            className={`rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${
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
              })}
              className={`rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${
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

      <SpielList
        initialSpiels={archivedSpiels}
        mode="archive"
        emptyMessage="No archived spiels found for the current filters."
        pagination={pagination}
      />
    </div>
  );
}
