"use server";

import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/auth-helpers";
import { revalidatePath } from "next/cache";

const profileSchema = z.object({
  name: z.string().trim().min(2, "El nombre es muy corto").max(80),
  bio: z.string().trim().max(280).optional().or(z.literal("")),
  image: z.string().trim().optional().or(z.literal("")),
});

export async function updateProfile(formData: FormData) {
  const session = await requireSession();

  const parsed = profileSchema.safeParse({
    name: formData.get("name"),
    bio: formData.get("bio") ?? "",
    image: formData.get("image") ?? "",
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Datos inválidos" };
  }
  const data = parsed.data;

  if (data.image && !data.image.startsWith("data:image/")) {
    return { error: "La imagen no es válida" };
  }
  if (data.image && data.image.length > 700_000) {
    return { error: "La imagen es demasiado grande" };
  }

  await prisma.user.update({
    where: { id: session.user.id },
    data: {
      name: data.name,
      bio: data.bio || null,
      ...(data.image ? { image: data.image } : {}),
    },
  });

  revalidatePath("/", "layout");
  return { success: true };
}

const themeSchema = z.object({
  accentColor: z.string().regex(/^#[0-9a-fA-F]{6}$/),
  backgroundColor: z.string().regex(/^#[0-9a-fA-F]{6}$/),
  backgroundType: z.enum(["PARTICLES", "AURORA", "GRADIENT", "SOLID"]),
  particlesEnabled: z.boolean(),
});

export async function updateTheme(input: z.infer<typeof themeSchema>) {
  const session = await requireSession();
  const data = themeSchema.parse(input);

  await prisma.user.update({
    where: { id: session.user.id },
    data,
  });

  revalidatePath("/", "layout");
  return { success: true };
}
