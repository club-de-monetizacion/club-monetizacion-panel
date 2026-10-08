import { useId } from "react";
import type { FormatoVideo, RedSocial, TipoLogro } from "@prisma/client";
import { BadgeDollarSign, Eye, Globe, Heart, Lock, Monitor, Smartphone, Users, Wallet } from "lucide-react";
import { etiquetaCifra, rangoLogro } from "@/lib/desafios";
import { RedIcon } from "./red-icon";
import { cn } from "@/lib/utils";

const ICONO = {
  SEGUIDORES: Users,
  AUDIENCIA: Globe,
  VISTAS: Eye,
  LIKES: Heart,
  MONETIZACION: BadgeDollarSign,
  INGRESOS: Wallet,
} as const;

export type EstadoInsignia = "ganada" | "bloqueada" | "revocada";

/**
 * Una insignia: un hexágono con el color de su rango, la cifra del escalón al centro y
 * el icono de lo que mide. Ganada brilla; bloqueada se queda apagada con su candado.
 */
export function Insignia({
  tipo,
  umbral,
  red,
  formato,
  estado = "ganada",
  tamano = 76,
  className,
}: {
  tipo: TipoLogro;
  umbral: number;
  red?: RedSocial | null;
  /** En las vistas de YouTube: vertical (Shorts) u horizontal (largos) */
  formato?: FormatoVideo | null;
  estado?: EstadoInsignia;
  tamano?: number;
  className?: string;
}) {
  const rango = rangoLogro(tipo, umbral);
  const cifra = etiquetaCifra(tipo, umbral);
  const Icono = estado === "bloqueada" ? Lock : ICONO[tipo];
  const id = useId().replace(/:/g, "");
  const ganada = estado === "ganada";

  return (
    <div
      className={cn(
        "relative shrink-0",
        ganada && "insignia-ganada",
        estado === "bloqueada" && "insignia-bloqueada",
        estado === "revocada" && "insignia-revocada",
        className,
      )}
      style={
        {
          width: tamano,
          height: tamano * 1.12,
          "--brillo": `${rango.color}66`,
        } as React.CSSProperties
      }
      title={`${rango.nombre} · ${cifra}`}
    >
      <svg viewBox="0 0 100 112" className="absolute inset-0 h-full w-full" aria-hidden>
        <defs>
          <linearGradient id={`g${id}`} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor={rango.claro} />
            <stop offset="0.55" stopColor={rango.color} />
            <stop offset="1" stopColor={rango.color} stopOpacity="0.7" />
          </linearGradient>
          <clipPath id={`c${id}`}>
            <polygon points="50,3 95,28 95,84 50,109 5,84 5,28" />
          </clipPath>
        </defs>
        {/* Borde exterior */}
        <polygon
          points="50,2 96,28 96,84 50,110 4,84 4,28"
          fill={ganada ? `url(#g${id})` : "#0d1830"}
          stroke={ganada ? rango.claro : "rgba(120,150,200,0.35)"}
          strokeWidth="2"
          strokeDasharray={ganada ? undefined : "5 4"}
        />
        {/* El interior más oscuro, para que la cifra se lea */}
        <polygon
          points="50,12 87,33 87,79 50,100 13,79 13,33"
          fill={ganada ? "rgba(5,9,26,0.55)" : "rgba(255,255,255,0.03)"}
        />
        {ganada && (
          <g clipPath={`url(#c${id})`}>
            <rect
              x="0" y="0" width="34" height="112"
              fill="rgba(255,255,255,0.55)"
              className="insignia-destello"
            />
          </g>
        )}
      </svg>

      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <Icono
          style={{ width: tamano * 0.2, height: tamano * 0.2, color: ganada ? rango.claro : "var(--ink-3)" }}
        />
        <span
          className="font-[family-name:var(--font-titulos)] leading-none font-bold"
          style={{
            fontSize: tamano * (cifra.length > 3 ? 0.22 : 0.27),
            color: ganada ? "#fff" : "var(--ink-3)",
            marginTop: tamano * 0.04,
          }}
        >
          {cifra}
        </span>
      </div>

      {red && (tipo === "SEGUIDORES" || tipo === "VISTAS") && (
        <span
          className="absolute -right-0.5 -bottom-0.5 flex items-center justify-center rounded-full bg-[#0b1428] ring-1 ring-[var(--linea)]"
          // (el logo ocupa el 65 % del círculo)
          style={{ width: tamano * 0.3, height: tamano * 0.3 }}
        >
          <RedIcon red={red} className="h-[65%] w-[65%]" />
        </span>
      )}

      {formato && (
        <span
          className="absolute -bottom-0.5 -left-0.5 flex items-center justify-center rounded-full bg-[#0b1428] text-[var(--ink-1)] ring-1 ring-[var(--linea)]"
          style={{ width: tamano * 0.3, height: tamano * 0.3 }}
          title={formato === "VERTICAL" ? "Vertical (Shorts)" : "Horizontal (videos largos)"}
        >
          {formato === "VERTICAL" ? <Smartphone className="h-[60%] w-[60%]" /> : <Monitor className="h-[60%] w-[60%]" />}
        </span>
      )}
    </div>
  );
}
