import { NextRequest, NextResponse } from "next/server";
import { getAccessContextOrNull } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma/client";
import { slugify } from "@/lib/utils/index";

type UpdateCategoryBody = {
  name?: string;
  description?: string | null;
};

async function getCategoryForAccess(id: string, companyId: string) {
  return prisma.category.findFirst({
    where: { id, companyId },
    select: {
      id: true,
      companyId: true,
      name: true,
      slug: true,
      description: true,
    },
  });
}

async function buildUniqueCategorySlug(
  companyId: string,
  name: string,
  excludeId?: string,
) {
  const baseSlug = slugify(name) || "category";
  let slug = baseSlug;
  let counter = 2;

  while (true) {
    const existing = await prisma.category.findFirst({
      where: {
        companyId,
        slug,
        ...(excludeId ? { NOT: { id: excludeId } } : {}),
      },
      select: { id: true },
    });

    if (!existing) {
      return slug;
    }

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

  const { id } = await params;
  const category = await getCategoryForAccess(id, access.companyId);

  if (!category) {
    return NextResponse.json({ error: "Category not found" }, { status: 404 });
  }

  const body = (await req.json()) as UpdateCategoryBody;
  const name = body.name?.trim();
  const description = body.description === undefined ? undefined : body.description?.trim() || null;

  if (!name && description === undefined) {
    return NextResponse.json({ error: "No updates provided" }, { status: 400 });
  }

  const slug = name
    ? await buildUniqueCategorySlug(access.companyId, name, id)
    : category.slug;

  const updated = await prisma.category.update({
    where: { id },
    data: {
      ...(name ? { name, slug } : {}),
      ...(description !== undefined ? { description } : {}),
    },
    select: {
      id: true,
      name: true,
      description: true,
    },
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

  const { id } = await params;
  const category = await getCategoryForAccess(id, access.companyId);

  if (!category) {
    return NextResponse.json({ error: "Category not found" }, { status: 404 });
  }

  await prisma.$transaction([
    prisma.spiel.updateMany({
      where: {
        companyId: access.companyId,
        categoryId: id,
      },
      data: {
        categoryId: null,
      },
    }),
    prisma.category.delete({
      where: { id },
    }),
  ]);

  return new NextResponse(null, { status: 204 });
}
