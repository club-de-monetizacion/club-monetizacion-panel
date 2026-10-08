import { Lock } from "lucide-react";
import { TODOS_LOS_NIVELES, entero } from "@/lib/desafios";
import { ChipNivel } from "@/components/desafios/chip-nivel";
import { cn } from "@/lib/utils";

/**
 * «Los niveles del Club»: todas las etiquetas, de la sobria a la holográfica, con los puntos
 * que pide cada una. Enseña desde el primer día lo que hay arriba, para que apetezca subir.
 */
export function NivelesGaleria({ actual }: { actual: number }) {
  return (
    <section>
      <h2 className="text-lg font-semibold">Los niveles del Club</h2>
      <p className="mb-3 text-xs text-[var(--ink-3)]">
        Cuanto más subes, más brilla tu etiqueta. Los de arriba se ven en toda la tabla.
      </p>
      <ul className="glass-panel grid gap-x-4 gap-y-3 rounded-2xl p-5 sm:grid-cols-2 lg:grid-cols-5">
        {TODOS_LOS_NIVELES.map((n) => (
          <li
            key={n.numero}
            className={cn(
              "flex flex-col items-start gap-1.5 rounded-xl p-2.5",
              n.numero === actual && "bg-[var(--oro)]/[0.08] ring-1 ring-[var(--oro)]/40",
            )}
          >
            <ChipNivel numero={n.numero} nombre={n.nombre} />
            <p className="flex items-center gap-1 text-[11px] text-[var(--ink-3)]">
              {n.numero === actual ? (
                <span className="font-semibold text-[var(--oro-claro)]">¡Estás aquí!</span>
              ) : n.numero < actual ? (
                "Superado"
              ) : (
                <>
                  <Lock className="h-3 w-3" /> desde {entero(n.desde)} pts
                </>
              )}
            </p>
          </li>
        ))}
      </ul>
    </section>
  );
}
