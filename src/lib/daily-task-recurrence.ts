import type { TaskRecurrence } from "@prisma/client";

/** Spanish weekday labels indexed by JS `Date#getUTCDay()` (0 = Sunday). */
export const WEEKDAY_LABELS = ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"];

/** Monday-first display order, referencing the same getUTCDay() indices. */
export const WEEKDAY_DISPLAY_ORDER = [1, 2, 3, 4, 5, 6, 0];

export function sameUTCDate(a: Date, b: Date) {
  return (
    a.getUTCFullYear() === b.getUTCFullYear() &&
    a.getUTCMonth() === b.getUTCMonth() &&
    a.getUTCDate() === b.getUTCDate()
  );
}

export type RecurrenceInfo = {
  recurrence: TaskRecurrence;
  weekdays: number[];
  onDate: Date | null;
};

/** Whether a task item is scheduled to appear on the given date, per its
 * recurrence rule. Pure/date-only — safe to use in both client and server
 * code (no database access here). */
export function isItemActiveOnDate(item: RecurrenceInfo, date: Date): boolean {
  if (item.recurrence === "DAILY") return true;
  if (item.recurrence === "WEEKLY") return item.weekdays.includes(date.getUTCDay());
  if (item.recurrence === "ONCE") return !!item.onDate && sameUTCDate(item.onDate, date);
  return false;
}

/** Short human label for an item's schedule, e.g. "Diario", "Lun, Mié, Vie",
 * or "Solo el 12 sept". */
export function recurrenceLabel(item: RecurrenceInfo): string {
  if (item.recurrence === "DAILY") return "Diario";
  if (item.recurrence === "WEEKLY") {
    if (item.weekdays.length === 0) return "Sin días elegidos";
    return WEEKDAY_DISPLAY_ORDER.filter((d) => item.weekdays.includes(d))
      .map((d) => WEEKDAY_LABELS[d])
      .join(", ");
  }
  if (item.recurrence === "ONCE" && item.onDate) {
    return `Solo el ${item.onDate.toLocaleDateString("es-MX", {
      day: "numeric",
      month: "short",
      timeZone: "UTC",
    })}`;
  }
  return "";
}
