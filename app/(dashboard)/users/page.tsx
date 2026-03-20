import { PageHeader } from "@/components/layout/page-header";

export const metadata = {
  title: "Users — Spiel Vault",
};

export default function UsersPage() {
  return (
    <div className="flex-1 px-8 py-8">
      <PageHeader
        title="Users"
        description="Manage team members and their department access"
        actions={
          <button className="inline-flex items-center gap-2 px-4 py-2.5 rounded-md text-white text-sm font-medium bg-gradient-to-br from-[#005db5] to-[#0052a0] hover:opacity-90 transition-opacity">
            + Invite User
          </button>
        }
      />

      <div className="rounded-md border border-[#abb3b7]/20 bg-white">
        <div className="px-5 py-12 text-center">
          <p className="text-sm text-[#49636f]">No users yet.</p>
        </div>
      </div>
    </div>
  );
}
