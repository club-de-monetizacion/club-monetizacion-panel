"use server";

import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/auth-helpers";
import { revalidatePath } from "next/cache";

const ideaSchema = z.object({
  body: z.string().trim().min(1, "Escribe algo antes de guardar").max(1000),
});

export async function createIdea(formData: FormData) {
  const session = await requireSession();
  const parsed = ideaSchema.safeParse({ body: formData.get("body") });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Datos inválidos" };
  }

  await prisma.idea.create({
    data: { body: parsed.data.body, createdById: session.user.id },
  });

  revalidatePath("/equipo");
  return { success: true };
}

export async function deleteIdea(id: string) {
  const session = await requireSession();
  const idea = await prisma.idea.findUnique({ where: { id } });
  if (!idea) return;
  if (idea.createdById !== session.user.id && session.user.role !== "ADMIN") {
    throw new Error("No tienes permiso para eliminar esta idea");
  }

  await prisma.idea.delete({ where: { id } });
  revalidatePath("/equipo");
}
