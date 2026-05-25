import { pgTable, text, timestamp } from "drizzle-orm/pg-core";
import { randomUUID } from "crypto";
import { users } from "./auth";

export const apiTokens = pgTable("api_token", {
  id: text("id").primaryKey().$defaultFn(() => randomUUID()),
  userId: text("userId").notNull().references(() => users.id, { onDelete: "cascade" }),
  token: text("token").notNull().unique(),
  name: text("name").notNull().default("Browser Extension"),
  createdAt: timestamp("createdAt", { mode: "date" }).notNull().defaultNow(),
  lastUsedAt: timestamp("lastUsedAt", { mode: "date" }),
});
