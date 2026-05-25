import { NextRequest, NextResponse } from "next/server";
import { canManageDepartment } from "@/lib/permissions";
import { getAccessContextOrNull } from "@/lib/auth/session";
import { updateDepartmentSchema } from "@/lib/validations/department";
import { db } from "@/lib/drizzle/db";
import { departments, spiels } from "@/lib/drizzle/schema";
import { eq, and, count } from "drizzle-orm";
import { logActivity } from "@/lib/audit/log-activity";
import type { UserRole } from "@/types";
import { slugify } from "@/lib/utils/index";

async function getDepartmentForAccess(id: string, companyId: string) {
  const [row] = await db
    .select({ id: departments.id, companyId: departments.companyId, name: departments.name, slug: departments.slug, description: departments.description })
    .from(departments)
    .where(and(eq(departments.id, id), eq(departments.companyId, companyId)))
    .limit(1);
  return row ?? null;
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const access = await getAccessContextOrNull();

  if (!access) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!canManageDepartment(access.session.user.role as UserRole)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;
  const department = await getDepartmentForAccess(id, access.companyId);

  if (!department) {
    return NextResponse.json({ error: "Department not found" }, { status: 404 });
  }

  const body = await req.json().catch(() => ({}));
  const parsed = updateDepartmentSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.flatten().fieldErrors },
      { status: 400 },
    );
  }

  const { name, description } = parsed.data;

  if (!name && description === undefined) {
    return NextResponse.json({ error: "No updates provided" }, { status: 400 });
  }

  const slug = name ? slugify(name) : department.slug;

  if (name) {
    const [existing] = await db
      .select({ id: departments.id })
      .from(departments)
      .where(and(eq(departments.companyId, access.companyId), eq(departments.slug, slug)))
      .limit(1);

    if (existing && existing.id !== id) {
      return NextResponse.json(
        { error: "A department with this name already exists" },
        { status: 409 },
      );
    }
  }

  const [updated] = await db
    .update(departments)
    .set({
      ...(name ? { name, slug } : {}),
      ...(description !== undefined ? { description } : {}),
      updatedAt: new Date(),
    })
    .where(eq(departments.id, id))
    .returning();

  await logActivity({
    userId: access.session.user.id,
    action: "department.update",
    entityType: "department",
    entityId: updated.id,
    metadata: { name: updated.name },
  });

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

  if (!canManageDepartment(access.session.user.role as UserRole)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;
  const department = await getDepartmentForAccess(id, access.companyId);

  if (!department) {
    return NextResponse.json({ error: "Department not found" }, { status: 404 });
  }

  const [countRow] = await db
    .select({ count: count() })
    .from(spiels)
    .where(eq(spiels.departmentId, id));

  if (Number(countRow.count) > 0) {
    return NextResponse.json(
      { error: "Cannot delete a department that still has spiels." },
      { status: 400 },
    );
  }

  await db.delete(departments).where(eq(departments.id, id));

  await logActivity({
    userId: access.session.user.id,
    action: "department.delete",
    entityType: "department",
    entityId: id,
    metadata: { name: department.name },
  });

  return new NextResponse(null, { status: 204 });
}
