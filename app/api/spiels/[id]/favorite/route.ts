import { NextRequest, NextResponse } from "next/server";
import { getAccessContextOrNull } from "@/lib/auth/session";
import { db } from "@/lib/drizzle/db";
import { spiels, userSpielFavorites } from "@/lib/drizzle/schema";
import { eq, and } from "drizzle-orm";

async function resolveSpiel(id: string, companyId: string, departmentIds: string[]) {
  const [spiel] = await db
    .select({ id: spiels.id, departmentId: spiels.departmentId })
    .from(spiels)
    .where(and(eq(spiels.id, id), eq(spiels.companyId, companyId), eq(spiels.status, "active")))
    .limit(1);
  if (!spiel) return null;
  if (!departmentIds.includes(spiel.departmentId)) return null;
  return spiel;
}

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const access = await getAccessContextOrNull();
  if (!access) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const spiel = await resolveSpiel(id, access.companyId, access.departmentIds);
  if (!spiel) {
    return NextResponse.json({ error: "Spiel not found" }, { status: 404 });
  }

  await db
    .insert(userSpielFavorites)
    .values({ userId: access.session.user.id, spielId: id })
    .onConflictDoNothing();

  return NextResponse.json({ favorited: true });
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const access = await getAccessContextOrNull();
  if (!access) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const spiel = await resolveSpiel(id, access.companyId, access.departmentIds);
  if (!spiel) {
    return NextResponse.json({ error: "Spiel not found" }, { status: 404 });
  }

  await db
    .delete(userSpielFavorites)
    .where(and(eq(userSpielFavorites.userId, access.session.user.id), eq(userSpielFavorites.spielId, id)));

  return NextResponse.json({ favorited: false });
}
