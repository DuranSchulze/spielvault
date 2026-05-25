import { db } from "@/lib/drizzle/db";
import { users, companies, userDepartments, departments } from "@/lib/drizzle/schema";
import { eq, and, asc } from "drizzle-orm";

export async function getUserById(id: string) {
  const [user] = await db
    .select({
      id: users.id,
      name: users.name,
      email: users.email,
      role: users.role,
      isActive: users.isActive,
      companyId: users.companyId,
      company: { id: companies.id, name: companies.name },
    })
    .from(users)
    .leftJoin(companies, eq(users.companyId, companies.id))
    .where(eq(users.id, id))
    .limit(1);

  if (!user) return null;

  const deptRows = await db
    .select({ department: { id: departments.id, name: departments.name } })
    .from(userDepartments)
    .leftJoin(departments, eq(userDepartments.departmentId, departments.id))
    .where(eq(userDepartments.userId, id));

  return { ...user, departments: deptRows };
}

export async function getUsersByCompany(companyId: string) {
  return db
    .select()
    .from(users)
    .where(and(eq(users.companyId, companyId), eq(users.isActive, true)))
    .orderBy(asc(users.name));
}
