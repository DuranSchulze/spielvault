import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma/client";

export async function GET(req: NextRequest) {
  const companyId = req.nextUrl.searchParams.get("companyId");
  if (!companyId) {
    return NextResponse.json({ error: "companyId required" }, { status: 400 });
  }
  const variables = await prisma.spielVariable.findMany({
    where: { companyId },
    orderBy: { key: "asc" },
  });
  return NextResponse.json(variables);
}

export async function POST(req: NextRequest) {
  const body = await req.json() as { companyId: string; key: string; value: string };
  const { companyId, key, value } = body;
  if (!companyId || !key || !value) {
    return NextResponse.json({ error: "companyId, key and value are required" }, { status: 400 });
  }
  const variable = await prisma.spielVariable.create({
    data: { companyId, key: key.trim(), value: value.trim() },
  });
  return NextResponse.json(variable, { status: 201 });
}
