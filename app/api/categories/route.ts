import { NextRequest, NextResponse } from "next/server";
import { getAccessContextOrNull } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma/client";
import { slugify } from "@/lib/utils/index";

type CreateCategoryBody = {
  name?: string;
  description?: string | null;
};

async function buildUniqueCategorySlug(companyId: string, name: string) {
  const baseSlug = slugify(name) || "category";
  let slug = baseSlug;
  let counter = 2;

  while (true) {
    const existing = await prisma.category.findFirst({
      where: {
        companyId,
        slug,
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

export async function POST(req: NextRequest) {
  const access = await getAccessContextOrNull();

  if (!access) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = (await req.json()) as CreateCategoryBody;
  const name = body.name?.trim();
  const description = body.description?.trim() || null;

  if (!name) {
    return NextResponse.json({ error: "Category name is required" }, { status: 400 });
  }

  const slug = await buildUniqueCategorySlug(access.companyId, name);

  const category = await prisma.category.create({
    data: {
      companyId: access.companyId,
      name,
      slug,
      description,
    },
    select: {
      id: true,
      name: true,
      description: true,
    },
  });

  return NextResponse.json(category, { status: 201 });
}
