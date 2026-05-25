"use client";

import { startTransition, useState } from "react";
import { useRouter } from "next/navigation";
import { Archive, Trash2 } from "lucide-react";
import { SpielCard, type SpielCardData } from "@/components/spiels/spiel-card";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { goeyToast } from "@/components/ui/goey-toaster";

type SpielListMode = "library" | "archive";

type PaginationInfo = {
  currentPage: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
  baseHref: string;
  filterParams: {
    department?: string;
    category?: string;
    q?: string;
    favorites?: string;
  };
};

type SpielListProps = {
  initialSpiels: SpielCardData[];
  mode: SpielListMode;
  emptyMessage: string;
  pagination?: PaginationInfo;
};

type ConfirmState = {
  open: boolean;
  spiel: SpielCardData | null;
  title: string;
  description: string;
  variant: "default" | "destructive";
};

function sortFavoritesFirst(list: SpielCardData[]): SpielCardData[] {
  return [...list].sort((a, b) => {
    if (a.isFavorited === b.isFavorited) return 0;
    return a.isFavorited ? -1 : 1;
  });
}

export function SpielList({
  initialSpiels,
  mode,
  emptyMessage,
  pagination,
}: SpielListProps) {
  const router = useRouter();
  const [spiels, setSpiels] = useState(() => sortFavoritesFirst(initialSpiels));
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [favoritePendingId, setFavoritePendingId] = useState<string | null>(null);
  const [confirm, setConfirm] = useState<ConfirmState>({
    open: false,
    spiel: null,
    title: "",
    description: "",
    variant: "default",
  });

  const isArchiveMode = mode === "archive";

  function promptAction(spiel: SpielCardData) {
    setConfirm({
      open: true,
      spiel,
      title: isArchiveMode ? "Delete permanently" : "Archive spiel",
      description: isArchiveMode
        ? `Permanently delete "${spiel.title}"? This cannot be undone.`
        : `Move "${spiel.title}" to archive?`,
      variant: isArchiveMode ? "destructive" : "default",
    });
  }

  async function handleAction(spiel: SpielCardData) {
    setPendingId(spiel.id);
    setConfirm((current) => ({ ...current, open: false }));

    const response = await fetch(`/api/spiels/${spiel.id}`, {
      method: isArchiveMode ? "DELETE" : "PATCH",
    });

    setPendingId(null);

    if (!response.ok) {
      const body = (await response.json().catch(() => null)) as {
        error?: string;
      } | null;
      goeyToast.error("Action failed", {
        description: body?.error ?? "Unable to update spiel.",
      });
      return;
    }

    setSpiels((current) => current.filter((item) => item.id !== spiel.id));
    goeyToast.success(isArchiveMode ? "Spiel deleted" : "Spiel archived", {
      description: isArchiveMode
        ? `"${spiel.title}" was permanently deleted.`
        : `"${spiel.title}" moved to archive.`,
    });

    startTransition(() => {
      router.refresh();
    });
  }

  async function handleFavoriteToggle(spiel: SpielCardData) {
    const next = !spiel.isFavorited;
    setFavoritePendingId(spiel.id);

    // Optimistic update
    setSpiels((current) =>
      sortFavoritesFirst(
        current.map((item) =>
          item.id === spiel.id ? { ...item, isFavorited: next } : item,
        ),
      ),
    );

    const response = await fetch(`/api/spiels/${spiel.id}/favorite`, {
      method: next ? "POST" : "DELETE",
    });

    setFavoritePendingId(null);

    if (!response.ok) {
      // Roll back
      setSpiels((current) =>
        sortFavoritesFirst(
          current.map((item) =>
            item.id === spiel.id ? { ...item, isFavorited: !next } : item,
          ),
        ),
      );
      goeyToast.error("Failed to update favorite", {
        description: "Something went wrong. Please try again.",
      });
    }
  }

  function buildPageHref(page: number) {
    const params = new URLSearchParams();

    if (pagination?.filterParams.department) {
      params.set("department", pagination.filterParams.department);
    }

    if (pagination?.filterParams.category) {
      params.set("category", pagination.filterParams.category);
    }

    if (pagination?.filterParams.q) {
      params.set("q", pagination.filterParams.q);
    }

    if (pagination?.filterParams.favorites) {
      params.set("favorites", pagination.filterParams.favorites);
    }

    if (page > 1) {
      params.set("page", String(page));
    }

    const query = params.toString();
    const href = pagination?.baseHref ?? "/spiels";
    return query ? `${href}?${query}` : href;
  }

  return (
    <div className="flex flex-col gap-3">
      {spiels.length === 0 ? (
        <div className="rounded-lg border border-dashed border-border bg-card px-6 py-10 text-center text-sm text-muted-foreground">
          {emptyMessage}
        </div>
      ) : (
        <>
          {spiels.map((spiel) => (
            <SpielCard
              key={spiel.id}
              spiel={spiel}
              actionLabel={isArchiveMode ? "Delete permanently" : "Archive"}
              actionTitle={
                isArchiveMode ? "Delete permanently" : "Archive spiel"
              }
              actionIcon={isArchiveMode ? Trash2 : Archive}
              actionTone={isArchiveMode ? "destructive" : "default"}
              isActionPending={pendingId === spiel.id}
              isFavoritePending={favoritePendingId === spiel.id}
              onAction={promptAction}
              onFavoriteToggle={isArchiveMode ? undefined : handleFavoriteToggle}
              className="border border-border rounded-lg px-6 py-5 hover:border-primary/30 hover:shadow-[0_2px_12px_rgba(0,93,181,0.06)]"
            />
          ))}

          {/* Pagination */}
          {pagination && pagination.totalPages > 1 && (
            <div className="flex items-center justify-between border-t border-border pt-4 mt-2">
              <p className="text-xs text-muted-foreground">
                Page {pagination.currentPage} of {pagination.totalPages}
              </p>
              <div className="flex items-center gap-2">
                {pagination.hasPrevPage && (
                  <a
                    href={buildPageHref(pagination.currentPage - 1)}
                    className="inline-flex items-center gap-1 rounded-md border border-border px-3 py-1.5 text-xs font-medium text-muted-foreground hover:border-primary/30 hover:text-primary transition-colors"
                  >
                    ← Previous
                  </a>
                )}
                {pagination.hasNextPage && (
                  <a
                    href={buildPageHref(pagination.currentPage + 1)}
                    className="inline-flex items-center gap-1 rounded-md border border-border px-3 py-1.5 text-xs font-medium text-muted-foreground hover:border-primary/30 hover:text-primary transition-colors"
                  >
                    Next →
                  </a>
                )}
              </div>
            </div>
          )}
        </>
      )}

      {/* Confirmation Dialog */}
      <ConfirmDialog
        open={confirm.open}
        title={confirm.title}
        description={confirm.description}
        variant={confirm.variant}
        confirmLabel={isArchiveMode ? "Delete permanently" : "Archive"}
        onConfirm={() => {
          if (confirm.spiel) {
            handleAction(confirm.spiel);
          }
        }}
        onCancel={() => setConfirm((current) => ({ ...current, open: false }))}
        isLoading={pendingId !== null}
      />
    </div>
  );
}
