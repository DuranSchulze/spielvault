import { requireAccessContext } from "@/lib/auth/session";
import { db } from "@/lib/drizzle/db";
import { departments, categories } from "@/lib/drizzle/schema";
import { eq, and, inArray, asc } from "drizzle-orm";
import { NewSpielForm } from "./new-spiel-form";

export default async function NewSpielPage() {
  const { companyId, departmentIds } = await requireAccessContext();

  const [deptList, catList] = await Promise.all([
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
      .select({ id: categories.id, name: categories.name, description: categories.description })
      .from(categories)
      .where(eq(categories.companyId, companyId))
      .orderBy(asc(categories.name)),
  ]);

  return <NewSpielForm departments={deptList} categories={catList} />;
}
