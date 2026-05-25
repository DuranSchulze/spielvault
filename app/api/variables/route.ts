import { NextRequest, NextResponse } from "next/server";
import { getAccessContextOrNull } from "@/lib/auth/session";
import { canManageDepartment } from "@/lib/permissions";
import { createVariableSchema } from "@/lib/validations/variable";
import { db } from "@/lib/drizzle/db";
import { spielVariables } from "@/lib/drizzle/schema";
import { eq, asc } from "drizzle-orm";
import { logActivity } from "@/lib/audit/log-activity";
import type { UserRole } from "@/types";

export async function GET() {
  const access = await getAccessContextOrNull();

  if (!access) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const variables = await db
    .select()
    .from(spielVariables)
    .where(eq(spielVariables.companyId, access.companyId))
    .orderBy(asc(spielVariables.key));

  return NextResponse.json(variables);
}

export async function POST(req: NextRequest) {
  const access = await getAccessContextOrNull();

  if (!access) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!canManageDepartment(access.session.user.role as UserRole)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await req.json().catch(() => ({}));
  const parsed = createVariableSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.flatten().fieldErrors },
      { status: 400 },
    );
  }

  const { key, value } = parsed.data;

  const [variable] = await db
    .insert(spielVariables)
    .values({ companyId: access.companyId, key, value })
    .returning();

  await logActivity({
    userId: access.session.user.id,
    action: "variable.create",
    entityType: "variable",
    entityId: variable.id,
    metadata: { name: variable.key },
  });

  return NextResponse.json(variable, { status: 201 });
}
