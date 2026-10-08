import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { filasDeLaTabla, type Orden } from "@/lib/desafios-data";
import { ClasificacionVista, PESTANAS } from "@/components/desafios/vistas/clasificacion";

export const metadata = { title: "Clasificación" };

export default async function Clasificacion({
  searchParams,
}: {
  searchParams: Promise<{ t?: string }>;
}) {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const { t } = await searchParams;
  const orden: Orden = PESTANAS.some((p) => p.id === t) ? (t as Orden) : "puntos";
  const todas = await filasDeLaTabla();
  // A mi perfil lo reconozco por su usuario; la tabla solo trae ids de perfil.
  const mio = await prisma.perfilCreador.findUnique({
    where: { userId: session.user.id },
    select: { id: true },
  });

  return <ClasificacionVista todas={todas} orden={orden} mioId={mio?.id ?? null} />;
}
