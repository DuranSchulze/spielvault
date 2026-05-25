import { redirect } from "next/navigation";
import { requireAccessContext } from "@/lib/auth/session";
import { canManageDepartment } from "@/lib/permissions";
import type { UserRole } from "@/types";
import { ImportForm } from "./import-form";

export const metadata = { title: "Import Spiels — Spiel Vault" };

export default async function ImportPage() {
  const access = await requireAccessContext();

  if (!canManageDepartment(access.session.user.role as UserRole)) {
    redirect("/spiels");
  }

  return (
    <div className="flex-1 px-8 py-8 overflow-y-auto">
      <div className="max-w-2xl">
        <p className="text-[10px] font-semibold text-muted-foreground/60 uppercase tracking-widest mb-1">
          Library
        </p>
        <h1 className="font-display text-2xl font-bold text-foreground tracking-tight mb-1">
          Import Spiels
        </h1>
        <p className="text-sm text-muted-foreground mb-8">
          Upload a JSON or CSV file to bulk-create spiels. Departments are
          matched by name. Missing categories are skipped (spiel created without
          one).
        </p>
        <ImportForm />
      </div>
    </div>
  );
}
