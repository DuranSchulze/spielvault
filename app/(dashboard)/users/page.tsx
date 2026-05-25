import { PageHeader } from "@/components/layout/page-header";
import { UsersManager } from "@/components/users/users-manager";
import { requireAccessContext } from "@/lib/auth/session";
import { canManageDepartment } from "@/lib/permissions";
import { db } from "@/lib/drizzle/db";
import { users, departments, userDepartments } from "@/lib/drizzle/schema";
import { eq, asc, inArray, and } from "drizzle-orm";
import type { UserRole } from "@/types";
import type { UserItem } from "@/components/users/users-manager";

export const metadata = {
  title: "Users — Spiel Vault",
};

export default async function UsersPage() {
  const access = await requireAccessContext();
  const canManage = canManageDepartment(access.session.user.role as UserRole);

  const [userRows, departmentList] = await Promise.all([
    db
      .select({ id: users.id, name: users.name, email: users.email, role: users.role, isActive: users.isActive, createdAt: users.createdAt })
      .from(users)
      .where(eq(users.companyId, access.companyId))
      .orderBy(asc(users.name)),
    db
      .select({ id: departments.id, name: departments.name })
      .from(departments)
      .where(eq(departments.companyId, access.companyId))
      .orderBy(asc(departments.name)),
  ]);

  const userIds = userRows.map((u) => u.id);
  const memberships = userIds.length > 0
    ? await db
        .select({ userId: userDepartments.userId, department: { id: departments.id, name: departments.name } })
        .from(userDepartments)
        .innerJoin(departments, eq(userDepartments.departmentId, departments.id))
        .where(inArray(userDepartments.userId, userIds))
    : [];

  const memberMap = new Map<string, { department: { id: string; name: string } }[]>();
  for (const m of memberships) {
    const list = memberMap.get(m.userId) ?? [];
    list.push({ department: m.department });
    memberMap.set(m.userId, list);
  }

  const result = userRows.map((u) => ({ ...u, departments: memberMap.get(u.id) ?? [] }));

  return (
    <div className="flex-1 px-8 py-8">
      <PageHeader
        title="Users"
        description="Manage team members and their department access"
      />
      <UsersManager
        canManage={canManage}
        initialUsers={result as unknown as UserItem[]}
        departments={departmentList}
      />
    </div>
  );
}
