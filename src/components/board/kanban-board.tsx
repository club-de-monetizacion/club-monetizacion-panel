"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  useSensor,
  useSensors,
  closestCorners,
  type DragEndEvent,
  type DragOverEvent,
  type DragStartEvent,
} from "@dnd-kit/core";
import { KanbanColumn } from "@/components/board/kanban-column";
import { TaskCard } from "@/components/board/task-card";
import { TaskDetailDialog } from "@/components/board/task-detail-dialog";
import { CreateTaskDialog } from "@/components/board/create-task-dialog";
import { moveTask } from "@/app/actions/tasks";
import type { TaskWithRelations } from "@/lib/data";
import type { Platform, TaskType } from "@prisma/client";

type Member = { id: string; name: string | null; email: string; image: string | null };
type ProjectOption = { id: string; name: string; driveLink: string | null; color: string };

export function KanbanBoard({
  columns,
  groupField,
  initialTasks,
  members,
  type,
  platform,
  projects,
}: {
  columns: { key: string; label: string; color?: string }[];
  groupField: "status" | "stage";
  initialTasks: TaskWithRelations[];
  members: Member[];
  type: TaskType;
  platform?: Platform;
  projects?: ProjectOption[];
}) {
  const router = useRouter();

  const groupTasks = (tasks: TaskWithRelations[]) => {
    const map: Record<string, TaskWithRelations[]> = {};
    for (const col of columns) map[col.key] = [];
    for (const t of tasks) {
      const key = String(groupField === "status" ? t.status : t.stage);
      if (map[key]) map[key].push(t);
    }
    return map;
  };

  const signature = useMemo(
    () => initialTasks.map((t) => `${t.id}:${t.status}:${t.stage}:${t.position}`).join("|"),
    [initialTasks]
  );

  const [board, setBoard] = useState(() => groupTasks(initialTasks));
  const [syncedSignature, setSyncedSignature] = useState(signature);
  if (signature !== syncedSignature) {
    setSyncedSignature(signature);
    setBoard(groupTasks(initialTasks));
  }

  const [activeTask, setActiveTask] = useState<TaskWithRelations | null>(null);
  const [selectedTask, setSelectedTask] = useState<TaskWithRelations | null>(null);
  const [createColumn, setCreateColumn] = useState<string | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } })
  );

  function findColumnOf(taskId: string) {
    return Object.keys(board).find((key) =>
      board[key].some((t) => t.id === taskId)
    );
  }

  function handleDragStart(event: DragStartEvent) {
    const task = initialTasks.find((t) => t.id === event.active.id);
    setActiveTask(task ?? null);
  }

  function handleDragOver(event: DragOverEvent) {
    const { active, over } = event;
    if (!over) return;
    const activeCol = findColumnOf(String(active.id));
    const overCol = columns.some((c) => c.key === over.id)
      ? String(over.id)
      : findColumnOf(String(over.id));
    if (!activeCol || !overCol || activeCol === overCol) return;

    setBoard((prev) => {
      const activeItems = [...prev[activeCol]];
      const overItems = [...prev[overCol]];
      const activeIndex = activeItems.findIndex((t) => t.id === active.id);
      if (activeIndex === -1) return prev;
      const [moved] = activeItems.splice(activeIndex, 1);
      const overIndex = overItems.findIndex((t) => t.id === over.id);
      overItems.splice(overIndex >= 0 ? overIndex : overItems.length, 0, moved);
      return { ...prev, [activeCol]: activeItems, [overCol]: overItems };
    });
  }

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    setActiveTask(null);
    if (!over) return;

    const activeCol = findColumnOf(String(active.id));
    const overCol = columns.some((c) => c.key === over.id)
      ? String(over.id)
      : findColumnOf(String(over.id));
    if (!activeCol || !overCol) return;

    setBoard((prev) => {
      const items = [...prev[overCol]];
      const activeIndex = items.findIndex((t) => t.id === active.id);
      const overIndex = items.findIndex((t) => t.id === over.id);

      let nextItems = items;
      if (activeIndex !== -1 && overIndex !== -1 && activeIndex !== overIndex) {
        nextItems = arrayMove(items, activeIndex, overIndex);
      }
      const next = { ...prev, [overCol]: nextItems };

      void moveTask({
        taskId: String(active.id),
        field: groupField,
        value: overCol,
        orderedIds: nextItems.map((t) => t.id),
      }).then(() => router.refresh());

      return next;
    });
  }

  return (
    <>
      <DndContext
        sensors={sensors}
        collisionDetection={closestCorners}
        onDragStart={handleDragStart}
        onDragOver={handleDragOver}
        onDragEnd={handleDragEnd}
      >
        <div className="flex gap-4 overflow-x-auto pb-4">
          {columns.map((col) => (
            <KanbanColumn
              key={col.key}
              id={col.key}
              label={col.label}
              color={col.color}
              tasks={board[col.key] ?? []}
              onTaskClick={setSelectedTask}
              onAddClick={() => setCreateColumn(col.key)}
            />
          ))}
        </div>
        <DragOverlay>
          {activeTask && <TaskCard task={activeTask} overlay />}
        </DragOverlay>
      </DndContext>

      {selectedTask && (
        <TaskDetailDialog
          task={selectedTask}
          members={members}
          projects={projects}
          onClose={() => setSelectedTask(null)}
        />
      )}

      {createColumn && (
        <CreateTaskDialog
          open
          onOpenChange={(open) => !open && setCreateColumn(null)}
          type={type}
          platform={platform}
          initialColumnField={groupField}
          initialColumnValue={createColumn}
          members={members}
          projects={projects}
        />
      )}
    </>
  );
}

function arrayMove<T>(array: T[], from: number, to: number): T[] {
  const copy = [...array];
  const [item] = copy.splice(from, 1);
  copy.splice(to, 0, item);
  return copy;
}
