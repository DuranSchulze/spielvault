import { NextRequest, NextResponse } from "next/server";
import { hashPassword } from "better-auth/crypto";
import { getAccessContextOrNull } from "@/lib/auth/session";
import { canManageDepartment } from "@/lib/permissions";
import { createUserSchema } from "@/lib/validations/user";
import { db } from "@/lib/drizzle/db";
import { users, accounts, departments, userDepartments } from "@/lib/drizzle/schema";
import { eq, and, asc, inArray } from "drizzle-orm";
import { logActivity } from "@/lib/audit/log-activity";
import type { UserRole } from "@/types";

export async function GET() {
  const access = await getAccessContextOrNull();

  if (!access) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userRows = await db
    .select({ id: users.id, name: users.name, email: users.email, role: users.role, isActive: users.isActive, createdAt: users.createdAt })
    .from(users)
    .where(eq(users.companyId, access.companyId))
    .orderBy(asc(users.name));

  const userIds = userRows.map((u) => u.id);
  const memberships = userIds.length > 0
    ? await db
        .select({ userId: userDepartments.userId, department: { id: departments.id, name: departments.name } })
        .from(userDepartments)
        .innerJoin(departments, eq(userDepartments.departmentId, departments.id))
        .where(inArray(userDepartments.userId, userIds))
    : [];

  const memberMap = new Map<string, { department: { id: string; name: string } }[]>();
  for (const m of memberships) {
    const list = memberMap.get(m.userId) ?? [];
    list.push({ department: m.department });
    memberMap.set(m.userId, list);
  }

  const result = userRows.map((u) => ({ ...u, departments: memberMap.get(u.id) ?? [] }));
  return NextResponse.json(result);
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
  const parsed = createUserSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.flatten().fieldErrors },
      { status: 400 },
    );
  }

  const { name, email, password, role, departmentIds } = parsed.data;

  const [existing] = await db
    .select({ id: users.id })
    .from(users)
    .where(eq(users.email, email))
    .limit(1);

  if (existing) {
    return NextResponse.json(
      { error: "A user with this email already exists" },
      { status: 409 },
    );
  }

  if (departmentIds && departmentIds.length > 0) {
    const validDepartments = await db
      .select({ id: departments.id })
      .from(departments)
      .where(and(inArray(departments.id, departmentIds), eq(departments.companyId, access.companyId)));

    if (validDepartments.length !== departmentIds.length) {
      return NextResponse.json({ error: "One or more departments are invalid" }, { status: 400 });
    }
  }

  const passwordHash = await hashPassword(password);

  const [user] = await db
    .insert(users)
    .values({ name, email, emailVerified: true, role, isActive: true, companyId: access.companyId })
    .returning();

  await db.insert(accounts).values({
    accountId: user.id,
    providerId: "credential",
    userId: user.id,
    password: passwordHash,
  });

  if (departmentIds && departmentIds.length > 0) {
    await db.insert(userDepartments).values(
      departmentIds.map((departmentId) => ({ userId: user.id, departmentId })),
    );
  }

  await logActivity({
    userId: access.session.user.id,
    action: "user.create",
    entityType: "user",
    entityId: user.id,
    metadata: { name: user.name, email: user.email },
  });

  return NextResponse.json(
    { id: user.id, name: user.name, email: user.email, role: user.role, isActive: user.isActive },
    { status: 201 },
  );
}
