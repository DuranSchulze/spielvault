import { NextRequest, NextResponse } from "next/server";
import { getAccessContextOrNull } from "@/lib/auth/session";
import { db } from "@/lib/drizzle/db";
import { spiels, auditLogs } from "@/lib/drizzle/schema";
import { eq, and } from "drizzle-orm";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const access = await getAccessContextOrNull();
  if (!access) {
    return new NextResponse(null, { status: 204 });
  }

  const { id } = await params;

  const body = await req.json().catch(() => ({})) as { action?: string };
  const action = body.action;
  if (action !== "copy") {
    return new NextResponse(null, { status: 204 });
  }

  const [spiel] = await db
    .select({ id: spiels.id })
    .from(spiels)
    .where(and(eq(spiels.id, id), eq(spiels.companyId, access.companyId)))
    .limit(1);

  if (!spiel) {
    return new NextResponse(null, { status: 204 });
  }

  await db.insert(auditLogs).values({
    userId: access.session.user.id,
    action: "copy",
    entityType: "spiel",
    entityId: id,
  });

  return new NextResponse(null, { status: 204 });
}
