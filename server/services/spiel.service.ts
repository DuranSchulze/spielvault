import { db } from "@/lib/drizzle/db";
import { spiels, departments, categories, users } from "@/lib/drizzle/schema";
import { eq, and, desc } from "drizzle-orm";

export async function getSpielsByDepartment(departmentId: string) {
  return db
    .select({
      id: spiels.id,
      title: spiels.title,
      status: spiels.status,
      contentHtml: spiels.contentHtml,
      contentPlain: spiels.contentPlain,
      updatedAt: spiels.updatedAt,
      department: { id: departments.id, name: departments.name },
      category: { id: categories.id, name: categories.name },
      createdBy: { id: users.id, name: users.name },
    })
    .from(spiels)
    .leftJoin(departments, eq(spiels.departmentId, departments.id))
    .leftJoin(categories, eq(spiels.categoryId, categories.id))
    .leftJoin(users, eq(spiels.createdByUserId, users.id))
    .where(and(eq(spiels.departmentId, departmentId), eq(spiels.status, "active")))
    .orderBy(desc(spiels.updatedAt));
}

export async function getSpielById(id: string) {
  const [row] = await db
    .select({
      id: spiels.id,
      title: spiels.title,
      status: spiels.status,
      contentHtml: spiels.contentHtml,
      contentJson: spiels.contentJson,
      contentPlain: spiels.contentPlain,
      updatedAt: spiels.updatedAt,
      department: { id: departments.id, name: departments.name },
      category: { id: categories.id, name: categories.name },
      createdBy: { id: users.id, name: users.name },
    })
    .from(spiels)
    .leftJoin(departments, eq(spiels.departmentId, departments.id))
    .leftJoin(categories, eq(spiels.categoryId, categories.id))
    .leftJoin(users, eq(spiels.createdByUserId, users.id))
    .where(eq(spiels.id, id))
    .limit(1);
  return row ?? null;
}

export async function createSpiel(data: {
  companyId: string;
  departmentId: string;
  categoryId?: string;
  createdByUserId: string;
  title: string;
  description?: string;
  contentJson?: string;
  contentHtml?: string;
  contentPlain?: string;
}) {
  const [spiel] = await db
    .insert(spiels)
    .values({
      companyId: data.companyId,
      departmentId: data.departmentId,
      categoryId: data.categoryId ?? null,
      createdByUserId: data.createdByUserId,
      title: data.title,
      description: data.description,
      contentJson: data.contentJson ?? "",
      contentHtml: data.contentHtml ?? null,
      contentPlain: data.contentPlain ?? "",
    })
    .returning();
  return spiel;
}

export async function updateSpiel(
  id: string,
  data: Partial<{
    title: string;
    description: string;
    categoryId: string;
    contentJson: string;
    contentHtml: string;
    contentPlain: string;
    status: string;
  }>
) {
  const [updated] = await db
    .update(spiels)
    .set({ ...data, updatedAt: new Date() })
    .where(eq(spiels.id, id))
    .returning();
  return updated;
}

export async function archiveSpiel(id: string) {
  const [updated] = await db
    .update(spiels)
    .set({ status: "archived", updatedAt: new Date() })
    .where(eq(spiels.id, id))
    .returning();
  return updated;
}
