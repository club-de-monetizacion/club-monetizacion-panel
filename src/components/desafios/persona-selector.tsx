import Link from "next/link";
import { ExternalLink } from "lucide-react";
import { ChipNivel } from "@/components/desafios/chip-nivel";
import { cn } from "@/lib/utils";

/**
 * En la demostración: «mira Desafíos como si fueras…». Cambia de creador de ejemplo sin
 * salir de la pantalla en la que estás.
 */
export function PersonaSelector({
  personas,
  actual,
  ruta,
}: {
  personas: { id: string; nombre: string; nivel: { numero: number; nombre: string } }[];
  actual: string;
  /** La pantalla en la que se está, p. ej. «/demo/retos» */
  ruta: string;
}) {
  const quien = personas.find((p) => p.id === actual);
  return (
    <div className="glass-panel mb-6 rounded-2xl p-4">
      <p className="antetitulo mb-2">Míralo como si fueras…</p>
      <div className="flex flex-wrap gap-2">
        {personas.map((p) => (
          <Link
            key={p.id}
            href={`${ruta}?p=${p.id}`}
            className={cn(
              "inline-flex items-center gap-2 rounded-xl border px-3 py-2 text-sm transition",
              p.id === actual
                ? "border-[var(--oro)] bg-[var(--oro)]/10 text-white"
                : "border-[var(--linea)] text-[var(--ink-2)] hover:border-[var(--flotante-borde)] hover:text-white",
            )}
          >
            {p.nombre.split(" ")[0]}
            <span className="text-[11px] text-[var(--ink-3)]">nivel {p.nivel.numero}</span>
          </Link>
        ))}
      </div>
      {quien && (
        <p className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-[var(--ink-3)]">
          <span className="inline-flex items-center gap-2">Estás viendo a <strong className="text-[var(--ink-1)]">{quien.nombre}</strong> <ChipNivel numero={quien.nivel.numero} nombre={quien.nivel.nombre} /></span>
          <Link href={`/demo/creador/${quien.id}`} className="inline-flex items-center gap-1 text-[var(--oro-claro)] hover:underline">
            Ver su ficha pública, como la ve cualquiera <ExternalLink className="h-3 w-3" />
          </Link>
        </p>
      )}
    </div>
  );
}
