"use client";

import { useEffect, useState, useTransition } from "react";
import { ChevronLeft, ChevronRight, Loader2 } from "lucide-react";
import { fetchDailyTaskHistory } from "@/app/actions/daily-tasks";
import { isItemActiveOnDate, sameUTCDate } from "@/lib/daily-task-recurrence";
import { todayInAppZone } from "@/lib/timezone";
import { cn } from "@/lib/utils";
import type { TaskCategory } from "@prisma/client";

const WEEKDAY_HEADER = ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"];
const MONTH_LABEL = [
  "Enero",
  "Febrero",
  "Marzo",
  "Abril",
  "Mayo",
  "Junio",
  "Julio",
  "Agosto",
  "Septiembre",
  "Octubre",
  "Noviembre",
  "Diciembre",
];

type HistoryItem = {
  id: string;
  recurrence: "DAILY" | "WEEKLY" | "ONCE";
  weekdays: number[];
  onDate: Date | null;
  createdAt: Date;
};

type HistoryLog = { itemId: string; date: Date };

function startOfUTCDate(d: Date) {
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
}

function dayPct(day: Date, items: HistoryItem[], logs: HistoryLog[], today: Date) {
  // Future days have nothing to report yet.
  if (day > startOfUTCDate(today)) return null;

  const scheduled = items.filter(
    (item) => startOfUTCDate(new Date(item.createdAt)) <= day && isItemActiveOnDate(item, day)
  );
  if (scheduled.length === 0) return null;
  const doneCount = logs.filter(
    (log) => sameUTCDate(new Date(log.date), day) && scheduled.some((i) => i.id === log.itemId)
  ).length;
  return Math.round((doneCount / scheduled.length) * 100);
}

function pctColor(pct: number | null) {
  if (pct === null) return "bg-transparent text-[var(--ink-3)]";
  if (pct === 100) return "bg-emerald-500/20 text-emerald-400";
  if (pct >= 50) return "bg-amber-500/20 text-amber-400";
  if (pct > 0) return "bg-red-500/15 text-red-400";
  return "bg-[var(--panel-strong)] text-[var(--ink-3)]";
}

export function DailyTasksCalendar({
  userId,
  category,
}: {
  userId: string;
  category: TaskCategory;
}) {
  const now = todayInAppZone();
  const [year, setYear] = useState(now.getUTCFullYear());
  const [month, setMonth] = useState(now.getUTCMonth());
  const [items, setItems] = useState<HistoryItem[]>([]);
  const [logs, setLogs] = useState<HistoryLog[]>([]);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    let cancelled = false;
    startTransition(async () => {
      const result = await fetchDailyTaskHistory(userId, year, month, category);
      if (cancelled) return;
      setItems(result.items as unknown as HistoryItem[]);
      setLogs(result.logs as unknown as HistoryLog[]);
    });
    return () => {
      cancelled = true;
    };
  }, [userId, year, month, category]);

  function changeMonth(delta: number) {
    const next = new Date(Date.UTC(year, month + delta, 1));
    setYear(next.getUTCFullYear());
    setMonth(next.getUTCMonth());
  }

  const firstOfMonth = new Date(Date.UTC(year, month, 1));
  const daysInMonth = new Date(Date.UTC(year, month + 1, 0)).getUTCDate();
  // Monday-first offset: getUTCDay() is 0=Sun..6=Sat.
  const leadingBlanks = (firstOfMonth.getUTCDay() + 6) % 7;
  const today = todayInAppZone();

  const cells: (Date | null)[] = [
    ...Array(leadingBlanks).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => new Date(Date.UTC(year, month, i + 1))),
  ];

  return (
    <div>
      <div className="mb-3 flex items-center justify-between">
        <button
          type="button"
          onClick={() => changeMonth(-1)}
          className="focus-ring rounded-md p-1.5 text-[var(--ink-2)] hover:bg-[var(--panel)]"
          aria-label="Mes anterior"
        >
          <ChevronLeft className="h-4 w-4" />
        </button>
        <p className="text-sm font-medium text-[var(--ink-1)]">
          {MONTH_LABEL[month]} {year}
        </p>
        <button
          type="button"
          onClick={() => changeMonth(1)}
          className="focus-ring rounded-md p-1.5 text-[var(--ink-2)] hover:bg-[var(--panel)]"
          aria-label="Mes siguiente"
        >
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>

      {isPending && items.length === 0 ? (
        <div className="flex justify-center py-10">
          <Loader2 className="h-5 w-5 animate-spin text-[var(--ink-3)]" />
        </div>
      ) : (
        <>
          <div className="mb-1 grid grid-cols-7 gap-1 text-center text-[10px] font-medium uppercase tracking-wide text-[var(--ink-3)]">
            {WEEKDAY_HEADER.map((d) => (
              <span key={d}>{d}</span>
            ))}
          </div>
          <div className="grid grid-cols-7 gap-1">
            {cells.map((day, i) => {
              if (!day) return <div key={`blank-${i}`} />;
              const pct = dayPct(day, items, logs, today);
              const isToday = sameUTCDate(day, today);
              return (
                <div
                  key={day.toISOString()}
                  className={cn(
                    "flex aspect-square flex-col items-center justify-center rounded-lg text-xs",
                    pctColor(pct),
                    isToday && "ring-1 ring-[var(--accent)]"
                  )}
                >
                  <span>{day.getUTCDate()}</span>
                  {pct !== null && <span className="text-[9px] opacity-80">{pct}%</span>}
                </div>
              );
            })}
          </div>
          <div className="mt-3 flex flex-wrap items-center gap-3 text-[11px] text-[var(--ink-3)]">
            <span className="flex items-center gap-1">
              <span className="h-2.5 w-2.5 rounded-full bg-emerald-500/40" /> 100%
            </span>
            <span className="flex items-center gap-1">
              <span className="h-2.5 w-2.5 rounded-full bg-amber-500/40" /> 50–99%
            </span>
            <span className="flex items-center gap-1">
              <span className="h-2.5 w-2.5 rounded-full bg-red-500/40" /> 1–49%
            </span>
            <span className="flex items-center gap-1">
              <span className="h-2.5 w-2.5 rounded-full bg-[var(--panel-strong)]" /> 0%
            </span>
          </div>
        </>
      )}
    </div>
  );
}
