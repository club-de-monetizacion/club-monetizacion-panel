"use server";

import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/auth-helpers";
import { revalidatePath } from "next/cache";

const bodySchema = z.object({
  body: z.string().trim().min(1, "Escribe algo antes de guardar").max(2000),
});

/** Adds a sticky note to a specific idea's own whiteboard. */
export async function createIdeaNode(ideaId: string, x: number, y: number, body = "Nueva nota") {
  const session = await requireSession();
  const parsed = bodySchema.safeParse({ body });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Datos inválidos" };
  }

  const node = await prisma.ideaNode.create({
    data: { ideaId, x, y, body: parsed.data.body, createdById: session.user.id },
    include: { createdBy: { select: { id: true, name: true, image: true } } },
  });

  revalidatePath("/ideas");
  return { success: true, node };
}

export async function updateIdeaNodeBody(id: string, body: string) {
  await requireSession();
  const parsed = bodySchema.safeParse({ body });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Datos inválidos" };
  }
  await prisma.ideaNode.update({ where: { id }, data: { body: parsed.data.body } });
  return { success: true };
}

export async function moveIdeaNode(id: string, x: number, y: number) {
  await requireSession();
  await prisma.ideaNode.update({ where: { id }, data: { x, y } });
}

export async function recolorIdeaNode(id: string, color: string) {
  await requireSession();
  await prisma.ideaNode.update({ where: { id }, data: { color } });
}

export async function deleteIdeaNode(id: string) {
  const session = await requireSession();
  const node = await prisma.ideaNode.findUnique({ where: { id } });
  if (!node) return;
  if (node.createdById !== session.user.id && session.user.role !== "ADMIN") {
    throw new Error("No tienes permiso para eliminar esta nota");
  }

  await prisma.ideaNode.delete({ where: { id } });
  revalidatePath("/ideas");
}
