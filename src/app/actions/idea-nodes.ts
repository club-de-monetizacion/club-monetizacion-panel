"use server";

import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/auth-helpers";
import { revalidatePath } from "next/cache";
import type { BoardElementKind } from "@prisma/client";

const bodySchema = z.object({
  body: z.string().trim().max(2000),
});

/** Images carry a base64 data URL in `body` instead of text, so they need
 * their own (much larger) length cap and a content-type check. */
function validateBody(kind: BoardElementKind, body: string) {
  const trimmed = body.trim();
  if (kind === "IMAGE") {
    if (!trimmed.startsWith("data:image/")) return { error: "Imagen inválida" };
    if (trimmed.length > 2_000_000) return { error: "La imagen es demasiado grande" };
    return { body: trimmed };
  }
  const parsed = bodySchema.safeParse({ body: trimmed });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Datos inválidos" };
  return { body: parsed.data.body };
}

const KIND_DEFAULTS: Record<BoardElementKind, { body: string; width: number; height: number }> = {
  STICKY: { body: "Nueva nota", width: 224, height: 160 },
  TEXT: { body: "Texto", width: 220, height: 100 },
  TITLE: { body: "Título", width: 280, height: 64 },
  IMAGE: { body: "", width: 240, height: 180 },
  SHAPE_RECTANGLE: { body: "", width: 200, height: 130 },
  SHAPE_CIRCLE: { body: "", width: 150, height: 150 },
  SHAPE_LINE: { body: "", width: 200, height: 60 },
  SHAPE_CROSS: { body: "", width: 120, height: 120 },
};

/** Adds an element to a specific idea's own whiteboard. */
export async function createIdeaNode(
  ideaId: string,
  x: number,
  y: number,
  kind: BoardElementKind = "STICKY",
  body?: string,
  width?: number,
  height?: number
) {
  const session = await requireSession();
  const defaults = KIND_DEFAULTS[kind];
  const result = validateBody(kind, body ?? defaults.body);
  if ("error" in result) return { error: result.error };

  const node = await prisma.ideaNode.create({
    data: {
      ideaId,
      x,
      y,
      kind,
      width: width ?? defaults.width,
      height: height ?? defaults.height,
      body: result.body,
      createdById: session.user.id,
    },
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

export async function resizeIdeaNode(id: string, width: number, height: number) {
  await requireSession();
  await prisma.ideaNode.update({
    where: { id },
    data: { width: Math.round(width), height: Math.round(height) },
  });
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

export async function createIdeaNodeConnection(
  ideaId: string,
  sourceId: string,
  targetId: string
) {
  await requireSession();
  if (sourceId === targetId) return { error: "No puedes conectar un elemento consigo mismo" };
  const connection = await prisma.ideaNodeConnection.create({
    data: { ideaId, sourceId, targetId },
  });
  revalidatePath("/ideas");
  return { success: true, connection };
}

export async function deleteIdeaNodeConnection(id: string) {
  await requireSession();
  await prisma.ideaNodeConnection.delete({ where: { id } }).catch(() => null);
  revalidatePath("/ideas");
}
