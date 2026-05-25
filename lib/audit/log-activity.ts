import { db } from "@/lib/drizzle/db";
import { auditLogs } from "@/lib/drizzle/schema";

export async function logActivity(data: {
  userId: string;
  action: string;
  entityType: string;
  entityId: string;
  metadata?: Record<string, unknown>;
}): Promise<void> {
  await db.insert(auditLogs).values({
    userId: data.userId,
    action: data.action,
    entityType: data.entityType,
    entityId: data.entityId,
    metadata: data.metadata ?? null,
  });
}
