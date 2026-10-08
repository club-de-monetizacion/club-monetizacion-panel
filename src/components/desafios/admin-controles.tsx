"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Eye, EyeOff, Loader2, RotateCcw, ShieldX, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/input";
import {
  borrarPerfilComoEquipo,
  corregirSeguidores,
  moderarPerfil,
  quitarCuentaComoEquipo,
  quitarIngresoComoEquipo,
  restaurarLogro,
  revocarLogro,
} from "@/app/actions/desafios";

/** Pequeño ayudante: corre una acción, avisa del error y refresca la pantalla. */
function useAccion() {
  const router = useRouter();
  const [pendiente, empezar] = useTransition();
  const [error, setError] = useState<string | null>(null);
  function correr(f: () => Promise<{ error: string } | { success: true }>, despues?: () => void) {
    setError(null);
    empezar(async () => {
      const r = await f();
      if ("error" in r) return setError(r.error);
      router.refresh();
      despues?.();
    });
  }
  return { pendiente, error, correr };
}

/** Quitar o devolver una insignia. */
export function AdminLogro({ logroId, revocado }: { logroId: string; revocado: boolean }) {
  const { pendiente, error, correr } = useAccion();
  return (
    <span className="inline-flex items-center gap-2">
      {revocado ? (
        <button
          disabled={pendiente}
          onClick={() => correr(() => restaurarLogro(logroId))}
          className="inline-flex items-center gap-1 text-[11px] text-emerald-400 hover:underline"
        >
          <RotateCcw className="h-3 w-3" /> Devolver
        </button>
      ) : (
        <button
          disabled={pendiente}
          onClick={() => {
            const motivo = window.prompt("¿Por qué se quita esta insignia? (queda anotado)");
            if (motivo === null) return;
            correr(() => revocarLogro(logroId, motivo));
          }}
          className="inline-flex items-center gap-1 text-[11px] text-red-400 hover:underline"
        >
          <ShieldX className="h-3 w-3" /> Quitar
        </button>
      )}
      {error && <span className="text-[11px] text-red-400">{error}</span>}
    </span>
  );
}

/** Corregir la cifra de una página, o quitarla. */
export function AdminCuenta({ cuentaId, seguidores }: { cuentaId: string; seguidores: number }) {
  const { pendiente, error, correr } = useAccion();
  return (
    <span className="inline-flex flex-wrap items-center gap-3 text-[11px]">
      <button
        disabled={pendiente}
        onClick={() => {
          const v = window.prompt("Seguidores correctos:", String(seguidores));
          if (v === null) return;
          correr(() => corregirSeguidores(cuentaId, Number(v.replace(/\D/g, "")) ));
        }}
        className="text-[var(--oro-claro)] hover:underline"
      >
        Corregir cifra
      </button>
      <button
        disabled={pendiente}
        onClick={() => {
          if (window.confirm("¿Quitar esta página del perfil?")) correr(() => quitarCuentaComoEquipo(cuentaId));
        }}
        className="text-red-400 hover:underline"
      >
        Quitar página
      </button>
      {error && <span className="text-red-400">{error}</span>}
    </span>
  );
}

/** Quitar una fila de ingresos que no cuadra. */
export function AdminIngreso({ ingresoId }: { ingresoId: string }) {
  const { pendiente, error, correr } = useAccion();
  return (
    <span className="inline-flex items-center gap-2">
      <button
        disabled={pendiente}
        onClick={() => {
          if (window.confirm("¿Quitar este ingreso? Si una insignia de dinero dependía de él, revísala aparte.")) {
            correr(() => quitarIngresoComoEquipo(ingresoId));
          }
        }}
        className="text-[11px] text-red-400 hover:underline"
      >
        Quitar
      </button>
      {error && <span className="text-[11px] text-red-400">{error}</span>}
    </span>
  );
}

/** Ocultar a alguien de la tabla, dejar una nota para el equipo o borrar el perfil. */
export function AdminPerfil({
  perfilId,
  oculto,
  nota,
}: {
  perfilId: string;
  oculto: boolean;
  nota: string | null;
}) {
  const router = useRouter();
  const { pendiente, error, correr } = useAccion();
  const [texto, setTexto] = useState(nota ?? "");
  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-2">
        <Button size="sm" variant="outline" disabled={pendiente} onClick={() => correr(() => moderarPerfil(perfilId, { oculto: !oculto }))}>
          {oculto ? <Eye className="h-3.5 w-3.5" /> : <EyeOff className="h-3.5 w-3.5" />}
          {oculto ? "Volver a mostrar en la tabla" : "Ocultar de la tabla"}
        </Button>
        <Button
          size="sm"
          variant="danger"
          disabled={pendiente}
          onClick={() => {
            if (window.confirm("¿Borrar este perfil por completo? Se van sus páginas, avances e insignias.")) {
              correr(() => borrarPerfilComoEquipo(perfilId), () => router.push("/desafios/admin"));
            }
          }}
        >
          <Trash2 className="h-3.5 w-3.5" /> Borrar perfil
        </Button>
      </div>
      <div>
        <Textarea value={texto} onChange={(e) => setTexto(e.target.value)} rows={2} maxLength={1000} placeholder="Nota solo para el equipo…" />
        <Button size="sm" variant="secondary" className="mt-2" disabled={pendiente || texto === (nota ?? "")} onClick={() => correr(() => moderarPerfil(perfilId, { nota: texto }))}>
          {pendiente && <Loader2 className="h-3.5 w-3.5 animate-spin" />} Guardar nota
        </Button>
      </div>
      {error && <p className="text-xs text-red-400">{error}</p>}
    </div>
  );
}
