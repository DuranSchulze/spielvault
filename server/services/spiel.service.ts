import { prisma } from "@/lib/prisma/client";

export async function getSpielsByDepartment(departmentId: string) {
  return prisma.spiel.findMany({
    where: { departmentId, status: "active" },
    include: {
      department: { select: { id: true, name: true } },
      category: { select: { id: true, name: true } },
      createdBy: { select: { id: true, name: true } },
    },
    orderBy: { updatedAt: "desc" },
  });
}

export async function getSpielById(id: string) {
  return prisma.spiel.findUnique({
    where: { id },
    include: {
      department: { select: { id: true, name: true } },
      category: { select: { id: true, name: true } },
      createdBy: { select: { id: true, name: true } },
    },
  });
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
  return prisma.spiel.create({ data });
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
  return prisma.spiel.update({ where: { id }, data });
}

export async function archiveSpiel(id: string) {
  return prisma.spiel.update({ where: { id }, data: { status: "archived" } });
}
