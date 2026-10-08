"use client";

import { useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { ImagePlus, Loader2, Pencil, Trash2, X } from "lucide-react";
import type { RedSocial } from "@prisma/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { borrarIngreso, registrarIngreso } from "@/app/actions/desafios";
import { RED_INFO, REDES, dolaresExactos, nombreDeMes } from "@/lib/desafios";
import type { IngresoVista } from "@/lib/desafios-data";
import { fileToScaledDataUrl } from "@/lib/image";
import { cn } from "@/lib/utils";
import { celebrar } from "./celebracion";
import { RedIcon } from "./red-icon";
import { VerPrueba } from "./ver-prueba";

/** El mes en curso como «2026-10», en UTC, que es como lo valida el servidor. */
const mesActual = () => new Date().toISOString().slice(0, 7);

/** Deja solo dígitos y un punto decimal con dos decimales: «12.505» → «12.50». */
function soloMonto(texto: string) {
  const limpio = texto.replace(/[^\d.]/g, "");
  const [entero, ...resto] = limpio.split(".");
  return resto.length ? `${entero.slice(0, 8)}.${resto.join("").slice(0, 2)}` : entero.slice(0, 8);
}

/** Anotar lo que se gana cada mes en cada plataforma, y ver el historial. */
export function IngresosManager({ ingresos }: { ingresos: IngresoVista[] }) {
  const router = useRouter();
  const [red, setRed] = useState<RedSocial>("YOUTUBE");
  const [mes, setMes] = useState(mesActual);
  const [monto, setMonto] = useState("");
  const [nota, setNota] = useState("");
  const [captura, setCaptura] = useState<string | null>(null);
  const [leyendo, setLeyendo] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [editando, setEditando] = useState(false);
  const [pendiente, empezar] = useTransition();
  const archivo = useRef<HTMLInputElement>(null);
  const formulario = useRef<HTMLDivElement>(null);

  async function alElegir(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    e.target.value = "";
    if (!f) return;
    if (!f.type.startsWith("image/")) return setError("Elige una imagen");
    setLeyendo(true);
    setError(null);
    try {
      const url = await fileToScaledDataUrl(f, 1280, 0.72);
      if (url.length > 880_000) setError("La captura es demasiado grande. Prueba con otra.");
      else setCaptura(url);
    } catch {
      setError("No se pudo leer la imagen");
    } finally {
      setLeyendo(false);
    }
  }

  function guardar() {
    setError(null);
    empezar(async () => {
      const r = await registrarIngreso({ red, mes, monto: Number(monto || 0), nota, captura });
      if ("error" in r) return setError(r.error);
      setMonto("");
      setNota("");
      setCaptura(null);
      setEditando(false);
      router.refresh();
      celebrar(r.nuevos);
    });
  }

  /** Vuelve a poner una fila en el formulario para corregirla. */
  function corregir(i: IngresoVista) {
    setRed(i.red);
    setMes(i.mes.slice(0, 7));
    setMonto(String(i.monto));
    setNota(i.nota ?? "");
    setCaptura(null);
    setEditando(true);
    setError(null);
    formulario.current?.scrollIntoView({ behavior: "smooth", block: "center" });
  }

  function borrar(i: IngresoVista) {
    if (!window.confirm(`¿Borrar lo de ${nombreDeMes(i.mes)} en ${RED_INFO[i.red].nombre}?`)) return;
    empezar(async () => {
      const r = await borrarIngreso(i.id);
      if ("error" in r) setError(r.error);
      else router.refresh();
    });
  }

  return (
    <div className="space-y-6">
      <div ref={formulario} className="glass-panel rounded-2xl p-5">
        <h2 className="font-semibold">{editando ? "Corregir ingreso" : "Anotar ingresos de un mes"}</h2>
        <p className="mb-4 text-xs text-[var(--ink-3)]">
          En dólares (USD). Si anotas otra vez el mismo mes y la misma plataforma, se corrige: no se suma dos veces.
        </p>

        <div className="space-y-4">
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

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <Label htmlFor="i-mes">Mes</Label>
              <Input id="i-mes" type="month" value={mes} max={mesActual()} min="2005-01" onChange={(e) => setMes(e.target.value)} className="mt-1.5" />
            </div>
            <div>
              <Label htmlFor="i-monto">¿Cuánto ganaste? (USD)</Label>
              <div className="relative mt-1.5">
                <span className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-sm text-[var(--ink-3)]">$</span>
                <Input id="i-monto" inputMode="decimal" value={monto} onChange={(e) => setMonto(soloMonto(e.target.value))} placeholder="0.00" className="pl-6" />
              </div>
            </div>
          </div>

          <div>
            <Label htmlFor="i-nota">Nota (opcional)</Label>
            <Input id="i-nota" value={nota} onChange={(e) => setNota(e.target.value)} maxLength={200} placeholder="«Mi primer pago de AdSense»" className="mt-1.5" />
          </div>

          <div>
            <Label>Captura de tu panel de pagos (opcional)</Label>
            {captura ? (
              <div className="relative mt-1.5">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={captura} alt="Tu captura" className="max-h-40 w-full rounded-xl border border-[var(--linea)] object-contain" />
                <button type="button" onClick={() => setCaptura(null)} className="absolute top-2 right-2 rounded-full bg-black/70 p-1 text-white" aria-label="Quitar captura">
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>
            ) : (
              <button type="button" onClick={() => archivo.current?.click()} className="focus-ring mt-1.5 flex w-full items-center justify-center gap-2 rounded-xl border border-dashed border-[var(--flotante-borde)] py-4 text-sm text-[var(--ink-3)] hover:border-[var(--oro)] hover:text-white">
                {leyendo ? <Loader2 className="h-4 w-4 animate-spin" /> : <ImagePlus className="h-4 w-4" />}
                Subir una captura
              </button>
            )}
            <input ref={archivo} type="file" accept="image/*" onChange={alElegir} className="hidden" />
          </div>

          {error && <p className="text-sm text-red-400">{error}</p>}
          <div className="flex gap-2">
            <Button onClick={guardar} disabled={pendiente || leyendo || monto === "" || monto === "."}>
              {pendiente && <Loader2 className="h-4 w-4 animate-spin" />}
              {editando ? "Guardar corrección" : "Guardar ingreso"}
            </Button>
            {editando && (
              <Button variant="ghost" onClick={() => { setEditando(false); setMonto(""); setNota(""); setError(null); }}>
                Cancelar
              </Button>
            )}
          </div>
        </div>
      </div>

      <section>
        <h2 className="mb-3 text-lg font-semibold">Historial</h2>
        {ingresos.length === 0 ? (
          <p className="glass-panel rounded-2xl p-6 text-center text-sm text-[var(--ink-3)]">
            Aún no has anotado ingresos. Cuando llegue el primero, aquí vas a ver cómo crece.
          </p>
        ) : (
          <ul className="space-y-2">
            {ingresos.map((i) => (
              <li key={i.id} className="fila-tabla flex items-center gap-3 p-3">
                <RedIcon red={i.red} className="h-6 w-6 shrink-0" />
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium capitalize">{nombreDeMes(i.mes)} · <span className="normal-case">{RED_INFO[i.red].nombre}</span></p>
                  {i.nota && <p className="truncate text-xs text-[var(--ink-3)]">{i.nota}</p>}
                </div>
                <VerPrueba titulo={`${nombreDeMes(i.mes)} · ${RED_INFO[i.red].nombre}`} enlace={null} captura={i.captura} nota={null} />
                <p className="font-[family-name:var(--font-titulos)] text-lg font-bold tabular-nums">{dolaresExactos(i.monto)}</p>
                <button onClick={() => corregir(i)} className="rounded-md p-1.5 text-[var(--ink-3)] hover:bg-white/5 hover:text-white" aria-label="Corregir">
                  <Pencil className="h-3.5 w-3.5" />
                </button>
                <button onClick={() => borrar(i)} disabled={pendiente} className="rounded-md p-1.5 text-[var(--ink-3)] hover:bg-white/5 hover:text-red-400" aria-label="Borrar">
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
