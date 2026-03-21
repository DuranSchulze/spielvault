import { NextRequest, NextResponse } from "next/server";
import { getAccessContextOrNull } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma/client";

export async function GET() {
  const access = await getAccessContextOrNull();

  if (!access) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const variables = await prisma.spielVariable.findMany({
    where: { companyId: access.companyId },
    orderBy: { key: "asc" },
  });
  return NextResponse.json(variables);
}

export async function POST(req: NextRequest) {
  const access = await getAccessContextOrNull();

  if (!access) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = (await req.json()) as { key?: string; value?: string };
  const key = body.key?.trim();
  const value = body.value?.trim();

  if (!key || !value) {
    return NextResponse.json({ error: "key and value are required" }, { status: 400 });
  }

  const variable = await prisma.spielVariable.create({
    data: { companyId: access.companyId, key, value },
  });
  return NextResponse.json(variable, { status: 201 });
}
