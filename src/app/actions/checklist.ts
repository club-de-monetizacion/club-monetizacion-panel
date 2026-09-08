"use server";

import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/auth-helpers";
import { revalidatePath } from "next/cache";

const labelSchema = z.string().trim().min(1, "Escribe algo").max(200);

function revalidateBoards() {
  revalidatePath("/tableros");
  revalidatePath("/soporte");
  revalidatePath("/calendario");
  revalidatePath("/");
}

export async function addChecklistItem(taskId: string, label: string) {
  await requireSession();
  const parsed = labelSchema.safeParse(label);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Datos inválidos" };
  }

  const count = await prisma.checklistItem.count({ where: { taskId } });
  const item = await prisma.checklistItem.create({
    data: { taskId, label: parsed.data, position: count },
  });

  revalidateBoards();
  return { success: true, item };
}

export async function toggleChecklistItem(id: string, done: boolean) {
  await requireSession();
  await prisma.checklistItem.update({ where: { id }, data: { done } });
  revalidateBoards();
}

export async function deleteChecklistItem(id: string) {
  await requireSession();
  await prisma.checklistItem.delete({ where: { id } });
  revalidateBoards();
}
