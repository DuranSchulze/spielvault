import { PageHeader } from "@/components/layout/page-header";
import { ProfileForm } from "./profile-form";
import { requireServerSession } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma/client";

export const metadata = {
  title: "Profile — Spiel Vault",
};

export default async function ProfilePage() {
  const session = await requireServerSession();
  const company = session.user.companyId
    ? await prisma.company.findUnique({
        where: { id: session.user.companyId },
        select: { name: true },
      })
    : null;

  return (
    <div className="flex-1 px-8 py-8">
      <PageHeader
        title="My Account"
        description="Manage your profile details and sign-in credentials."
      />

      <ProfileForm
        name={session.user.name}
        email={session.user.email}
        role={session.user.role}
        companyName={company?.name ?? null}
      />
    </div>
  );
}
