import { cn } from "@/lib/utils";

/** Barra de progreso dorada. `valor` va de 0 a 1. */
export function Barra({
  valor,
  className,
  alto = 8,
}: {
  valor: number;
  className?: string;
  alto?: number;
}) {
  const pct = Math.max(0, Math.min(1, valor)) * 100;
  return (
    <div
      role="progressbar"
      aria-valuenow={Math.round(pct)}
      aria-valuemin={0}
      aria-valuemax={100}
      className={cn("w-full overflow-hidden rounded-full bg-white/[0.07]", className)}
      style={{ height: alto }}
    >
      <div className="barra-oro h-full rounded-full" style={{ width: `${Math.max(pct, pct > 0 ? 2 : 0)}%` }} />
    </div>
  );
}
