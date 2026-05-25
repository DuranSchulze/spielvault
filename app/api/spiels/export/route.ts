import { NextRequest, NextResponse } from "next/server";
import { getAccessContextOrNull } from "@/lib/auth/session";
import { canManageDepartment } from "@/lib/permissions";
import { db } from "@/lib/drizzle/db";
import { spiels, departments, categories } from "@/lib/drizzle/schema";
import { eq, and, desc } from "drizzle-orm";
import type { UserRole } from "@/types";

function csvCell(value: string | null | undefined): string {
  const str = value ?? "";
  if (/[",\n\r]/.test(str)) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

export async function GET(req: NextRequest) {
  const access = await getAccessContextOrNull();
  if (!access) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!canManageDepartment(access.session.user.role as UserRole)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { searchParams } = req.nextUrl;
  const format = searchParams.get("format") === "csv" ? "csv" : "json";
  const departmentFilter = searchParams.get("department") ?? "";
  const categoryFilter = searchParams.get("category") ?? "";

  const rows = await db
    .select({
      title: spiels.title,
      contentPlain: spiels.contentPlain,
      contentHtml: spiels.contentHtml,
      department: { name: departments.name },
      category: { name: categories.name },
    })
    .from(spiels)
    .leftJoin(departments, eq(spiels.departmentId, departments.id))
    .leftJoin(categories, eq(spiels.categoryId, categories.id))
    .where(
      and(
        eq(spiels.companyId, access.companyId),
        eq(spiels.status, "active"),
        departmentFilter ? eq(spiels.departmentId, departmentFilter) : undefined,
        categoryFilter ? eq(spiels.categoryId, categoryFilter) : undefined,
      ),
    )
    .orderBy(desc(spiels.updatedAt));

  const timestamp = new Date().toISOString().split("T")[0];

  if (format === "csv") {
    const header = ["title", "department", "category", "contentPlain"].join(",");
    const lines = rows.map((s) =>
      [
        csvCell(s.title),
        csvCell(s.department?.name),
        csvCell(s.category?.name),
        csvCell(s.contentPlain),
      ].join(","),
    );
    const csv = [header, ...lines].join("\r\n");

    return new NextResponse(csv, {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="spiels-${timestamp}.csv"`,
      },
    });
  }

  const data = rows.map((s) => ({
    title: s.title,
    department: s.department?.name ?? "",
    category: s.category?.name ?? null,
    contentPlain: s.contentPlain ?? "",
    contentHtml: s.contentHtml ?? "",
  }));

  return new NextResponse(JSON.stringify(data, null, 2), {
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Content-Disposition": `attachment; filename="spiels-${timestamp}.json"`,
    },
  });
}
