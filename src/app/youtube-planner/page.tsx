import { redirect } from "next/navigation";
import { auth } from "@/auth";

export const dynamic = "force-dynamic";
export const metadata = { title: "YouTube Planner" };

/**
 * El YouTube Planner, a pantalla completa y **fuera del armazón** de la plataforma:
 * es una herramienta entera, con su propio menú lateral, y metida dentro del marco
 * se quedaba sin sitio. Para volver tiene su botón «← Panel», que ya lleva a la
 * portada.
 *
 * Viene del panel del Máster tal cual (`public/planner/planner.html`); lo único que
 * cambió es a dónde guarda (`/api/planner`, una copia para todo el equipo) y los
 * colores. El acceso lo cuida la sesión de la plataforma.
 */
export default async function YoutubePlannerPage() {
  const session = await auth();
  if (!session) redirect("/login");

  return (
    <iframe
      src="/planner/planner.html"
      title="YouTube Planner"
      className="fixed inset-0 h-full w-full border-0 bg-[var(--azul-hondo)]"
    />
  );
}
