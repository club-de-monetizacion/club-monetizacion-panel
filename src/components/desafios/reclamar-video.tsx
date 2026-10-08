"use client";

import { useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { ImagePlus, Loader2, Undo2, X } from "lucide-react";
import type { RedSocial, TipoLogro } from "@prisma/client";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { Input, Textarea } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { reclamarLogro, retirarLogro } from "@/app/actions/desafios";
import { RED_INFO, REDES, tituloLogro } from "@/lib/desafios";
import { fileToScaledDataUrl } from "@/lib/image";
import { cn } from "@/lib/utils";
import { celebrar } from "./celebracion";
import { Insignia } from "./insignia";
import { RedIcon } from "./red-icon";

/** El botón «Lo logré» de una insignia de video, con su formulario de prueba. */
export function ReclamarBoton({
  tipo,
  umbral,
  destacado = false,
}: {
  tipo: "VISTAS" | "LIKES" | "MONETIZACION";
  umbral: number;
  /** El siguiente escalón sin reclamar va en dorado; los demás, discretos. */
  destacado?: boolean;
}) {
  const router = useRouter();
  const [abierto, setAbierto] = useState(false);
  const [red, setRed] = useState<RedSocial | null>(null);
  const [enlace, setEnlace] = useState("");
  const [captura, setCaptura] = useState<string | null>(null);
  const [nota, setNota] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [leyendo, setLeyendo] = useState(false);
  const [pendiente, empezar] = useTransition();
  const archivo = useRef<HTMLInputElement>(null);
  // Los textos cambian según lo que se reclame: un video o la monetización de una cuenta.
  const t = tipo === "MONETIZACION"
    ? {
        boton: "¡Ya estoy monetizando!",
        red: "¿En qué plataforma?",
        enlace: "Enlace a tu canal o página",
        captura: "Captura de tu panel de monetización",
      }
    : {
        boton: "¡Lo logré!",
        red: "¿En qué red?",
        enlace: "Enlace al video",
        captura: "Captura de las estadísticas",
      };

  async function alElegir(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    e.target.value = "";
    if (!f) return;
    if (!f.type.startsWith("image/")) return setError("Elige una imagen");
    setLeyendo(true);
    setError(null);
    try {
      // Se baja de tamaño en el navegador: una captura de móvil pesa varios MB.
      const url = await fileToScaledDataUrl(f, 1280, 0.72);
      if (url.length > 880_000) setError("La captura es demasiado grande. Prueba con otra.");
      else setCaptura(url);
    } catch {
      setError("No se pudo leer la imagen");
    } finally {
      setLeyendo(false);
    }
  }

  function enviar() {
    setError(null);
    empezar(async () => {
      const r = await reclamarLogro({ tipo, umbral, red, enlace: enlace.trim(), captura, nota });
      if ("error" in r) return setError(r.error);
      setAbierto(false);
      setEnlace(""); setCaptura(null); setNota(""); setRed(null);
      router.refresh();
      celebrar(r.nuevos);
    });
  }

  return (
    <>
      <Button size="sm" variant={destacado ? "primary" : "outline"} onClick={() => setAbierto(true)} className="w-full">
        {t.boton}
      </Button>
      {abierto && (
        <Dialog open onOpenChange={(o) => !o && setAbierto(false)}>
          <DialogContent>
            <div className="flex items-center gap-4">
              <Insignia tipo={tipo as TipoLogro} umbral={umbral} tamano={64} />
              <div>
                <DialogTitle>{tituloLogro(tipo, umbral)}</DialogTitle>
                <DialogDescription>
                  Cuéntanos cuál fue. La prueba es opcional, pero ayuda a que tu logro cuente en serio.
                </DialogDescription>
              </div>
            </div>

            <div className="mt-5 space-y-4">
              <div>
                <Label>{t.red}</Label>
                <div className="mt-1.5 flex flex-wrap gap-2">
                  {REDES.map((r) => (
                    <button
                      key={r}
                      type="button"
                      onClick={() => setRed(red === r ? null : r)}
                      className={cn(
                        "focus-ring inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs transition",
                        red === r
                          ? "border-[var(--oro)] bg-[var(--oro)]/10 text-white"
                          : "border-[var(--linea)] text-[var(--ink-3)] hover:text-white",
                      )}
                    >
                      <RedIcon red={r} className="h-4 w-4" /> {RED_INFO[r].nombre}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <Label htmlFor="r-enlace">{t.enlace}</Label>
                <Input id="r-enlace" value={enlace} onChange={(e) => setEnlace(e.target.value)} placeholder="https://…" className="mt-1.5" />
              </div>

              <div>
                <Label>{t.captura}</Label>
                {captura ? (
                  <div className="relative mt-1.5">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={captura} alt="Tu captura" className="max-h-52 w-full rounded-xl border border-[var(--linea)] object-contain" />
                    <button type="button" onClick={() => setCaptura(null)} className="absolute top-2 right-2 rounded-full bg-black/70 p-1 text-white" aria-label="Quitar captura">
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => archivo.current?.click()}
                    className="focus-ring mt-1.5 flex w-full items-center justify-center gap-2 rounded-xl border border-dashed border-[var(--flotante-borde)] py-5 text-sm text-[var(--ink-3)] hover:border-[var(--oro)] hover:text-white"
                  >
                    {leyendo ? <Loader2 className="h-4 w-4 animate-spin" /> : <ImagePlus className="h-4 w-4" />}
                    Subir una captura
                  </button>
                )}
                <input ref={archivo} type="file" accept="image/*" onChange={alElegir} className="hidden" />
              </div>

              <div>
                <Label htmlFor="r-nota">¿Quieres contar algo? (opcional)</Label>
                <Textarea id="r-nota" value={nota} onChange={(e) => setNota(e.target.value)} rows={2} maxLength={300} className="mt-1.5" />
              </div>

              <p className="rounded-lg bg-white/[0.04] p-2.5 text-[11px] text-[var(--ink-3)]">
                Puedes dejarlo sin prueba y solo marcar que lo lograste. El equipo del Club revisa los
                logros y puede quitar los que no cuadren.
              </p>

              {error && <p className="text-sm text-red-400">{error}</p>}
              <Button className="w-full" onClick={enviar} disabled={pendiente || leyendo}>
                {pendiente && <Loader2 className="h-4 w-4 animate-spin" />} Reclamar insignia
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </>
  );
}

/** Retira una insignia de video reclamada por error. */
export function RetirarBoton({ logroId }: { logroId: string }) {
  const router = useRouter();
  const [pendiente, empezar] = useTransition();
  return (
    <button
      disabled={pendiente}
      onClick={() => {
        if (!window.confirm("¿Retirar esta insignia? Podrás reclamarla otra vez cuando quieras.")) return;
        empezar(async () => {
          await retirarLogro(logroId);
          router.refresh();
        });
      }}
      className="inline-flex items-center gap-1 text-[11px] text-[var(--ink-3)] hover:text-red-400"
    >
      <Undo2 className="h-3 w-3" /> Retirar
    </button>
  );
}
