"use client";

import { useEffect, useRef, useState } from "react";
import { Loader2, Pencil, Plus, Trash2, X } from "lucide-react";

export type CategoryOption = {
  id: string;
  name: string;
  description: string | null;
};

type CategoryManagerModalProps = {
  categories: CategoryOption[];
  isOpen: boolean;
  onClose: () => void;
  onCreate: (input: { name: string; description: string }) => Promise<void>;
  onUpdate: (
    id: string,
    updates: { name?: string; description?: string },
  ) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
};

type CreateState = {
  name: string;
  description: string;
};

type EditState = {
  name: string;
  description: string;
};

export function CategoryManagerModal({
  categories,
  isOpen,
  onClose,
  onCreate,
  onUpdate,
  onDelete,
}: CategoryManagerModalProps) {
  const panelRef = useRef<HTMLDivElement | null>(null);
  const [createState, setCreateState] = useState<CreateState>({
    name: "",
    description: "",
  });
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editState, setEditState] = useState<EditState>({
    name: "",
    description: "",
  });
  const [isCreating, setIsCreating] = useState(false);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    function handleEscape(event: KeyboardEvent) {
      if (event.key === "Escape") {
        onClose();
      }
    }

    function handlePointerDown(event: MouseEvent) {
      if (!panelRef.current?.contains(event.target as Node)) {
        onClose();
      }
    }

    document.body.style.overflow = "hidden";
    document.addEventListener("keydown", handleEscape);
    document.addEventListener("mousedown", handlePointerDown);

    return () => {
      document.body.style.overflow = "";
      document.removeEventListener("keydown", handleEscape);
      document.removeEventListener("mousedown", handlePointerDown);
    };
  }, [isOpen, onClose]);

  useEffect(() => {
    if (!isOpen) {
      setError(null);
      setEditingId(null);
      setEditState({ name: "", description: "" });
    }
  }, [isOpen]);

  if (!isOpen) {
    return null;
  }

  async function handleCreate() {
    setError(null);

    if (!createState.name.trim()) {
      setError("Category name is required.");
      return;
    }

    setIsCreating(true);

    try {
      await onCreate({
        name: createState.name.trim(),
        description: createState.description.trim(),
      });
      setCreateState({ name: "", description: "" });
    } catch (createError) {
      setError(
        createError instanceof Error
          ? createError.message
          : "Unable to create category.",
      );
    } finally {
      setIsCreating(false);
    }
  }

  function startEditing(category: CategoryOption) {
    setError(null);
    setEditingId(category.id);
    setEditState({
      name: category.name,
      description: category.description ?? "",
    });
  }

  async function handleUpdate(id: string) {
    setError(null);

    if (!editState.name.trim()) {
      setError("Category name is required.");
      return;
    }

    setSavingId(id);

    try {
      await onUpdate(id, {
        name: editState.name.trim(),
        description: editState.description.trim(),
      });
      setEditingId(null);
      setEditState({ name: "", description: "" });
    } catch (updateError) {
      setError(
        updateError instanceof Error
          ? updateError.message
          : "Unable to update category.",
      );
    } finally {
      setSavingId(null);
    }
  }

  async function handleDelete(id: string) {
    setError(null);
    setDeletingId(id);

    try {
      await onDelete(id);
      if (editingId === id) {
        setEditingId(null);
        setEditState({ name: "", description: "" });
      }
    } catch (deleteError) {
      setError(
        deleteError instanceof Error
          ? deleteError.message
          : "Unable to delete category.",
      );
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/40 px-4 py-6">
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="category-manager-title"
        className="flex max-h-[min(720px,90vh)] w-full max-w-2xl flex-col overflow-hidden rounded-2xl border border-border bg-popover shadow-[0_24px_80px_rgba(0,0,0,0.22)]"
      >
        <div className="flex items-start justify-between gap-4 border-b border-border px-6 py-5">
          <div>
            <h2
              id="category-manager-title"
              className="font-display text-xl font-semibold text-foreground"
            >
              Manage Categories
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Create, update, and remove categories without leaving the editor.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-md p-2 text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
            aria-label="Close category manager"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="grid gap-6 overflow-y-auto px-6 py-6 md:grid-cols-[minmax(0,1fr)_minmax(0,1.25fr)]">
          <div className="rounded-xl border border-border bg-muted/30 p-4">
            <div className="flex items-center gap-2">
              <div className="rounded-full bg-primary/10 p-2 text-primary">
                <Plus className="h-4 w-4" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-foreground">
                  New Category
                </h3>
                <p className="text-xs text-muted-foreground">
                  Add a category for future spiels.
                </p>
              </div>
            </div>

            <div className="mt-4 space-y-3">
              <div>
                <label className="mb-1.5 block text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                  Name
                </label>
                <input
                  value={createState.name}
                  onChange={(event) =>
                    setCreateState((current) => ({
                      ...current,
                      name: event.target.value,
                    }))
                  }
                  placeholder="Customer Support"
                  className="w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm text-foreground outline-none transition-all focus:border-primary focus:ring-2 focus:ring-primary/10"
                />
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                  Description
                </label>
                <textarea
                  value={createState.description}
                  onChange={(event) =>
                    setCreateState((current) => ({
                      ...current,
                      description: event.target.value,
                    }))
                  }
                  rows={4}
                  placeholder="Optional note to help your team understand when to use this category."
                  className="w-full resize-none rounded-lg border border-border bg-background px-3 py-2.5 text-sm text-foreground outline-none transition-all focus:border-primary focus:ring-2 focus:ring-primary/10"
                />
              </div>
              <button
                type="button"
                onClick={handleCreate}
                disabled={isCreating}
                className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isCreating ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Plus className="h-4 w-4" />
                )}
                {isCreating ? "Creating..." : "Create Category"}
              </button>
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-semibold text-foreground">
                  Existing Categories
                </h3>
                <p className="text-xs text-muted-foreground">
                  These are available across your company.
                </p>
              </div>
              <span className="rounded-full bg-muted px-2.5 py-1 text-xs font-medium text-muted-foreground">
                {categories.length}
              </span>
            </div>

            {error && (
              <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                {error}
              </div>
            )}

            <div className="space-y-3">
              {categories.length === 0 ? (
                <div className="rounded-xl border border-dashed border-border bg-muted/30 px-4 py-8 text-center text-sm text-muted-foreground">
                  No categories yet.
                </div>
              ) : (
                categories.map((category) => {
                  const isEditing = editingId === category.id;
                  const isSaving = savingId === category.id;
                  const isDeleting = deletingId === category.id;

                  return (
                    <div
                      key={category.id}
                      className="rounded-xl border border-border bg-card p-4"
                    >
                      {isEditing ? (
                        <div className="space-y-3">
                          <input
                            value={editState.name}
                            onChange={(event) =>
                              setEditState((current) => ({
                                ...current,
                                name: event.target.value,
                              }))
                            }
                            className="w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm text-foreground outline-none transition-all focus:border-primary focus:ring-2 focus:ring-primary/10"
                          />
                          <textarea
                            value={editState.description}
                            onChange={(event) =>
                              setEditState((current) => ({
                                ...current,
                                description: event.target.value,
                              }))
                            }
                            rows={3}
                            className="w-full resize-none rounded-lg border border-border bg-background px-3 py-2.5 text-sm text-foreground outline-none transition-all focus:border-primary focus:ring-2 focus:ring-primary/10"
                          />
                          <div className="flex items-center justify-end gap-2">
                            <button
                              type="button"
                              onClick={() => {
                                setEditingId(null);
                                setEditState({ name: "", description: "" });
                              }}
                              className="rounded-lg border border-border px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-accent"
                            >
                              Cancel
                            </button>
                            <button
                              type="button"
                              onClick={() => handleUpdate(category.id)}
                              disabled={isSaving}
                              className="inline-flex items-center gap-2 rounded-lg bg-foreground px-3 py-2 text-sm font-semibold text-background transition-colors hover:bg-foreground/90 disabled:cursor-not-allowed disabled:opacity-60"
                            >
                              {isSaving && (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              )}
                              {isSaving ? "Saving..." : "Save Changes"}
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div>
                          <div className="flex items-start justify-between gap-3">
                            <div className="min-w-0">
                              <h4 className="text-sm font-semibold text-foreground">
                                {category.name}
                              </h4>
                              <p className="mt-1 text-sm text-muted-foreground">
                                {category.description?.trim() ||
                                  "No description added yet."}
                              </p>
                            </div>
                            <div className="flex shrink-0 items-center gap-1">
                              <button
                                type="button"
                                onClick={() => startEditing(category)}
                                className="rounded-md p-2 text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
                                aria-label={`Edit ${category.name}`}
                              >
                                <Pencil className="h-4 w-4" />
                              </button>
                              <button
                                type="button"
                                onClick={() => handleDelete(category.id)}
                                disabled={isDeleting}
                                className="rounded-md p-2 text-destructive transition-colors hover:bg-destructive/10 hover:text-destructive disabled:cursor-not-allowed disabled:opacity-60"
                                aria-label={`Delete ${category.name}`}
                              >
                                {isDeleting ? (
                                  <Loader2 className="h-4 w-4 animate-spin" />
                                ) : (
                                  <Trash2 className="h-4 w-4" />
                                )}
                              </button>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
