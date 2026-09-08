"use client";

import { useState } from "react";
import { MiniTaskRow } from "@/components/board/mini-task-row";
import { TaskDetailDialog } from "@/components/board/task-detail-dialog";
import type { TaskWithRelations } from "@/lib/data";

type Member = { id: string; name: string | null; email: string; image: string | null };
type ProjectOption = { id: string; name: string };

export function MyTasksPanel({
  tasks,
  members,
  projects,
}: {
  tasks: TaskWithRelations[];
  members: Member[];
  projects: ProjectOption[];
}) {
  const [selectedTask, setSelectedTask] = useState<TaskWithRelations | null>(null);

  // Keeps the open detail dialog's task in sync with fresh server data (new
  // comments/attachments/etc.) once the page revalidates and hands down a
  // new `tasks` array.
  const [syncedTasksRef, setSyncedTasksRef] = useState(tasks);
  if (syncedTasksRef !== tasks) {
    setSyncedTasksRef(tasks);
    if (selectedTask) {
      setSelectedTask(tasks.find((t) => t.id === selectedTask.id) ?? null);
    }
  }

  return (
    <div className="glass-panel mb-5 rounded-2xl p-4">
      <div className="mb-1 flex items-center justify-between px-1">
        <h3 className="text-sm font-semibold text-[var(--ink-0)]">Mis tareas pendientes</h3>
        <span className="rounded-full bg-[var(--panel-strong)] px-2 py-0.5 text-[11px] text-[var(--ink-3)]">
          {tasks.length}
        </span>
      </div>
      <div className="space-y-0.5">
        {tasks.map((task) => (
          <MiniTaskRow key={task.id} task={task} onClick={() => setSelectedTask(task)} />
        ))}
        {tasks.length === 0 && (
          <p className="px-2 py-4 text-sm text-[var(--ink-3)]">
            No tienes tareas pendientes asignadas. 🎉
          </p>
        )}
      </div>

      {selectedTask && (
        <TaskDetailDialog
          task={selectedTask}
          members={members}
          projects={projects}
          onClose={() => setSelectedTask(null)}
        />
      )}
    </div>
  );
}
