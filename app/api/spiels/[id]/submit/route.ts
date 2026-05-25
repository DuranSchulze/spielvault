import { NextRequest, NextResponse } from "next/server";
import { getAccessContextOrNull } from "@/lib/auth/session";
import { db } from "@/lib/drizzle/db";
import { spiels } from "@/lib/drizzle/schema";
import { eq, and } from "drizzle-orm";
import { logActivity } from "@/lib/audit/log-activity";

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const access = await getAccessContextOrNull();
  if (!access) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  const [spiel] = await db
    .select({ id: spiels.id, title: spiels.title, status: spiels.status, departmentId: spiels.departmentId })
    .from(spiels)
    .where(and(eq(spiels.id, id), eq(spiels.companyId, access.companyId)))
    .limit(1);

  if (!spiel) {
    return NextResponse.json({ error: "Spiel not found" }, { status: 404 });
  }

  if (!access.departmentIds.includes(spiel.departmentId)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  if (spiel.status !== "draft") {
    return NextResponse.json(
      { error: "Only draft spiels can be submitted for review." },
      { status: 400 },
    );
  }

  const [updated] = await db
    .update(spiels)
    .set({ status: "pending_review", updatedAt: new Date() })
    .where(eq(spiels.id, id))
    .returning({ id: spiels.id, status: spiels.status });

  await logActivity({
    userId: access.session.user.id,
    action: "spiel.submit",
    entityType: "spiel",
    entityId: id,
    metadata: { name: spiel.title },
  });

  return NextResponse.json(updated);
}
