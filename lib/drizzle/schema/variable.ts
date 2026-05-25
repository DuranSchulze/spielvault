import { pgTable, text, timestamp, unique } from "drizzle-orm/pg-core";
import { randomUUID } from "crypto";
import { companies } from "./company";

export const spielVariables = pgTable("SpielVariable", {
  id: text("id").primaryKey().$defaultFn(() => randomUUID()),
  companyId: text("companyId").notNull().references(() => companies.id, { onDelete: "restrict" }),
  key: text("key").notNull(),
  value: text("value").notNull(),
  createdAt: timestamp("createdAt", { mode: "date" }).notNull().defaultNow(),
  updatedAt: timestamp("updatedAt", { mode: "date" }).notNull().defaultNow(),
}, (t) => [unique("SpielVariable_companyId_key_key").on(t.companyId, t.key)]);
