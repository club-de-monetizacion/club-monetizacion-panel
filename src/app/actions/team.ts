"use server";

import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth-helpers";
import { revalidatePath } from "next/cache";

const roleSchema = z.enum(["ADMIN", "SOPORTE", "EDITOR", "MIEMBRO"]);

export async function updateUserRole(userId: string, role: string) {
  await requireAdmin();
  const parsedRole = roleSchema.parse(role);

  await prisma.user.update({
    where: { id: userId },
    data: { role: parsedRole },
  });

  revalidatePath("/equipo");
}
