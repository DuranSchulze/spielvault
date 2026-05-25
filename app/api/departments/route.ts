import { NextRequest, NextResponse } from "next/server";
import { canManageDepartment } from "@/lib/permissions";
import { getAccessContextOrNull } from "@/lib/auth/session";
import { createDepartmentSchema } from "@/lib/validations/department";
import { db } from "@/lib/drizzle/db";
import { departments, userDepartments } from "@/lib/drizzle/schema";
import { eq, and } from "drizzle-orm";
import { logActivity } from "@/lib/audit/log-activity";
import type { UserRole } from "@/types";
import { slugify } from "@/lib/utils/index";

export async function POST(req: NextRequest) {
  const access = await getAccessContextOrNull();

  if (!access) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!canManageDepartment(access.session.user.role as UserRole)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await req.json().catch(() => ({}));
  const parsed = createDepartmentSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.flatten().fieldErrors },
      { status: 400 },
    );
  }

  const { name, description } = parsed.data;
  const slug = slugify(name);

  const [existing] = await db
    .select({ id: departments.id })
    .from(departments)
    .where(and(eq(departments.companyId, access.companyId), eq(departments.slug, slug)))
    .limit(1);

  if (existing) {
    return NextResponse.json(
      { error: "A department with this name already exists" },
      { status: 409 },
    );
  }

  const [department] = await db
    .insert(departments)
    .values({ companyId: access.companyId, name, slug, description })
    .returning();

  await db
    .insert(userDepartments)
    .values({ userId: access.session.user.id, departmentId: department.id })
    .onConflictDoNothing();

  await logActivity({
    userId: access.session.user.id,
    action: "department.create",
    entityType: "department",
    entityId: department.id,
    metadata: { name: department.name },
  });

  return NextResponse.json(department, { status: 201 });
}
