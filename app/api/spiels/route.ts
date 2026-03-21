import { NextRequest, NextResponse } from "next/server";
import { getAccessContextOrNull } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma/client";

type CreateSpielBody = {
  title?: string;
  departmentId?: string;
  categoryId?: string | null;
  contentHtml?: string;
  contentJson?: string;
  contentPlain?: string;
};

export async function POST(req: NextRequest) {
  const access = await getAccessContextOrNull();

  if (!access) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = (await req.json()) as CreateSpielBody;
  const title = body.title?.trim();
  const departmentId = body.departmentId?.trim();
  const categoryId = body.categoryId?.trim() || null;

  if (!title || !departmentId || !body.contentHtml?.trim()) {
    return NextResponse.json(
      { error: "title, departmentId, and content are required" },
      { status: 400 },
    );
  }

  if (!access.departmentIds.includes(departmentId)) {
    return NextResponse.json({ error: "Department not allowed" }, { status: 403 });
  }

  if (categoryId) {
    const category = await prisma.category.findFirst({
      where: { id: categoryId, companyId: access.companyId },
      select: { id: true },
    });

    if (!category) {
      return NextResponse.json({ error: "Category not found" }, { status: 404 });
    }
  }

  const spiel = await prisma.spiel.create({
    data: {
      companyId: access.companyId,
      departmentId,
      categoryId,
      createdByUserId: access.session.user.id,
      title,
      contentHtml: body.contentHtml,
      contentJson: body.contentJson ?? "",
      contentPlain: body.contentPlain ?? "",
    },
  });

  return NextResponse.json(spiel, { status: 201 });
}
