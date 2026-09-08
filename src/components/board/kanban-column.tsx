"use client";

import { useDroppable } from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { Plus } from "lucide-react";
import { TaskCard } from "@/components/board/task-card";
import { ProcessingBadge } from "@/components/board/processing-badge";
import type { TaskWithRelations } from "@/lib/data";

export function KanbanColumn({
  id,
  label,
  color,
  processing,
  tasks,
  onTaskClick,
  onAddClick,
}: {
  id: string;
  label: string;
  color?: string;
  processing?: boolean;
  tasks: TaskWithRelations[];
  onTaskClick: (task: TaskWithRelations) => void;
  onAddClick: () => void;
}) {
  const { setNodeRef, isOver } = useDroppable({ id });

  return (
    <div className="flex min-w-0 flex-col">
      <div className="mb-2.5 flex items-center justify-between px-1">
        <div className="flex min-w-0 items-center gap-1.5">
          {color && (
            <span
              className="h-2 w-2 shrink-0 rounded-full"
              style={{ background: color }}
            />
          )}
          <h3 className="truncate text-sm font-semibold text-[var(--ink-0)]">{label}</h3>
          {processing && <ProcessingBadge compact />}
          <span className="shrink-0 rounded-full bg-[var(--panel-strong)] px-1.5 py-0.5 text-[11px] text-[var(--ink-3)]">
            {tasks.length}
          </span>
        </div>
        <button
          onClick={onAddClick}
          className="focus-ring shrink-0 rounded-md p-1 text-[var(--ink-3)] hover:bg-[var(--panel)] hover:text-[var(--ink-0)]"
          aria-label={`Añadir a ${label}`}
        >
          <Plus className="h-3.5 w-3.5" />
        </button>
      </div>

      <div
        ref={setNodeRef}
        className={`flex min-h-[120px] flex-1 flex-col gap-2 rounded-xl p-1.5 transition ${
          isOver ? "bg-[var(--accent-soft)]" : ""
        }`}
      >
        <SortableContext
          items={tasks.map((t) => t.id)}
          strategy={verticalListSortingStrategy}
        >
          {tasks.map((task) => (
            <TaskCard key={task.id} task={task} onClick={() => onTaskClick(task)} />
          ))}
        </SortableContext>
        {tasks.length === 0 && (
          <div className="rounded-lg border border-dashed border-[var(--panel-border)] p-4 text-center text-xs text-[var(--ink-3)]">
            Sin tareas
          </div>
        )}
      </div>
    </div>
  );
}
