import { NextRequest, NextResponse } from "next/server";
import { getAccessContextOrNull } from "@/lib/auth/session";
import { canManageDepartment } from "@/lib/permissions";
import { updateVariableSchema } from "@/lib/validations/variable";
import { db } from "@/lib/drizzle/db";
import { spielVariables } from "@/lib/drizzle/schema";
import { eq, and } from "drizzle-orm";
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
  const body = await req.json().catch(() => ({}));
  const parsed = updateVariableSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.flatten().fieldErrors },
      { status: 400 },
    );
  }

  const [existing] = await db
    .select()
    .from(spielVariables)
    .where(and(eq(spielVariables.id, id), eq(spielVariables.companyId, access.companyId)))
    .limit(1);

  if (!existing) {
    return NextResponse.json({ error: "Variable not found" }, { status: 404 });
  }

  const { key, value } = parsed.data;

  const [variable] = await db
    .update(spielVariables)
    .set({
      ...(key !== undefined && { key }),
      ...(value !== undefined && { value }),
      updatedAt: new Date(),
    })
    .where(eq(spielVariables.id, id))
    .returning();

  await logActivity({
    userId: access.session.user.id,
    action: "variable.update",
    entityType: "variable",
    entityId: variable.id,
    metadata: { name: variable.key },
  });

  return NextResponse.json(variable);
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

  const [existing] = await db
    .select()
    .from(spielVariables)
    .where(and(eq(spielVariables.id, id), eq(spielVariables.companyId, access.companyId)))
    .limit(1);

  if (!existing) {
    return NextResponse.json({ error: "Variable not found" }, { status: 404 });
  }

  await db.delete(spielVariables).where(eq(spielVariables.id, id));

  await logActivity({
    userId: access.session.user.id,
    action: "variable.delete",
    entityType: "variable",
    entityId: id,
    metadata: { name: existing.key },
  });

  return new NextResponse(null, { status: 204 });
}
