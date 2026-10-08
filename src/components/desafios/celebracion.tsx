"use client";

import { useEffect, useState } from "react";
import type { LogroNuevo } from "@/app/actions/desafios";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Insignia } from "./insignia";
import { rangoLogro, tituloLogro, puntosDe } from "@/lib/desafios";

const COLORES = ["#ffd97d", "#c9a040", "#2468ff", "#10b981", "#ec4899", "#ffffff"];

/** Confeti sin azar: cada pieza sale de su posición, así no cambia entre pintados. */
function Confeti() {
  return (
    <div className="pointer-events-none absolute inset-x-0 top-0 h-full overflow-hidden" aria-hidden>
      {Array.from({ length: 28 }, (_, i) => (
        <span
          key={i}
          className="confeti"
          style={
            {
              left: `${(i * 37) % 100}%`,
              background: COLORES[i % COLORES.length],
              "--dx": `${((i * 53) % 90) - 45}px`,
              "--giro": `${360 + ((i * 71) % 540)}deg`,
              "--dur": `${2 + ((i * 13) % 14) / 10}s`,
              "--ret": `${((i * 7) % 8) / 10}s`,
            } as React.CSSProperties
          }
        />
      ))}
    </div>
  );
}

/** «¡Insignia desbloqueada!». Se abre sola cuando hay logros nuevos. */
export function Celebracion({
  nuevos,
  onCerrar,
}: {
  nuevos: LogroNuevo[];
  onCerrar: () => void;
}) {
  if (nuevos.length === 0) return null;
  // La más alta primero: es la que se celebra a lo grande.
  const orden = [...nuevos].sort((a, b) => b.umbral - a.umbral);
  const [mayor, ...resto] = orden;
  const rango = rangoLogro(mayor.tipo, mayor.umbral);
  const puntos = nuevos.reduce((s, l) => s + puntosDe(l.tipo, l.umbral), 0);

  return (
    <Dialog open onOpenChange={(abierto) => !abierto && onCerrar()}>
      <DialogContent className="max-w-sm overflow-hidden text-center">
        <Confeti />
        <div className="relative flex flex-col items-center gap-3 pt-2">
          <p className="antetitulo">¡Insignia desbloqueada!</p>
          <div className="aparece-rebote">
            <Insignia tipo={mayor.tipo} umbral={mayor.umbral} red={mayor.red} formato={mayor.formato} tamano={120} />
          </div>
          <DialogTitle className="text-xl">{tituloLogro(mayor.tipo, mayor.umbral, mayor.red, mayor.formato)}</DialogTitle>
          {mayor.pagina && <p className="text-xs text-[var(--ink-3)]">en {mayor.pagina}</p>}
          <DialogDescription>
            Rango <strong style={{ color: rango.claro }}>{rango.nombre}</strong> · +{puntos} puntos
          </DialogDescription>
          {resto.length > 0 && (
            <div className="mt-1 flex flex-wrap justify-center gap-2">
              {resto.slice(0, 8).map((l) => (
                <Insignia key={`${l.tipo}${l.red}${l.formato}${l.umbral}`} tipo={l.tipo} umbral={l.umbral} red={l.red} formato={l.formato} tamano={44} />
              ))}
            </div>
          )}
          {resto.length > 0 && (
            <p className="text-xs text-[var(--ink-3)]">
              y {resto.length} más que ya te tocaban
            </p>
          )}
          <Button className="mt-2 w-full" onClick={onCerrar}>
            ¡A por la siguiente!
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

const EVENTO = "desafios:logros";

/**
 * Avisa de insignias nuevas desde cualquier sitio. La celebración vive en el layout
 * (`CelebracionGlobal`) y no dentro del botón que la provoca: al refrescar la lista, ese
 * botón desaparece (la insignia ya es tuya) y se llevaría la celebración con él.
 */
export function celebrar(nuevos: LogroNuevo[] | undefined) {
  if (!nuevos || nuevos.length === 0) return;
  window.dispatchEvent(new CustomEvent<LogroNuevo[]>(EVENTO, { detail: nuevos }));
}

export function CelebracionGlobal() {
  const [nuevos, setNuevos] = useState<LogroNuevo[]>([]);
  useEffect(() => {
    const alAvisar = (e: Event) => setNuevos((e as CustomEvent<LogroNuevo[]>).detail);
    window.addEventListener(EVENTO, alAvisar);
    return () => window.removeEventListener(EVENTO, alAvisar);
  }, []);
  return <Celebracion nuevos={nuevos} onCerrar={() => setNuevos([])} />;
}
