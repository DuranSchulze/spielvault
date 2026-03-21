import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth/auth";
import { prisma } from "@/lib/prisma/client";

export async function getServerSession() {
  return auth.api.getSession({
    headers: new Headers(await headers()),
  });
}

export async function requireServerSession() {
  const session = await getServerSession();

  if (!session?.user) {
    redirect("/login");
  }

  return session;
}

export async function requireAccessContext() {
  const session = await requireServerSession();
  const companyId = session.user.companyId;

  if (!companyId) {
    redirect("/login");
  }

  const memberships = await prisma.userDepartment.findMany({
    where: { userId: session.user.id },
    select: { departmentId: true },
  });

  return {
    session,
    companyId,
    departmentIds: memberships.map((membership) => membership.departmentId),
  };
}

export async function getAccessContextOrNull() {
  const session = await getServerSession();

  if (!session?.user?.companyId) {
    return null;
  }

  const memberships = await prisma.userDepartment.findMany({
    where: { userId: session.user.id },
    select: { departmentId: true },
  });

  return {
    session,
    companyId: session.user.companyId,
    departmentIds: memberships.map((membership) => membership.departmentId),
  };
}
