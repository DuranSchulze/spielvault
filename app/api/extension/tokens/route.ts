import { NextResponse } from "next/server";
import { getAccessContextOrNull } from "@/lib/auth/session";
import { db } from "@/lib/drizzle/db";
import { apiTokens } from "@/lib/drizzle/schema";
import { eq, desc } from "drizzle-orm";
import { randomBytes } from "crypto";

export async function GET() {
  const access = await getAccessContextOrNull();
  if (!access) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const tokens = await db
    .select({ id: apiTokens.id, name: apiTokens.name, createdAt: apiTokens.createdAt, lastUsedAt: apiTokens.lastUsedAt })
    .from(apiTokens)
    .where(eq(apiTokens.userId, access.session.user.id))
    .orderBy(desc(apiTokens.createdAt));

  return NextResponse.json(tokens);
}

export async function POST() {
  const access = await getAccessContextOrNull();
  if (!access) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const raw = "svt_" + randomBytes(32).toString("hex");

  const [token] = await db
    .insert(apiTokens)
    .values({ userId: access.session.user.id, token: raw, name: "Browser Extension" })
    .returning({ id: apiTokens.id, name: apiTokens.name, createdAt: apiTokens.createdAt, lastUsedAt: apiTokens.lastUsedAt });

  return NextResponse.json({ ...token, token: raw }, { status: 201 });
}
