import { NextRequest, NextResponse } from "next/server";
import { getAccessContextOrNull } from "@/lib/auth/session";
import { canManageDepartment } from "@/lib/permissions";
import { reviewSpielSchema } from "@/lib/validations/spiel";
import { db } from "@/lib/drizzle/db";
import { spiels, spielApprovals } from "@/lib/drizzle/schema";
import { eq, and } from "drizzle-orm";
import { logActivity } from "@/lib/audit/log-activity";
import type { UserRole } from "@/types";

export async function POST(
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

  const [spiel] = await db
    .select({ id: spiels.id, title: spiels.title, status: spiels.status })
    .from(spiels)
    .where(and(eq(spiels.id, id), eq(spiels.companyId, access.companyId)))
    .limit(1);

  if (!spiel) {
    return NextResponse.json({ error: "Spiel not found" }, { status: 404 });
  }

  if (spiel.status !== "pending_review") {
    return NextResponse.json(
      { error: "Only pending_review spiels can be reviewed." },
      { status: 400 },
    );
  }

  const body = await req.json().catch(() => ({}));
  const parsed = reviewSpielSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.flatten().fieldErrors },
      { status: 400 },
    );
  }

  const { action, comment } = parsed.data;
  const newStatus = action === "approve" ? "active" : "draft";

  const [updated] = await db.transaction(async (tx) => {
    const result = await tx
      .update(spiels)
      .set({ status: newStatus, updatedAt: new Date() })
      .where(eq(spiels.id, id))
      .returning({ id: spiels.id, status: spiels.status });

    await tx.insert(spielApprovals).values({
      spielId: id,
      reviewerId: access.session.user.id,
      action: action === "approve" ? "approved" : "rejected",
      comment: comment ?? null,
    });

    return result;
  });

  await logActivity({
    userId: access.session.user.id,
    action: action === "approve" ? "spiel.approve" : "spiel.reject",
    entityType: "spiel",
    entityId: id,
    metadata: { name: spiel.title },
  });

  return NextResponse.json(updated);
}
