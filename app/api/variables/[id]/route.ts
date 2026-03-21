import { NextRequest, NextResponse } from "next/server";
import { getAccessContextOrNull } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma/client";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const access = await getAccessContextOrNull();

  if (!access) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const body = await req.json() as { value?: string; key?: string };
  const existing = await prisma.spielVariable.findFirst({
    where: { id, companyId: access.companyId },
  });

  if (!existing) {
    return NextResponse.json({ error: "Variable not found" }, { status: 404 });
  }

  const variable = await prisma.spielVariable.update({
    where: { id },
    data: {
      ...(body.key !== undefined && { key: body.key.trim() }),
      ...(body.value !== undefined && { value: body.value.trim() }),
    },
  });
  return NextResponse.json(variable);
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const access = await getAccessContextOrNull();

  if (!access) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const existing = await prisma.spielVariable.findFirst({
    where: { id, companyId: access.companyId },
  });

  if (!existing) {
    return NextResponse.json({ error: "Variable not found" }, { status: 404 });
  }

  await prisma.spielVariable.delete({ where: { id } });
  return new NextResponse(null, { status: 204 });
}
