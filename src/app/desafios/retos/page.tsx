import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { perfilDe } from "@/lib/desafios-data";
import { RetosVista } from "@/components/desafios/vistas/retos";

export const metadata = { title: "Retos" };

export default async function Retos() {
  const session = await auth();
  if (!session?.user) redirect("/login");
  const perfil = await perfilDe(session.user.id);
  if (!perfil) redirect("/desafios");

  return <RetosVista perfil={perfil} />;
}
