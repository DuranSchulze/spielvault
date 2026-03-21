import { NextRequest, NextResponse } from "next/server";
import { canManageDepartment } from "@/lib/permissions";
import { getAccessContextOrNull } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma/client";
import type { UserRole } from "@/types";
import { slugify } from "@/lib/utils/index";

type CreateDepartmentBody = {
  name?: string;
  description?: string | null;
};

export async function POST(req: NextRequest) {
  const access = await getAccessContextOrNull();

  if (!access) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!canManageDepartment(access.session.user.role as UserRole)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = (await req.json()) as CreateDepartmentBody;
  const name = body.name?.trim();
  const description = body.description?.trim() || null;

  if (!name) {
    return NextResponse.json({ error: "Department name is required" }, { status: 400 });
  }

  const slug = slugify(name);

  const existing = await prisma.department.findFirst({
    where: {
      companyId: access.companyId,
      slug,
    },
    select: { id: true },
  });

  if (existing) {
    return NextResponse.json(
      { error: "A department with this name already exists" },
      { status: 409 },
    );
  }

  const department = await prisma.department.create({
    data: {
      companyId: access.companyId,
      name,
      slug,
      description,
    },
  });

  await prisma.userDepartment.upsert({
    where: {
      userId_departmentId: {
        userId: access.session.user.id,
        departmentId: department.id,
      },
    },
    update: {},
    create: {
      userId: access.session.user.id,
      departmentId: department.id,
    },
  });

  return NextResponse.json(department, { status: 201 });
}
