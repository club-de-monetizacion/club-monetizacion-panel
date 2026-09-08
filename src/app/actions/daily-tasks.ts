"use server";

import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/auth-helpers";
import { todayUTC } from "@/lib/daily-tasks";
import { revalidatePath } from "next/cache";

const labelSchema = z.string().trim().min(1, "Escribe algo").max(200);

export async function createDailyTaskItem(label: string) {
  const session = await requireSession();
  const parsed = labelSchema.safeParse(label);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Datos inválidos" };
  }

  const count = await prisma.dailyTaskItem.count({ where: { userId: session.user.id } });
  const item = await prisma.dailyTaskItem.create({
    data: { label: parsed.data, position: count, userId: session.user.id },
  });

  revalidatePath("/soporte");
  return { success: true, item };
}

export async function deleteDailyTaskItem(id: string) {
  const session = await requireSession();
  const item = await prisma.dailyTaskItem.findUnique({ where: { id } });
  if (!item) return;
  if (item.userId !== session.user.id && session.user.role !== "ADMIN") {
    throw new Error("No tienes permiso para eliminar esta tarea");
  }

  await prisma.dailyTaskItem.delete({ where: { id } });
  revalidatePath("/soporte");
}

export async function toggleDailyTaskToday(itemId: string, done: boolean) {
  const session = await requireSession();
  const item = await prisma.dailyTaskItem.findUnique({ where: { id: itemId } });
  if (!item) return;
  if (item.userId !== session.user.id && session.user.role !== "ADMIN") {
    throw new Error("No tienes permiso para marcar esta tarea");
  }

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
}
