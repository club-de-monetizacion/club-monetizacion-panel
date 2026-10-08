"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { BadgeCheck, ExternalLink, Loader2, Pencil, Plus, RefreshCw, Trash2, TrendingUp } from "lucide-react";
import type { RedSocial } from "@prisma/client";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar } from "@/components/ui/avatar";
import {
  actualizarDesdeYoutube,
  agregarCuenta,
  borrarCuenta,
  editarCuenta,
  registrarAvance,
} from "@/app/actions/desafios";
import { RED_INFO, REDES, detectarRed, entero, normalizarUrlCuenta } from "@/lib/desafios";
import type { CuentaVista } from "@/lib/desafios-data";
import { cn } from "@/lib/utils";
import { celebrar } from "./celebracion";
import { FotoCampo } from "./foto-campo";
import { RedIcon } from "./red-icon";
import { Sparkline } from "./sparkline";

/** Un número con puntos de millar mientras se escribe: «12500» → «12.500»… solo dígitos. */
const soloDigitos = (s: string) => s.replace(/\D/g, "").slice(0, 10);

export function PaginasManager({
  cuentas,
  youtubeAuto,
}: {
  cuentas: CuentaVista[];
  youtubeAuto: boolean;
}) {
  const [agregando, setAgregando] = useState(false);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm text-[var(--ink-2)]">
          {cuentas.length === 0
            ? "Aún no has dado de alta ninguna página."
            : cuentas.length === 1
              ? "1 página dada de alta"
              : `${cuentas.length} páginas dadas de alta`}
        </p>
        <Button onClick={() => setAgregando(true)}>
          <Plus className="h-4 w-4" /> Agregar página
        </Button>
      </div>

      {cuentas.length === 0 && (
        <div className="glass-panel rounded-2xl p-8 text-center">
          <p className="text-3xl">📲</p>
          <p className="mt-2 font-[family-name:var(--font-titulos)] text-lg font-semibold">
            Da de alta tu primera página
          </p>
          <p className="mx-auto mt-1 max-w-sm text-sm text-[var(--ink-3)]">
            Instagram, TikTok, YouTube o Facebook. Pega el enlace, anota cuántos seguidores tienes
            y empieza a sumar insignias.
          </p>
        </div>
      )}

      <div className="grid gap-4 lg:grid-cols-2">
        {cuentas.map((c) => (
          <TarjetaCuenta key={c.id} cuenta={c} youtubeAuto={youtubeAuto} />
        ))}
      </div>

      {agregando && (
        <AgregarDialog alCerrar={() => setAgregando(false)} />
      )}
    </div>
  );
}

/* ── Una página ────────────────────────────────────────────────────────────── */

