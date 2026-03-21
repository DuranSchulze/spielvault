"use client";

import { useMemo, useState } from "react";
import {
  BookOpen,
  Building2,
  Pencil,
  Plus,
  Save,
  Trash2,
  Users,
  X,
} from "lucide-react";

type DepartmentUser = {
  id: string;
  name: string;
  email: string;
};

type DepartmentSpiel = {
  id: string;
  title: string;
};

type DepartmentCard = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  spielCount: number;
  userCount: number;
  spiels: DepartmentSpiel[];
  users: DepartmentUser[];
};

type DepartmentsManagerProps = {
  canManage: boolean;
  initialDepartments: DepartmentCard[];
  currentUser: DepartmentUser;
};

type DepartmentDraft = {
  name: string;
  description: string;
};

const EMPTY_DRAFT: DepartmentDraft = {
  name: "",
  description: "",
};

export function DepartmentsManager({
  canManage,
  initialDepartments,
  currentUser,
}: DepartmentsManagerProps) {
  const [departments, setDepartments] = useState(initialDepartments);
  const [draft, setDraft] = useState<DepartmentDraft>(EMPTY_DRAFT);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingDraft, setEditingDraft] =
    useState<DepartmentDraft>(EMPTY_DRAFT);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const sortedDepartments = useMemo(
    () => [...departments].sort((a, b) => a.name.localeCompare(b.name)),
    [departments],
  );

  async function createDepartment() {
    if (!draft.name.trim()) return;

    setError(null);
    setIsSubmitting(true);

    const response = await fetch("/api/departments", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        name: draft.name,
        description: draft.description,
      }),
    });

    setIsSubmitting(false);

    if (!response.ok) {
      const body = (await response.json().catch(() => null)) as {
        error?: string;
      } | null;
      setError(body?.error ?? "Unable to create department.");
      return;
    }

    const created = (await response.json()) as {
      id: string;
      name: string;
      slug: string;
      description: string | null;
    };

    setDepartments((current) => [
      ...current,
      {
        ...created,
        spielCount: 0,
        userCount: 1,
        spiels: [],
        users: [currentUser],
      },
    ]);
    setDraft(EMPTY_DRAFT);
  }

  function startEdit(department: DepartmentCard) {
    setEditingId(department.id);
    setEditingDraft({
      name: department.name,
      description: department.description ?? "",
    });
    setError(null);
  }

  async function saveEdit(id: string) {
    if (!editingDraft.name.trim()) return;

    setError(null);
    setIsSubmitting(true);

    const response = await fetch(`/api/departments/${id}`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        name: editingDraft.name,
        description: editingDraft.description,
      }),
    });

    setIsSubmitting(false);

    if (!response.ok) {
      const body = (await response.json().catch(() => null)) as {
        error?: string;
      } | null;
      setError(body?.error ?? "Unable to update department.");
      return;
    }

    const updated = (await response.json()) as {
      id: string;
      name: string;
      slug: string;
      description: string | null;
    };

    setDepartments((current) =>
      current.map((department) =>
        department.id === id ? { ...department, ...updated } : department,
      ),
    );
    setEditingId(null);
    setEditingDraft(EMPTY_DRAFT);
  }

  async function deleteDepartment(id: string) {
    setError(null);
    setIsSubmitting(true);

    const response = await fetch(`/api/departments/${id}`, {
      method: "DELETE",
    });

    setIsSubmitting(false);

    if (!response.ok) {
      const body = (await response.json().catch(() => null)) as {
        error?: string;
      } | null;
      setError(body?.error ?? "Unable to delete department.");
      return;
    }

    setDepartments((current) =>
      current.filter((department) => department.id !== id),
    );
  }

  return (
    <div className="space-y-6">
      {canManage && (
        <div className="rounded-xl border border-border bg-card p-5">
          <div className="flex items-start gap-3">
            <div className="mt-0.5 rounded-lg bg-primary/10 p-2 text-primary">
              <Building2 className="h-4 w-4" />
            </div>
            <div className="min-w-0 flex-1">
              <h2 className="font-display text-lg font-semibold text-foreground">
                Create Department
              </h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Add a new department and make it available across the workspace.
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
                  placeholder="Department name"
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
                  onClick={createDepartment}
                  disabled={isSubmitting || !draft.name.trim()}
                  className="inline-flex items-center justify-center gap-2 rounded-md bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  <Plus className="h-4 w-4" />
                  New Department
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {error && (
        <div className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {sortedDepartments.length === 0 ? (
        <div className="rounded-md border border-border bg-card">
          <div className="px-5 py-12 text-center">
            <p className="text-sm text-muted-foreground">No departments yet.</p>
          </div>
        </div>
      ) : (
        <div className="grid gap-4 xl:grid-cols-2">
          {sortedDepartments.map((department) => {
            const isEditing = editingId === department.id;

            return (
              <div
                key={department.id}
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
                            <Building2 className="h-4 w-4" />
                          </div>
                          <div className="min-w-0">
                            <h2 className="truncate font-display text-lg font-semibold text-foreground">
                              {department.name}
                            </h2>
                            <p className="text-xs uppercase tracking-widest text-muted-foreground/60">
                              {department.slug}
                            </p>
                          </div>
                        </div>
                        <p className="mt-3 text-sm text-muted-foreground">
                          {department.description || "No description yet."}
                        </p>
                      </>
                    )}
                  </div>

                  {canManage && (
                    <div className="flex items-center gap-1">
                      {isEditing ? (
                        <>
                          <button
                            type="button"
                            onClick={() => saveEdit(department.id)}
                            disabled={isSubmitting || !editingDraft.name.trim()}
                            className="rounded-md p-2 text-muted-foreground transition-colors hover:bg-primary/10 hover:text-primary disabled:cursor-not-allowed disabled:opacity-40"
                            title="Save department"
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
                            onClick={() => startEdit(department)}
                            className="rounded-md p-2 text-muted-foreground transition-colors hover:bg-primary/10 hover:text-primary"
                            title="Edit department"
                          >
                            <Pencil className="h-4 w-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => deleteDepartment(department.id)}
                            disabled={isSubmitting}
                            className="rounded-md p-2 text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive disabled:cursor-not-allowed disabled:opacity-40"
                            title="Delete department"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </>
                      )}
                    </div>
                  )}
                </div>

                <div className="mt-5 grid gap-3 sm:grid-cols-2">
                  <div className="rounded-lg border border-border bg-muted/40 p-3">
                    <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
                      <BookOpen className="h-4 w-4 text-primary" />
                      Spiels
                      <span className="ml-auto rounded-full bg-primary/10 px-2 py-0.5 text-xs text-primary">
                        {department.spielCount}
                      </span>
                    </div>
                    <div className="mt-3 space-y-1.5">
                      {department.spiels.length === 0 ? (
                        <p className="text-xs text-muted-foreground/60">
                          No spiels in this department yet.
                        </p>
                      ) : (
                        department.spiels.map((spiel) => (
                          <div
                            key={spiel.id}
                            className="truncate text-sm text-muted-foreground"
                          >
                            {spiel.title}
                          </div>
                        ))
                      )}
                    </div>
                  </div>

                  <div className="rounded-lg border border-border bg-muted/40 p-3">
                    <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
                      <Users className="h-4 w-4 text-primary" />
                      Users
                      <span className="ml-auto rounded-full bg-primary/10 px-2 py-0.5 text-xs text-primary">
                        {department.userCount}
                      </span>
                    </div>
                    <div className="mt-3 space-y-1.5">
                      {department.users.length === 0 ? (
                        <p className="text-xs text-muted-foreground/60">
                          No users assigned to this department.
                        </p>
                      ) : (
                        department.users.map((user) => (
                          <div key={user.id} className="truncate">
                            <div className="text-sm text-muted-foreground">
                              {user.name}
                            </div>
                            <div className="text-xs text-muted-foreground/60">
                              {user.email}
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
