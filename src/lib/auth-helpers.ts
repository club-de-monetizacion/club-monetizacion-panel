import { auth } from "@/auth";

export async function requireSession() {
  const session = await auth();
  if (!session?.user?.id) {
    throw new Error("No autenticado");
  }
  return session;
}

export async function requireAdmin() {
  const session = await requireSession();
  if (session.user.role !== "ADMIN") {
    throw new Error("Se requiere rol de administrador");
  }
  return session;
}
