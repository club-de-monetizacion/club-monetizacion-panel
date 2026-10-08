"use client";

import { useState } from "react";
import { ExternalLink, FileSearch } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";

/**
 * La prueba de una insignia: el enlace y/o la captura. Las capturas se guardan como
 * datos dentro de la propia página, y los navegadores no dejan abrir un `data:` en una
 * pestaña nueva, así que se enseñan aquí.
 */
export function VerPrueba({
  titulo,
  enlace,
  captura,
  nota,
}: {
  titulo: string;
  enlace: string | null;
  captura: string | null;
  nota: string | null;
}) {
  const [abierto, setAbierto] = useState(false);
  if (!enlace && !captura && !nota) return null;
  return (
    <>
      <button
        onClick={() => setAbierto(true)}
        className="inline-flex items-center gap-1 text-[11px] text-[var(--oro-claro)] hover:underline"
      >
        <FileSearch className="h-3 w-3" /> Ver prueba
      </button>
      {abierto && (
        <Dialog open onOpenChange={(o) => !o && setAbierto(false)}>
          <DialogContent className="max-w-xl">
            <DialogTitle>{titulo}</DialogTitle>
            <DialogDescription>La prueba que dejó la persona.</DialogDescription>
            <div className="mt-4 space-y-3">
              {captura && (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={captura} alt="Captura de la prueba" className="max-h-[60vh] w-full rounded-xl border border-[var(--linea)] object-contain" />
              )}
              {enlace && (
                <a
                  href={enlace}
                  target="_blank"
                  rel="noopener noreferrer nofollow"
                  className="flex items-center gap-1.5 break-all text-sm text-[var(--oro-claro)] hover:underline"
                >
                  <ExternalLink className="h-3.5 w-3.5 shrink-0" /> {enlace}
                </a>
              )}
              {nota && <p className="rounded-lg bg-white/[0.04] p-3 text-sm text-[var(--ink-1)]">{nota}</p>}
            </div>
          </DialogContent>
        </Dialog>
      )}
    </>
  );
}
