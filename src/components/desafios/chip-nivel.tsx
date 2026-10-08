import { Zap } from "lucide-react";

export function ChipNivel({ numero, nombre }: { numero: number; nombre: string }) {
  return (
    <span className="chip chip-oro inline-flex items-center gap-1 whitespace-nowrap">
      <Zap className="h-3 w-3" /> Nivel {numero} · {nombre}
    </span>
  );
}
