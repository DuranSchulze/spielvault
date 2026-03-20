import { prisma } from "@/lib/prisma/client";

export async function getUserById(id: string) {
  return prisma.user.findUnique({
    where: { id },
    include: {
      company: { select: { id: true, name: true } },
      departments: {
        include: {
          department: { select: { id: true, name: true } },
        },
      },
    },
  });
}

export async function getUsersByCompany(companyId: string) {
  return prisma.user.findMany({
    where: { companyId, isActive: true },
    orderBy: { name: "asc" },
  });
}
