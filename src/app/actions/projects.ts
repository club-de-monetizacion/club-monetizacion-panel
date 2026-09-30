"use server";

import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/auth-helpers";
import { revalidatePath } from "next/cache";

const projectSchema = z.object({
  name: z.string().trim().min(2, "El nombre es muy corto").max(120),
  description: z.string().trim().max(2000).optional().or(z.literal("")),
  platform: z.enum(["SKOOL", "SKOOL_UPDATES", "YOUTUBE", "TIKTOK", "INSTAGRAM", "FACEBOOK"]),
  driveLink: z
    .string()
    .trim()
    .url("Debe ser un enlace válido")
    .optional()
    .or(z.literal("")),
  color: z.string().trim().optional(),
});

export async function createProject(formData: FormData) {
  const session = await requireSession();

  const parsed = projectSchema.safeParse({
    name: formData.get("name"),
    description: formData.get("description") ?? "",
    platform: formData.get("platform"),
    driveLink: formData.get("driveLink") ?? "",
    color: formData.get("color") ?? undefined,
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Datos inválidos" };
  }

  const data = parsed.data;

  await prisma.project.create({
    data: {
      name: data.name,
      description: data.description || null,
      platform: data.platform,
      driveLink: data.driveLink || null,
      color: data.color || "#c9a040",
      createdById: session.user.id,
    },
  });

  revalidatePath("/tableros");
  revalidatePath("/proyectos");
  return { success: true };
}

export async function updateProject(projectId: string, formData: FormData) {
  await requireSession();

  const parsed = projectSchema.partial().safeParse({
    name: formData.get("name") ?? undefined,
    description: formData.get("description") ?? undefined,
    platform: formData.get("platform") ?? undefined,
    driveLink: formData.get("driveLink") ?? undefined,
    color: formData.get("color") ?? undefined,
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Datos inválidos" };
  }

  const data = parsed.data;

  await prisma.project.update({
    where: { id: projectId },
    data: {
      ...(data.name !== undefined ? { name: data.name } : {}),
      ...(data.description !== undefined
        ? { description: data.description || null }
        : {}),
      ...(data.platform !== undefined ? { platform: data.platform } : {}),
      ...(data.driveLink !== undefined
        ? { driveLink: data.driveLink || null }
        : {}),
      ...(data.color !== undefined ? { color: data.color } : {}),
    },
  });

  revalidatePath("/tableros");
  revalidatePath("/proyectos");
  return { success: true };
}

export async function toggleArchiveProject(projectId: string, archived: boolean) {
  await requireSession();
  await prisma.project.update({
    where: { id: projectId },
    data: { archived },
  });
  revalidatePath("/tableros");
  revalidatePath("/proyectos");
}

export async function deleteProject(projectId: string) {
  const session = await requireSession();
  const project = await prisma.project.findUnique({
    where: { id: projectId },
  });
  if (!project) return;
  if (session.user.role !== "ADMIN" && project.createdById !== session.user.id) {
    throw new Error("No tienes permiso para eliminar este proyecto");
  }
  await prisma.project.delete({ where: { id: projectId } });
  revalidatePath("/tableros");
  revalidatePath("/proyectos");
}
