"use client";

import { useMemo, useState } from "react";
import { Layers, Pencil, Plus, Save, Trash2, X } from "lucide-react";

type CategoryItem = {
  id: string;
  name: string;
  description: string | null;
};

type CategoriesManagerProps = {
  canManage: boolean;
  initialCategories: CategoryItem[];
};

const EMPTY_DRAFT = { name: "", description: "" };

export function CategoriesManager({
  canManage,
  initialCategories,
}: CategoriesManagerProps) {
  const [categories, setCategories] = useState(initialCategories);
  const [draft, setDraft] = useState(EMPTY_DRAFT);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingDraft, setEditingDraft] = useState(EMPTY_DRAFT);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const sortedCategories = useMemo(
    () => [...categories].sort((a, b) => a.name.localeCompare(b.name)),
    [categories],
  );

  async function createCategory() {
    if (!draft.name.trim()) return;

    setError(null);
    setIsSubmitting(true);

    const response = await fetch("/api/categories", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: draft.name.trim(),
        description: draft.description.trim(),
      }),
    });

    setIsSubmitting(false);

    if (!response.ok) {
      const body = (await response.json().catch(() => null)) as {
        error?: string;
      } | null;
      setError(body?.error ?? "Unable to create category.");
      return;
    }

    const created = (await response.json()) as CategoryItem;
    setCategories((current) => [...current, created]);
    setDraft(EMPTY_DRAFT);
  }

  function startEdit(category: CategoryItem) {
    setEditingId(category.id);
    setEditingDraft({
      name: category.name,
      description: category.description ?? "",
    });
    setError(null);
  }

  async function saveEdit(id: string) {
    if (!editingDraft.name.trim()) return;

    setError(null);
    setIsSubmitting(true);

    const response = await fetch(`/api/categories/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: editingDraft.name.trim(),
        description: editingDraft.description.trim(),
      }),
    });

    setIsSubmitting(false);

    if (!response.ok) {
      const body = (await response.json().catch(() => null)) as {
        error?: string;
      } | null;
      setError(body?.error ?? "Unable to update category.");
      return;
    }

    const updated = (await response.json()) as CategoryItem;

    setCategories((current) =>
      current.map((category) =>
        category.id === id ? updated : category,
      ),
    );
    setEditingId(null);
    setEditingDraft(EMPTY_DRAFT);
  }

  async function deleteCategory(id: string) {
    setError(null);
    setIsSubmitting(true);

    const response = await fetch(`/api/categories/${id}`, {
      method: "DELETE",
    });

    setIsSubmitting(false);

    if (!response.ok) {
      const body = (await response.json().catch(() => null)) as {
        error?: string;
      } | null;
      setError(body?.error ?? "Unable to delete category.");
      return;
    }

    setCategories((current) =>
      current.filter((category) => category.id !== id),
    );
    if (editingId === id) {
      setEditingId(null);
      setEditingDraft(EMPTY_DRAFT);
    }
  }

  return (
    <div className="space-y-6">
      {/* Create form */}
      {canManage && (
        <div className="rounded-xl border border-border bg-card p-5">
          <div className="flex items-start gap-3">
            <div className="mt-0.5 rounded-lg bg-primary/10 p-2 text-primary">
              <Layers className="h-4 w-4" />
            </div>
            <div className="min-w-0 flex-1">
              <h2 className="font-display text-lg font-semibold text-foreground">
                Create Category
              </h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Add a new category to organize spiels across departments.
              </p>

              <div className="mt-4 grid gap-3 md:grid-cols-[1fr_1.2fr_auto]">
                <input
                  value={draft.name}
                  onChange={(event) =>
                    setDraft((current) => ({
                      ...current,
                      name: event.target.value,
                    }))
                  }
                  placeholder="Category name"
                  className="w-full rounded-md border border-border bg-background px-3 py-2.5 text-sm text-foreground outline-none focus:border-primary focus:ring-2 focus:ring-primary/10"
                />
                <input
                  value={draft.description}
                  onChange={(event) =>
                    setDraft((current) => ({
                      ...current,
                      description: event.target.value,
                    }))
                  }
                  placeholder="Description (optional)"
                  className="w-full rounded-md border border-border bg-background px-3 py-2.5 text-sm text-foreground outline-none focus:border-primary focus:ring-2 focus:ring-primary/10"
                />
                <button
                  type="button"
                  onClick={createCategory}
                  disabled={isSubmitting || !draft.name.trim()}
                  className="inline-flex items-center justify-center gap-2 rounded-md bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  <Plus className="h-4 w-4" />
                  New Category
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Error message */}
      {error && (
        <div className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {/* Category list */}
      {sortedCategories.length === 0 ? (
        <div className="rounded-md border border-border bg-card">
          <div className="px-5 py-12 text-center">
            <p className="text-sm text-muted-foreground">No categories yet.</p>
          </div>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {sortedCategories.map((category) => {
            const isEditing = editingId === category.id;

            return (
              <div
                key={category.id}
                className="rounded-xl border border-border bg-card p-5"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0 flex-1">
                    {isEditing ? (
                      <div className="space-y-3">
                        <input
                          value={editingDraft.name}
                          onChange={(event) =>
                            setEditingDraft((current) => ({
                              ...current,
                              name: event.target.value,
                            }))
                          }
                          className="w-full rounded-md border border-border bg-background px-3 py-2.5 text-sm text-foreground outline-none focus:border-primary focus:ring-2 focus:ring-primary/10"
                        />
                        <textarea
                          value={editingDraft.description}
                          onChange={(event) =>
                            setEditingDraft((current) => ({
                              ...current,
                              description: event.target.value,
                            }))
                          }
                          rows={3}
                          className="w-full resize-none rounded-md border border-border bg-background px-3 py-2.5 text-sm text-foreground outline-none focus:border-primary focus:ring-2 focus:ring-primary/10"
                        />
                      </div>
                    ) : (
                      <>
                        <div className="flex items-center gap-2">
                          <div className="rounded-lg bg-primary/10 p-2 text-primary">
                            <Layers className="h-4 w-4" />
                          </div>
                          <div className="min-w-0">
                            <h2 className="truncate font-display text-lg font-semibold text-foreground">
                              {category.name}
                            </h2>
                          </div>
                        </div>
                        <p className="mt-3 text-sm text-muted-foreground">
                          {category.description || "No description yet."}
                        </p>
                      </>
                    )}
                  </div>

                  {canManage && (
                    <div className="flex items-center gap-1 shrink-0">
                      {isEditing ? (
                        <>
                          <button
                            type="button"
                            onClick={() => saveEdit(category.id)}
                            disabled={isSubmitting || !editingDraft.name.trim()}
                            className="rounded-md p-2 text-muted-foreground transition-colors hover:bg-primary/10 hover:text-primary disabled:cursor-not-allowed disabled:opacity-40"
                            title="Save category"
                          >
                            <Save className="h-4 w-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setEditingId(null);
                              setEditingDraft(EMPTY_DRAFT);
                            }}
                            disabled={isSubmitting}
                            className="rounded-md p-2 text-muted-foreground transition-colors hover:bg-accent hover:text-foreground disabled:cursor-not-allowed disabled:opacity-40"
                            title="Cancel edit"
                          >
                            <X className="h-4 w-4" />
                          </button>
                        </>
                      ) : (
                        <>
                          <button
                            type="button"
                            onClick={() => startEdit(category)}
                            className="rounded-md p-2 text-muted-foreground transition-colors hover:bg-primary/10 hover:text-primary"
                            title="Edit category"
                          >
                            <Pencil className="h-4 w-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => deleteCategory(category.id)}
                            disabled={isSubmitting}
                            className="rounded-md p-2 text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive disabled:cursor-not-allowed disabled:opacity-40"
                            title="Delete category"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </>
                      )}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
