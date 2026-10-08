import { notFound, redirect } from "next/navigation";
import { auth } from "@/auth";
import { perfilVistoPor } from "@/lib/desafios-data";
import { CreadorVista } from "@/components/desafios/vistas/creador";

export const metadata = { title: "Perfil de creador" };

export default async function PerfilPublico({ params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user) redirect("/login");
  const { id } = await params;

  const esEquipo = session.user.role === "ADMIN";
  // El servidor entrega el perfil ya sin lo que su dueña decidió ocultar a quien mira.
  const perfil = await perfilVistoPor(id, { userId: session.user.id, esEquipo });
  if (!perfil) notFound();

  const esMio = perfil.userId === session.user.id;
  const oculto = !perfil.visible || perfil.ocultoPorEquipo;
  // Un perfil que su dueño o el equipo sacaron de la tabla solo lo ven ellos.
  if (oculto && !esMio && !esEquipo) notFound();

  return <CreadorVista perfil={perfil} esMio={esMio} esEquipo={esEquipo} />;
}
