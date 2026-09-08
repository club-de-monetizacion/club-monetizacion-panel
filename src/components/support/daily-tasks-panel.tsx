"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Check, Loader2, Plus, Trash2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { createDailyTaskItem, deleteDailyTaskItem, toggleDailyTaskToday } from "@/app/actions/daily-tasks";
import { cn } from "@/lib/utils";
import type { DailyTaskWithTodayLog } from "@/lib/data";

export function DailyTasksPanel({ items }: { items: DailyTaskWithTodayLog[] }) {
  const router = useRouter();
  const [label, setLabel] = useState("");
  const [isPending, startTransition] = useTransition();

  const total = items.length;
  const done = items.filter((item) => item.logs.length > 0).length;
  const pct = total > 0 ? Math.round((done / total) * 100) : 0;

  function handleToggle(item: DailyTaskWithTodayLog) {
    const nextDone = item.logs.length === 0;
    startTransition(async () => {
      await toggleDailyTaskToday(item.id, nextDone);
      router.refresh();
    });
  }

  function handleAdd() {
    const trimmed = label.trim();
    if (!trimmed) return;
    startTransition(async () => {
      await createDailyTaskItem(trimmed);
      setLabel("");
      router.refresh();
    });
  }

  function handleDelete(id: string) {
    startTransition(async () => {
      await deleteDailyTaskItem(id);
      router.refresh();
    });
  }

  return (
    <div className="mx-auto max-w-xl">
      <div className="mb-5">
        <div className="mb-1.5 flex items-center justify-between text-sm">
          <span className="font-medium text-[var(--ink-1)]">Progreso de hoy</span>
          <span className="text-[var(--ink-3)]">
            {done}/{total} · {pct}%
          </span>
        </div>
        <div className="h-2.5 w-full overflow-hidden rounded-full bg-[var(--panel-strong)]">
          <div
            className="h-full rounded-full bg-[var(--accent)] transition-all duration-300"
            style={{ width: `${pct}%` }}
          />
        </div>
      </div>

      <div className="space-y-1">
        {items.map((item) => {
          const isDone = item.logs.length > 0;
          return (
            <div
              key={item.id}
              className="group flex items-center gap-2.5 rounded-lg px-2 py-2 hover:bg-[var(--panel)]"
            >
              <button
                type="button"
                onClick={() => handleToggle(item)}
                className={cn(
                  "focus-ring flex h-5 w-5 shrink-0 items-center justify-center rounded-md border transition",
                  isDone
                    ? "border-[var(--accent)] bg-[var(--accent)] text-white"
                    : "border-[var(--panel-border)] text-transparent hover:border-[var(--accent)]"
                )}
                aria-label={isDone ? "Marcar como pendiente" : "Marcar como cumplida"}
              >
                <Check className="h-3.5 w-3.5" />
              </button>
              <span
                className={cn(
                  "min-w-0 flex-1 text-sm",
                  isDone ? "text-[var(--ink-3)] line-through" : "text-[var(--ink-1)]"
                )}
              >
                {item.label}
              </span>
              <button
                type="button"
                onClick={() => handleDelete(item.id)}
                className="focus-ring shrink-0 rounded-md p-1 text-[var(--ink-3)] opacity-0 hover:text-red-400 group-hover:opacity-100"
                aria-label={`Eliminar "${item.label}"`}
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </div>
          );
        })}
        {items.length === 0 && (
          <p className="px-2 py-3 text-sm text-[var(--ink-3)]">Aún no tienes tareas diarias.</p>
        )}
      </div>

      <div className="mt-4 flex gap-2">
        <Input
          value={label}
          onChange={(e) => setLabel(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleAdd()}
          placeholder="Agregar una tarea diaria…"
        />
        <button
          type="button"
          onClick={handleAdd}
          disabled={isPending || !label.trim()}
          className="focus-ring flex shrink-0 items-center gap-1 rounded-md bg-[var(--panel-strong)] px-3 text-sm font-medium text-[var(--ink-1)] hover:bg-[var(--panel)] disabled:opacity-50"
        >
          {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
        </button>
      </div>

      <p className="mt-3 text-[11px] text-[var(--ink-3)]">
        El progreso se reinicia cada día, pero cada tarea cumplida queda registrada.
      </p>
    </div>
  );
}
