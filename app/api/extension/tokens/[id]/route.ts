import { NextRequest, NextResponse } from "next/server";
import { getAccessContextOrNull } from "@/lib/auth/session";
import { db } from "@/lib/drizzle/db";
import { apiTokens } from "@/lib/drizzle/schema";
import { eq } from "drizzle-orm";

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const access = await getAccessContextOrNull();
  if (!access) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  const [existing] = await db
    .select({ userId: apiTokens.userId })
    .from(apiTokens)
    .where(eq(apiTokens.id, id))
    .limit(1);

  if (!existing || existing.userId !== access.session.user.id) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  await db.delete(apiTokens).where(eq(apiTokens.id, id));

  return new NextResponse(null, { status: 204 });
}
