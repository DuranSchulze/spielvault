import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth/auth";
import { db } from "@/lib/drizzle/db";
import { users, userDepartments } from "@/lib/drizzle/schema";
import { eq } from "drizzle-orm";

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

  // Session cookie may be stale after onboarding — fall back to a fresh DB lookup
  let companyId = session.user.companyId;
  if (!companyId) {
    const [fresh] = await db
      .select({ companyId: users.companyId })
      .from(users)
      .where(eq(users.id, session.user.id))
      .limit(1);
    companyId = fresh?.companyId ?? null;
  }

  if (!companyId) {
    redirect("/onboarding");
  }

  const memberships = await db
    .select({ departmentId: userDepartments.departmentId })
    .from(userDepartments)
    .where(eq(userDepartments.userId, session.user.id));

  return {
    session,
    companyId,
    departmentIds: memberships.map((m) => m.departmentId),
  };
}

export async function getAccessContextOrNull() {
  const session = await getServerSession();

  if (!session?.user?.companyId) {
    return null;
  }

  const memberships = await db
    .select({ departmentId: userDepartments.departmentId })
    .from(userDepartments)
    .where(eq(userDepartments.userId, session.user.id));

  return {
    session,
    companyId: session.user.companyId,
    departmentIds: memberships.map((m) => m.departmentId),
  };
}
