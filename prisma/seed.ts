import "dotenv/config";
import { hashPassword } from "better-auth/crypto";
import { PrismaClient } from "@prisma/client";
import { withAccelerate } from "@prisma/extension-accelerate";
import { slugify } from "../lib/utils/index";

const prisma = new PrismaClient({
  accelerateUrl: process.env.DATABASE_URL,
}).$extends(withAccelerate());

async function main() {
  const adminEmail = process.env.SEED_ADMIN_EMAIL?.trim().toLowerCase();
  const adminPassword = process.env.SEED_ADMIN_PASSWORD?.trim();

  if (!adminEmail || !adminPassword) {
    throw new Error(
      "SEED_ADMIN_EMAIL and SEED_ADMIN_PASSWORD must be set before running prisma db seed.",
    );
  }

  const company = await prisma.company.upsert({
    where: { slug: "filepino" },
    update: { name: "FilePino" },
    create: {
      name: "FilePino",
      slug: "filepino",
    },
  });

  const departmentNames = ["Sales", "Support", "HR"] as const;
  const departments = await Promise.all(
    departmentNames.map((name) =>
      prisma.department.upsert({
        where: {
          companyId_slug: {
            companyId: company.id,
            slug: slugify(name),
          },
        },
        update: { name },
        create: {
          companyId: company.id,
          name,
          slug: slugify(name),
        },
      }),
    ),
  );

  const categoryNames = ["Outreach", "Technical", "Onboarding"] as const;
  await Promise.all(
    categoryNames.map((name) =>
      prisma.category.upsert({
        where: {
          companyId_slug: {
            companyId: company.id,
            slug: slugify(name),
          },
        },
        update: { name },
        create: {
          companyId: company.id,
          name,
          slug: slugify(name),
        },
      }),
    ),
  );

  const passwordHash = await hashPassword(adminPassword);

  const adminUser = await prisma.user.upsert({
    where: { email: adminEmail },
    update: {
      name: "FilePino Admin",
      role: "admin",
      isActive: true,
      companyId: company.id,
    },
    create: {
      name: "FilePino Admin",
      email: adminEmail,
      emailVerified: true,
      role: "admin",
      isActive: true,
      companyId: company.id,
    },
  });

  await prisma.account.upsert({
    where: { id: `${adminUser.id}-credential` },
    update: {
      accountId: adminUser.id,
      providerId: "credential",
      userId: adminUser.id,
      password: passwordHash,
    },
    create: {
      id: `${adminUser.id}-credential`,
      accountId: adminUser.id,
      providerId: "credential",
      userId: adminUser.id,
      password: passwordHash,
    },
  });

  await Promise.all(
    departments.map((department) =>
      prisma.userDepartment.upsert({
        where: {
          userId_departmentId: {
            userId: adminUser.id,
            departmentId: department.id,
          },
        },
        update: {},
        create: {
          userId: adminUser.id,
          departmentId: department.id,
        },
      }),
    ),
  );

  console.log(
    `Seeded company ${company.slug} with admin ${adminUser.email} and ${departments.length} departments.`,
  );
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
