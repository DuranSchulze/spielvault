import { NextRequest, NextResponse } from "next/server";
import { getAccessContextOrNull } from "@/lib/auth/session";
import { canManageCompany } from "@/lib/permissions";
import { logActivity } from "@/lib/audit/log-activity";
import { db } from "@/lib/drizzle/db";
import { companies } from "@/lib/drizzle/schema";
import { eq } from "drizzle-orm";
import type { UserRole } from "@/types";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const access = await getAccessContextOrNull();

  if (!access) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!canManageCompany(access.session.user.role as UserRole)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;

  if (id !== access.companyId) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await req.json().catch(() => ({})) as { name?: unknown };
  const name = typeof body.name === "string" ? body.name.trim() : "";

  if (name.length < 2) {
    return NextResponse.json(
      { error: "Company name must be at least 2 characters." },
      { status: 400 },
    );
  }

  const [updated] = await db
    .update(companies)
    .set({ name, updatedAt: new Date() })
    .where(eq(companies.id, id))
    .returning({ id: companies.id, name: companies.name, slug: companies.slug });

  await logActivity({
    userId: access.session.user.id,
    action: "company.update",
    entityType: "company",
    entityId: updated.id,
    metadata: { name: updated.name },
  });

  return NextResponse.json(updated);
}
