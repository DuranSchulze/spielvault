import { NextRequest, NextResponse } from "next/server";
import { hashPassword } from "better-auth/crypto";
import { getAccessContextOrNull } from "@/lib/auth/session";
import { canManageDepartment } from "@/lib/permissions";
import { updateUserSchema } from "@/lib/validations/user";
import { db } from "@/lib/drizzle/db";
import { users, accounts, departments, userDepartments } from "@/lib/drizzle/schema";
import { eq, and, inArray } from "drizzle-orm";
import { logActivity } from "@/lib/audit/log-activity";
import type { UserRole } from "@/types";

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

  const [user] = await db
    .select({ id: users.id })
    .from(users)
    .where(and(eq(users.id, id), eq(users.companyId, access.companyId)))
    .limit(1);

  if (!user) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  const body = await req.json().catch(() => ({}));
  const parsed = updateUserSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.flatten().fieldErrors },
      { status: 400 },
    );
  }

  const { name, role, isActive, password, departmentIds } = parsed.data;

  const data: Record<string, unknown> = { updatedAt: new Date() };
  if (name !== undefined) data.name = name;
  if (role !== undefined) data.role = role;
  if (isActive !== undefined) data.isActive = isActive;

  if (Object.keys(data).length > 1) {
    await db.update(users).set(data as Partial<typeof users.$inferInsert>).where(eq(users.id, id));
  }

  if (password) {
    const passwordHash = await hashPassword(password);
    await db
      .update(accounts)
      .set({ password: passwordHash, updatedAt: new Date() })
      .where(and(eq(accounts.userId, id), eq(accounts.providerId, "credential")));
  }

  if (departmentIds !== undefined) {
    await db.delete(userDepartments).where(eq(userDepartments.userId, id));

    if (departmentIds.length > 0) {
      const validDepartments = await db
        .select({ id: departments.id })
        .from(departments)
        .where(and(inArray(departments.id, departmentIds), eq(departments.companyId, access.companyId)));

      if (validDepartments.length !== departmentIds.length) {
        return NextResponse.json({ error: "One or more departments are invalid" }, { status: 400 });
      }

      await db.insert(userDepartments).values(
        departmentIds.map((departmentId) => ({ userId: id, departmentId })),
      );
    }
  }

  await logActivity({
    userId: access.session.user.id,
    action: "user.update",
    entityType: "user",
    entityId: id,
  });

  return NextResponse.json({ id, success: true });
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

  const [user] = await db
    .select({ id: users.id })
    .from(users)
    .where(and(eq(users.id, id), eq(users.companyId, access.companyId)))
    .limit(1);

  if (!user) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  const [deactivated] = await db
    .update(users)
    .set({ isActive: false, updatedAt: new Date() })
    .where(eq(users.id, id))
    .returning({ name: users.name });

  await logActivity({
    userId: access.session.user.id,
    action: "user.deactivate",
    entityType: "user",
    entityId: id,
    metadata: { name: deactivated.name },
  });

  return NextResponse.json({ success: true });
}
