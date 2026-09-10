"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Archive, ChevronDown } from "lucide-react";
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
import { MiniTaskRow } from "@/components/board/mini-task-row";
import { moveTask } from "@/app/actions/tasks";
import { cn } from "@/lib/utils";
import type { TaskWithRelations } from "@/lib/data";
import type { Platform, TaskType } from "@prisma/client";

type Member = { id: string; name: string | null; email: string; image: string | null };
type ProjectOption = { id: string; name: string; driveLink: string | null; color: string };

export function KanbanBoard({
  columns,
  groupField,
  initialTasks,
  archivedTasks,
  archivedLabel = "Publicados",
  members,
  type,
  platform,
  projects,
}: {
  columns: { key: string; label: string; color?: string; processing?: boolean }[];
  groupField: "status" | "stage";
  initialTasks: TaskWithRelations[];
  /** Tasks kept out of the active board (e.g. already-published videos) but
   * still reachable so the panel stays clean without losing history. */
  archivedTasks?: TaskWithRelations[];
  archivedLabel?: string;
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

  // Keeps the open detail dialog's task in sync with fresh server data (new
  // comments/attachments/etc. don't change the board signature above, but
  // `initialTasks` is still a new array every time the page revalidates).
  const [syncedTasksRef, setSyncedTasksRef] = useState(initialTasks);
  if (syncedTasksRef !== initialTasks) {
    setSyncedTasksRef(initialTasks);
    if (selectedTask) {
      setSelectedTask(initialTasks.find((t) => t.id === selectedTask.id) ?? null);
    }
  }
  const [showArchived, setShowArchived] = useState(false);

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

    const items = [...board[overCol]];
    const activeIndex = items.findIndex((t) => t.id === active.id);
    const overIndex = items.findIndex((t) => t.id === over.id);

    // Dropped back on its own spot — nothing to persist, and calling the
    // server here is what caused visible glitches when dragging fast.
    if (activeCol === overCol && (activeIndex === -1 || activeIndex === overIndex)) {
      return;
    }

    let nextItems = items;
    if (activeIndex !== -1 && overIndex !== -1 && activeIndex !== overIndex) {
      nextItems = arrayMove(items, activeIndex, overIndex);
    }

    // Calling the mutation and its follow-up from inside the setBoard
    // updater (as before) triggered React's "setState while rendering a
    // different component" violation — moved out here into the plain event
    // handler body instead, which is where side effects belong.
    const prevBoard = board;
    setBoard((prev) => ({ ...prev, [overCol]: nextItems }));

    // The optimistic state above is already the intended end result, so we
    // don't force a full page refresh on success — that round-trip was
    // racing with whatever the user dragged next and snapping cards back
    // mid-gesture. Only resync from the server if the move actually failed.
    moveTask({
      taskId: String(active.id),
      field: groupField,
      value: overCol,
      orderedIds: nextItems.map((t) => t.id),
    }).catch(() => {
      setBoard(prevBoard);
      router.refresh();
    });
  }

  return (
    <>
      <DndContext
        id={`kanban-${type}-${platform ?? "all"}`}
        sensors={sensors}
        collisionDetection={closestCorners}
        onDragStart={handleDragStart}
        onDragOver={handleDragOver}
        onDragEnd={handleDragEnd}
      >
        <div className="overflow-x-auto pb-2">
          <div
            className="grid gap-3"
            style={{
              gridTemplateColumns: `repeat(${columns.length}, minmax(190px, 1fr))`,
            }}
          >
            {columns.map((col) => (
              <KanbanColumn
                key={col.key}
                id={col.key}
                label={col.label}
                color={col.color}
                processing={col.processing}
                tasks={board[col.key] ?? []}
                onTaskClick={setSelectedTask}
                onAddClick={() => setCreateColumn(col.key)}
              />
            ))}
          </div>
        </div>
        <DragOverlay>
          {activeTask && <TaskCard task={activeTask} overlay />}
        </DragOverlay>
      </DndContext>

      {archivedTasks && archivedTasks.length > 0 && (
        <div className="mt-4">
          <button
            type="button"
            onClick={() => setShowArchived((v) => !v)}
            className="focus-ring flex items-center gap-2 rounded-lg px-2 py-1.5 text-sm font-medium text-[var(--ink-2)] hover:bg-[var(--panel)] hover:text-[var(--ink-0)]"
          >
            <Archive className="h-4 w-4" />
            {archivedLabel} ({archivedTasks.length})
            <ChevronDown
              className={cn("h-4 w-4 transition-transform", showArchived && "rotate-180")}
            />
          </button>
          {showArchived && (
            <div className="glass-panel animate-fade-in mt-2 rounded-xl p-2">
              {archivedTasks.map((task) => (
                <MiniTaskRow key={task.id} task={task} onClick={() => setSelectedTask(task)} />
              ))}
            </div>
          )}
        </div>
      )}

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
