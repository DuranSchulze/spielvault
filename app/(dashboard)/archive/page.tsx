import Link from "next/link";
import { PageHeader } from "@/components/layout/page-header";
import { SpielList } from "@/components/spiels/spiel-list";
import { requireAccessContext } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma/client";

export const metadata = {
  title: "Archive — Spiel Vault",
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
  return query ? `/archive?${query}` : "/archive";
}

export default async function ArchivePage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const params = await searchParams;
  const { companyId, departmentIds } = await requireAccessContext();

  const [departments, categories, spiels] = await Promise.all([
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
        status: "archived",
        departmentId: {
          in: departmentIds.length > 0 ? departmentIds : ["__none__"],
        },
        ...(params.department ? { departmentId: params.department } : {}),
        ...(params.category ? { categoryId: params.category } : {}),
      },
      include: {
        department: { select: { id: true, name: true } },
        category: { select: { id: true, name: true } },
      },
      orderBy: { updatedAt: "desc" },
    }),
  ]);

  const filterDepartments = departments as unknown as FilterOption[];
  const filterCategories = categories as unknown as FilterOption[];
  const archivedSpiels = spiels as unknown as SpielListItem[];

  return (
    <div className="flex-1 overflow-y-auto px-8 py-8">
      <PageHeader
        title="Archive"
        description="Archived spiels stay here until they are permanently deleted."
        actions={
          <Link
            href="/spiels"
            className="inline-flex items-center gap-2 rounded-md border border-border bg-card px-4 py-2.5 text-sm font-medium text-muted-foreground transition-colors hover:border-primary/30 hover:text-foreground"
          >
            Back to Library
          </Link>
        }
      />

      <div className="mb-6 flex items-center gap-6 border-b border-border pb-4">
        <div className="flex items-center gap-1">
          <span className="mr-2 text-xs font-semibold uppercase tracking-widest text-muted-foreground">
            Departments
          </span>
          <Link
            href={buildFilterHref({ category: params.category })}
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
            href={buildFilterHref({ department: params.department })}
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
      />
    </div>
  );
}
