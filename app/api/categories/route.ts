import { NextRequest, NextResponse } from "next/server";
import { getAccessContextOrNull } from "@/lib/auth/session";
import { canManageDepartment } from "@/lib/permissions";
import { createCategorySchema } from "@/lib/validations/category";
import { db } from "@/lib/drizzle/db";
import { categories } from "@/lib/drizzle/schema";
import { eq, and, asc } from "drizzle-orm";
import { logActivity } from "@/lib/audit/log-activity";
import type { UserRole } from "@/types";
import { slugify } from "@/lib/utils/index";

async function buildUniqueCategorySlug(companyId: string, name: string) {
  const baseSlug = slugify(name) || "category";
  let slug = baseSlug;
  let counter = 2;

  while (true) {
    const [existing] = await db
      .select({ id: categories.id })
      .from(categories)
      .where(and(eq(categories.companyId, companyId), eq(categories.slug, slug)))
      .limit(1);

    if (!existing) return slug;
    slug = `${baseSlug}-${counter}`;
    counter += 1;
  }
}

export async function POST(req: NextRequest) {
  const access = await getAccessContextOrNull();

  if (!access) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!canManageDepartment(access.session.user.role as UserRole)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await req.json().catch(() => ({}));
  const parsed = createCategorySchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.flatten().fieldErrors },
      { status: 400 },
    );
  }

  const { name, description } = parsed.data;
  const slug = await buildUniqueCategorySlug(access.companyId, name);

  const [category] = await db
    .insert(categories)
    .values({ companyId: access.companyId, name, slug, description })
    .returning({ id: categories.id, name: categories.name, description: categories.description });

  await logActivity({
    userId: access.session.user.id,
    action: "category.create",
    entityType: "category",
    entityId: category.id,
    metadata: { name: category.name },
  });

  return NextResponse.json(category, { status: 201 });
}
