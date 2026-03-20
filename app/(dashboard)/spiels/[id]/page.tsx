import Link from "next/link";
import { PageHeader } from "@/components/layout/page-header";

export const metadata = {
  title: "Spiel — Spiel Vault",
};

export default function SpielDetailPage({ params }: { params: { id: string } }) {
  return (
    <div className="flex-1 px-8 py-8">
      <PageHeader
        title="Spiel Detail"
        actions={
          <div className="flex items-center gap-2">
            <Link
              href={`/spiels/${params.id}/edit`}
              className="px-4 py-2.5 rounded-md text-sm font-medium text-[#49636f] hover:text-[#2b3437] hover:bg-[#e3e9ec] transition-colors"
            >
              Edit
            </Link>
            <Link
              href="/spiels"
              className="px-4 py-2.5 rounded-md text-sm font-medium text-[#49636f] hover:text-[#2b3437] hover:bg-[#e3e9ec] transition-colors"
            >
              Back
            </Link>
          </div>
        }
      />

      <div className="max-w-2xl bg-white rounded-md p-6">
        <p className="text-sm text-[#49636f]">Spiel ID: {params.id}</p>
        <p className="mt-4 text-sm text-[#abb3b7]">Spiel detail view — coming soon.</p>
      </div>
    </div>
  );
}
