import { notFound, redirect } from "next/navigation";
import { requireAccessContext } from "@/lib/auth/session";
import { canManageDepartment } from "@/lib/permissions";
import { db } from "@/lib/drizzle/db";
import { spiels, spielApprovals, departments, categories, users } from "@/lib/drizzle/schema";
import { eq, and, inArray, desc, asc } from "drizzle-orm";
import { NewSpielForm } from "../../new/new-spiel-form";
import type { UserRole } from "@/types";

type PageParams = Promise<{ id: string }>;

export const metadata = {
  title: "Edit Spiel — RepFlow",
};

export default async function EditSpielPage({
  params,
}: {
  params: PageParams;
}) {
  const { id } = await params;
  const access = await requireAccessContext();

  const [spiel] = await db
    .select({
      id: spiels.id,
      title: spiels.title,
      departmentId: spiels.departmentId,
      categoryId: spiels.categoryId,
      contentHtml: spiels.contentHtml,
      contentJson: spiels.contentJson,
      contentPlain: spiels.contentPlain,
      status: spiels.status,
    })
    .from(spiels)
    .where(and(eq(spiels.id, id), eq(spiels.companyId, access.companyId)))
    .limit(1);

  if (!spiel) notFound();

  if (!access.departmentIds.includes(spiel.departmentId)) {
    redirect("/spiels");
  }

  const isAdmin = canManageDepartment(access.session.user.role as UserRole);

  // Fetch latest rejection comment (only relevant when status is draft)
  type ApprovalRow = { action: string; comment: string | null; reviewer: { name: string } };
  let latestRejection: { comment: string | null; reviewerName: string } | null = null;

  if (spiel.status === "draft") {
    const [approval] = await db
      .select({
        action: spielApprovals.action,
        comment: spielApprovals.comment,
        reviewerId: spielApprovals.reviewerId,
      })
      .from(spielApprovals)
      .where(eq(spielApprovals.spielId, id))
      .orderBy(desc(spielApprovals.createdAt))
      .limit(1);

    if (approval?.action === "rejected") {
      const [reviewer] = await db
        .select({ name: users.name })
        .from(users)
        .where(eq(users.id, approval.reviewerId))
        .limit(1);
      latestRejection = { comment: approval.comment, reviewerName: reviewer?.name ?? "Unknown" };
    }
  }

  const [deptList, catList] = await Promise.all([
    db
      .select({ id: departments.id, name: departments.name })
      .from(departments)
      .where(
        and(
          eq(departments.companyId, access.companyId),
          access.departmentIds.length > 0
            ? inArray(departments.id, access.departmentIds)
            : eq(departments.id, "__none__"),
        ),
      )
      .orderBy(asc(departments.name)),
    db
      .select({ id: categories.id, name: categories.name, description: categories.description })
      .from(categories)
      .where(eq(categories.companyId, access.companyId))
      .orderBy(asc(categories.name)),
  ]);

  return (
    <NewSpielForm
      departments={deptList}
      categories={catList}
      userRole={access.session.user.role}
      isAdmin={isAdmin}
      latestRejection={latestRejection}
      initialData={{
        id: spiel.id,
        title: spiel.title,
        departmentId: spiel.departmentId,
        categoryId: spiel.categoryId,
        contentHtml: spiel.contentHtml,
        contentJson: spiel.contentJson,
        contentPlain: spiel.contentPlain,
        status: spiel.status,
      }}
    />
  );
}
