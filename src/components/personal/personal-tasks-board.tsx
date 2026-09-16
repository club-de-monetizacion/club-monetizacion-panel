"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { formatDistanceToNow } from "date-fns";
import { es } from "date-fns/locale";
import { Archive, ChevronDown, ChevronRight, Check, ListChecks, Loader2, Plus, Trash2 } from "lucide-react";
import { Input, Textarea } from "@/components/ui/input";
import {
  createPersonalTask,
  deletePersonalTask,
  togglePersonalTaskDone,
  updatePersonalTask,
} from "@/app/actions/personal-tasks";
import { cn } from "@/lib/utils";
import type { PersonalTaskItem } from "@/lib/data";

function TaskRow({ task, onToggle, onDelete, onSave }: {
  task: PersonalTaskItem;
  onToggle: () => void;
  onDelete: () => void;
  onSave: (data: { title?: string; description?: string | null }) => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const [title, setTitle] = useState(task.title);
  const [description, setDescription] = useState(task.description ?? "");

  function saveTitleIfChanged() {
    const trimmed = title.trim();
    if (!trimmed) {
      setTitle(task.title);
      return;
    }
    if (trimmed !== task.title) onSave({ title: trimmed });
  }

  function saveDescriptionIfChanged() {
    const trimmed = description.trim();
    if (trimmed !== (task.description ?? "")) onSave({ description: trimmed || null });
  }

  return (
    <div className="rounded-lg hover:bg-[var(--panel)]">
      <div className="group flex items-center gap-2.5 px-2 py-2">
        <button
          type="button"
          onClick={onToggle}
          className={cn(
            "focus-ring flex h-5 w-5 shrink-0 items-center justify-center rounded-md border transition",
            task.done
              ? "border-[var(--accent)] bg-[var(--accent)] text-white"
              : "border-[var(--panel-border)] text-transparent hover:border-[var(--accent)]"
          )}
          aria-label={task.done ? "Marcar como pendiente" : "Marcar como hecha"}
        >
          <Check className="h-3.5 w-3.5" />
        </button>

        <button
          type="button"
          onClick={() => setExpanded((v) => !v)}
          className="flex min-w-0 flex-1 items-center gap-1.5 text-left"
        >
          {expanded ? (
            <ChevronDown className="h-3.5 w-3.5 shrink-0 text-[var(--ink-3)]" />
          ) : (
            <ChevronRight className="h-3.5 w-3.5 shrink-0 text-[var(--ink-3)]" />
          )}
          <span
            className={cn(
              "min-w-0 flex-1 truncate text-sm",
              task.done ? "text-[var(--ink-3)] line-through" : "text-[var(--ink-1)]"
            )}
          >
            {task.title}
          </span>
          {!expanded && task.description && (
            <span className="shrink-0 text-[10px] text-[var(--ink-3)]">tiene detalles</span>
          )}
        </button>

        <button
          type="button"
          onClick={onDelete}
          className="focus-ring shrink-0 rounded-md p-1 text-[var(--ink-3)] opacity-0 hover:text-red-400 group-hover:opacity-100"
          aria-label={`Eliminar "${task.title}"`}
        >
          <Trash2 className="h-3.5 w-3.5" />
        </button>
      </div>

      {expanded && (
        <div className="space-y-2 px-2 pb-3 pl-9">
          <Input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            onBlur={saveTitleIfChanged}
            placeholder="Título"
          />
          <Textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            onBlur={saveDescriptionIfChanged}
            placeholder="Agrega detalles, pasos o notas cuando la desarrolles… (opcional)"
            rows={3}
          />
          <p className="text-[11px] text-[var(--ink-3)]">
            {task.done && task.doneAt
              ? `Hecha ${formatDistanceToNow(new Date(task.doneAt), { addSuffix: true, locale: es })} · se archiva sola un día después`
              : "Los cambios se guardan solos al salir del campo."}
          </p>
        </div>
      )}
    </div>
  );
}

export function PersonalTasksBoard({
  active,
  archived,
}: {
  active: PersonalTaskItem[];
  archived: PersonalTaskItem[];
}) {
  const router = useRouter();
  const [view, setView] = useState<"pendientes" | "archivadas">("pendientes");
  const [title, setTitle] = useState("");
  const [isPending, startTransition] = useTransition();

  const pendingCount = active.filter((t) => !t.done).length;

  function handleAdd() {
    const trimmed = title.trim();
    if (!trimmed) return;
    startTransition(async () => {
      await createPersonalTask(trimmed);
      setTitle("");
      router.refresh();
    });
  }

  function handleToggle(task: PersonalTaskItem) {
    startTransition(async () => {
      await togglePersonalTaskDone(task.id, !task.done);
      router.refresh();
    });
  }

  function handleDelete(id: string) {
    startTransition(async () => {
      await deletePersonalTask(id);
      router.refresh();
    });
  }

  function handleSave(id: string, data: { title?: string; description?: string | null }) {
    startTransition(async () => {
      await updatePersonalTask(id, data);
      router.refresh();
    });
  }

  const list = view === "pendientes" ? active : archived;

  return (
    <div className="mx-auto max-w-xl">
      <div className="mb-4 flex gap-1 rounded-lg bg-[var(--panel-strong)] p-1">
        <button
          type="button"
          onClick={() => setView("pendientes")}
          className={cn(
            "flex flex-1 items-center justify-center gap-1.5 rounded-md py-1.5 text-sm font-medium transition",
            view === "pendientes" ? "bg-[var(--accent)] text-white" : "text-[var(--ink-2)] hover:text-[var(--ink-0)]"
          )}
        >
          <ListChecks className="h-3.5 w-3.5" />
          Pendientes {pendingCount > 0 && `(${pendingCount})`}
        </button>
        <button
          type="button"
          onClick={() => setView("archivadas")}
          className={cn(
            "flex flex-1 items-center justify-center gap-1.5 rounded-md py-1.5 text-sm font-medium transition",
            view === "archivadas" ? "bg-[var(--accent)] text-white" : "text-[var(--ink-2)] hover:text-[var(--ink-0)]"
          )}
        >
          <Archive className="h-3.5 w-3.5" />
          Archivadas {archived.length > 0 && `(${archived.length})`}
        </button>
      </div>

      {view === "pendientes" && (
        <div className="mb-4 flex gap-2">
          <Input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleAdd()}
            placeholder="Anota una idea o pendiente…"
            autoFocus
          />
          <button
            type="button"
            onClick={handleAdd}
            disabled={isPending || !title.trim()}
            className="focus-ring flex shrink-0 items-center justify-center gap-1.5 rounded-lg bg-[var(--accent)] px-3 text-sm font-medium text-white disabled:opacity-50"
            aria-label="Agregar"
          >
            {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
          </button>
        </div>
      )}

      <div className="space-y-1">
        {list.map((task) => (
          <TaskRow
            key={task.id}
            task={task}
            onToggle={() => handleToggle(task)}
            onDelete={() => handleDelete(task.id)}
            onSave={(data) => handleSave(task.id, data)}
          />
        ))}
        {list.length === 0 && (
          <p className="px-2 py-3 text-sm text-[var(--ink-3)]">
            {view === "pendientes"
              ? "Nada por aquí — anota una idea arriba para empezar."
              : "Todavía no hay tareas archivadas."}
          </p>
        )}
      </div>

      {view === "pendientes" && (
        <p className="mt-4 text-[11px] text-[var(--ink-3)]">
          Da clic en una tarea para desarrollarla con detalles. Al marcarla como hecha, se archiva
          sola un día después — solo tú puedes ver y editar esta lista.
        </p>
      )}
    </div>
  );
}
