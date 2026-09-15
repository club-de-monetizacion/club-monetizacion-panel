import { prisma } from "@/lib/prisma";
import { todayInAppZone } from "@/lib/timezone";
import type { TaskCategory } from "@prisma/client";

/** Seeded onto a support member's list the first time they open the tab. */
export const DEFAULT_DAILY_TASKS = [
  "Contestar mensajes de Skool",
  "Crear links para las clases",
  "Respaldar clase",
  "Subir clase",
  "Buscar casos de éxito",
  "Agendar llamadas de casos de éxito Low ticket",
  "Abrir grupo de WhatsApp",
  "Cerrar grupo de WhatsApp",
  "Enviar post de clase antes",
  "Enviar post de clase en vivo",
];

/** "Today" in the team's own timezone (Guadalajara), as a UTC-midnight
 * Date — matching the rest of the app's date-only fields (due dates,
 * calendar grid) — used as the shared key between writing a completion log
 * and reading "is this done today". */
export function todayUTC() {
  return todayInAppZone();
}

/** Idempotent: only seeds the default list the very first time a user has
 * zero SUPPORT daily tasks, so it's safe to call on every page load. */
export async function ensureDefaultDailyTasks(userId: string) {
  const count = await prisma.dailyTaskItem.count({ where: { userId, category: "SUPPORT" } });
  if (count > 0) return;
  await prisma.dailyTaskItem.createMany({
    data: DEFAULT_DAILY_TASKS.map((label, position) => ({
      label,
      position,
      userId,
      category: "SUPPORT",
    })),
  });
}

/** Every task item (with its recurrence rule) plus every completion log
 * within the given UTC month, for the calendar view's per-day percentage. */
export async function getDailyTaskHistoryRaw(
  userId: string,
  year: number,
  month: number,
  category: TaskCategory
) {
  const start = new Date(Date.UTC(year, month, 1));
  const end = new Date(Date.UTC(year, month + 1, 0));

  const [items, logs] = await Promise.all([
    prisma.dailyTaskItem.findMany({
      where: { userId, category },
      select: {
        id: true,
        recurrence: true,
        weekdays: true,
        onDate: true,
        createdAt: true,
      },
    }),
    prisma.dailyTaskLog.findMany({
      where: { userId, date: { gte: start, lte: end } },
      select: { itemId: true, date: true },
    }),
  ]);

  return { items, logs, start, end };
}
