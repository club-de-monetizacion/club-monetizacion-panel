import type { ReactNode } from "react";
import { Crown, Flame, Star, Zap } from "lucide-react";
import { estiloNivel } from "@/lib/desafios";
import { cn } from "@/lib/utils";

const ICONO = { 1: Zap, 2: Zap, 3: Zap, 4: Star, 5: Flame, 6: Crown } as const;

/**
 * La etiqueta de nivel. Cuanto más alto el nivel, más llamativa: sobria al principio, luego
 * dorada, con destello, con un borde de aurora que gira, con resplandor y, en la cima,
 * holográfica con chispas (los estilos están en `globals.css`, bajo «LOS NIVELES»). Es lo que
 * ven los que van entrando: los niveles altos se ven distintos, y se quiere llegar a ellos.
 */
export function ChipNivel({
  numero,
  nombre,
  className,
}: {
  numero: number;
  nombre: string;
  className?: string;
}) {
  const t = estiloNivel(numero);
  const Icono = ICONO[t];
  return (
    <span className={cn("nivel-etiqueta", `nivel-t${t}`, className)} title={`Nivel ${numero} · ${nombre}`}>
      <Icono className="h-3 w-3 shrink-0" />
      <span className="nivel-texto">Nivel {numero} · {nombre}</span>
      {t >= 5 && (
        <>
          <i className="chispa" style={{ top: -5, right: 10 }} />
          <i className="chispa" style={{ bottom: -4, left: 14, animationDelay: "0.7s" }} />
          {t === 6 && <i className="chispa" style={{ top: -6, left: 38, animationDelay: "1.3s" }} />}
        </>
      )}
    </span>
  );
}

/**
 * El marco de una foto según el nivel: desde el nivel 7 lleva un aro de aurora que gira, y
 * en los más altos, resplandor. Por debajo de eso no cambia nada.
 */
export function AnilloNivel({ numero, children }: { numero: number; children: ReactNode }) {
  const t = estiloNivel(numero);
  if (t < 4) return <>{children}</>;
  return <span className={cn("anillo-nivel", `anillo-t${t}`)}>{children}</span>;
}
