import { NextRequest, NextResponse } from "next/server";
import { getAccessContextOrNull } from "@/lib/auth/session";
import { db } from "@/lib/drizzle/db";
import { spiels, spielVersions, users } from "@/lib/drizzle/schema";
import { eq, and, desc } from "drizzle-orm";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const access = await getAccessContextOrNull();
  if (!access) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  const [spiel] = await db
    .select({ departmentId: spiels.departmentId })
    .from(spiels)
    .where(and(eq(spiels.id, id), eq(spiels.companyId, access.companyId)))
    .limit(1);

  if (!spiel) {
    return NextResponse.json({ error: "Spiel not found" }, { status: 404 });
  }

  if (!access.departmentIds.includes(spiel.departmentId)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const versions = await db
    .select({
      id: spielVersions.id,
      title: spielVersions.title,
      categoryId: spielVersions.categoryId,
      createdAt: spielVersions.createdAt,
      savedBy: { name: users.name },
    })
    .from(spielVersions)
    .leftJoin(users, eq(spielVersions.savedByUserId, users.id))
    .where(eq(spielVersions.spielId, id))
    .orderBy(desc(spielVersions.createdAt));

  return NextResponse.json(versions);
}
