import Link from "next/link";
import { ChevronLeft, ChevronRight, User } from "lucide-react";
import { auth } from "@/auth";
import { getAssignableMembers, getProjects, getTasksInRange } from "@/lib/data";
import {
  MONTH_LABELS,
  dateKey,
  getMonthGrid,
  shiftMonth,
  todayUTC,
} from "@/lib/calendar";
import { CalendarGrid } from "@/components/calendar/calendar-grid";
import { cn } from "@/lib/utils";
import type { TaskWithRelations } from "@/lib/data";

export const dynamic = "force-dynamic";

function parseParam(value: string | undefined, fallback: number) {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
}

function monthHref(year: number, month: number, mine: boolean) {
  const params = new URLSearchParams({ year: String(year), month: String(month) });
  if (mine) params.set("mine", "1");
  return `/calendario?${params.toString()}`;
}

export default async function CalendarPage({
  searchParams,
}: {
  searchParams: Promise<{ year?: string; month?: string; mine?: string }>;
}) {
  const params = await searchParams;
  const session = await auth();
  const now = todayUTC();
  const year = parseParam(params.year, now.getUTCFullYear());
  const month = parseParam(params.month, now.getUTCMonth());
  const mine = params.mine === "1";

  const { weeks, gridStart, gridEnd } = getMonthGrid(year, month);
  const [tasks, members, projects] = await Promise.all([
    getTasksInRange(gridStart, gridEnd, mine ? session?.user.id : undefined),
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
        <div className="flex flex-wrap items-center gap-2">
          <Link
            href={monthHref(year, month, !mine)}
            className={cn(
              "focus-ring flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition",
              mine
                ? "bg-[var(--accent)] text-[#1a1200]"
                : "glass-panel text-[var(--ink-2)] hover:text-[var(--ink-0)]"
            )}
          >
            <User className="h-3.5 w-3.5" />
            Solo mis tareas
          </Link>
          <div className="glass-panel flex items-center gap-1 rounded-lg p-1">
            <Link
              href={monthHref(prev.year, prev.month, mine)}
              className="focus-ring rounded-md p-1.5 text-[var(--ink-2)] hover:bg-[var(--panel-strong)] hover:text-[var(--ink-0)]"
            >
              <ChevronLeft className="h-4 w-4" />
            </Link>
            <span className="min-w-[9rem] px-2 text-center text-sm font-medium text-[var(--ink-0)]">
              {MONTH_LABELS[month]} {year}
            </span>
            <Link
              href={monthHref(next.year, next.month, mine)}
              className="focus-ring rounded-md p-1.5 text-[var(--ink-2)] hover:bg-[var(--panel-strong)] hover:text-[var(--ink-0)]"
            >
              <ChevronRight className="h-4 w-4" />
            </Link>
            <Link
              href={monthHref(now.getUTCFullYear(), now.getUTCMonth(), mine)}
              className="focus-ring ml-1 rounded-md px-2.5 py-1.5 text-xs font-medium text-[var(--ink-2)] hover:bg-[var(--panel-strong)] hover:text-[var(--ink-0)]"
            >
              Hoy
            </Link>
          </div>
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
