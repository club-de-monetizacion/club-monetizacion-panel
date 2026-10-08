import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { perfilDe } from "@/lib/desafios-data";
import { MonetizacionVista } from "@/components/desafios/vistas/monetizacion";

export const metadata = { title: "Monetización" };

export default async function Monetizacion() {
  const session = await auth();
  if (!session?.user) redirect("/login");
  const perfil = await perfilDe(session.user.id);
  if (!perfil) redirect("/desafios");

  return <MonetizacionVista perfil={perfil} />;
}
