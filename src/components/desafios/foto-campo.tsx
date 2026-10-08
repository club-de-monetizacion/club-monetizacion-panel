"use client";

import { useRef, useState } from "react";
import { Camera, Loader2, X } from "lucide-react";
import { Avatar } from "@/components/ui/avatar";
import { fileToCompressedDataUrl } from "@/lib/image";

/**
 * El campo para poner una foto: la comprime en el navegador a 256×256 y la devuelve
 * como texto. `valor` es la foto actual; `onCambia(null)` es «quitarla».
 */
export function FotoCampo({
  valor,
  nombre,
  onCambia,
  tamano = 72,
  etiqueta = "Foto",
}: {
  valor: string | null;
  nombre?: string | null;
  onCambia: (foto: string | null) => void;
  tamano?: number;
  etiqueta?: string;
}) {
  const input = useRef<HTMLInputElement>(null);
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function alElegir(e: React.ChangeEvent<HTMLInputElement>) {
    const archivo = e.target.files?.[0];
    e.target.value = "";
    if (!archivo) return;
    if (!archivo.type.startsWith("image/")) {
      setError("Elige una imagen");
      return;
    }
    setError(null);
    setCargando(true);
    try {
      onCambia(await fileToCompressedDataUrl(archivo, { width: 256, height: 256, quality: 0.82 }));
    } catch {
      setError("No se pudo leer la imagen");
    } finally {
      setCargando(false);
    }
  }

  return (
    <div className="flex items-center gap-3">
      <div className="relative">
        <Avatar src={valor} name={nombre} size={tamano} />
        <button
          type="button"
          onClick={() => input.current?.click()}
          className="focus-ring absolute -right-1 -bottom-1 flex h-7 w-7 items-center justify-center rounded-full bg-[var(--oro)] text-[#1a1200] shadow-lg"
          aria-label={`Cambiar ${etiqueta.toLowerCase()}`}
        >
          {cargando ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Camera className="h-3.5 w-3.5" />}
        </button>
        <input ref={input} type="file" accept="image/*" onChange={alElegir} className="hidden" />
      </div>
      <div className="text-xs text-[var(--ink-3)]">
        <p className="text-sm font-medium text-[var(--ink-0)]">{etiqueta}</p>
        <p>La foto de tu página o la tuya.</p>
        {valor && (
          <button
            type="button"
            onClick={() => onCambia(null)}
            className="mt-0.5 inline-flex items-center gap-1 text-[var(--ink-2)] hover:text-white"
          >
            <X className="h-3 w-3" /> Quitar
          </button>
        )}
        {error && <p className="text-red-400">{error}</p>}
      </div>
    </div>
  );
}
