import { NextRequest, NextResponse } from "next/server";
import { getAccessContextOrNull } from "@/lib/auth/session";
import { getBearerAccessContext } from "@/lib/auth/bearer-auth";
import { canManageDepartment } from "@/lib/permissions";
import type { UserRole } from "@/types";
import { createSpielSchema } from "@/lib/validations/spiel";
import { db } from "@/lib/drizzle/db";
import { spiels, departments, categories } from "@/lib/drizzle/schema";
import { eq, and, or, ilike, desc, inArray } from "drizzle-orm";
import { logActivity } from "@/lib/audit/log-activity";
import { snapshotSpiel } from "@/lib/versioning/snapshot-spiel";

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
  "Access-Control-Allow-Headers": "Authorization, Content-Type",
};

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: CORS_HEADERS });
}

export async function GET(req: NextRequest) {
  const access =
    (await getBearerAccessContext(req)) ?? (await getAccessContextOrNull());

  if (!access) {
    return NextResponse.json(
      { error: "Unauthorized" },
      { status: 401, headers: CORS_HEADERS },
    );
  }

  const { searchParams } = req.nextUrl;
  const q = searchParams.get("q")?.trim() ?? "";
  const department = searchParams.get("department") ?? "";
  const take = Math.min(Number(searchParams.get("take") ?? "20"), 50);

  const where = and(
    eq(spiels.companyId, access.companyId),
    eq(spiels.status, "active"),
    department ? eq(spiels.departmentId, department) : undefined,
    q
      ? or(
          ilike(spiels.title, `%${q}%`),
          ilike(spiels.contentPlain, `%${q}%`),
        )
      : undefined,
  );

  const rows = await db
    .select({
      id: spiels.id,
      title: spiels.title,
      contentPlain: spiels.contentPlain,
      contentHtml: spiels.contentHtml,
      department: { name: departments.name },
      category: { name: categories.name },
    })
    .from(spiels)
    .leftJoin(departments, eq(spiels.departmentId, departments.id))
    .leftJoin(categories, eq(spiels.categoryId, categories.id))
    .where(where)
    .orderBy(desc(spiels.updatedAt))
    .limit(take);

  return NextResponse.json(rows, { headers: CORS_HEADERS });
}

export async function POST(req: NextRequest) {
  const access = await getAccessContextOrNull();

  if (!access) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json().catch(() => ({}));
  const parsed = createSpielSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.flatten().fieldErrors },
      { status: 400 },
    );
  }

  const { title, departmentId, categoryId, contentHtml, contentJson, contentPlain } =
    parsed.data;

  if (!access.departmentIds.includes(departmentId)) {
    return NextResponse.json({ error: "Department not allowed" }, { status: 403 });
  }

  if (categoryId) {
    const [cat] = await db
      .select({ id: categories.id })
      .from(categories)
      .where(and(eq(categories.id, categoryId), eq(categories.companyId, access.companyId)))
      .limit(1);

    if (!cat) {
      return NextResponse.json({ error: "Category not found" }, { status: 404 });
    }
  }

  const isAdmin = canManageDepartment(access.session.user.role as UserRole);
  const initialStatus = isAdmin ? "active" : "draft";

  const [spiel] = await db
    .insert(spiels)
    .values({
      companyId: access.companyId,
      departmentId,
      categoryId: categoryId ?? null,
      createdByUserId: access.session.user.id,
      title,
      contentHtml: contentHtml ?? null,
      contentJson: contentJson ?? "",
      contentPlain: contentPlain ?? "",
      status: initialStatus,
    })
    .returning();

  await logActivity({
    userId: access.session.user.id,
    action: "spiel.create",
    entityType: "spiel",
    entityId: spiel.id,
    metadata: { name: spiel.title },
  });

  snapshotSpiel({
    spielId: spiel.id,
    savedByUserId: access.session.user.id,
    title: spiel.title,
    contentHtml: spiel.contentHtml,
    contentJson: spiel.contentJson,
    contentPlain: spiel.contentPlain,
    categoryId: spiel.categoryId,
  }).catch(() => {});

  return NextResponse.json(spiel, { status: 201 });
}
