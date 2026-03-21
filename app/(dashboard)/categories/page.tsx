import { PageHeader } from "@/components/layout/page-header";

export const metadata = {
  title: "Categories — Spiel Vault",
};

export default function CategoriesPage() {
  return (
    <div className="flex-1 px-8 py-8">
      <PageHeader
        title="Categories"
        description="Organize spiels into categories"
        actions={
          <button className="inline-flex items-center gap-2 px-4 py-2.5 rounded-md text-primary-foreground text-sm font-medium bg-primary hover:bg-primary/90 transition-colors">
            + New Category
          </button>
        }
      />

      <div className="rounded-md border border-border bg-card">
        <div className="px-5 py-12 text-center">
          <p className="text-sm text-muted-foreground">No categories yet.</p>
        </div>
      </div>
    </div>
  );
}
