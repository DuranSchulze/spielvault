import { PageHeader } from "@/components/layout/page-header";
import { CategoriesManager } from "@/components/categories/categories-manager";
import { requireAccessContext } from "@/lib/auth/session";
import { canManageDepartment } from "@/lib/permissions";
import { db } from "@/lib/drizzle/db";
import { categories } from "@/lib/drizzle/schema";
import { eq, asc } from "drizzle-orm";
import type { UserRole } from "@/types";

export const metadata = {
  title: "Categories — Spiel Vault",
};

export default async function CategoriesPage() {
  const access = await requireAccessContext();
  const canManage = canManageDepartment(access.session.user.role as UserRole);

  const categoryList = await db
    .select({ id: categories.id, name: categories.name, description: categories.description })
    .from(categories)
    .where(eq(categories.companyId, access.companyId))
    .orderBy(asc(categories.name));

  return (
    <div className="flex-1 px-8 py-8">
      <PageHeader
        title="Categories"
        description="Organize spiels into categories"
      />
      <CategoriesManager canManage={canManage} initialCategories={categoryList} />
    </div>
  );
}
