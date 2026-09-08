import { prisma } from "@/lib/prisma";

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

/** UTC-midnight "today", matching the rest of the app's date-only fields
 * (due dates, calendar grid) — used as the shared key between writing a
 * completion log and reading "is this done today". */
export function todayUTC() {
  const now = new Date();
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
}

/** Idempotent: only seeds the default list the very first time a user has
 * zero daily tasks, so it's safe to call on every page load. */
export async function ensureDefaultDailyTasks(userId: string) {
  const count = await prisma.dailyTaskItem.count({ where: { userId } });
  if (count > 0) return;
  await prisma.dailyTaskItem.createMany({
    data: DEFAULT_DAILY_TASKS.map((label, position) => ({ label, position, userId })),
  });
}
