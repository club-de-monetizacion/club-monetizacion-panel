/**
 * All date-only values in this app (task due dates, calendar grid days) are
 * stored/compared as UTC midnight timestamps — `new Date("2026-09-15")`
 * parses as UTC per the ECMAScript spec. Every helper here reads/writes UTC
 * fields exclusively so the grid lines up with `dueDate` regardless of the
 * server's local timezone (dev machine vs. Vercel's UTC runtime).
 */
import { todayInAppZone } from "@/lib/timezone";

export function dateKey(date: Date) {
  const y = date.getUTCFullYear();
  const m = String(date.getUTCMonth() + 1).padStart(2, "0");
  const d = String(date.getUTCDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

/** Weeks (Mon–Sun) covering the whole month, including the leading/trailing
 * days from adjacent months needed to fill a complete calendar grid. */
export function getMonthGrid(year: number, month: number) {
  const firstWeekday = new Date(Date.UTC(year, month, 1)).getUTCDay(); // 0=Sun..6=Sat
  const mondayOffset = (firstWeekday + 6) % 7; // days since the preceding Monday
  const gridStart = new Date(Date.UTC(year, month, 1 - mondayOffset));

  const lastWeekday = new Date(Date.UTC(year, month + 1, 0)).getUTCDay();
  const sundayOffset = (7 - lastWeekday) % 7; // days until the following Sunday
  const gridEnd = new Date(Date.UTC(year, month + 1, sundayOffset));

  const days: Date[] = [];
  const cursor = new Date(gridStart);
  while (cursor.getTime() <= gridEnd.getTime()) {
    days.push(new Date(cursor));
    cursor.setUTCDate(cursor.getUTCDate() + 1);
  }

  const weeks: Date[][] = [];
  for (let i = 0; i < days.length; i += 7) {
    weeks.push(days.slice(i, i + 7));
  }
  return { weeks, gridStart, gridEnd };
}

export const WEEKDAY_LABELS = ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"];

export const MONTH_LABELS = [
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

export function shiftMonth(year: number, month: number, delta: number) {
  const d = new Date(Date.UTC(year, month + delta, 1));
  return { year: d.getUTCFullYear(), month: d.getUTCMonth() };
}

/** "Today" in the team's own timezone (Guadalajara), not the runtime's. */
export function todayUTC() {
  return todayInAppZone();
}
