import { pgTable, text, timestamp, jsonb } from "drizzle-orm/pg-core";
import { randomUUID } from "crypto";
import { users } from "./auth";

export const auditLogs = pgTable("AuditLog", {
  id: text("id").primaryKey().$defaultFn(() => randomUUID()),
  userId: text("userId").notNull().references(() => users.id, { onDelete: "restrict" }),
  action: text("action").notNull(),
  entityType: text("entityType").notNull(),
  entityId: text("entityId").notNull(),
  metadata: jsonb("metadata"),
  createdAt: timestamp("createdAt", { mode: "date" }).notNull().defaultNow(),
});
