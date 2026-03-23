import Link from "next/link";
import { SpielList } from "@/components/spiels/spiel-list";
import { requireAccessContext } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma/client";

export const metadata = {
  title: "Library — Spiel Vault",
};

type SpielListItem = {
  id: string;
  title: string;
  contentHtml: string | null;
  contentPlain: string | null;
  updatedAt: Date;
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

type SearchParams = Promise<{
  department?: string;
  category?: string;
}>;

function buildFilterHref(filters: { department?: string; category?: string }) {
  const params = new URLSearchParams();

  if (filters.department) {
    params.set("department", filters.department);
  }

  if (filters.category) {
    params.set("category", filters.category);
  }

  const query = params.toString();
  return query ? `/spiels?${query}` : "/spiels";
}

export default async function SpielsPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const params = await searchParams;
  const { companyId, departmentIds } = await requireAccessContext();

  const [departments, categories, rawSpiels] = await Promise.all([
    prisma.department.findMany({
      where: {
        companyId,
        id: { in: departmentIds.length > 0 ? departmentIds : ["__none__"] },
      },
      orderBy: { name: "asc" },
      select: { id: true, name: true },
    }),
    prisma.category.findMany({
      where: { companyId },
      orderBy: { name: "asc" },
      select: { id: true, name: true },
    }),
    prisma.spiel.findMany({
      where: {
        companyId,
        status: "active",
        departmentId: {
          in: departmentIds.length > 0 ? departmentIds : ["__none__"],
        },
        ...(params.department ? { departmentId: params.department } : {}),
        ...(params.category ? { categoryId: params.category } : {}),
      },
      include: {
        department: { select: { id: true, name: true } },
        category: { select: { id: true, name: true } },
        createdBy: { select: { id: true, name: true } },
      },
      orderBy: { updatedAt: "desc" },
    }),
  ]);

  const filterDepartments = departments as unknown as FilterOption[];
  const filterCategories = categories as unknown as FilterOption[];
  const spiels = rawSpiels as unknown as SpielListItem[];

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      {/* Top bar */}
      <div className="px-8 pt-8 pb-0">
        <div className="flex items-start justify-between gap-4 mb-6">
          <div>
            <h1 className="font-display text-2xl font-bold text-foreground tracking-tight">
              Spiel Library
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Your curated collection of high-impact communications.
            </p>
          </div>
          <Link
            href="/spiels/new"
            className="shrink-0 inline-flex items-center gap-2 px-4 py-2.5 rounded-md text-primary-foreground text-sm font-semibold bg-primary hover:bg-primary/90 transition-colors"
          >
            + New Spiel
          </Link>
        </div>

        {/* Filters */}
        <div className="flex items-center gap-6 border-b border-border pb-0">
          <div className="flex items-center gap-1">
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-widest mr-2">
              Departments
            </span>
            <Link
              href={buildFilterHref({ category: params.category })}
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
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-widest mr-2">
              Categories
            </span>
            <Link
              href={buildFilterHref({ department: params.department })}
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
      </div>

      {/* Spiel list */}
      <div className="flex-1 overflow-y-auto px-8 py-6">
        <SpielList
          initialSpiels={spiels}
          mode="library"
          emptyMessage="No spiels found for the current filters."
        />
      </div>
    </div>
  );
}
