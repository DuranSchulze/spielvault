import { type NextRequest } from "next/server";
import { db } from "@/lib/drizzle/db";
import { apiTokens, users, userDepartments } from "@/lib/drizzle/schema";
import { eq, and } from "drizzle-orm";

export async function getBearerAccessContext(req: NextRequest) {
  const authHeader = req.headers.get("authorization");
  if (!authHeader?.startsWith("Bearer svt_")) return null;

  const rawToken = authHeader.slice("Bearer ".length);

  const [tokenRow] = await db
    .select({
      id: apiTokens.id,
      userId: apiTokens.userId,
    })
    .from(apiTokens)
    .where(eq(apiTokens.token, rawToken))
    .limit(1);

  if (!tokenRow) return null;

  const [user] = await db
    .select({
      id: users.id,
      name: users.name,
      email: users.email,
      role: users.role,
      companyId: users.companyId,
      isActive: users.isActive,
    })
    .from(users)
    .where(eq(users.id, tokenRow.userId))
    .limit(1);

  if (!user || !user.isActive || !user.companyId) return null;

  // Update lastUsedAt fire-and-forget
  db.update(apiTokens)
    .set({ lastUsedAt: new Date() })
    .where(eq(apiTokens.id, tokenRow.id))
    .catch(() => {});

  const memberships = await db
    .select({ departmentId: userDepartments.departmentId })
    .from(userDepartments)
    .where(eq(userDepartments.userId, user.id));

  return {
    session: {
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        companyId: user.companyId,
      },
    },
    companyId: user.companyId,
    departmentIds: memberships.map((m) => m.departmentId),
  };
}
