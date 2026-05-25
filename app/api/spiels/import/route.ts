import { NextRequest, NextResponse } from "next/server";
import { getAccessContextOrNull } from "@/lib/auth/session";
import { canManageDepartment } from "@/lib/permissions";
import { db } from "@/lib/drizzle/db";
import { spiels, departments, categories } from "@/lib/drizzle/schema";
import { eq } from "drizzle-orm";
import { logActivity } from "@/lib/audit/log-activity";
import { snapshotSpiel } from "@/lib/versioning/snapshot-spiel";
import type { UserRole } from "@/types";
import { z } from "zod";

const importRowSchema = z.object({
  title: z.string().min(1).max(200),
  department: z.string().min(1),
  category: z.string().optional().nullable(),
  contentPlain: z.string().optional().nullable(),
  contentHtml: z.string().optional().nullable(),
});

const importBodySchema = z.object({
  rows: z.array(importRowSchema).min(1).max(500),
});

export async function POST(req: NextRequest) {
  const access = await getAccessContextOrNull();
  if (!access) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!canManageDepartment(access.session.user.role as UserRole)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await req.json().catch(() => null);
  if (!body) {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const parsed = importBodySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.flatten().fieldErrors },
      { status: 400 },
    );
  }

  const [allDepartments, allCategories] = await Promise.all([
    db.select({ id: departments.id, name: departments.name }).from(departments).where(eq(departments.companyId, access.companyId)),
    db.select({ id: categories.id, name: categories.name }).from(categories).where(eq(categories.companyId, access.companyId)),
  ]);

  const deptByName = new Map(allDepartments.map((d) => [d.name.toLowerCase(), d.id]));
  const catByName = new Map(allCategories.map((c) => [c.name.toLowerCase(), c.id]));

  const errors: { row: number; message: string }[] = [];
  let created = 0;

  for (let i = 0; i < parsed.data.rows.length; i++) {
    const row = parsed.data.rows[i];
    const rowNum = i + 1;

    const departmentId = deptByName.get(row.department.toLowerCase());
    if (!departmentId) {
      errors.push({ row: rowNum, message: `Department "${row.department}" not found.` });
      continue;
    }

    const categoryId = row.category ? (catByName.get(row.category.toLowerCase()) ?? null) : null;
    const plain = row.contentPlain ?? "";
    const html = row.contentHtml?.trim()
      ? row.contentHtml
      : plain.split(/\n+/).filter(Boolean).map((p) => `<p>${p}</p>`).join("") || "<p></p>";

    try {
      const [spiel] = await db
        .insert(spiels)
        .values({
          companyId: access.companyId,
          departmentId,
          categoryId,
          createdByUserId: access.session.user.id,
          title: row.title,
          contentPlain: plain,
          contentHtml: html,
          contentJson: "",
          status: "active",
        })
        .returning();

      await logActivity({
        userId: access.session.user.id,
        action: "spiel.create",
        entityType: "spiel",
        entityId: spiel.id,
        metadata: { name: spiel.title },
      });

      snapshotSpiel({
        spielId: spiel.id,
        savedByUserId: access.session.user.id,
        title: spiel.title,
        contentHtml: spiel.contentHtml,
        contentJson: spiel.contentJson,
        contentPlain: spiel.contentPlain,
        categoryId: spiel.categoryId,
      }).catch(() => {});

      created++;
    } catch {
      errors.push({ row: rowNum, message: `Failed to create spiel "${row.title}".` });
    }
  }

  return NextResponse.json({ created, errors });
}
