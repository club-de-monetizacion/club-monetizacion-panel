"use server";

import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/auth-helpers";
import { revalidatePath } from "next/cache";

const cannedResponseSchema = z.object({
  title: z.string().trim().min(2, "El título es muy corto").max(120),
  body: z.string().trim().min(1, "La respuesta no puede estar vacía").max(4000),
});

export async function createCannedResponse(formData: FormData) {
  const session = await requireSession();
  const parsed = cannedResponseSchema.safeParse({
    title: formData.get("title"),
    body: formData.get("body"),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Datos inválidos" };
  }

  await prisma.cannedResponse.create({
    data: { ...parsed.data, createdById: session.user.id },
  });

  revalidatePath("/soporte");
  return { success: true };
}

export async function updateCannedResponse(id: string, formData: FormData) {
  await requireSession();
  const parsed = cannedResponseSchema.safeParse({
    title: formData.get("title"),
    body: formData.get("body"),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Datos inválidos" };
  }

  await prisma.cannedResponse.update({ where: { id }, data: parsed.data });
  revalidatePath("/soporte");
  return { success: true };
}

export async function deleteCannedResponse(id: string) {
  await requireSession();
  await prisma.cannedResponse.delete({ where: { id } });
  revalidatePath("/soporte");
}

const faqItemSchema = z.object({
  question: z.string().trim().min(2, "La pregunta es muy corta").max(200),
  answer: z.string().trim().min(1, "La respuesta no puede estar vacía").max(4000),
});

export async function createFaqItem(formData: FormData) {
  const session = await requireSession();
  const parsed = faqItemSchema.safeParse({
    question: formData.get("question"),
    answer: formData.get("answer"),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Datos inválidos" };
  }

  await prisma.faqItem.create({
    data: { ...parsed.data, createdById: session.user.id },
  });

  revalidatePath("/soporte");
  return { success: true };
}

export async function updateFaqItem(id: string, formData: FormData) {
  await requireSession();
  const parsed = faqItemSchema.safeParse({
    question: formData.get("question"),
    answer: formData.get("answer"),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Datos inválidos" };
  }

  await prisma.faqItem.update({ where: { id }, data: parsed.data });
  revalidatePath("/soporte");
  return { success: true };
}

export async function deleteFaqItem(id: string) {
  await requireSession();
  await prisma.faqItem.delete({ where: { id } });
  revalidatePath("/soporte");
}

const quickLinkSchema = z.object({
  title: z.string().trim().min(2, "El título es muy corto").max(120),
  url: z.string().trim().min(1, "El enlace es obligatorio").url("Debe ser un enlace válido"),
  description: z.string().trim().max(280).optional().or(z.literal("")),
});

export async function createQuickLink(formData: FormData) {
  const session = await requireSession();
  const parsed = quickLinkSchema.safeParse({
    title: formData.get("title"),
    url: formData.get("url"),
    description: formData.get("description") ?? "",
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Datos inválidos" };
  }

  await prisma.quickLink.create({
    data: {
      title: parsed.data.title,
      url: parsed.data.url,
      description: parsed.data.description || null,
      createdById: session.user.id,
    },
  });

  revalidatePath("/soporte");
  return { success: true };
}

export async function updateQuickLink(id: string, formData: FormData) {
  await requireSession();
  const parsed = quickLinkSchema.safeParse({
    title: formData.get("title"),
    url: formData.get("url"),
    description: formData.get("description") ?? "",
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Datos inválidos" };
  }

  await prisma.quickLink.update({
    where: { id },
    data: {
      title: parsed.data.title,
      url: parsed.data.url,
      description: parsed.data.description || null,
    },
  });

  revalidatePath("/soporte");
  return { success: true };
}

export async function deleteQuickLink(id: string) {
  await requireSession();
  await prisma.quickLink.delete({ where: { id } });
  revalidatePath("/soporte");
}
