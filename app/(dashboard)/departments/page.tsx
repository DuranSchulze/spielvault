import { PageHeader } from "@/components/layout/page-header";
import { requireAccessContext } from "@/lib/auth/session";
import { canManageDepartment } from "@/lib/permissions";
import { prisma } from "@/lib/prisma/client";
import type { UserRole } from "@/types";
import { DepartmentsManager } from "./departments-manager";

export const metadata = {
  title: "Departments — Spiel Vault",
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

  const departments = (await prisma.department.findMany({
    where: {
      companyId: access.companyId,
      ...(canManage
        ? {}
        : {
            id: {
              in: access.departmentIds.length > 0 ? access.departmentIds : ["__none__"],
            },
          }),
    },
    select: {
      id: true,
      name: true,
      slug: true,
      description: true,
      _count: {
        select: {
          spiels: true,
          members: true,
        },
      },
      spiels: {
        where: { status: "active" },
        orderBy: { updatedAt: "desc" },
        take: 4,
        select: {
          id: true,
          title: true,
        },
      },
      members: {
        take: 4,
        select: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
      },
    },
    orderBy: { name: "asc" },
  })) as unknown as DepartmentListItem[];

  const departmentCards = departments.map((department) => ({
    id: department.id,
    name: department.name,
    slug: department.slug,
    description: department.description,
    spielCount: department._count.spiels,
    userCount: department._count.members,
    spiels: department.spiels,
    users: department.members.map((member) => member.user),
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
