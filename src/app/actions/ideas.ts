"use server";

import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/auth-helpers";
import { revalidatePath } from "next/cache";
import type { BoardElementKind } from "@prisma/client";

const bodySchema = z.object({
  body: z.string().trim().max(2000),
});

const COLUMNS = 5;
const COLUMN_WIDTH = 260;
const ROW_HEIGHT = 200;

const KIND_DEFAULTS: Record<BoardElementKind, { body: string; width: number; height: number }> = {
  STICKY: { body: "Nueva nota", width: 224, height: 160 },
  TEXT: { body: "Texto", width: 220, height: 100 },
  TITLE: { body: "Título", width: 280, height: 64 },
  SHAPE_RECTANGLE: { body: "", width: 200, height: 130 },
  SHAPE_CIRCLE: { body: "", width: 150, height: 150 },
  SHAPE_LINE: { body: "", width: 200, height: 60 },
  SHAPE_CROSS: { body: "", width: 120, height: 120 },
};

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
  if (!parsed.success || !parsed.data.body) {
    return { error: "Escribe algo antes de guardar" };
  }

  const { x, y } = await nextGridPosition();
  await prisma.idea.create({
    data: { body: parsed.data.body, createdById: session.user.id, x, y },
  });

  revalidatePath("/ideas");
  return { success: true };
}

/** Used by the whiteboard to drop a new element at a specific spot. */
export async function createIdeaAt(
  x: number,
  y: number,
  kind: BoardElementKind = "STICKY",
  body?: string
) {
  const session = await requireSession();
  const defaults = KIND_DEFAULTS[kind];
  const parsed = bodySchema.safeParse({ body: body ?? defaults.body });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Datos inválidos" };
  }

  const idea = await prisma.idea.create({
    data: {
      body: parsed.data.body,
      kind,
      width: defaults.width,
      height: defaults.height,
      createdById: session.user.id,
      x,
      y,
    },
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

export async function resizeIdea(id: string, width: number, height: number) {
  await requireSession();
  await prisma.idea.update({
    where: { id },
    data: { width: Math.round(width), height: Math.round(height) },
  });
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

export async function createIdeaConnection(sourceId: string, targetId: string) {
  await requireSession();
  if (sourceId === targetId) return { error: "No puedes conectar una idea consigo misma" };
  const connection = await prisma.ideaConnection.create({
    data: { sourceId, targetId },
  });
  revalidatePath("/ideas");
  return { success: true, connection };
}

export async function deleteIdeaConnection(id: string) {
  await requireSession();
  await prisma.ideaConnection.delete({ where: { id } }).catch(() => null);
  revalidatePath("/ideas");
}
