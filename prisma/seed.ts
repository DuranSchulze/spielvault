import "dotenv/config";
import { hashPassword } from "better-auth/crypto";
import { Pool } from "pg";
import { drizzle } from "drizzle-orm/node-postgres";
import * as schema from "../lib/drizzle/schema";
import { eq, and } from "drizzle-orm";
import { slugify } from "../lib/utils/index";

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const db = drizzle(pool, { schema });

const { companies, departments, categories, users, accounts, userDepartments } = schema;

async function main() {
  const adminEmail = process.env.SEED_ADMIN_EMAIL?.trim().toLowerCase();
  const adminPassword = process.env.SEED_ADMIN_PASSWORD?.trim();

  if (!adminEmail || !adminPassword) {
    throw new Error(
      "SEED_ADMIN_EMAIL and SEED_ADMIN_PASSWORD must be set before running db:seed.",
    );
  }

  // Upsert company
  const companySlug = "filepino";
  const [existingCompany] = await db
    .select()
    .from(companies)
    .where(eq(companies.slug, companySlug))
    .limit(1);

  let company: typeof existingCompany;
  if (existingCompany) {
    [company] = await db
      .update(companies)
      .set({ name: "FilePino" })
      .where(eq(companies.id, existingCompany.id))
      .returning();
  } else {
    [company] = await db
      .insert(companies)
      .values({ name: "FilePino", slug: companySlug })
      .returning();
  }

  // Upsert departments
  const departmentNames = ["Sales", "Support", "HR"] as const;
  const deptRows = await Promise.all(
    departmentNames.map(async (name) => {
      const slug = slugify(name);
      const [existing] = await db
        .select()
        .from(departments)
        .where(and(eq(departments.companyId, company.id), eq(departments.slug, slug)))
        .limit(1);
      if (existing) {
        const [updated] = await db
          .update(departments)
          .set({ name })
          .where(eq(departments.id, existing.id))
          .returning();
        return updated;
      }
      const [created] = await db
        .insert(departments)
        .values({ companyId: company.id, name, slug })
        .returning();
      return created;
    }),
  );

  // Upsert categories
  const categoryNames = ["Outreach", "Technical", "Onboarding"] as const;
  await Promise.all(
    categoryNames.map(async (name) => {
      const slug = slugify(name);
      const [existing] = await db
        .select()
        .from(categories)
        .where(and(eq(categories.companyId, company.id), eq(categories.slug, slug)))
        .limit(1);
      if (!existing) {
        await db.insert(categories).values({ companyId: company.id, name, slug });
      }
    }),
  );

  const passwordHash = await hashPassword(adminPassword);

  // Upsert admin user
  const [existingUser] = await db
    .select()
    .from(users)
    .where(eq(users.email, adminEmail))
    .limit(1);

  let adminUser: typeof existingUser;
  if (existingUser) {
    [adminUser] = await db
      .update(users)
      .set({ name: "FilePino Admin", role: "admin", isActive: true, companyId: company.id })
      .where(eq(users.id, existingUser.id))
      .returning();
  } else {
    [adminUser] = await db
      .insert(users)
      .values({
        name: "FilePino Admin",
        email: adminEmail,
        emailVerified: true,
        role: "admin",
        isActive: true,
        companyId: company.id,
      })
      .returning();
  }

  // Upsert credential account
  const [existingAccount] = await db
    .select()
    .from(accounts)
    .where(and(eq(accounts.providerId, "credential"), eq(accounts.userId, adminUser.id)))
    .limit(1);

  if (existingAccount) {
    await db
      .update(accounts)
      .set({ password: passwordHash })
      .where(eq(accounts.id, existingAccount.id));
  } else {
    await db.insert(accounts).values({
      accountId: adminUser.id,
      providerId: "credential",
      userId: adminUser.id,
      password: passwordHash,
    });
  }

  // Upsert user-department memberships
  await Promise.all(
    deptRows.map((dept) =>
      db
        .insert(userDepartments)
        .values({ userId: adminUser.id, departmentId: dept.id })
        .onConflictDoNothing(),
    ),
  );

  console.log(
    `Seeded company ${company.slug} with admin ${adminUser.email} and ${deptRows.length} departments.`,
  );
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => pool.end());
