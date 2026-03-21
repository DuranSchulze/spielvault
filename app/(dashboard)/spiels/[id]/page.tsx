import Link from "next/link";
import { PageHeader } from "@/components/layout/page-header";

export const metadata = {
  title: "Spiel — Spiel Vault",
};

export default function SpielDetailPage({
  params,
}: {
  params: { id: string };
}) {
  return (
    <div className="flex-1 px-8 py-8">
      <PageHeader
        title="Spiel Detail"
        actions={
          <div className="flex items-center gap-2">
            <Link
              href={`/spiels/${params.id}/edit`}
              className="px-4 py-2.5 rounded-md text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
            >
              Edit
            </Link>
            <Link
              href="/spiels"
              className="px-4 py-2.5 rounded-md text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
            >
              Back
            </Link>
          </div>
        }
      />

      <div className="max-w-2xl bg-card rounded-md p-6">
        <p className="text-sm text-muted-foreground">Spiel ID: {params.id}</p>
        <p className="mt-4 text-sm text-muted-foreground/60">
          Spiel detail view — coming soon.
        </p>
      </div>
    </div>
  );
}
