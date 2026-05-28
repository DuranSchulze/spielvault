import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "@/lib/auth/session";
import { db } from "@/lib/drizzle/db";
import { companies, users } from "@/lib/drizzle/schema";
import { eq } from "drizzle-orm";

function toSlug(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

export async function POST(req: NextRequest) {
  const session = await getServerSession();

  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (session.user.companyId) {
    return NextResponse.json(
      { error: "Already assigned to a company." },
      { status: 400 },
    );
  }

  const body = await req.json().catch(() => ({})) as { name?: unknown };
  const name = typeof body.name === "string" ? body.name.trim() : "";

  if (name.length < 2) {
    return NextResponse.json(
      { error: "Company name must be at least 2 characters." },
      { status: 400 },
    );
  }

  const baseSlug = toSlug(name);
  const slug = `${baseSlug}-${Date.now()}`;

  const [company] = await db
    .insert(companies)
    .values({ name, slug })
    .returning({ id: companies.id, name: companies.name, slug: companies.slug });

  await db
    .update(users)
    .set({ companyId: company.id, role: "super_admin" })
    .where(eq(users.id, session.user.id));

  return NextResponse.json(company, { status: 201 });
}