function TarjetaCuenta({
  cuenta,
  youtubeAuto,
}: {
  cuenta: CuentaVista;
  youtubeAuto: boolean;
}) {
  const router = useRouter();
  const info = RED_INFO[cuenta.red];
  const [anotando, setAnotando] = useState(false);
  const [editando, setEditando] = useState(false);
  const [cifra, setCifra] = useState(String(cuenta.seguidores));
  const [nota, setNota] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pendiente, empezar] = useTransition();

  const h = cuenta.historial;
  const delta = h.length >= 2 ? cuenta.seguidores - h[h.length - 2].seguidores : null;
  const sePuedeLeer = cuenta.red === "YOUTUBE" && youtubeAuto;

  function guardarAvance() {
    setError(null);
    empezar(async () => {
      const r = await registrarAvance(cuenta.id, { seguidores: Number(cifra), nota });
      if ("error" in r) return setError(r.error);
      setAnotando(false);
      setNota("");
      router.refresh();
      celebrar(r.nuevos);
    });
  }

  function leerDeYoutube() {
    setError(null);
    empezar(async () => {
      const r = await actualizarDesdeYoutube(cuenta.id);
      if ("error" in r) return setError(r.error);
      router.refresh();
      celebrar(r.nuevos);
    });
  }

  function borrar() {
    if (!window.confirm(`¿Quitar «${cuenta.nombre}»? Las insignias que ya ganaste se quedan.`)) return;
    empezar(async () => {
      const r = await borrarCuenta(cuenta.id);
      if ("error" in r) setError(r.error);
      else router.refresh();
    });
  }

  return (
    <article className="glass-panel rounded-2xl p-4">
      <div className="flex items-start gap-3">
        <div className="relative">
          <Avatar src={cuenta.foto} name={cuenta.nombre} size={48} />
          <span
            className="absolute -right-1 -bottom-1 flex h-5 w-5 items-center justify-center rounded-full bg-[#0b1428] ring-1"
            style={{ ["--tw-ring-color" as string]: `${info.color}88` }}
          >
            <RedIcon red={cuenta.red} className="h-3 w-3" />
          </span>
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate font-semibold text-[var(--ink-0)]">{cuenta.nombre}</p>
          <a
            href={cuenta.url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex max-w-full items-center gap-1 truncate text-xs text-[var(--ink-3)] hover:text-[var(--oro-claro)]"
          >
            {info.nombre} <ExternalLink className="h-3 w-3 shrink-0" />
          </a>
        </div>
        <div className="flex gap-1">
          <button onClick={() => setEditando(true)} className="focus-ring rounded-md p-1.5 text-[var(--ink-3)] hover:bg-white/5 hover:text-white" aria-label="Editar página">
            <Pencil className="h-3.5 w-3.5" />
          </button>
          <button onClick={borrar} disabled={pendiente} className="focus-ring rounded-md p-1.5 text-[var(--ink-3)] hover:bg-white/5 hover:text-red-400" aria-label="Quitar página">
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      <div className="mt-4 flex items-end justify-between gap-3">
        <div>
          <p className="font-[family-name:var(--font-titulos)] text-3xl leading-none font-bold text-[var(--ink-0)] tabular-nums">
            {entero(cuenta.seguidores)}
          </p>
          <p className="mt-1 flex items-center gap-1.5 text-xs text-[var(--ink-3)]">
            seguidores
            {delta !== null && delta !== 0 && (
              <span className={cn("inline-flex items-center gap-0.5 font-medium", delta > 0 ? "text-emerald-400" : "text-[var(--ink-3)]")}>
                <TrendingUp className={cn("h-3 w-3", delta < 0 && "rotate-180")} />
                {delta > 0 ? "+" : ""}{entero(delta)}
              </span>
            )}
          </p>
          {cuenta.leidoDeLaRed && (
            <p className="mt-1 inline-flex items-center gap-1 text-[11px] text-emerald-400">
              <BadgeCheck className="h-3.5 w-3.5" /> Leído de YouTube
            </p>
          )}
        </div>
        <Sparkline puntos={h} className="h-10 w-40" />
      </div>

      {anotando ? (
        <div className="mt-4 space-y-2 rounded-xl border border-[var(--linea)] bg-white/[0.03] p-3">
          <Label htmlFor={`c-${cuenta.id}`}>¿Cuántos seguidores tienes hoy?</Label>
          <Input
            id={`c-${cuenta.id}`}
            inputMode="numeric"
            value={cifra}
            onChange={(e) => setCifra(soloDigitos(e.target.value))}
            onFocus={(e) => e.target.select()}
            autoFocus
          />
          <Input
            value={nota}
            onChange={(e) => setNota(e.target.value)}
            placeholder="Nota (opcional): «me hizo viral este video»"
            maxLength={200}
          />
          <div className="flex gap-2">
            <Button size="sm" onClick={guardarAvance} disabled={pendiente || cifra === ""}>
              {pendiente && <Loader2 className="h-3.5 w-3.5 animate-spin" />} Guardar avance
            </Button>
            <Button size="sm" variant="ghost" onClick={() => { setAnotando(false); setError(null); }}>
              Cancelar
            </Button>
          </div>
        </div>
      ) : (
        <div className="mt-4 flex flex-wrap gap-2">
          {!cuenta.leidoDeLaRed && (
            <Button size="sm" onClick={() => { setAnotando(true); setCifra(String(cuenta.seguidores)); }}>
              <TrendingUp className="h-3.5 w-3.5" /> Anotar avance
            </Button>
          )}
          {sePuedeLeer && (
            <Button size="sm" variant={cuenta.leidoDeLaRed ? "primary" : "outline"} onClick={leerDeYoutube} disabled={pendiente}>
              {pendiente ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <RefreshCw className="h-3.5 w-3.5" />}
              Actualizar desde YouTube
            </Button>
          )}
        </div>
      )}
      {error && <p className="mt-2 text-xs text-red-400">{error}</p>}

      {editando && <EditarDialog cuenta={cuenta} alCerrar={() => setEditando(false)} />}
    </article>
  );
}

/* ── Editar nombre y foto ──────────────────────────────────────────────────── */

