"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Eye, EyeOff, Loader2 } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { cambiarPrivacidad } from "@/app/actions/desafios";

/**
 * Un interruptor de privacidad que se guarda al instante: «¿los demás ven esto?».
 * Si falla, vuelve a donde estaba y lo dice.
 */
export function PrivacidadSwitch({
  campo,
  valor,
  titulo,
  descripcion,
}: {
  campo: "visible" | "mostrarSeguidores" | "mostrarIngresos";
  valor: boolean;
  titulo: string;
  descripcion: string;
}) {
  const router = useRouter();
  const [activo, setActivo] = useState(valor);
  const [error, setError] = useState<string | null>(null);
  const [pendiente, empezar] = useTransition();

  function cambiar(nuevo: boolean) {
    setError(null);
    setActivo(nuevo);
    empezar(async () => {
      const r = await cambiarPrivacidad({ [campo]: nuevo });
      if ("error" in r) {
        setActivo(!nuevo);
        return setError(r.error);
      }
      router.refresh();
    });
  }

  return (
    <div>
      <label className="flex items-center justify-between gap-4 rounded-xl border border-[var(--linea)] bg-white/[0.03] p-3">
        <span className="flex items-start gap-3">
          <span className={activo ? "mt-0.5 text-[var(--oro-claro)]" : "mt-0.5 text-[var(--ink-3)]"}>
            {activo ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
          </span>
          <span>
            <span className="block text-sm font-medium text-[var(--ink-0)]">{titulo}</span>
            <span className="block text-xs text-[var(--ink-3)]">
              {descripcion}
            </span>
            <span className="mt-1 block text-[11px] font-medium" style={{ color: activo ? "var(--oro-claro)" : "var(--ink-2)" }}>
              {activo ? "Los demás lo ven" : "Solo tú y el equipo del Club lo ven"}
            </span>
          </span>
        </span>
        <span className="flex items-center gap-2">
          {pendiente && <Loader2 className="h-3.5 w-3.5 animate-spin text-[var(--ink-3)]" />}
          <Switch checked={activo} onCheckedChange={cambiar} disabled={pendiente} aria-label={titulo} />
        </span>
      </label>
      {error && <p className="mt-1 text-xs text-red-400">{error}</p>}
    </div>
  );
}
