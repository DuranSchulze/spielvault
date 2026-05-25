import { NextRequest, NextResponse } from "next/server";
import { getAccessContextOrNull } from "@/lib/auth/session";
import { canManageDepartment } from "@/lib/permissions";
import { updateCategorySchema } from "@/lib/validations/category";
import { db } from "@/lib/drizzle/db";
import { categories, spiels } from "@/lib/drizzle/schema";
import { eq, and } from "drizzle-orm";
import { logActivity } from "@/lib/audit/log-activity";
import type { UserRole } from "@/types";
import { slugify } from "@/lib/utils/index";

async function getCategoryForAccess(id: string, companyId: string) {
  const [row] = await db
    .select({ id: categories.id, companyId: categories.companyId, name: categories.name, slug: categories.slug, description: categories.description })
    .from(categories)
    .where(and(eq(categories.id, id), eq(categories.companyId, companyId)))
    .limit(1);
  return row ?? null;
}

async function buildUniqueCategorySlug(companyId: string, name: string, excludeId?: string) {
  const baseSlug = slugify(name) || "category";
  let slug = baseSlug;
  let counter = 2;

  while (true) {
    const rows = await db
      .select({ id: categories.id })
      .from(categories)
      .where(and(eq(categories.companyId, companyId), eq(categories.slug, slug)))
      .limit(1);

    const existing = rows[0];
    if (!existing || existing.id === excludeId) return slug;
    slug = `${baseSlug}-${counter}`;
    counter += 1;
  }
}

export async function PATCH(
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
  const category = await getCategoryForAccess(id, access.companyId);

  if (!category) {
    return NextResponse.json({ error: "Category not found" }, { status: 404 });
  }

  const body = await req.json().catch(() => ({}));
  const parsed = updateCategorySchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.flatten().fieldErrors },
      { status: 400 },
    );
  }

  const { name, description } = parsed.data;

  if (!name && description === undefined) {
    return NextResponse.json({ error: "No updates provided" }, { status: 400 });
  }

  const slug = name ? await buildUniqueCategorySlug(access.companyId, name, id) : category.slug;

  const [updated] = await db
    .update(categories)
    .set({
      ...(name ? { name, slug } : {}),
      ...(description !== undefined ? { description } : {}),
      updatedAt: new Date(),
    })
    .where(eq(categories.id, id))
    .returning({ id: categories.id, name: categories.name, description: categories.description });

  await logActivity({
    userId: access.session.user.id,
    action: "category.update",
    entityType: "category",
    entityId: updated.id,
    metadata: { name: updated.name },
  });

  return NextResponse.json(updated);
}

export async function DELETE(
  _req: NextRequest,
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
  const category = await getCategoryForAccess(id, access.companyId);

  if (!category) {
    return NextResponse.json({ error: "Category not found" }, { status: 404 });
  }

  await db.transaction(async (tx) => {
    await tx
      .update(spiels)
      .set({ categoryId: null, updatedAt: new Date() })
      .where(and(eq(spiels.companyId, access.companyId), eq(spiels.categoryId, id)));

    await tx.delete(categories).where(eq(categories.id, id));
  });

  await logActivity({
    userId: access.session.user.id,
    action: "category.delete",
    entityType: "category",
    entityId: id,
    metadata: { name: category.name },
  });

  return new NextResponse(null, { status: 204 });
}
