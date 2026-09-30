import { redirect } from "next/navigation";
import { auth } from "@/auth";

export const dynamic = "force-dynamic";
export const metadata = { title: "YouTube Planner" };

/**
 * El YouTube Planner, dentro de la plataforma. Viene del panel del Máster tal cual
 * (`public/planner/planner.html`): lo único que cambió es a dónde guarda
 * (`/api/planner`, una copia para todo el equipo) y los colores.
 *
 * Va en un marco y no reescrito en React a propósito: son 5.300 líneas que llevan
 * tiempo funcionando. Ella misma se da cuenta de que está incrustada y se ajusta.
 */
export default async function YoutubePlannerPage() {
  const session = await auth();
  if (!session) redirect("/login");

  return (
    <div className="animate-fade-in -mx-1">
      {/* Se le da todo el alto que queda bajo la cabecera: la herramienta trae su
          propio menú y sus columnas, y con poco alto no se puede trabajar. */}
      <iframe
        src="/planner/planner.html"
        title="YouTube Planner"
        className="h-[calc(100vh-112px)] min-h-[620px] w-full rounded-2xl border border-[var(--linea)] bg-[var(--azul-hondo)]"
      />
    </div>
  );
}
