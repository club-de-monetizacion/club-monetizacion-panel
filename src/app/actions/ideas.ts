"use server";

import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/auth-helpers";
import { revalidatePath } from "next/cache";

const bodySchema = z.object({
  body: z.string().trim().min(1, "Escribe algo antes de guardar").max(2000),
});

const COLUMNS = 5;
const COLUMN_WIDTH = 260;
const ROW_HEIGHT = 200;

async function nextGridPosition() {
  const count = await prisma.idea.count();
  return {
    x: (count % COLUMNS) * COLUMN_WIDTH + 40,
    y: Math.floor(count / COLUMNS) * ROW_HEIGHT + 40,
  };
}

/** Used by the simple "Notas" list — drops the new note into the next open
 * grid slot on the whiteboard too. */
export async function createIdea(formData: FormData) {
  const session = await requireSession();
  const parsed = bodySchema.safeParse({ body: formData.get("body") });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Datos inválidos" };
  }

  const { x, y } = await nextGridPosition();
  await prisma.idea.create({
    data: { body: parsed.data.body, createdById: session.user.id, x, y },
  });

  revalidatePath("/ideas");
  return { success: true };
}

/** Used by the whiteboard to drop a new sticky note at a specific spot. */
export async function createIdeaAt(body: string, x: number, y: number) {
  const session = await requireSession();
  const parsed = bodySchema.safeParse({ body });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Datos inválidos" };
  }

  const idea = await prisma.idea.create({
    data: { body: parsed.data.body, createdById: session.user.id, x, y },
    include: { createdBy: { select: { id: true, name: true, image: true } } },
  });

  revalidatePath("/ideas");
  return { success: true, idea };
}

export async function updateIdeaBody(id: string, body: string) {
  await requireSession();
  const parsed = bodySchema.safeParse({ body });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Datos inválidos" };
  }
  await prisma.idea.update({ where: { id }, data: { body: parsed.data.body } });
  return { success: true };
}

export async function moveIdea(id: string, x: number, y: number) {
  await requireSession();
  await prisma.idea.update({ where: { id }, data: { x, y } });
}

export async function recolorIdea(id: string, color: string) {
  await requireSession();
  await prisma.idea.update({ where: { id }, data: { color } });
}

export async function deleteIdea(id: string) {
  const session = await requireSession();
  const idea = await prisma.idea.findUnique({ where: { id } });
  if (!idea) return;
  if (idea.createdById !== session.user.id && session.user.role !== "ADMIN") {
    throw new Error("No tienes permiso para eliminar esta idea");
  }

  await prisma.idea.delete({ where: { id } });
  revalidatePath("/ideas");
}
