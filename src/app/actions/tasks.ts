"use server";

import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/auth-helpers";
import { revalidatePath } from "next/cache";

const baseTaskSchema = z.object({
  title: z.string().trim().min(2, "El título es muy corto").max(200),
  description: z.string().trim().max(4000).optional().or(z.literal("")),
  notes: z.string().trim().max(4000).optional().or(z.literal("")),
  coverImage: z
    .string()
    .trim()
    .refine((v) => v === "" || v.startsWith("data:image/"), {
      error: "La portada no es válida",
    })
    .refine((v) => v.length < 900_000, { error: "La portada es demasiado grande" })
    .optional()
    .or(z.literal("")),
  type: z.enum(["SOPORTE", "CONTENIDO"]),
  status: z
    .enum(["PENDIENTE", "EN_PROGRESO", "EN_REVISION", "COMPLETADA"])
    .optional()
    .or(z.literal("")),
  priority: z.enum(["BAJA", "MEDIA", "ALTA", "URGENTE"]).optional(),
  assigneeId: z.string().trim().optional().or(z.literal("")),
  dueDate: z.string().trim().optional().or(z.literal("")),
  driveLink: z
    .string()
    .trim()
    .url("Debe ser un enlace válido")
    .optional()
    .or(z.literal("")),
  projectId: z.string().trim().optional().or(z.literal("")),
  platform: z
    .enum(["SKOOL", "SKOOL_UPDATES", "YOUTUBE", "TIKTOK", "INSTAGRAM", "FACEBOOK"])
    .optional()
    .or(z.literal("")),
  stage: z
    .enum(["IDEA", "PLANEADO", "GRABADO", "EDITANDO", "EDITADO", "PUBLICADO"])
    .optional()
    .or(z.literal("")),
});

/**
 * Only fields actually present in the FormData are returned (as `undefined`
 * otherwise) so that partial updates (e.g. saving a single field from the
 * task detail dialog) don't accidentally clear every other field — Zod's
 * `.partial()` treats `undefined` as "not provided" but would treat a
 * fallback like `""` as "please clear this field".
 */
function readTaskForm(formData: FormData) {
  const get = (key: string) => (formData.has(key) ? formData.get(key) : undefined);
  return {
    title: get("title") ?? undefined,
    description: get("description") ?? undefined,
    notes: get("notes") ?? undefined,
    coverImage: get("coverImage") ?? undefined,
    type: get("type") ?? undefined,
    status: get("status") ?? undefined,
    priority: get("priority") || undefined,
    assigneeId: get("assigneeId") ?? undefined,
    dueDate: get("dueDate") ?? undefined,
    driveLink: get("driveLink") ?? undefined,
    projectId: get("projectId") ?? undefined,
    platform: get("platform") ?? undefined,
    stage: get("stage") ?? undefined,
  };
}

export async function createTask(formData: FormData) {
  const session = await requireSession();
  const parsed = baseTaskSchema.safeParse(readTaskForm(formData));

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Datos inválidos" };
  }
  const data = parsed.data;
  const status = data.status || "PENDIENTE";
  const stage = data.stage || "IDEA";

  const count = await prisma.task.count({
    where:
      data.type === "CONTENIDO"
        ? { type: "CONTENIDO", stage: stage as never }
        : { type: "SOPORTE", status: status as never },
  });

  await prisma.task.create({
    data: {
      title: data.title,
      description: data.description || null,
      notes: data.notes || null,
      coverImage: data.coverImage || null,
      type: data.type,
      status,
      stage: data.type === "CONTENIDO" ? stage : null,
      platform: data.type === "CONTENIDO" ? data.platform || null : null,
      priority: data.priority || "MEDIA",
      dueDate: data.dueDate ? new Date(data.dueDate) : null,
      driveLink: data.driveLink || null,
      projectId: data.projectId || null,
      assigneeId: data.assigneeId || null,
      createdById: session.user.id,
      position: count,
    },
  });

  revalidatePath("/tableros");
  revalidatePath("/soporte");
  revalidatePath("/");
  return { success: true };
}

export async function updateTask(taskId: string, formData: FormData) {
  await requireSession();

  const partialSchema = baseTaskSchema.partial();
  const parsed = partialSchema.safeParse(readTaskForm(formData));
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Datos inválidos" };
  }
  const data = parsed.data;

  await prisma.task.update({
    where: { id: taskId },
    data: {
      ...(data.title !== undefined ? { title: data.title } : {}),
      ...(data.description !== undefined
        ? { description: data.description || null }
        : {}),
      ...(data.notes !== undefined ? { notes: data.notes || null } : {}),
      ...(data.coverImage !== undefined
        ? { coverImage: data.coverImage || null }
        : {}),
      ...(data.stage !== undefined ? { stage: data.stage || null } : {}),
      ...(data.priority !== undefined ? { priority: data.priority } : {}),
      ...(data.dueDate !== undefined
        ? { dueDate: data.dueDate ? new Date(data.dueDate) : null }
        : {}),
      ...(data.driveLink !== undefined
        ? { driveLink: data.driveLink || null }
        : {}),
      ...(data.projectId !== undefined
        ? { projectId: data.projectId || null }
        : {}),
      ...(data.platform !== undefined
        ? { platform: data.platform || null }
        : {}),
      ...(data.assigneeId !== undefined
        ? { assigneeId: data.assigneeId || null }
        : {}),
    },
  });

  revalidatePath("/tableros");
  revalidatePath("/soporte");
  revalidatePath("/");
  return { success: true };
}

export async function deleteTask(taskId: string) {
  await requireSession();
  await prisma.task.delete({ where: { id: taskId } });
  revalidatePath("/tableros");
  revalidatePath("/soporte");
  revalidatePath("/");
}

const moveSchema = z.object({
  taskId: z.string(),
  field: z.enum(["status", "stage"]),
  value: z.string(),
  orderedIds: z.array(z.string()),
});

export async function moveTask(input: z.infer<typeof moveSchema>) {
  await requireSession();
  const { taskId, field, value, orderedIds } = moveSchema.parse(input);

  await prisma.$transaction([
    prisma.task.update({
      where: { id: taskId },
      data: field === "status" ? { status: value as never } : { stage: value as never },
    }),
    ...orderedIds.map((id, index) =>
      prisma.task.update({ where: { id }, data: { position: index } })
    ),
  ]);

  revalidatePath("/tableros");
  revalidatePath("/soporte");
  revalidatePath("/");
}

export async function addComment(taskId: string, formData: FormData) {
  const session = await requireSession();
  const body = String(formData.get("body") ?? "").trim();
  if (!body) return { error: "El comentario está vacío" };

  await prisma.comment.create({
    data: { taskId, authorId: session.user.id, body },
  });

  revalidatePath("/tableros");
  revalidatePath("/soporte");
  return { success: true };
}
