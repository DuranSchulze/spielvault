import { NextRequest, NextResponse } from "next/server";
import { getAccessContextOrNull } from "@/lib/auth/session";
import { db } from "@/lib/drizzle/db";
import { users, auditLogs } from "@/lib/drizzle/schema";
import { eq, and, gte, count, inArray } from "drizzle-orm";

export async function GET(req: NextRequest) {
  const access = await getAccessContextOrNull();
  if (!access) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = req.nextUrl;
  const days = Math.min(Number(searchParams.get("days") ?? "30"), 90);
  const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
  const { companyId } = access;

  const companyUserIds = await db
    .select({ id: users.id })
    .from(users)
    .where(eq(users.companyId, companyId))
    .then((rows) => rows.map((r) => r.id));

  if (companyUserIds.length === 0) {
    return NextResponse.json({ totalCopies: 0, totalCreated: 0, activeUsers: 0, topSpiels: [], topUsers: [], dailyCopies: [] });
  }

  const [copyCountRow] = await db
    .select({ count: count() })
    .from(auditLogs)
    .where(and(inArray(auditLogs.userId, companyUserIds), eq(auditLogs.action, "copy")));

  const totalCopies = Number(copyCountRow.count);

  const [createdCountRow] = await db
    .select({ count: count() })
    .from(auditLogs)
    .where(and(inArray(auditLogs.userId, companyUserIds), eq(auditLogs.action, "spiel.create"), gte(auditLogs.createdAt, since)));

  const totalCreated = Number(createdCountRow.count);

  const activeUserRows = await db
    .selectDistinct({ userId: auditLogs.userId })
    .from(auditLogs)
    .where(and(inArray(auditLogs.userId, companyUserIds), gte(auditLogs.createdAt, since)));

  const activeUsers = activeUserRows.length;

  // Top copied spiels
  const copyLogs = await db
    .select({ entityId: auditLogs.entityId, metadata: auditLogs.metadata })
    .from(auditLogs)
    .where(and(inArray(auditLogs.userId, companyUserIds), eq(auditLogs.action, "copy"), eq(auditLogs.entityType, "spiel"), gte(auditLogs.createdAt, since)));

  const copyCountBySpiel = new Map<string, { count: number; name: string }>();
  for (const log of copyLogs) {
    const existing = copyCountBySpiel.get(log.entityId);
    const meta = log.metadata as Record<string, string> | null;
    const name = meta?.name ?? log.entityId.slice(0, 8);
    copyCountBySpiel.set(log.entityId, { count: (existing?.count ?? 0) + 1, name: existing?.name ?? name });
  }

  const topSpiels = [...copyCountBySpiel.entries()]
    .sort((a, b) => b[1].count - a[1].count)
    .slice(0, 10)
    .map(([id, { count: copies, name }]) => ({ id, name, copies }));

  // Top active users
  const userActionCounts = await db
    .select({ userId: auditLogs.userId, count: count() })
    .from(auditLogs)
    .where(and(inArray(auditLogs.userId, companyUserIds), gte(auditLogs.createdAt, since)))
    .groupBy(auditLogs.userId)
    .orderBy(count())
    .limit(10);

  const topUserIds = userActionCounts.map((r) => r.userId);
  const userRecords = topUserIds.length > 0
    ? await db.select({ id: users.id, name: users.name }).from(users).where(inArray(users.id, topUserIds))
    : [];
  const userNameMap = new Map(userRecords.map((u) => [u.id, u.name]));

  const topUsers = userActionCounts
    .sort((a, b) => Number(b.count) - Number(a.count))
    .map((r) => ({ userId: r.userId, name: userNameMap.get(r.userId) ?? "Unknown", actions: Number(r.count) }));

  // Daily copy counts
  const allCopyLogs = await db
    .select({ createdAt: auditLogs.createdAt })
    .from(auditLogs)
    .where(and(inArray(auditLogs.userId, companyUserIds), eq(auditLogs.action, "copy"), gte(auditLogs.createdAt, since)));

  const dailyMap = new Map<string, number>();
  for (let i = 0; i < days; i++) {
    const d = new Date(since.getTime() + i * 24 * 60 * 60 * 1000);
    dailyMap.set(d.toISOString().slice(0, 10), 0);
  }
  for (const log of allCopyLogs) {
    const key = new Date(log.createdAt).toISOString().slice(0, 10);
    dailyMap.set(key, (dailyMap.get(key) ?? 0) + 1);
  }

  const dailyCopies = [...dailyMap.entries()].map(([date, copies]) => ({ date, copies }));

  return NextResponse.json({ totalCopies, totalCreated, activeUsers, topSpiels, topUsers, dailyCopies });
}
