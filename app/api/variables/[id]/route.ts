import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma/client";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = await req.json() as { value?: string; key?: string };
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
  const { id } = await params;
  await prisma.spielVariable.delete({ where: { id } });
  return new NextResponse(null, { status: 204 });
}
