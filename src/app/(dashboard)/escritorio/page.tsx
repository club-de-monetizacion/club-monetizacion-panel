import { ESCRITORIO } from "@/lib/escritorio";
import { Descargas } from "@/components/escritorio/descargas";

export const metadata = { title: "App de escritorio" };

/**
 * Descargar la app de escritorio de Tareas (Diego, 11 nov 2026: «desde la barra lateral de
 * Tareas del equipo, la opción para descargar la versión de escritorio, instalarla y usarla
 * en la Mac o PC»). Es la misma Tareas, con la misma cuenta, más el botón flotante.
 */
export default function EscritorioPage() {
  return (
    <div className="animate-fade-in">
      <div className="mb-5">
        <h2 className="text-lg font-semibold text-[var(--ink-0)]">App de escritorio</h2>
        <p className="text-xs text-[var(--ink-3)]">
          Tareas del equipo en tu Mac o tu PC. Es la misma Tareas, con tu misma cuenta del Club.
        </p>
      </div>
      <Descargas info={ESCRITORIO} />
    </div>
  );
}
