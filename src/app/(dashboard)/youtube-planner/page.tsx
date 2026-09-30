import { redirect } from "next/navigation";
import { auth } from "@/auth";

export const dynamic = "force-dynamic";
export const metadata = { title: "YouTube Planner" };

/**
 * El YouTube Planner, traído del Panel de Maestría tal cual.
 *
 * Va en un marco y no reescrito en React a propósito: son 5.300 líneas que llevan
 * tiempo funcionando, y tocarlas para adaptarlas habría sido rehacer la herramienta.
 * Lo único que cambió es a dónde guarda (`/api/planner`, una copia para todo el
 * equipo) y los colores. La propia herramienta se da cuenta de que está incrustada.
 */
export default async function YoutubePlannerPage() {
  const session = await auth();
  if (!session) redirect("/login");

  return (
    <div className="animate-fade-in">
      <div className="mb-3 flex flex-wrap items-baseline justify-between gap-2">
        <div>
          <h2 className="text-lg font-semibold text-[var(--ink-0)]">YouTube Planner</h2>
          <p className="text-xs text-[var(--ink-3)]">
            El contenido del canal. Lo que cambies lo ve todo el equipo.
          </p>
        </div>
        <a
          href="/planner/planner.html"
          target="_blank"
          rel="noreferrer"
          className="btn-fantasma rounded-xl px-3 py-1.5 text-xs"
        >
          Abrir en pantalla completa
        </a>
      </div>

      {/* Alto fijo y no 100%: dentro del armazón, un marco elástico se queda en nada. */}
      <iframe
        src="/planner/planner.html"
        title="YouTube Planner"
        className="h-[calc(100vh-168px)] min-h-[600px] w-full rounded-2xl border border-[var(--linea)] bg-[var(--azul-hondo)]"
      />
    </div>
  );
}
