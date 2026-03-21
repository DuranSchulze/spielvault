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

type NewSpielFormProps = {
  departments: Option[];
  categories: CategoryOption[];
};

export function NewSpielForm({ departments, categories }: NewSpielFormProps) {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [departmentId, setDepartmentId] = useState(departments[0]?.id ?? "");
  const [categoryId, setCategoryId] = useState("");
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
      const body = (await response.json().catch(() => null)) as
        | { error?: string }
        | null;
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
      const body = (await response.json().catch(() => null)) as
        | { error?: string }
        | null;
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
      const body = (await response.json().catch(() => null)) as
        | { error?: string }
        | null;
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
          />
        </div>
        <div className="flex items-center gap-2">
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
            disabled={!title || !editorValue.html || !departmentId || isSaving}
            className="flex items-center gap-2 px-4 py-2 rounded-md text-sm font-semibold text-primary-foreground bg-primary hover:bg-primary/90 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <Save className="w-3.5 h-3.5" />
            {isSaving ? "Saving..." : "Save Spiel"}
          </button>
        </div>
      </div>

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
            />

            {error && (
              <p className="mt-3 text-sm text-red-600" role="alert">
                {error}
              </p>
            )}

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
}: {
  onChange: (value: SpielEditorValue) => void;
  insertRef: MutableRefObject<((token: string) => void) | null>;
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
      onChange={onChange}
      onReady={(editor) => {
        editorRef.current = editor;
      }}
    />
  );
}
