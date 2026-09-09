"use server";

import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/auth-helpers";
import { todayUTC, getDailyTaskHistoryRaw } from "@/lib/daily-tasks";
import { revalidatePath } from "next/cache";
import type { TaskRecurrence } from "@prisma/client";

const labelSchema = z.string().trim().min(1, "Escribe algo").max(200);

function assertCanManage(ownerId: string, session: { user: { id: string; role: string } }) {
  if (ownerId !== session.user.id && session.user.role !== "ADMIN") {
    throw new Error("No tienes permiso para modificar estas tareas");
  }
}

export async function createDailyTaskItem(
  label: string,
  recurrence: TaskRecurrence,
  weekdays: number[],
  onDate: string | null,
  targetUserId?: string
) {
  const session = await requireSession();
  const ownerId = targetUserId ?? session.user.id;
  assertCanManage(ownerId, session);

  const parsed = labelSchema.safeParse(label);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Datos inválidos" };
  }

  const count = await prisma.dailyTaskItem.count({ where: { userId: ownerId } });
  const item = await prisma.dailyTaskItem.create({
    data: {
      label: parsed.data,
      position: count,
      userId: ownerId,
      recurrence,
      weekdays: recurrence === "WEEKLY" ? weekdays : [],
      onDate: recurrence === "ONCE" && onDate ? new Date(onDate) : null,
    },
  });

  revalidatePath("/soporte");
  revalidatePath("/tareas-diarias-soporte");
  return { success: true, item };
}

export async function deleteDailyTaskItem(id: string) {
  const session = await requireSession();
  const item = await prisma.dailyTaskItem.findUnique({ where: { id } });
  if (!item) return;
  assertCanManage(item.userId, session);

  await prisma.dailyTaskItem.delete({ where: { id } });
  revalidatePath("/soporte");
  revalidatePath("/tareas-diarias-soporte");
}

export async function toggleDailyTaskToday(itemId: string, done: boolean) {
  const session = await requireSession();
  const item = await prisma.dailyTaskItem.findUnique({ where: { id: itemId } });
  if (!item) return;
  assertCanManage(item.userId, session);

  const date = todayUTC();
  if (done) {
    await prisma.dailyTaskLog.upsert({
      where: { itemId_date: { itemId, date } },
      create: { itemId, date, userId: item.userId },
      update: {},
    });
  } else {
    await prisma.dailyTaskLog.deleteMany({ where: { itemId, date } });
  }
  revalidatePath("/soporte");
  revalidatePath("/tareas-diarias-soporte");
}

export async function fetchDailyTaskHistory(userId: string, year: number, month: number) {
  const session = await requireSession();
  assertCanManage(userId, session);
  const { items, logs } = await getDailyTaskHistoryRaw(userId, year, month);
  return { items, logs };
}
