import { pgTable, text, timestamp, unique } from "drizzle-orm/pg-core";
import { randomUUID } from "crypto";
import { relations } from "drizzle-orm";
import { companies } from "./company";

export const categories = pgTable("Category", {
  id: text("id").primaryKey().$defaultFn(() => randomUUID()),
  companyId: text("companyId").notNull().references(() => companies.id, { onDelete: "restrict" }),
  name: text("name").notNull(),
  slug: text("slug").notNull(),
  description: text("description"),
  createdAt: timestamp("createdAt", { mode: "date" }).notNull().defaultNow(),
  updatedAt: timestamp("updatedAt", { mode: "date" }).notNull().defaultNow(),
}, (t) => [unique("Category_companyId_slug_key").on(t.companyId, t.slug)]);

export const categoriesRelations = relations(categories, ({ one }) => ({
  company: one(companies, { fields: [categories.companyId], references: [companies.id] }),
}));
