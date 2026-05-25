import { NextRequest, NextResponse } from "next/server";
import { getAccessContextOrNull } from "@/lib/auth/session";
import { db } from "@/lib/drizzle/db";
import { spiels, spielVersions } from "@/lib/drizzle/schema";
import { eq, and } from "drizzle-orm";
import { snapshotSpiel } from "@/lib/versioning/snapshot-spiel";
import { logActivity } from "@/lib/audit/log-activity";

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string; versionId: string }> },
) {
  const access = await getAccessContextOrNull();
  if (!access) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id, versionId } = await params;

  const [spiel] = await db
    .select({ departmentId: spiels.departmentId, status: spiels.status })
    .from(spiels)
    .where(and(eq(spiels.id, id), eq(spiels.companyId, access.companyId)))
    .limit(1);

  if (!spiel) {
    return NextResponse.json({ error: "Spiel not found" }, { status: 404 });
  }

  if (!access.departmentIds.includes(spiel.departmentId)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  if (spiel.status === "archived") {
    return NextResponse.json(
      { error: "Cannot restore versions of an archived spiel." },
      { status: 400 },
    );
  }

  const [version] = await db
    .select()
    .from(spielVersions)
    .where(and(eq(spielVersions.id, versionId), eq(spielVersions.spielId, id)))
    .limit(1);

  if (!version) {
    return NextResponse.json({ error: "Version not found" }, { status: 404 });
  }

  const [restored] = await db
    .update(spiels)
    .set({
      title: version.title,
      contentHtml: version.contentHtml,
      contentJson: version.contentJson,
      contentPlain: version.contentPlain,
      categoryId: version.categoryId,
      updatedAt: new Date(),
    })
    .where(eq(spiels.id, id))
    .returning({
      id: spiels.id,
      title: spiels.title,
      contentHtml: spiels.contentHtml,
      contentJson: spiels.contentJson,
      contentPlain: spiels.contentPlain,
      categoryId: spiels.categoryId,
    });

  await logActivity({
    userId: access.session.user.id,
    action: "spiel.restore",
    entityType: "spiel",
    entityId: id,
    metadata: { name: restored.title },
  });

  snapshotSpiel({
    spielId: id,
    savedByUserId: access.session.user.id,
    title: restored.title,
    contentHtml: restored.contentHtml,
    contentJson: restored.contentJson,
    contentPlain: restored.contentPlain,
    categoryId: restored.categoryId,
  }).catch(() => {});

  return NextResponse.json(restored);
}
