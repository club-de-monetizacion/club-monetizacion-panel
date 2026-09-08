"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Check, Loader2, Plus, Trash2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { addChecklistItem, deleteChecklistItem, toggleChecklistItem } from "@/app/actions/checklist";

type ChecklistItem = {
  id: string;
  label: string;
  done: boolean;
};

export function ChecklistSection({
  taskId,
  items,
}: {
  taskId: string;
  items: ChecklistItem[];
}) {
  const router = useRouter();
  const [label, setLabel] = useState("");
  const [isPending, startTransition] = useTransition();
  const done = items.filter((i) => i.done).length;

  function handleAdd() {
    const trimmed = label.trim();
    if (!trimmed) return;
    startTransition(async () => {
      const result = await addChecklistItem(taskId, trimmed);
      if (!result?.error) setLabel("");
      router.refresh();
    });
  }

  function handleToggle(id: string, next: boolean) {
    void toggleChecklistItem(id, next).then(() => router.refresh());
  }

  function handleDelete(id: string) {
    void deleteChecklistItem(id).then(() => router.refresh());
  }

  return (
    <div className="mt-3">
      <div className="mb-1.5 flex items-center justify-between">
        <Label className="mb-0">Checklist</Label>
        {items.length > 0 && (
          <span className="text-[11px] text-[var(--ink-3)]">
            {done}/{items.length}
          </span>
        )}
      </div>

      {items.length > 0 ? (
        <div className="mb-2 space-y-1">
          {items.map((item) => (
            <div
              key={item.id}
              className="group flex items-center gap-2 rounded-lg px-1.5 py-1 hover:bg-[var(--panel)]"
            >
              <button
                type="button"
                onClick={() => handleToggle(item.id, !item.done)}
                className={cn(
                  "focus-ring flex h-4 w-4 shrink-0 items-center justify-center rounded border transition",
                  item.done
                    ? "border-[var(--accent)] bg-[var(--accent)] text-white"
                    : "border-[var(--panel-border)] text-transparent hover:border-[var(--accent)]"
                )}
                aria-label={item.done ? "Marcar como pendiente" : "Marcar como cumplido"}
              >
                <Check className="h-3 w-3" />
              </button>
              <span
                className={cn(
                  "min-w-0 flex-1 truncate text-sm",
                  item.done ? "text-[var(--ink-3)] line-through" : "text-[var(--ink-1)]"
                )}
              >
                {item.label}
              </span>
              <button
                type="button"
                onClick={() => handleDelete(item.id)}
                className="focus-ring shrink-0 rounded-md p-1 text-[var(--ink-3)] opacity-0 group-hover:opacity-100 hover:text-red-400"
                aria-label={`Eliminar "${item.label}"`}
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </div>
          ))}
        </div>
      ) : (
        <p className="mb-2 text-xs text-[var(--ink-3)]">Sin pendientes todavía.</p>
      )}

      <div className="flex gap-2">
        <Input
          value={label}
          onChange={(e) => setLabel(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), handleAdd())}
          placeholder="Agregar un pendiente…"
          className="h-8 text-sm"
        />
        <button
          type="button"
          onClick={handleAdd}
          disabled={isPending || !label.trim()}
          className="focus-ring flex shrink-0 items-center gap-1 rounded-md bg-[var(--panel-strong)] px-2.5 text-xs font-medium text-[var(--ink-1)] hover:bg-[var(--panel)] disabled:opacity-50"
        >
          {isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Plus className="h-3.5 w-3.5" />}
        </button>
      </div>
    </div>
  );
}
