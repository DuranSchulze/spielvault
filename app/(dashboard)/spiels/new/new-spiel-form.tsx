"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import { useEffect, useRef, useState, type MutableRefObject } from "react";
import { useRouter } from "next/navigation";
import { Check, Copy, Plus, Save, X } from "lucide-react";
import type { SpielEditorValue } from "@/components/editor/spiel-editor";
import {
  VariablePanel,
  type SpielVar,
} from "@/components/editor/variable-panel";
import {
  CategoryManagerModal,
  type CategoryOption,
} from "./category-manager-modal";

const SpielEditor = dynamic(
  () =>
    import("@/components/editor/spiel-editor").then(
      (module) => module.SpielEditor,
    ),
  {
    ssr: false,
    loading: () => (
      <div className="border border-border rounded-lg h-[420px] bg-card animate-pulse" />
    ),
  },
);

type Option = {
  id: string;
  name: string;
};

type InitialSpielData = {
  id: string;
  title: string;
  departmentId: string;
  categoryId: string | null;
  contentHtml: string | null;
  contentJson: string | null;
  contentPlain: string | null;
  status?: string;
};

type LatestRejection = {
  comment: string | null;
  reviewerName: string;
} | null;

type NewSpielFormProps = {
  departments: Option[];
  categories: CategoryOption[];
  initialData?: InitialSpielData;
  isAdmin?: boolean;
  userRole?: string;
  latestRejection?: LatestRejection;
};

