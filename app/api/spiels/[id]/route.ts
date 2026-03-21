import { NextRequest, NextResponse } from "next/server";
import { getAccessContextOrNull } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma/client";

async function getSpielForAccess(id: string, companyId: string) {
  return prisma.spiel.findFirst({
    where: { id, companyId },
    select: {
      id: true,
      title: true,
      status: true,
      departmentId: true,
    },
  });
}

export async function PATCH(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const access = await getAccessContextOrNull();

  if (!access) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const spiel = await getSpielForAccess(id, access.companyId);

  if (!spiel) {
    return NextResponse.json({ error: "Spiel not found" }, { status: 404 });
  }

  if (!access.departmentIds.includes(spiel.departmentId)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const updated = await prisma.spiel.update({
    where: { id },
    data: { status: "archived" },
    select: {
      id: true,
      title: true,
      status: true,
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
  const spiel = await getSpielForAccess(id, access.companyId);

  if (!spiel) {
    return NextResponse.json({ error: "Spiel not found" }, { status: 404 });
  }

  if (!access.departmentIds.includes(spiel.departmentId)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  if (spiel.status !== "archived") {
    return NextResponse.json(
      { error: "Archive the spiel before deleting it permanently." },
      { status: 400 },
    );
  }

  await prisma.spiel.delete({
    where: { id },
  });

  return new NextResponse(null, { status: 204 });
}
