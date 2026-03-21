import { requireAccessContext } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma/client";
import { NewSpielForm } from "./new-spiel-form";

export default async function NewSpielPage() {
  const { companyId, departmentIds } = await requireAccessContext();

  const [departments, categories] = await Promise.all([
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
  ]);

  return <NewSpielForm departments={departments} categories={categories} />;
}