export function NewSpielForm({
  departments,
  categories,
  initialData,
  isAdmin = false,
  latestRejection,
}: NewSpielFormProps) {
  const router = useRouter();
  const isEditMode = !!initialData;
  const status = initialData?.status ?? "active";

  const [title, setTitle] = useState(initialData?.title ?? "");
  const [departmentId, setDepartmentId] = useState(
    initialData?.departmentId ?? departments[0]?.id ?? "",
  );
  const [categoryId, setCategoryId] = useState(initialData?.categoryId ?? "");
  const [categoryOptions, setCategoryOptions] = useState(categories);
  const [isCategoryManagerOpen, setIsCategoryManagerOpen] = useState(false);
  const [editorValue, setEditorValue] = useState<SpielEditorValue>({
    html: "",
    json: "",
    plain: "",
  });
  const [variables, setVariables] = useState<SpielVar[]>([]);
  const [copied, setCopied] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isVariablesLoading, setIsVariablesLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isReviewing, setIsReviewing] = useState(false);
  const [showRejectInput, setShowRejectInput] = useState(false);
  const [rejectComment, setRejectComment] = useState("");
  const insertTokenRef = useRef<((token: string) => void) | null>(null);

  useEffect(() => {
    setCategoryOptions(categories);
  }, [categories]);

  useEffect(() => {
    let isMounted = true;

    async function loadVariables() {
      const response = await fetch("/api/variables", { cache: "no-store" });

      if (!response.ok) {
        if (isMounted) {
          setIsVariablesLoading(false);
        }
        return;
      }

      const data = (await response.json()) as SpielVar[];

      if (isMounted) {
        setVariables(data);
        setIsVariablesLoading(false);
      }
    }

    void loadVariables();

    return () => {
      isMounted = false;
    };
  }, []);

  async function handleCopy() {
    if (!editorValue.html) return;

    try {
      await navigator.clipboard.write([
        new ClipboardItem({
          "text/html": new Blob([editorValue.html], { type: "text/html" }),
          "text/plain": new Blob([editorValue.plain], { type: "text/plain" }),
        }),
      ]);
    } catch {
      await navigator.clipboard.writeText(editorValue.plain);
    }

    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  function handleInsertToken(token: string) {
    insertTokenRef.current?.(token);
  }

  async function handleSave() {
    setError(null);
    setIsSaving(true);

    if (isEditMode && initialData) {
      // Edit mode — PATCH existing spiel
      const response = await fetch(`/api/spiels/${initialData.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          title,
          categoryId: categoryId || null,
          contentHtml: editorValue.html,
          contentJson: editorValue.json,
          contentPlain: editorValue.plain,
        }),
      });

      setIsSaving(false);

      if (!response.ok) {
        const body = (await response.json().catch(() => null)) as {
          error?: string;
        } | null;
        setError(body?.error ?? "Unable to update spiel.");
        return;
      }

      router.push("/spiels");
      router.refresh();
      return;
    }

    // Create mode — POST new spiel

    const response = await fetch("/api/spiels", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        title,
        departmentId,
        categoryId: categoryId || null,
        contentHtml: editorValue.html,
        contentJson: editorValue.json,
        contentPlain: editorValue.plain,
      }),
    });

    setIsSaving(false);

    if (!response.ok) {
      const body = (await response.json().catch(() => null)) as {
        error?: string;
      } | null;
      setError(body?.error ?? "Unable to save spiel.");
      return;
    }

    router.push("/spiels");
    router.refresh();
  }

  async function handleSubmitForReview() {
    if (!initialData) return;
    setIsSubmitting(true);
    setError(null);
    const res = await fetch(`/api/spiels/${initialData.id}/submit`, { method: "POST" });
    setIsSubmitting(false);
    if (!res.ok) {
      const body = await res.json().catch(() => null) as { error?: string } | null;
      setError(body?.error ?? "Unable to submit for review.");
      return;
    }
    router.push("/spiels?view=drafts");
    router.refresh();
  }

  async function handleReview(action: "approve" | "reject") {
    if (!initialData) return;
    setIsReviewing(true);
    setError(null);
    const res = await fetch(`/api/spiels/${initialData.id}/review`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action, comment: action === "reject" ? rejectComment : undefined }),
    });
    setIsReviewing(false);
    if (!res.ok) {
      const body = await res.json().catch(() => null) as { error?: string } | null;
      setError(body?.error ?? "Unable to complete review.");
      return;
    }
    setShowRejectInput(false);
    router.push("/spiels?view=review");
    router.refresh();
  }

  async function createVariable(input: Pick<SpielVar, "key" | "value">) {
    const response = await fetch("/api/variables", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(input),
    });

    if (!response.ok) {
      throw new Error("Unable to add variable.");
    }

    const variable = (await response.json()) as SpielVar;
    setVariables((current) => [...current, variable]);
  }

  async function updateVariable(id: string, updates: Partial<SpielVar>) {
    const response = await fetch(`/api/variables/${id}`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(updates),
    });

    if (!response.ok) {
      throw new Error("Unable to update variable.");
    }

    const variable = (await response.json()) as SpielVar;
    setVariables((current) =>
      current.map((item) => (item.id === id ? variable : item)),
    );
  }

  async function deleteVariable(id: string) {
    const response = await fetch(`/api/variables/${id}`, {
      method: "DELETE",
    });

    if (!response.ok) {
      throw new Error("Unable to delete variable.");
    }

    setVariables((current) => current.filter((item) => item.id !== id));
  }

  async function createCategory(input: { name: string; description: string }) {
    const response = await fetch("/api/categories", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(input),
    });

    if (!response.ok) {
      const body = (await response.json().catch(() => null)) as {
        error?: string;
      } | null;
      throw new Error(body?.error ?? "Unable to create category.");
    }

    const category = (await response.json()) as CategoryOption;

    setCategoryOptions((current) =>
      [...current, category].sort((left, right) =>
        left.name.localeCompare(right.name),
      ),
    );
    setCategoryId(category.id);
  }

  async function updateCategory(
    id: string,
    updates: { name?: string; description?: string },
  ) {
    const response = await fetch(`/api/categories/${id}`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(updates),
    });

    if (!response.ok) {
      const body = (await response.json().catch(() => null)) as {
        error?: string;
      } | null;
      throw new Error(body?.error ?? "Unable to update category.");
    }

    const category = (await response.json()) as CategoryOption;

    setCategoryOptions((current) =>
      current
        .map((item) => (item.id === id ? category : item))
        .sort((left, right) => left.name.localeCompare(right.name)),
    );
  }

  async function deleteCategory(id: string) {
    const response = await fetch(`/api/categories/${id}`, {
      method: "DELETE",
    });

    if (!response.ok) {
      const body = (await response.json().catch(() => null)) as {
        error?: string;
      } | null;
      throw new Error(body?.error ?? "Unable to delete category.");
    }

    setCategoryOptions((current) => current.filter((item) => item.id !== id));
    setCategoryId((current) => (current === id ? "" : current));
  }

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      <CategoryManagerModal
        categories={categoryOptions}
        isOpen={isCategoryManagerOpen}
        onClose={() => setIsCategoryManagerOpen(false)}
        onCreate={createCategory}
        onUpdate={updateCategory}
        onDelete={deleteCategory}
      />

      <div className="flex items-center justify-between px-8 py-4 border-b border-border bg-card">
        <div className="flex items-center gap-4">
          <Link
            href="/spiels"
            className="text-muted-foreground hover:text-foreground transition-colors"
            title="Back to Library"
          >
            <X className="w-4 h-4" />
          </Link>
          <input
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            placeholder="Untitled Spiel"
            className="font-display text-lg font-semibold text-foreground bg-transparent border-none outline-none placeholder:text-muted-foreground/50 w-72"
            readOnly={isEditMode && status === "pending_review" && !isAdmin}
          />
          {isEditMode && status !== "active" && (
            <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-widest ${
              status === "draft"
                ? "bg-muted text-muted-foreground"
                : status === "pending_review"
                ? "bg-amber-100 text-amber-800 dark:bg-amber-950/40 dark:text-amber-400"
                : ""
            }`}>
              {status === "draft" ? "Draft" : "Pending Review"}
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          {isEditMode && (
            <Link
              href={`/spiels/${initialData.id}/history`}
              className="flex items-center gap-2 px-3.5 py-2 rounded-md text-sm font-medium text-muted-foreground border border-border hover:border-primary/30 hover:text-primary transition-colors"
            >
              History
            </Link>
          )}
          {/* Workflow actions */}
          {isEditMode && status === "draft" && !isAdmin && (
            <button
              type="button"
              onClick={handleSubmitForReview}
              disabled={isSubmitting}
              className="flex items-center gap-2 px-3.5 py-2 rounded-md text-sm font-medium text-amber-800 dark:text-amber-300 border border-amber-300 dark:border-amber-700 bg-amber-50 dark:bg-amber-950/30 hover:bg-amber-100 transition-colors disabled:opacity-40"
            >
              {isSubmitting ? "Submitting…" : "Submit for Review"}
            </button>
          )}
          {isEditMode && status === "pending_review" && isAdmin && !showRejectInput && (
            <>
              <button
                type="button"
                onClick={() => handleReview("approve")}
                disabled={isReviewing}
                className="flex items-center gap-2 px-3.5 py-2 rounded-md text-sm font-medium text-green-800 dark:text-green-300 border border-green-300 dark:border-green-700 bg-green-50 dark:bg-green-950/30 hover:bg-green-100 transition-colors disabled:opacity-40"
              >
                {isReviewing ? "Approving…" : "Approve"}
              </button>
              <button
                type="button"
                onClick={() => setShowRejectInput(true)}
                className="flex items-center gap-2 px-3.5 py-2 rounded-md text-sm font-medium text-red-700 dark:text-red-400 border border-red-300 dark:border-red-700 bg-red-50 dark:bg-red-950/30 hover:bg-red-100 transition-colors"
              >
                Reject
              </button>
            </>
          )}
          {isEditMode && status === "pending_review" && isAdmin && showRejectInput && (
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={rejectComment}
                onChange={(e) => setRejectComment(e.target.value)}
                placeholder="Rejection reason (optional)"
                className="rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground outline-none focus:border-primary w-60"
              />
              <button
                type="button"
                onClick={() => handleReview("reject")}
                disabled={isReviewing}
                className="flex items-center gap-2 px-3.5 py-2 rounded-md text-sm font-medium text-red-700 dark:text-red-400 border border-red-300 dark:border-red-700 bg-red-50 dark:bg-red-950/30 hover:bg-red-100 transition-colors disabled:opacity-40"
              >
                {isReviewing ? "Rejecting…" : "Confirm Reject"}
              </button>
              <button
                type="button"
                onClick={() => setShowRejectInput(false)}
                className="text-muted-foreground hover:text-foreground transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          )}
          <button
            type="button"
            onClick={handleCopy}
            disabled={!editorValue.html}
            className="flex items-center gap-2 px-3.5 py-2 rounded-md text-sm font-medium text-muted-foreground border border-border hover:border-primary/30 hover:text-primary transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {copied ? (
              <>
                <Check className="w-3.5 h-3.5 text-green-500" />
                <span className="text-green-600">Copied!</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5" />
                Copy
              </>
            )}
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={
              !title ||
              !editorValue.html ||
              !departmentId ||
              isSaving ||
              (isEditMode && status === "pending_review" && !isAdmin)
            }
            className="flex items-center gap-2 px-4 py-2 rounded-md text-sm font-semibold text-primary-foreground bg-primary hover:bg-primary/90 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <Save className="w-3.5 h-3.5" />
            {isSaving
              ? "Saving..."
              : isEditMode
                ? "Update Spiel"
                : "Save Spiel"}
          </button>
        </div>
      </div>

      {latestRejection && status === "draft" && (
        <div className="px-8 py-3 bg-amber-50 dark:bg-amber-950/20 border-b border-amber-200 dark:border-amber-800">
          <p className="text-sm text-amber-800 dark:text-amber-300">
            <span className="font-semibold">Rejected by {latestRejection.reviewerName}.</span>
            {latestRejection.comment && (
              <span className="ml-1">{latestRejection.comment}</span>
            )}
          </p>
        </div>
      )}

      {error && (
        <div className="px-8 py-2 bg-red-50 dark:bg-red-950/20 border-b border-red-200 dark:border-red-800">
          <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
        </div>
      )}

      <div className="flex-1 flex overflow-hidden">
        <div className="flex-1 overflow-y-auto px-8 py-6">
          <div className="max-w-3xl mx-auto">
            <div className="mb-4 flex gap-3">
              <select
                value={departmentId}
                onChange={(event) => setDepartmentId(event.target.value)}
                className="flex-1 px-3 py-2 text-sm border border-border rounded-md text-muted-foreground bg-background outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 transition-all"
              >
                <option value="">Select Department</option>
                {departments.map((department) => (
                  <option key={department.id} value={department.id}>
                    {department.name}
                  </option>
                ))}
              </select>
              <div className="flex flex-1 items-center gap-2">
                <select
                  value={categoryId}
                  onChange={(event) => setCategoryId(event.target.value)}
                  className="min-w-0 flex-1 px-3 py-2 text-sm border border-border rounded-md text-muted-foreground bg-background outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 transition-all"
                >
                  <option value="">Select Category (optional)</option>
                  {categoryOptions.map((category) => (
                    <option key={category.id} value={category.id}>
                      {category.name}
                    </option>
                  ))}
                </select>
                <button
                  type="button"
                  onClick={() => setIsCategoryManagerOpen(true)}
                  className="inline-flex shrink-0 items-center gap-2 rounded-md border border-border bg-background px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:border-primary/30 hover:text-primary"
                >
                  <Plus className="h-4 w-4" />
                  Category
                </button>
              </div>
            </div>

            <SpielEditorWithInsert
              onChange={setEditorValue}
              insertRef={insertTokenRef}
              initialHtml={initialData?.contentHtml ?? undefined}
            />

            <p className="mt-3 text-xs text-muted-foreground/60">
              Use{" "}
              <code className="bg-primary/10 text-primary px-1 rounded">
                [TokenName]
              </code>{" "}
              for dynamic placeholders. Define values in the Variables panel →
            </p>
          </div>
        </div>

        <div className="w-[240px] shrink-0 border-l border-border bg-card overflow-y-auto">
          <VariablePanel
            variables={variables}
            isLoading={isVariablesLoading}
            onCreate={createVariable}
            onDelete={deleteVariable}
            onUpdate={updateVariable}
            onInsert={handleInsertToken}
          />
        </div>
      </div>
    </div>
  );
}

function SpielEditorWithInsert({
  onChange,
  insertRef,
  initialHtml,
}: {
  onChange: (value: SpielEditorValue) => void;
  insertRef: MutableRefObject<((token: string) => void) | null>;
  initialHtml?: string;
}) {
  const editorRef = useRef<import("@tiptap/react").Editor | null>(null);

  useEffect(() => {
    insertRef.current = (token: string) => {
      editorRef.current?.chain().focus().insertContent(token).run();
    };

    return () => {
      insertRef.current = null;
    };
  }, [insertRef]);

  return (
    <SpielEditor
      initialHtml={initialHtml}
      onChange={onChange}
      onReady={(editor) => {
        editorRef.current = editor;
      }}
    />
  );
}
