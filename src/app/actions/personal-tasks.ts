"use server";

import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/auth-helpers";
import { revalidatePath } from "next/cache";

const titleSchema = z.string().trim().min(1, "Escribe algo").max(200);
const descriptionSchema = z.string().trim().max(4000).nullable();

function revalidateAll() {
  revalidatePath("/tareas-personales");
}

/** Every action here loads the row first and checks `userId` against the
 * session itself — no admin override, unlike the shared daily-task
 * actions. This list is private to its owner, full stop. */
async function requireOwnedTask(id: string) {
  const session = await requireSession();
  const task = await prisma.personalTask.findUnique({ where: { id } });
  if (!task || task.userId !== session.user.id) {
    throw new Error("No encontrada");
  }
  return task;
}

export async function createPersonalTask(title: string) {
  const session = await requireSession();
  const parsed = titleSchema.safeParse(title);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Datos inválidos" };
  }

  const task = await prisma.personalTask.create({
    data: { title: parsed.data, userId: session.user.id },
  });

  revalidateAll();
  return { success: true, task };
}

export async function updatePersonalTask(
  id: string,
  data: { title?: string; description?: string | null }
) {
  await requireOwnedTask(id);

  const updates: { title?: string; description?: string | null } = {};
  if (data.title !== undefined) {
    const parsed = titleSchema.safeParse(data.title);
    if (!parsed.success) {
      return { error: parsed.error.issues[0]?.message ?? "Datos inválidos" };
    }
    updates.title = parsed.data;
  }
  if (data.description !== undefined) {
    const trimmed = data.description?.trim() || null;
    const parsed = descriptionSchema.safeParse(trimmed);
    if (!parsed.success) {
      return { error: parsed.error.issues[0]?.message ?? "Datos inválidos" };
    }
    updates.description = parsed.data;
  }

  await prisma.personalTask.update({ where: { id }, data: updates });
  revalidateAll();
  return { success: true };
}

export async function togglePersonalTaskDone(id: string, done: boolean) {
  await requireOwnedTask(id);
  await prisma.personalTask.update({
    where: { id },
    data: { done, doneAt: done ? new Date() : null },
  });
  revalidateAll();
}

export async function deletePersonalTask(id: string) {
  await requireOwnedTask(id);
  await prisma.personalTask.delete({ where: { id } });
  revalidateAll();
}
