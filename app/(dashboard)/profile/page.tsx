import { PageHeader } from "@/components/layout/page-header";
import { ProfileForm } from "./profile-form";
import { ExtensionTokens } from "./extension-tokens";
import { requireServerSession } from "@/lib/auth/session";
import { db } from "@/lib/drizzle/db";
import { companies, apiTokens } from "@/lib/drizzle/schema";
import { eq, desc } from "drizzle-orm";

export const metadata = {
  title: "Profile — RepFlow",
};

export default async function ProfilePage() {
  const session = await requireServerSession();

  const [companyRow, tokenList] = await Promise.all([
    session.user.companyId
      ? db.select({ name: companies.name }).from(companies).where(eq(companies.id, session.user.companyId)).limit(1).then((r) => r[0] ?? null)
      : Promise.resolve(null),
    db
      .select({ id: apiTokens.id, name: apiTokens.name, createdAt: apiTokens.createdAt, lastUsedAt: apiTokens.lastUsedAt })
      .from(apiTokens)
      .where(eq(apiTokens.userId, session.user.id))
      .orderBy(desc(apiTokens.createdAt)),
  ]);

  const serializedTokens = tokenList.map((t) => ({
    id: t.id,
    name: t.name,
    createdAt: t.createdAt.toISOString(),
    lastUsedAt: t.lastUsedAt?.toISOString() ?? null,
  }));

  return (
    <div className="flex-1 px-8 py-8">
      <PageHeader
        title="My Account"
        description="Manage your profile details and sign-in credentials."
      />
      <div className="grid gap-6 lg:grid-cols-2">
        <ProfileForm
          name={session.user.name}
          email={session.user.email}
          role={session.user.role}
          companyName={companyRow?.name ?? null}
        />
        <ExtensionTokens initialTokens={serializedTokens} />
      </div>
    </div>
  );
}
