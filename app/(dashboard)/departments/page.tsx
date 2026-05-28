import { PageHeader } from "@/components/layout/page-header";
import { requireAccessContext } from "@/lib/auth/session";
import { canManageDepartment } from "@/lib/permissions";
import { db } from "@/lib/drizzle/db";
import { departments, spiels, users, userDepartments } from "@/lib/drizzle/schema";
import { eq, and, inArray, asc, desc, count } from "drizzle-orm";
import type { UserRole } from "@/types";
import { DepartmentsManager } from "./departments-manager";

export const metadata = {
  title: "Departments — RepFlow",
};

type DepartmentListItem = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  _count: {
    spiels: number;
    members: number;
  };
  spiels: {
    id: string;
    title: string;
  }[];
  members: {
    user: {
      id: string;
      name: string;
      email: string;
    };
  }[];
};

export default async function DepartmentsPage() {
  const access = await requireAccessContext();
  const canManage = canManageDepartment(access.session.user.role as UserRole);

  const deptWhere = canManage
    ? eq(departments.companyId, access.companyId)
    : and(
        eq(departments.companyId, access.companyId),
        access.departmentIds.length > 0
          ? inArray(departments.id, access.departmentIds)
          : eq(departments.id, "__none__"),
      );

  const deptRows = await db
    .select({ id: departments.id, name: departments.name, slug: departments.slug, description: departments.description })
    .from(departments)
    .where(deptWhere)
    .orderBy(asc(departments.name));

  const deptIds = deptRows.map((d) => d.id);

  const [spielCountRows, memberCountRows, recentSpielRows, memberRows] = deptIds.length > 0
    ? await Promise.all([
        db.select({ departmentId: spiels.departmentId, count: count() }).from(spiels).where(and(inArray(spiels.departmentId, deptIds), eq(spiels.status, "active"))).groupBy(spiels.departmentId),
        db.select({ departmentId: userDepartments.departmentId, count: count() }).from(userDepartments).where(inArray(userDepartments.departmentId, deptIds)).groupBy(userDepartments.departmentId),
        db.select({ id: spiels.id, title: spiels.title, departmentId: spiels.departmentId, updatedAt: spiels.updatedAt }).from(spiels).where(and(inArray(spiels.departmentId, deptIds), eq(spiels.status, "active"))).orderBy(desc(spiels.updatedAt)),
        db.select({ departmentId: userDepartments.departmentId, userId: userDepartments.userId, name: users.name, email: users.email }).from(userDepartments).leftJoin(users, eq(userDepartments.userId, users.id)).where(inArray(userDepartments.departmentId, deptIds)),
      ])
    : [[], [], [], []];

  const spielCountMap = new Map(spielCountRows.map((r) => [r.departmentId, Number(r.count)]));
  const memberCountMap = new Map(memberCountRows.map((r) => [r.departmentId, Number(r.count)]));

  const recentSpielsByDept = new Map<string, { id: string; title: string }[]>();
  for (const spiel of recentSpielRows) {
    const existing = recentSpielsByDept.get(spiel.departmentId) ?? [];
    if (existing.length < 4) existing.push({ id: spiel.id, title: spiel.title });
    recentSpielsByDept.set(spiel.departmentId, existing);
  }

  const membersByDept = new Map<string, { id: string; name: string; email: string }[]>();
  for (const member of memberRows) {
    const existing = membersByDept.get(member.departmentId) ?? [];
    if (existing.length < 4 && member.userId && member.name && member.email) {
      existing.push({ id: member.userId, name: member.name, email: member.email });
    }
    membersByDept.set(member.departmentId, existing);
  }

  const departmentCards = deptRows.map((dept) => ({
    id: dept.id,
    name: dept.name,
    slug: dept.slug,
    description: dept.description,
    spielCount: spielCountMap.get(dept.id) ?? 0,
    userCount: memberCountMap.get(dept.id) ?? 0,
    spiels: recentSpielsByDept.get(dept.id) ?? [],
    users: membersByDept.get(dept.id) ?? [],
  }));

  return (
    <div className="flex-1 px-8 py-8">
      <PageHeader
        title="Departments"
        description="Manage your company departments"
      />

      <DepartmentsManager
        canManage={canManage}
        initialDepartments={departmentCards}
        currentUser={{
          id: access.session.user.id,
          name: access.session.user.name,
          email: access.session.user.email,
        }}
      />
    </div>
  );
}
