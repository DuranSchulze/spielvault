"use client";

import { useState } from "react";
import { Plus, Trash2, ChevronRight } from "lucide-react";

export type SpielVar = {
  id: string;
  key: string;
  value: string;
};

interface VariablePanelProps {
  variables: SpielVar[];
  isLoading?: boolean;
  onCreate: (variable: Pick<SpielVar, "key" | "value">) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
  onUpdate: (id: string, updates: Partial<SpielVar>) => Promise<void>;
  onInsert: (token: string) => void;
}

export function VariablePanel({
  variables,
  isLoading = false,
  onCreate,
  onDelete,
  onUpdate,
  onInsert,
}: VariablePanelProps) {
  const [newKey, setNewKey] = useState("");
  const [newValue, setNewValue] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValue, setEditValue] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function addVariable() {
    const key = newKey.trim();
    const value = newValue.trim();
    if (!key || !value) return;
    if (variables.some((v) => v.key.toLowerCase() === key.toLowerCase())) return;
    setError(null);
    setIsSubmitting(true);

    try {
      await onCreate({ key, value });
      setNewKey("");
      setNewValue("");
    } catch {
      setError("Unable to add variable.");
    } finally {
      setIsSubmitting(false);
    }
  }

  async function removeVariable(id: string) {
    setError(null);
    setIsSubmitting(true);

    try {
      await onDelete(id);
    } catch {
      setError("Unable to delete variable.");
    } finally {
      setIsSubmitting(false);
    }
  }

  function startEdit(v: SpielVar) {
    setEditingId(v.id);
    setEditValue(v.value);
  }

  async function commitEdit(id: string) {
    setError(null);
    setIsSubmitting(true);

    try {
      await onUpdate(id, { value: editValue });
      setEditingId(null);
    } catch {
      setError("Unable to update variable.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="flex flex-col h-full">
      <div className="px-4 pt-4 pb-3 border-b border-[#e8ecef]">
        <p className="text-[10px] font-semibold text-[#abb3b7] uppercase tracking-widest mb-3">
          Variables
        </p>
        <p className="text-xs text-[#49636f] leading-relaxed mb-3">
          Define reusable values. Insert as{" "}
          <code className="bg-[#d6e3ff]/60 text-[#005db5] px-1 rounded text-[11px]">
            [Key]
          </code>{" "}
          tokens in your spiel.
        </p>

        {/* Add new */}
        <div className="space-y-2">
          <input
            value={newKey}
            onChange={(e) => setNewKey(e.target.value)}
            placeholder="Key (e.g. Company)"
            className="w-full px-2.5 py-1.5 text-xs border border-[#e8ecef] rounded-md bg-white text-[#2b3437] placeholder:text-[#abb3b7] outline-none focus:border-[#005db5] focus:ring-1 focus:ring-[#005db5]/10 transition-all"
            onKeyDown={(e) => e.key === "Enter" && addVariable()}
          />
          <input
            value={newValue}
            onChange={(e) => setNewValue(e.target.value)}
            placeholder="Value (e.g. FilePino)"
            className="w-full px-2.5 py-1.5 text-xs border border-[#e8ecef] rounded-md bg-white text-[#2b3437] placeholder:text-[#abb3b7] outline-none focus:border-[#005db5] focus:ring-1 focus:ring-[#005db5]/10 transition-all"
            onKeyDown={(e) => e.key === "Enter" && addVariable()}
          />
          <button
            type="button"
            onClick={addVariable}
            disabled={!newKey.trim() || !newValue.trim() || isSubmitting}
            className="w-full flex items-center justify-center gap-1.5 py-1.5 rounded-md text-xs font-semibold bg-[#005db5] text-white hover:bg-[#0052a0] transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <Plus className="w-3 h-3" />
            Add Variable
          </button>
        </div>
      </div>

      {/* Variable list */}
      <div className="flex-1 overflow-y-auto px-4 py-3 space-y-1.5">
        {error && (
          <p className="text-xs text-red-600 text-center py-2">{error}</p>
        )}
        {isLoading ? (
          <p className="text-xs text-[#abb3b7] text-center py-4">Loading variables...</p>
        ) : variables.length === 0 ? (
          <p className="text-xs text-[#abb3b7] text-center py-4">No variables yet.</p>
        ) : null}
        {variables.map((v) => (
          <div
            key={v.id}
            className="group border border-[#e8ecef] rounded-lg px-3 py-2.5 bg-white hover:border-[#005db5]/30 transition-colors"
          >
            <div className="flex items-center justify-between gap-2 mb-1">
              <span className="text-[11px] font-semibold text-[#005db5] bg-[#d6e3ff]/60 px-2 py-0.5 rounded-full">
                [{v.key}]
              </span>
              <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <button
                  type="button"
                  onClick={() => onInsert(`[${v.key}]`)}
                  title="Insert token"
                  className="p-1 rounded text-[#49636f] hover:text-[#005db5] hover:bg-[#d6e3ff]/40 transition-colors"
                >
                  <ChevronRight className="w-3 h-3" />
                </button>
                <button
                  type="button"
                  onClick={() => removeVariable(v.id)}
                  title="Delete"
                  disabled={isSubmitting}
                  className="p-1 rounded text-[#49636f] hover:text-red-500 hover:bg-red-50 transition-colors"
                >
                  <Trash2 className="w-3 h-3" />
                </button>
              </div>
            </div>

            {editingId === v.id ? (
              <input
                autoFocus
                value={editValue}
                onChange={(e) => setEditValue(e.target.value)}
                onBlur={() => commitEdit(v.id)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") commitEdit(v.id);
                  if (e.key === "Escape") setEditingId(null);
                }}
                className="w-full text-xs text-[#2b3437] border-b border-[#005db5] outline-none bg-transparent pb-0.5"
              />
            ) : (
              <p
                className="text-xs text-[#49636f] truncate cursor-pointer hover:text-[#2b3437] transition-colors"
                title="Click to edit value"
                onClick={() => startEdit(v)}
              >
                {v.value}
              </p>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
