import { NextRequest, NextResponse } from "next/server";
import { canManageDepartment } from "@/lib/permissions";
import { getAccessContextOrNull } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma/client";
import type { UserRole } from "@/types";
import { slugify } from "@/lib/utils/index";

type UpdateDepartmentBody = {
  name?: string;
  description?: string | null;
};

async function getDepartmentForAccess(id: string, companyId: string) {
  return prisma.department.findFirst({
    where: { id, companyId },
    select: {
      id: true,
      companyId: true,
      name: true,
      slug: true,
      description: true,
      _count: {
        select: {
          spiels: true,
        },
      },
    },
  });
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
  const department = await getDepartmentForAccess(id, access.companyId);

  if (!department) {
    return NextResponse.json({ error: "Department not found" }, { status: 404 });
  }

  const body = (await req.json()) as UpdateDepartmentBody;
  const name = body.name?.trim();
  const description = body.description === undefined ? undefined : body.description?.trim() || null;

  if (!name && description === undefined) {
    return NextResponse.json({ error: "No updates provided" }, { status: 400 });
  }

  const slug = name ? slugify(name) : department.slug;

  if (name) {
    const existing = await prisma.department.findFirst({
      where: {
        companyId: access.companyId,
        slug,
        NOT: { id },
      },
      select: { id: true },
    });

    if (existing) {
      return NextResponse.json(
        { error: "A department with this name already exists" },
        { status: 409 },
      );
    }
  }

  const updated = await prisma.department.update({
    where: { id },
    data: {
      ...(name ? { name, slug } : {}),
      ...(description !== undefined ? { description } : {}),
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

  if (!canManageDepartment(access.session.user.role as UserRole)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;
  const department = await getDepartmentForAccess(id, access.companyId);

  if (!department) {
    return NextResponse.json({ error: "Department not found" }, { status: 404 });
  }

  if (department._count.spiels > 0) {
    return NextResponse.json(
      { error: "Cannot delete a department that still has spiels." },
      { status: 400 },
    );
  }

  await prisma.department.delete({
    where: { id },
  });

  return new NextResponse(null, { status: 204 });
}
