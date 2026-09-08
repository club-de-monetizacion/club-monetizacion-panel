"use client";

import { useEffect, useState } from "react";
import { TaskChip } from "@/components/calendar/task-chip";
import { DayAgendaDialog } from "@/components/calendar/day-agenda-dialog";
import { TaskDetailDialog } from "@/components/board/task-detail-dialog";
import { dateKey, WEEKDAY_LABELS } from "@/lib/calendar";
import { cn } from "@/lib/utils";
import type { TaskWithRelations } from "@/lib/data";

const MAX_VISIBLE = 3;

type Member = { id: string; name: string | null; email: string; image?: string | null };
type ProjectOption = { id: string; name: string };

export function CalendarGrid({
  weeks,
  currentMonth,
  tasksByDate,
  members,
  projects,
}: {
  weeks: Date[][];
  currentMonth: number;
  tasksByDate: Record<string, TaskWithRelations[]>;
  members: Member[];
  projects: ProjectOption[];
}) {
  const [todayKey, setTodayKey] = useState<string | null>(null);
  const [dayAgenda, setDayAgenda] = useState<{ key: string; date: Date } | null>(null);
  const [selectedTask, setSelectedTask] = useState<TaskWithRelations | null>(null);

  useEffect(() => {
    // Reads the viewer's own clock/timezone on mount so the "today" ring
    // matches their real calendar day; deferred to an effect (rather than a
    // useState initializer) so server and client render the same markup on
    // hydration and only diverge afterwards.
    const now = new Date();
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setTodayKey(
      dateKey(new Date(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate())))
    );
  }, []);

  return (
    <>
      <div className="glass-panel overflow-hidden rounded-2xl">
        <div className="grid grid-cols-7 border-b border-[var(--panel-border)]">
          {WEEKDAY_LABELS.map((label) => (
            <div
              key={label}
              className="px-2 py-2 text-center text-[11px] font-medium uppercase tracking-wide text-[var(--ink-3)]"
            >
              {label}
            </div>
          ))}
        </div>

        <div className="grid grid-cols-7">
          {weeks.flat().map((day) => {
            const key = dateKey(day);
            const dayTasks = tasksByDate[key] ?? [];
            const inMonth = day.getUTCMonth() === currentMonth;
            const isToday = key === todayKey;
            const visible = dayTasks.slice(0, MAX_VISIBLE);
            const overflow = dayTasks.length - visible.length;

            return (
              <div
                key={key}
                className={cn(
                  "min-h-[92px] border-b border-r border-[var(--panel-border)] p-1.5 [&:nth-child(7n)]:border-r-0",
                  !inMonth && "opacity-40"
                )}
              >
                <div className="mb-1 flex justify-end">
                  <span
                    className={cn(
                      "flex h-5 w-5 items-center justify-center rounded-full text-[11px]",
                      isToday
                        ? "bg-[var(--accent)] font-semibold text-white"
                        : "text-[var(--ink-2)]"
                    )}
                  >
                    {day.getUTCDate()}
                  </span>
                </div>
                <div className="space-y-1">
                  {visible.map((task) => (
                    <TaskChip
                      key={task.id}
                      task={task}
                      onClick={() => setSelectedTask(task)}
                    />
                  ))}
                  {overflow > 0 && (
                    <button
                      type="button"
                      onClick={() => setDayAgenda({ key, date: day })}
                      className="focus-ring w-full rounded-md px-1.5 py-0.5 text-left text-[11px] text-[var(--ink-3)] hover:bg-[var(--panel)] hover:text-[var(--ink-0)]"
                    >
                      +{overflow} más
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {dayAgenda && (
        <DayAgendaDialog
          label={dayAgenda.date.toLocaleDateString("es-ES", {
            weekday: "long",
            day: "numeric",
            month: "long",
            timeZone: "UTC",
          })}
          tasks={tasksByDate[dayAgenda.key] ?? []}
          onClose={() => setDayAgenda(null)}
          onSelectTask={(task) => {
            setDayAgenda(null);
            setSelectedTask(task);
          }}
        />
      )}

      {selectedTask && (
        <TaskDetailDialog
          task={selectedTask}
          members={members}
          projects={projects}
          onClose={() => setSelectedTask(null)}
        />
      )}
    </>
  );
}
