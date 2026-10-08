import type { PuntoHistorial } from "@/lib/desafios-data";

/** La línea de avance de una página: seguidores a lo largo del tiempo. */
export function Sparkline({
  puntos,
  color = "var(--oro)",
  className,
}: {
  puntos: PuntoHistorial[];
  color?: string;
  className?: string;
}) {
  if (puntos.length < 2) {
    return (
      <p className="text-[11px] text-[var(--ink-3)]">
        Anota otro avance y aquí verás cómo crece.
      </p>
    );
  }
  const W = 160;
  const H = 40;
  const vals = puntos.map((p) => p.seguidores);
  const min = Math.min(...vals);
  const max = Math.max(...vals);
  const rango = max - min || 1;
  const xy = vals.map((v, i) => [
    (i / (vals.length - 1)) * W,
    H - 4 - ((v - min) / rango) * (H - 8),
  ]);
  const linea = xy.map(([x, y]) => `${x.toFixed(1)},${y.toFixed(1)}`).join(" ");
  const [ux, uy] = xy[xy.length - 1];
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className={className} role="img" aria-label="Avance de seguidores">
      <polygon points={`0,${H} ${linea} ${W},${H}`} fill={color} opacity="0.12" />
      <polyline points={linea} fill="none" stroke={color} strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" />
      <circle cx={ux} cy={uy} r="3" fill={color} />
    </svg>
  );
}
