"use server";

import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/auth-helpers";
import { revalidatePath } from "next/cache";

const attachmentSchema = z.object({
  kind: z.enum(["IMAGE", "DOCUMENT"]),
  name: z.string().trim().min(1).max(200),
  dataUrl: z
    .string()
    .trim()
    .refine((v) => v.startsWith("data:"), { error: "Archivo inválido" }),
  size: z.coerce
    .number()
    .int()
    .positive()
    .max(10_000_000, "El archivo es demasiado grande (máx. 10 MB)"),
});

function revalidateBoards() {
  revalidatePath("/tableros");
  revalidatePath("/soporte");
  revalidatePath("/calendario");
  revalidatePath("/");
}

export async function addAttachment(taskId: string, formData: FormData) {
  await requireSession();
  const parsed = attachmentSchema.safeParse({
    kind: formData.get("kind"),
    name: formData.get("name"),
    dataUrl: formData.get("dataUrl"),
    size: formData.get("size"),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Archivo inválido" };
  }

  await prisma.attachment.create({ data: { ...parsed.data, taskId } });
  revalidateBoards();
  return { success: true };
}

export async function deleteAttachment(id: string) {
  await requireSession();
  await prisma.attachment.delete({ where: { id } });
  revalidateBoards();
}
