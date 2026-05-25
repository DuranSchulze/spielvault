"use client";

import { useMemo, useState } from "react";
import {
  Check,
  Pencil,
  Plus,
  Save,
  ShieldAlert,
  ShieldCheck,
  Trash2,
  UserIcon,
  X,
} from "lucide-react";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";

type UserDepartment = {
  department: {
    id: string;
    name: string;
  };
};

export type UserItem = {
  id: string;
  name: string;
  email: string;
  role: string;
  isActive: boolean;
  createdAt: Date;
  departments: UserDepartment[];
};

type DepartmentOption = {
  id: string;
  name: string;
};

type UsersManagerProps = {
  canManage: boolean;
  initialUsers: UserItem[];
  departments: DepartmentOption[];
};

const EMPTY_CREATE = {
  name: "",
  email: "",
  password: "",
  role: "employee" as string,
  departmentIds: [] as string[],
};

const ROLE_OPTIONS = [
  { value: "employee", label: "Employee", icon: UserIcon },
  { value: "admin", label: "Admin", icon: ShieldCheck },
  { value: "super_admin", label: "Super Admin", icon: ShieldAlert },
];

export function UsersManager({
  canManage,
  initialUsers,
  departments,
}: UsersManagerProps) {
  const [users, setUsers] = useState(initialUsers);
  const [showCreate, setShowCreate] = useState(false);
  const [create, setCreate] = useState(EMPTY_CREATE);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingRole, setEditingRole] = useState<string>("");
  const [editingDeptIds, setEditingDeptIds] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showDeactivateConfirm, setShowDeactivateConfirm] = useState<
    string | null
  >(null);

  const sortedUsers = useMemo(
    () => [...users].sort((a, b) => a.name.localeCompare(b.name)),
    [users],
  );

  function getRoleIcon(role: string) {
    const option = ROLE_OPTIONS.find((o) => o.value === role);
    return option?.icon ?? UserIcon;
  }

  function getRoleLabel(role: string) {
    return ROLE_OPTIONS.find((o) => o.value === role)?.label ?? role;
  }

  async function createUser() {
    setError(null);

    if (!create.name.trim() || !create.email.trim() || !create.password) {
      setError("Name, email, and password are required.");
      return;
    }

    setIsSubmitting(true);

    const response = await fetch("/api/users", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: create.name.trim(),
        email: create.email.trim(),
        password: create.password,
        role: create.role,
        departmentIds: create.departmentIds,
      }),
    });

    setIsSubmitting(false);

    if (!response.ok) {
      const body = (await response.json().catch(() => null)) as {
        error?: string;
      } | null;
      setError(body?.error ?? "Unable to create user.");
      return;
    }

    // Refetch the full user list to get departments populated
    const listResponse = await fetch("/api/users");
    const updatedUsers = (await listResponse.json()) as UserItem[];
    setUsers(updatedUsers);

    setShowCreate(false);
    setCreate(EMPTY_CREATE);
  }

  function startEdit(user: UserItem) {
    setEditingId(user.id);
    setEditingRole(user.role);
    setEditingDeptIds(user.departments.map((d) => d.department.id));
    setError(null);
  }

  async function saveEdit(id: string) {
    setError(null);
    setIsSubmitting(true);

    const response = await fetch(`/api/users/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        role: editingRole,
        departmentIds: editingDeptIds,
      }),
    });

    setIsSubmitting(false);

    if (!response.ok) {
      const body = (await response.json().catch(() => null)) as {
        error?: string;
      } | null;
      setError(body?.error ?? "Unable to update user.");
      return;
    }

    // Refetch
    const listResponse = await fetch("/api/users");
    const updatedUsers = (await listResponse.json()) as UserItem[];
    setUsers(updatedUsers);

    setEditingId(null);
  }

  async function deactivateUser(id: string) {
    setShowDeactivateConfirm(null);
    setError(null);
    setIsSubmitting(true);

    const response = await fetch(`/api/users/${id}`, {
      method: "DELETE",
    });

    setIsSubmitting(false);

    if (!response.ok) {
      const body = (await response.json().catch(() => null)) as {
        error?: string;
      } | null;
      setError(body?.error ?? "Unable to deactivate user.");
      return;
    }

    const listResponse = await fetch("/api/users");
    const updatedUsers = (await listResponse.json()) as UserItem[];
    setUsers(updatedUsers);
  }

  function toggleCreateDept(deptId: string) {
    setCreate((current) => ({
      ...current,
      departmentIds: current.departmentIds.includes(deptId)
        ? current.departmentIds.filter((id) => id !== deptId)
        : [...current.departmentIds, deptId],
    }));
  }

  function toggleEditDept(deptId: string) {
    setEditingDeptIds((current) =>
      current.includes(deptId)
        ? current.filter((id) => id !== deptId)
        : [...current, deptId],
    );
  }

  return (
    <div className="space-y-6">
      {/* Create panel */}
      {canManage && showCreate && (
        <div className="rounded-xl border border-border bg-card p-5">
          <div className="flex items-start justify-between gap-4 mb-4">
            <div>
              <h2 className="font-display text-lg font-semibold text-foreground">
                Create User
              </h2>
              <p className="text-sm text-muted-foreground">
                Add a new team member. They will receive login credentials.
              </p>
            </div>
            <button
              type="button"
              onClick={() => {
                setShowCreate(false);
                setCreate(EMPTY_CREATE);
              }}
              className="rounded-md p-2 text-muted-foreground hover:bg-accent hover:text-foreground transition-colors"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            <input
              value={create.name}
              onChange={(e) =>
                setCreate((c) => ({ ...c, name: e.target.value }))
              }
              placeholder="Full Name"
              className="rounded-md border border-border bg-background px-3 py-2.5 text-sm text-foreground outline-none focus:border-primary focus:ring-2 focus:ring-primary/10"
            />
            <input
              value={create.email}
              onChange={(e) =>
                setCreate((c) => ({ ...c, email: e.target.value }))
              }
              type="email"
              placeholder="Email Address"
              className="rounded-md border border-border bg-background px-3 py-2.5 text-sm text-foreground outline-none focus:border-primary focus:ring-2 focus:ring-primary/10"
            />
            <input
              value={create.password}
              onChange={(e) =>
                setCreate((c) => ({ ...c, password: e.target.value }))
              }
              type="password"
              placeholder="Set Password"
              className="rounded-md border border-border bg-background px-3 py-2.5 text-sm text-foreground outline-none focus:border-primary focus:ring-2 focus:ring-primary/10"
            />
          </div>

          {/* Role + Departments */}
          <div className="mt-4 grid gap-4 md:grid-cols-2">
            <div>
              <label className="mb-1.5 block text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                Role
              </label>
              <div className="flex gap-2">
                {ROLE_OPTIONS.map((option) => {
                  const Icon = option.icon;
                  return (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() =>
                        setCreate((c) => ({ ...c, role: option.value }))
                      }
                      className={`flex items-center gap-1.5 rounded-md px-3 py-2 text-xs font-medium transition-colors ${
                        create.role === option.value
                          ? "bg-primary text-primary-foreground"
                          : "border border-border text-muted-foreground hover:border-primary/30"
                      }`}
                    >
                      <Icon className="h-3.5 w-3.5" />
                      {option.label}
                    </button>
                  );
                })}
              </div>
            </div>

            <div>
              <label className="mb-1.5 block text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                Departments
              </label>
              <div className="flex flex-wrap gap-1.5">
                {departments.map((dept) => {
                  const active = create.departmentIds.includes(dept.id);
                  return (
                    <button
                      key={dept.id}
                      type="button"
                      onClick={() => toggleCreateDept(dept.id)}
                      className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium transition-colors ${
                        active
                          ? "bg-primary/10 text-primary"
                          : "border border-border text-muted-foreground hover:border-primary/30"
                      }`}
                    >
                      {active && <Check className="h-3 w-3" />}
                      {dept.name}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {error && (
            <p className="mt-3 text-sm text-red-600" role="alert">
              {error}
            </p>
          )}

          <div className="mt-4 flex items-center gap-2">
            <button
              type="button"
              onClick={createUser}
              disabled={isSubmitting}
              className="inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <Plus className="h-4 w-4" />
              {isSubmitting ? "Creating..." : "Create User"}
            </button>
            <button
              type="button"
              onClick={() => {
                setShowCreate(false);
                setCreate(EMPTY_CREATE);
              }}
              className="rounded-md border border-border px-4 py-2.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-accent"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {error && !showCreate && (
        <div className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {/* User list */}
      {sortedUsers.length === 0 ? (
        <div className="rounded-md border border-border bg-card">
          <div className="px-5 py-12 text-center">
            <p className="text-sm text-muted-foreground">No users yet.</p>
          </div>
        </div>
      ) : (
        <div className="rounded-xl border border-border bg-card overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border bg-muted/30">
                <th className="text-left px-5 py-3 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
                  User
                </th>
                <th className="text-left px-5 py-3 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
                  Role
                </th>
                <th className="text-left px-5 py-3 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
                  Departments
                </th>
                <th className="text-left px-5 py-3 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
                  Status
                </th>
                {canManage && (
                  <th className="text-right px-5 py-3 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
                    Actions
                  </th>
                )}
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {sortedUsers.map((user) => {
                const RoleIcon = getRoleIcon(user.role);
                const isEditing = editingId === user.id;

                return (
                  <tr
                    key={user.id}
                    className={`transition-colors ${
                      !user.isActive ? "opacity-50" : "hover:bg-muted/20"
                    }`}
                  >
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10">
                          <span className="text-xs font-bold text-primary">
                            {user.name.charAt(0).toUpperCase()}
                          </span>
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-semibold text-foreground truncate">
                            {user.name}
                          </p>
                          <p className="text-xs text-muted-foreground truncate">
                            {user.email}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      {isEditing ? (
                        <select
                          value={editingRole}
                          onChange={(e) => setEditingRole(e.target.value)}
                          className="rounded-md border border-border bg-background px-2 py-1.5 text-xs text-foreground outline-none focus:border-primary"
                        >
                          {ROLE_OPTIONS.map((opt) => (
                            <option key={opt.value} value={opt.value}>
                              {opt.label}
                            </option>
                          ))}
                        </select>
                      ) : (
                        <div className="flex items-center gap-1.5">
                          <RoleIcon className="h-3.5 w-3.5 text-primary" />
                          <span className="text-sm text-foreground capitalize">
                            {getRoleLabel(user.role)}
                          </span>
                        </div>
                      )}
                    </td>
                    <td className="px-5 py-4">
                      {isEditing ? (
                        <div className="flex flex-wrap gap-1">
                          {departments.map((dept) => {
                            const active = editingDeptIds.includes(dept.id);
                            return (
                              <button
                                key={dept.id}
                                type="button"
                                onClick={() => toggleEditDept(dept.id)}
                                className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-medium transition-colors ${
                                  active
                                    ? "bg-primary/10 text-primary"
                                    : "border border-border text-muted-foreground"
                                }`}
                              >
                                {active && <Check className="h-2.5 w-2.5" />}
                                {dept.name}
                              </button>
                            );
                          })}
                        </div>
                      ) : (
                        <div className="flex flex-wrap gap-1">
                          {user.departments.length === 0 ? (
                            <span className="text-xs text-muted-foreground/60">
                              None
                            </span>
                          ) : (
                            user.departments.map((d) => (
                              <span
                                key={d.department.id}
                                className="inline-flex rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-medium text-primary"
                              >
                                {d.department.name}
                              </span>
                            ))
                          )}
                        </div>
                      )}
                    </td>
                    <td className="px-5 py-4">
                      <span
                        className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-medium ${
                          user.isActive
                            ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                            : "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
                        }`}
                      >
                        {user.isActive ? "Active" : "Inactive"}
                      </span>
                    </td>
                    {canManage && (
                      <td className="px-5 py-4 text-right">
                        {isEditing ? (
                          <div className="flex items-center justify-end gap-1">
                            <button
                              type="button"
                              onClick={() => saveEdit(user.id)}
                              disabled={isSubmitting}
                              className="rounded-md p-2 text-muted-foreground hover:bg-primary/10 hover:text-primary transition-colors disabled:opacity-40"
                              title="Save changes"
                            >
                              <Save className="h-4 w-4" />
                            </button>
                            <button
                              type="button"
                              onClick={() => setEditingId(null)}
                              className="rounded-md p-2 text-muted-foreground hover:bg-accent hover:text-foreground transition-colors"
                              title="Cancel edit"
                            >
                              <X className="h-4 w-4" />
                            </button>
                          </div>
                        ) : (
                          <div className="flex items-center justify-end gap-1">
                            <button
                              type="button"
                              onClick={() => startEdit(user)}
                              className="rounded-md p-2 text-muted-foreground hover:bg-primary/10 hover:text-primary transition-colors"
                              title="Edit user"
                            >
                              <Pencil className="h-4 w-4" />
                            </button>
                            {user.isActive && (
                              <button
                                type="button"
                                onClick={() =>
                                  setShowDeactivateConfirm(user.id)
                                }
                                disabled={isSubmitting}
                                className="rounded-md p-2 text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-colors disabled:opacity-40"
                                title="Deactivate user"
                              >
                                <Trash2 className="h-4 w-4" />
                              </button>
                            )}
                          </div>
                        )}
                      </td>
                    )}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Deactivate Confirmation Dialog */}
      <ConfirmDialog
        open={showDeactivateConfirm !== null}
        title="Deactivate user"
        description="Deactivate this user? They will not be able to log in."
        variant="destructive"
        confirmLabel="Deactivate"
        onConfirm={() => {
          if (showDeactivateConfirm) {
            deactivateUser(showDeactivateConfirm);
          }
        }}
        onCancel={() => setShowDeactivateConfirm(null)}
        isLoading={isSubmitting}
      />
    </div>
  );
}