function EditarDialog({ cuenta, alCerrar }: { cuenta: CuentaVista; alCerrar: () => void }) {
  const router = useRouter();
  const [nombre, setNombre] = useState(cuenta.nombre);
  const [foto, setFoto] = useState(cuenta.foto);
  const [cambioFoto, setCambioFoto] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pendiente, empezar] = useTransition();

  function guardar() {
    empezar(async () => {
      const r = await editarCuenta(cuenta.id, { nombre, ...(cambioFoto ? { foto } : {}) });
      if ("error" in r) return setError(r.error);
      router.refresh();
      alCerrar();
    });
  }

  return (
    <Dialog open onOpenChange={(o) => !o && alCerrar()}>
      <DialogContent>
        <DialogTitle>Editar página</DialogTitle>
        <DialogDescription>Los seguidores se cambian con «Anotar avance».</DialogDescription>
        <div className="mt-4 space-y-4">
          <FotoCampo valor={foto} nombre={nombre} etiqueta="Foto de la página" onCambia={(f) => { setFoto(f); setCambioFoto(true); }} />
          <div>
            <Label htmlFor="e-nombre">Nombre de la página</Label>
            <Input id="e-nombre" value={nombre} onChange={(e) => setNombre(e.target.value)} maxLength={80} className="mt-1.5" />
          </div>
          {error && <p className="text-sm text-red-400">{error}</p>}
          <Button onClick={guardar} disabled={pendiente || !nombre.trim()}>
            {pendiente && <Loader2 className="h-4 w-4 animate-spin" />} Guardar
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

/* ── Agregar una página ────────────────────────────────────────────────────── */

function AgregarDialog({ alCerrar }: { alCerrar: () => void }) {
  const router = useRouter();
  const [red, setRed] = useState<RedSocial>("INSTAGRAM");
  const [url, setUrl] = useState("");
  const [nombre, setNombre] = useState("");
  const [seguidores, setSeguidores] = useState("");
  const [foto, setFoto] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pendiente, empezar] = useTransition();

  const norm = url.trim() ? normalizarUrlCuenta(url, red) : null;
  const urlMal = url.trim() !== "" && !norm;

  function alCambiarUrl(valor: string) {
    setUrl(valor);
    // Con solo pegar el enlace se sabe de qué red es: no hace falta elegirla antes.
    const detectada = detectarRed(valor);
    const laRed = detectada ?? red;
    if (detectada) setRed(detectada);
    // Si aún no escribió nombre, se le sugiere el de la página que sale del enlace.
    const n = normalizarUrlCuenta(valor, laRed);
    if (n?.usuario && (!nombre || nombre === sugerido)) setNombre(n.usuario.replace(/^@/, ""));
  }
  const sugerido = norm?.usuario?.replace(/^@/, "") ?? "";

  function enviar(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    empezar(async () => {
      const r = await agregarCuenta({ red, nombre, url, seguidores: Number(seguidores || 0), foto });
      if ("error" in r) return setError(r.error);
      router.refresh();
      alCerrar();
      celebrar(r.nuevos);
    });
  }

  return (
    <Dialog open onOpenChange={(o) => !o && alCerrar()}>
      <DialogContent>
        <DialogTitle>Agregar una página</DialogTitle>
        <DialogDescription>Puedes dar de alta varias de la misma red.</DialogDescription>
        <form onSubmit={enviar} className="mt-4 space-y-4">
          <div className="grid grid-cols-4 gap-2">
            {REDES.map((r) => (
              <button
                key={r}
                type="button"
                onClick={() => setRed(r)}
                className={cn(
                  "focus-ring flex flex-col items-center gap-1.5 rounded-xl border p-2.5 text-[11px] transition",
                  red === r
                    ? "border-[var(--oro)] bg-[var(--oro)]/10 text-white"
                    : "border-[var(--linea)] text-[var(--ink-3)] hover:border-[var(--flotante-borde)] hover:text-white",
                )}
              >
                <RedIcon red={r} className="h-6 w-6" />
                {RED_INFO[r].nombre}
              </button>
            ))}
          </div>

          <div>
            <Label htmlFor="a-url">Enlace de tu página</Label>
            <Input
              id="a-url"
              value={url}
              onChange={(e) => alCambiarUrl(e.target.value)}
              placeholder={RED_INFO[red].ejemplo}
              className="mt-1.5"
              autoFocus
            />
            {urlMal && (
              <p className="mt-1 text-xs text-red-400">
                Ese enlace no es de {RED_INFO[red].nombre}. Debe verse así: {RED_INFO[red].ejemplo}
              </p>
            )}
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <Label htmlFor="a-nombre">Nombre de la página</Label>
              <Input id="a-nombre" value={nombre} onChange={(e) => setNombre(e.target.value)} maxLength={80} className="mt-1.5" />
            </div>
            <div>
              <Label htmlFor="a-seg">Seguidores hoy</Label>
              <Input id="a-seg" inputMode="numeric" value={seguidores} onChange={(e) => setSeguidores(soloDigitos(e.target.value))} placeholder="0" className="mt-1.5" />
            </div>
          </div>

          <FotoCampo valor={foto} nombre={nombre} etiqueta="Foto de la página (opcional)" onCambia={setFoto} />

          {error && <p className="text-sm text-red-400">{error}</p>}
          <Button type="submit" className="w-full" disabled={pendiente || !norm || !nombre.trim()}>
            {pendiente && <Loader2 className="h-4 w-4 animate-spin" />} Dar de alta
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
