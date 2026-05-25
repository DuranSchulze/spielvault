import { pgTable, text, timestamp, unique } from "drizzle-orm/pg-core";
import { randomUUID } from "crypto";
import { relations } from "drizzle-orm";
import { companies } from "./company";
import { users } from "./auth";

export const departments = pgTable("Department", {
  id: text("id").primaryKey().$defaultFn(() => randomUUID()),
  companyId: text("companyId").notNull().references(() => companies.id, { onDelete: "restrict" }),
  name: text("name").notNull(),
  slug: text("slug").notNull(),
  description: text("description"),
  createdAt: timestamp("createdAt", { mode: "date" }).notNull().defaultNow(),
  updatedAt: timestamp("updatedAt", { mode: "date" }).notNull().defaultNow(),
}, (t) => [unique("Department_companyId_slug_key").on(t.companyId, t.slug)]);

export const userDepartments = pgTable("UserDepartment", {
  id: text("id").primaryKey().$defaultFn(() => randomUUID()),
  userId: text("userId").notNull().references(() => users.id, { onDelete: "cascade" }),
  departmentId: text("departmentId").notNull().references(() => departments.id, { onDelete: "cascade" }),
  createdAt: timestamp("createdAt", { mode: "date" }).notNull().defaultNow(),
}, (t) => [unique("UserDepartment_userId_departmentId_key").on(t.userId, t.departmentId)]);

export const departmentsRelations = relations(departments, ({ one, many }) => ({
  company: one(companies, { fields: [departments.companyId], references: [companies.id] }),
  members: many(userDepartments),
}));

export const userDepartmentsRelations = relations(userDepartments, ({ one }) => ({
  user: one(users, { fields: [userDepartments.userId], references: [users.id] }),
  department: one(departments, { fields: [userDepartments.departmentId], references: [departments.id] }),
}));
