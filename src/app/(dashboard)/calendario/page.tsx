import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { getAssignableMembers, getProjects, getTasksInRange } from "@/lib/data";
import {
  MONTH_LABELS,
  dateKey,
  getMonthGrid,
  shiftMonth,
} from "@/lib/calendar";
import { CalendarGrid } from "@/components/calendar/calendar-grid";
import type { TaskWithRelations } from "@/lib/data";

export const dynamic = "force-dynamic";

function parseParam(value: string | undefined, fallback: number) {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
}

export default async function CalendarPage({
  searchParams,
}: {
  searchParams: Promise<{ year?: string; month?: string }>;
}) {
  const params = await searchParams;
  const now = new Date();
  const year = parseParam(params.year, now.getUTCFullYear());
  const month = parseParam(params.month, now.getUTCMonth());

  const { weeks, gridStart, gridEnd } = getMonthGrid(year, month);
  const [tasks, members, projects] = await Promise.all([
    getTasksInRange(gridStart, gridEnd),
    getAssignableMembers(),
    getProjects(),
  ]);

  const tasksByDate: Record<string, TaskWithRelations[]> = {};
  for (const task of tasks) {
    if (!task.dueDate) continue;
    const key = dateKey(task.dueDate);
    (tasksByDate[key] ??= []).push(task);
  }

  const prev = shiftMonth(year, month, -1);
  const next = shiftMonth(year, month, 1);

  return (
    <div className="animate-fade-in">
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold text-[var(--ink-0)]">Calendario</h2>
          <p className="text-xs text-[var(--ink-3)]">
            Todo lo que está programado, ordenado por fecha.
          </p>
        </div>
        <div className="glass-panel flex items-center gap-1 rounded-lg p-1">
          <Link
            href={`/calendario?year=${prev.year}&month=${prev.month}`}
            className="focus-ring rounded-md p-1.5 text-[var(--ink-2)] hover:bg-[var(--panel-strong)] hover:text-[var(--ink-0)]"
          >
            <ChevronLeft className="h-4 w-4" />
          </Link>
          <span className="min-w-[9rem] px-2 text-center text-sm font-medium text-[var(--ink-0)]">
            {MONTH_LABELS[month]} {year}
          </span>
          <Link
            href={`/calendario?year=${next.year}&month=${next.month}`}
            className="focus-ring rounded-md p-1.5 text-[var(--ink-2)] hover:bg-[var(--panel-strong)] hover:text-[var(--ink-0)]"
          >
            <ChevronRight className="h-4 w-4" />
          </Link>
          <Link
            href="/calendario"
            className="focus-ring ml-1 rounded-md px-2.5 py-1.5 text-xs font-medium text-[var(--ink-2)] hover:bg-[var(--panel-strong)] hover:text-[var(--ink-0)]"
          >
            Hoy
          </Link>
        </div>
      </div>

      <CalendarGrid
        weeks={weeks}
        currentMonth={month}
        tasksByDate={tasksByDate}
        members={members}
        projects={projects}
      />
    </div>
  );
}
