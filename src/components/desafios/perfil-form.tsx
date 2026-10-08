"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input, Textarea } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { borrarMiPerfil, guardarPerfil } from "@/app/actions/desafios";
import { FotoCampo } from "./foto-campo";

type Inicial = {
  nombre: string;
  bio: string;
  nicho: string;
  foto: string | null;
  visible: boolean;
  mostrarSeguidores: boolean;
  mostrarIngresos: boolean;
};

/** Crea o edita el perfil de creador: «me llamo Miguel Ángel y hago contenido de…». */
export function PerfilForm({
  inicial,
  existe,
  alGuardar,
}: {
  inicial: Inicial;
  /** Si ya tiene perfil, se edita; si no, se crea. */
  existe: boolean;
  alGuardar?: () => void;
}) {
  const router = useRouter();
  const [v, setV] = useState(inicial);
  // `foto` solo se manda si cambió: así no se pisa la de su cuenta sin querer.
  const [fotoCambio, setFotoCambio] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [guardado, setGuardado] = useState(false);
  const [pendiente, empezar] = useTransition();

  function enviar(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setGuardado(false);
    empezar(async () => {
      const r = await guardarPerfil({
        nombre: v.nombre,
        bio: v.bio,
        nicho: v.nicho,
        visible: v.visible,
        mostrarSeguidores: v.mostrarSeguidores,
        mostrarIngresos: v.mostrarIngresos,
        ...(fotoCambio ? { foto: v.foto } : {}),
      });
      if ("error" in r) return setError(r.error);
      setGuardado(true);
      setFotoCambio(false);
      router.refresh();
      alGuardar?.();
    });
  }

  function borrar() {
    if (!window.confirm("¿Borrar tu perfil de Desafíos? Se van tus páginas, avances e insignias. No se puede deshacer.")) return;
    empezar(async () => {
      const r = await borrarMiPerfil();
      if ("error" in r) return setError(r.error);
      router.refresh();
    });
  }

  return (
    <form onSubmit={enviar} className="space-y-4">
      <FotoCampo
        valor={v.foto}
        nombre={v.nombre}
        etiqueta="Tu foto"
        tamano={76}
        onCambia={(foto) => {
          setV({ ...v, foto });
          setFotoCambio(true);
        }}
      />

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <Label htmlFor="d-nombre">¿Cómo te llamas?</Label>
          <Input
            id="d-nombre"
            value={v.nombre}
            onChange={(e) => setV({ ...v, nombre: e.target.value })}
            placeholder="Miguel Ángel"
            maxLength={60}
            required
            className="mt-1.5"
          />
        </div>
        <div>
          <Label htmlFor="d-nicho">¿De qué haces contenido?</Label>
          <Input
            id="d-nicho"
            value={v.nicho}
            onChange={(e) => setV({ ...v, nicho: e.target.value })}
            placeholder="Cocina, finanzas, fitness…"
            maxLength={40}
            className="mt-1.5"
          />
        </div>
      </div>

      <div>
        <Label htmlFor="d-bio">Cuéntanos de ti</Label>
        <Textarea
          id="d-bio"
          value={v.bio}
          onChange={(e) => setV({ ...v, bio: e.target.value })}
          rows={3}
          maxLength={280}
          placeholder="Qué haces, para quién y adónde quieres llegar."
          className="mt-1.5"
        />
        <p className="mt-1 text-right text-[11px] text-[var(--ink-3)]">{v.bio.length}/280</p>
      </div>

      <fieldset className="space-y-2">
        <legend className="mb-1 text-sm font-medium text-[var(--ink-0)]">¿Qué pueden ver los demás?</legend>
        <Opcion
          titulo="Salir en la tabla clasificatoria"
          texto="Tu nivel, tus páginas y tus insignias. Si lo apagas, tu perfil no aparece en la tabla."
          valor={v.visible}
          alCambiar={(visible) => setV({ ...v, visible })}
        />
        <Opcion
          titulo="Mostrar mis cifras de seguidores"
          texto="Cuántos seguidores tienes y cómo creces. Tus insignias se ven siempre."
          valor={v.mostrarSeguidores}
          alCambiar={(mostrarSeguidores) => setV({ ...v, mostrarSeguidores })}
        />
        <Opcion
          titulo="Mostrar cuánto gano"
          texto="Tus ingresos y tus insignias de dinero. Empieza apagado: es dinero."
          valor={v.mostrarIngresos}
          alCambiar={(mostrarIngresos) => setV({ ...v, mostrarIngresos })}
        />
        <p className="text-[11px] text-[var(--ink-3)]">
          El equipo del Club siempre ve todo, para poder ayudarte y revisar los logros.
        </p>
      </fieldset>

      {error && <p className="text-sm text-red-400">{error}</p>}
      {guardado && !pendiente && <p className="text-sm text-emerald-400">Guardado.</p>}

      <div className="flex flex-wrap items-center gap-3">
        <Button type="submit" disabled={pendiente || v.nombre.trim().length < 2}>
          {pendiente && <Loader2 className="h-4 w-4 animate-spin" />}
          {existe ? "Guardar cambios" : "Empezar mi camino"}
        </Button>
        {existe && (
          <button
            type="button"
            onClick={borrar}
            className="text-xs text-[var(--ink-3)] underline-offset-2 hover:text-red-400 hover:underline"
          >
            Borrar mi perfil
          </button>
        )}
      </div>
    </form>
  );
}

function Opcion({
  titulo,
  texto,
  valor,
  alCambiar,
}: {
  titulo: string;
  texto: string;
  valor: boolean;
  alCambiar: (v: boolean) => void;
}) {
  return (
    <label className="flex items-center justify-between gap-4 rounded-xl border border-[var(--linea)] bg-white/[0.03] p-3">
      <span>
        <span className="block text-sm font-medium text-[var(--ink-0)]">{titulo}</span>
        <span className="block text-xs text-[var(--ink-3)]">{texto}</span>
      </span>
      <Switch checked={valor} onCheckedChange={alCambiar} aria-label={titulo} />
    </label>
  );
}
