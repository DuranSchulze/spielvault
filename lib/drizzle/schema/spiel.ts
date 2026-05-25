import { pgTable, text, timestamp } from "drizzle-orm/pg-core";
import { randomUUID } from "crypto";
import { relations } from "drizzle-orm";
import { companies } from "./company";
import { departments } from "./department";
import { categories } from "./category";
import { users } from "./auth";

export const spiels = pgTable("Spiel", {
  id: text("id").primaryKey().$defaultFn(() => randomUUID()),
  companyId: text("companyId").notNull().references(() => companies.id, { onDelete: "restrict" }),
  departmentId: text("departmentId").notNull().references(() => departments.id, { onDelete: "restrict" }),
  categoryId: text("categoryId").references(() => categories.id, { onDelete: "set null" }),
  createdByUserId: text("createdByUserId").notNull().references(() => users.id, { onDelete: "restrict" }),
  title: text("title").notNull(),
  description: text("description"),
  contentJson: text("contentJson"),
  contentHtml: text("contentHtml"),
  contentPlain: text("contentPlain"),
  status: text("status").notNull().default("active"),
  createdAt: timestamp("createdAt", { mode: "date" }).notNull().defaultNow(),
  updatedAt: timestamp("updatedAt", { mode: "date" }).notNull().defaultNow(),
});

export const spielVersions = pgTable("spiel_version", {
  id: text("id").primaryKey().$defaultFn(() => randomUUID()),
  spielId: text("spielId").notNull().references(() => spiels.id, { onDelete: "cascade" }),
  savedByUserId: text("savedByUserId").notNull().references(() => users.id, { onDelete: "restrict" }),
  title: text("title").notNull(),
  contentHtml: text("contentHtml"),
  contentJson: text("contentJson"),
  contentPlain: text("contentPlain"),
  categoryId: text("categoryId"),
  createdAt: timestamp("createdAt", { mode: "date" }).notNull().defaultNow(),
});

export const spielApprovals = pgTable("spiel_approval", {
  id: text("id").primaryKey().$defaultFn(() => randomUUID()),
  spielId: text("spielId").notNull().references(() => spiels.id, { onDelete: "cascade" }),
  reviewerId: text("reviewerId").notNull().references(() => users.id, { onDelete: "restrict" }),
  action: text("action").notNull(),
  comment: text("comment"),
  createdAt: timestamp("createdAt", { mode: "date" }).notNull().defaultNow(),
});

export const spielsRelations = relations(spiels, ({ one, many }) => ({
  company: one(companies, { fields: [spiels.companyId], references: [companies.id] }),
  department: one(departments, { fields: [spiels.departmentId], references: [departments.id] }),
  category: one(categories, { fields: [spiels.categoryId], references: [categories.id] }),
  createdBy: one(users, { fields: [spiels.createdByUserId], references: [users.id] }),
  versions: many(spielVersions),
  approvals: many(spielApprovals),
}));

export const spielVersionsRelations = relations(spielVersions, ({ one }) => ({
  spiel: one(spiels, { fields: [spielVersions.spielId], references: [spiels.id] }),
  savedBy: one(users, { fields: [spielVersions.savedByUserId], references: [users.id] }),
}));

export const spielApprovalsRelations = relations(spielApprovals, ({ one }) => ({
  spiel: one(spiels, { fields: [spielApprovals.spielId], references: [spiels.id] }),
  reviewer: one(users, { fields: [spielApprovals.reviewerId], references: [users.id] }),
}));
