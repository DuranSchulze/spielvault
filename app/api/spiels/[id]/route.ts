import { NextRequest, NextResponse } from "next/server";
import { getAccessContextOrNull } from "@/lib/auth/session";
import { canManageDepartment } from "@/lib/permissions";
import { updateSpielSchema } from "@/lib/validations/spiel";
import { db } from "@/lib/drizzle/db";
import { spiels, departments, categories, users } from "@/lib/drizzle/schema";
import { eq, and } from "drizzle-orm";
import { logActivity } from "@/lib/audit/log-activity";
import { snapshotSpiel } from "@/lib/versioning/snapshot-spiel";
import type { UserRole } from "@/types";

async function getSpielForAccess(id: string, companyId: string) {
  const [row] = await db
    .select({
      id: spiels.id,
      title: spiels.title,
      status: spiels.status,
      departmentId: spiels.departmentId,
    })
    .from(spiels)
    .where(and(eq(spiels.id, id), eq(spiels.companyId, companyId)))
    .limit(1);
  return row ?? null;
}

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const access = await getAccessContextOrNull();

  if (!access) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  const [row] = await db
    .select({
      id: spiels.id,
      title: spiels.title,
      status: spiels.status,
      departmentId: spiels.departmentId,
      categoryId: spiels.categoryId,
      contentHtml: spiels.contentHtml,
      contentJson: spiels.contentJson,
      contentPlain: spiels.contentPlain,
      createdAt: spiels.createdAt,
      updatedAt: spiels.updatedAt,
      department: { id: departments.id, name: departments.name },
      category: { id: categories.id, name: categories.name },
      createdBy: { id: users.id, name: users.name },
    })
    .from(spiels)
    .leftJoin(departments, eq(spiels.departmentId, departments.id))
    .leftJoin(categories, eq(spiels.categoryId, categories.id))
    .leftJoin(users, eq(spiels.createdByUserId, users.id))
    .where(and(eq(spiels.id, id), eq(spiels.companyId, access.companyId)))
    .limit(1);

  if (!row) {
    return NextResponse.json({ error: "Spiel not found" }, { status: 404 });
  }

  if (!access.departmentIds.includes(row.departmentId)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  return NextResponse.json(row);
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const access = await getAccessContextOrNull();

  if (!access) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const spiel = await getSpielForAccess(id, access.companyId);

  if (!spiel) {
    return NextResponse.json({ error: "Spiel not found" }, { status: 404 });
  }

  if (!access.departmentIds.includes(spiel.departmentId)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  if (
    spiel.status === "pending_review" &&
    !canManageDepartment(access.session.user.role as UserRole)
  ) {
    return NextResponse.json(
      { error: "This spiel is under review and cannot be edited." },
      { status: 400 },
    );
  }

  const body = await req.json().catch(() => ({}));
  const parsed = updateSpielSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.flatten().fieldErrors },
      { status: 400 },
    );
  }

  const data: Record<string, unknown> = { updatedAt: new Date() };

  if (parsed.data.title !== undefined) data.title = parsed.data.title;
  if (parsed.data.contentHtml !== undefined) data.contentHtml = parsed.data.contentHtml;
  if (parsed.data.contentJson !== undefined) data.contentJson = parsed.data.contentJson;
  if (parsed.data.contentPlain !== undefined) data.contentPlain = parsed.data.contentPlain;
  if (parsed.data.status !== undefined) data.status = parsed.data.status;

  if (parsed.data.categoryId !== undefined) {
    if (parsed.data.categoryId) {
      const [cat] = await db
        .select({ id: categories.id })
        .from(categories)
        .where(and(eq(categories.id, parsed.data.categoryId), eq(categories.companyId, access.companyId)))
        .limit(1);

      if (!cat) {
        return NextResponse.json({ error: "Category not found" }, { status: 404 });
      }
    }
    data.categoryId = parsed.data.categoryId || null;
  }

  if (
    parsed.data.status === "archived" &&
    !canManageDepartment(access.session.user.role as UserRole)
  ) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  if (Object.keys(data).length === 1) {
    return NextResponse.json({ error: "No updates provided" }, { status: 400 });
  }

  const isContentUpdate =
    parsed.data.title !== undefined ||
    parsed.data.contentHtml !== undefined ||
    parsed.data.contentJson !== undefined ||
    parsed.data.contentPlain !== undefined ||
    parsed.data.categoryId !== undefined;

  const [updated] = await db
    .update(spiels)
    .set(data as Partial<typeof spiels.$inferInsert>)
    .where(eq(spiels.id, id))
    .returning({
      id: spiels.id,
      title: spiels.title,
      status: spiels.status,
      contentHtml: spiels.contentHtml,
      contentJson: spiels.contentJson,
      contentPlain: spiels.contentPlain,
      categoryId: spiels.categoryId,
    });

  const action = updated.status === "archived" ? "spiel.archive" : "spiel.update";
  await logActivity({
    userId: access.session.user.id,
    action,
    entityType: "spiel",
    entityId: updated.id,
    metadata: { name: updated.title },
  });

  if (isContentUpdate) {
    snapshotSpiel({
      spielId: updated.id,
      savedByUserId: access.session.user.id,
      title: updated.title,
      contentHtml: updated.contentHtml,
      contentJson: updated.contentJson,
      contentPlain: updated.contentPlain,
      categoryId: updated.categoryId,
    }).catch(() => {});
  }

  return NextResponse.json(updated);
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const access = await getAccessContextOrNull();

  if (!access) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const spiel = await getSpielForAccess(id, access.companyId);

  if (!spiel) {
    return NextResponse.json({ error: "Spiel not found" }, { status: 404 });
  }

  if (!access.departmentIds.includes(spiel.departmentId)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  if (spiel.status !== "archived") {
    return NextResponse.json(
      { error: "Archive the spiel before deleting it permanently." },
      { status: 400 },
    );
  }

  if (!canManageDepartment(access.session.user.role as UserRole)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  await db.delete(spiels).where(eq(spiels.id, id));

  await logActivity({
    userId: access.session.user.id,
    action: "spiel.delete",
    entityType: "spiel",
    entityId: id,
    metadata: { name: spiel.title },
  });

  return new NextResponse(null, { status: 204 });
}
