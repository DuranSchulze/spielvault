"use client";

import Link from "next/link";
import { useState, useRef } from "react";
import dynamic from "next/dynamic";
import type { SpielEditorValue } from "@/components/editor/spiel-editor";
import { VariablePanel, SpielVar } from "@/components/editor/variable-panel";
import { Copy, Check, Save, X } from "lucide-react";

const SpielEditor = dynamic(
  () => import("@/components/editor/spiel-editor").then((m) => m.SpielEditor),
  {
    ssr: false,
    loading: () => (
      <div className="border border-[#e8ecef] rounded-lg h-[420px] bg-white animate-pulse" />
    ),
  },
);

export default function NewSpielPage() {
  const [title, setTitle] = useState("");
  const [editorValue, setEditorValue] = useState<SpielEditorValue>({
    html: "",
    json: "",
    plain: "",
  });
  const [variables, setVariables] = useState<SpielVar[]>([]);
  const [copied, setCopied] = useState(false);
  const insertTokenRef = useRef<((token: string) => void) | null>(null);

  async function handleCopy() {
    if (!editorValue.html) return;
    try {
      await navigator.clipboard.write([
        new ClipboardItem({
          "text/html": new Blob([editorValue.html], { type: "text/html" }),
          "text/plain": new Blob([editorValue.plain], { type: "text/plain" }),
        }),
      ]);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      await navigator.clipboard.writeText(editorValue.plain);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }

  function handleInsertToken(token: string) {
    insertTokenRef.current?.(token);
  }

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      {/* Top bar */}
      <div className="flex items-center justify-between px-8 py-4 border-b border-[#e8ecef] bg-white">
        <div className="flex items-center gap-4">
          <Link
            href="/spiels"
            className="text-[#49636f] hover:text-[#2b3437] transition-colors"
            title="Back to Library"
          >
            <X className="w-4 h-4" />
          </Link>
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Untitled Spiel"
            className="font-display text-lg font-semibold text-[#2b3437] bg-transparent border-none outline-none placeholder:text-[#abb3b7] w-72"
          />
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleCopy}
            disabled={!editorValue.html}
            className="flex items-center gap-2 px-3.5 py-2 rounded-md text-sm font-medium text-[#49636f] border border-[#e8ecef] hover:border-[#005db5]/30 hover:text-[#005db5] transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
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
            disabled={!title || !editorValue.html}
            className="flex items-center gap-2 px-4 py-2 rounded-md text-sm font-semibold text-white bg-[#005db5] hover:bg-[#0052a0] transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <Save className="w-3.5 h-3.5" />
            Save Spiel
          </button>
        </div>
      </div>

      {/* Body */}
      <div className="flex-1 flex overflow-hidden">
        {/* Editor column */}
        <div className="flex-1 overflow-y-auto px-8 py-6">
          <div className="max-w-3xl mx-auto">
            {/* Meta fields */}
            <div className="mb-4 flex gap-3">
              <select className="flex-1 px-3 py-2 text-sm border border-[#e8ecef] rounded-md text-[#49636f] bg-white outline-none focus:border-[#005db5] focus:ring-2 focus:ring-[#005db5]/10 transition-all">
                <option value="">Select Department</option>
              </select>
              <select className="flex-1 px-3 py-2 text-sm border border-[#e8ecef] rounded-md text-[#49636f] bg-white outline-none focus:border-[#005db5] focus:ring-2 focus:ring-[#005db5]/10 transition-all">
                <option value="">Select Category (optional)</option>
              </select>
            </div>

            {/* Rich text editor */}
            <SpielEditorWithInsert
              onChange={setEditorValue}
              insertRef={insertTokenRef}
            />

            <p className="mt-3 text-xs text-[#abb3b7]">
              Use{" "}
              <code className="bg-[#d6e3ff]/60 text-[#005db5] px-1 rounded">
                [TokenName]
              </code>{" "}
              for dynamic placeholders. Define values in the Variables panel →
            </p>
          </div>
        </div>

        {/* Right panel — variables */}
        <div className="w-[240px] shrink-0 border-l border-[#e8ecef] bg-white overflow-y-auto">
          <VariablePanel
            variables={variables}
            onChange={setVariables}
            onInsert={handleInsertToken}
          />
        </div>
      </div>
    </div>
  );
}

// Wrapper to expose insertToken imperatively via ref
function SpielEditorWithInsert({
  onChange,
  insertRef,
}: {
  onChange: (v: SpielEditorValue) => void;
  insertRef: React.MutableRefObject<((token: string) => void) | null>;
}) {
  const editorRef = useRef<import("@tiptap/react").Editor | null>(null);

  insertRef.current = (token: string) => {
    editorRef.current?.chain().focus().insertContent(token).run();
  };

  return (
    <SpielEditor
      onChange={onChange}
      onReady={(ed) => {
        editorRef.current = ed;
      }}
    />
  );
}
