import { PageHeader } from "@/components/layout/page-header";

export const metadata = {
  title: "Company — Spiel Vault",
};

export default function CompaniesPage() {
  return (
    <div className="flex-1 px-8 py-8">
      <PageHeader title="Company" description="Manage your company settings" />

      <div className="rounded-md border border-border bg-card">
        <div className="px-5 py-12 text-center">
          <p className="text-sm text-muted-foreground">
            Company settings — coming soon.
          </p>
        </div>
      </div>
    </div>
  );
}
