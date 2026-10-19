"use client";

import { useEffect, useState } from "react";
import { CLUB } from "@/lib/club-sso";

/* Cuándo se pulsó «Volver a intentar». Vive fuera del componente porque, si la
   base sigue sin contestar, Next vuelve a montar este aviso desde cero y lo que
   guardara dentro se pierde: el botón parecía no hacer nada. Así se ve
   «Intentando…» un momento aunque la respuesta llegue al instante. */
let intentoEn = 0;
const SE_VE_INTENTANDO = 1200;

/**
 * «TAREAS NO ESTÁ DISPONIBLE AHORA», CON LA SESIÓN YA ABIERTA (19 oct 2026)
 *
 * La página de `api/entrar-club` solo la ve quien entra. Quien ya tenía Tareas
 * abierto cuando la base deja de responder no pasa por ahí: el refresco vivo (o
 * un clic en el menú) pide la pantalla, la consulta falla y Next ponía su error
 * genérico en inglés («This page couldn’t load… Reload»). Eso es lo que vio el
 * equipo el 17 oct con la pestaña abierta. Ahora sale el mismo aviso que al
 * entrar, dentro de la cabecera, el menú y el pie de siempre.
 *
 * No se enseña ningún error técnico: el detalle lo deja el servidor en su log.
 * «Volver a intentar» pide la pantalla otra vez (`retry`); si la base ya
 * contesta, vuelve lo de antes sin recargar.
 */
export default function TareasNoDisponible({
  retry,
}: {
  error: Error & { digest?: string };
  retry: () => void;
}) {
  const [intentando, setIntentando] = useState(
    () => Date.now() - intentoEn < SE_VE_INTENTANDO,
  );

  useEffect(() => {
    if (!intentando) return;
    const falta = Math.max(0, intentoEn + SE_VE_INTENTANDO - Date.now());
    const t = setTimeout(() => setIntentando(false), falta);
    return () => clearTimeout(t);
  }, [intentando]);

  const otraVez = () => {
    if (intentando) return;
    intentoEn = Date.now();
    setIntentando(true);
    retry();
  };

  return (
    <div className="flex min-h-[60vh] items-center justify-center py-4 md:py-8">
      <section
        role="alert"
        className="glass-panel animate-fade-in w-full max-w-[520px] rounded-[22px] px-5 pt-8 pb-6 text-center min-[481px]:px-[30px] min-[481px]:pt-10 min-[481px]:pb-8"
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/branding/logo-club.png"
          alt=""
          width={72}
          height={72}
          className="mx-auto mb-[22px] block h-[72px] w-[72px] object-contain drop-shadow-[0_6px_22px_rgba(201,160,64,0.4)]"
        />
        <div className="mb-3 font-[family-name:var(--font-titulos)] text-[11px] font-bold tracking-[0.24em] text-[var(--oro)] uppercase">
          Club de Monetización
        </div>
        <h2 className="font-[family-name:var(--font-titulos)] text-[clamp(24px,6.4vw,31px)] leading-[1.18] font-bold tracking-[-0.3px] text-balance text-[var(--ink-0)]">
          Tareas no está disponible ahora
        </h2>
        <p className="mx-auto mt-3.5 max-w-[400px] text-[15.5px] leading-[1.65] text-pretty text-[var(--ink-2)]">
          No pudimos abrir los tableros. Tus tareas siguen guardadas: vuelve a
          intentarlo en un rato.
        </p>
        <div className="mt-7 flex flex-col gap-3 min-[481px]:flex-row min-[481px]:flex-wrap min-[481px]:justify-center">
          <a
            href={CLUB}
            className="btn-oro border border-transparent px-[22px] py-[14px] text-[15px] whitespace-nowrap focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-[var(--oro-claro)]"
          >
            <svg viewBox="0 0 24 24" aria-hidden="true" className="h-[17px] w-[17px] flex-none fill-none stroke-current stroke-2 [stroke-linecap:round] [stroke-linejoin:round]">
              <path d="M19 12H5" />
              <path d="m12 19-7-7 7-7" />
            </svg>
            Volver al Club
          </a>
          <button
            type="button"
            onClick={otraVez}
            disabled={intentando}
            aria-busy={intentando}
            className="btn-fantasma justify-center px-[22px] py-[14px] text-[15px] font-semibold whitespace-nowrap disabled:cursor-wait disabled:opacity-80 focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-[var(--oro-claro)]"
          >
            <svg
              viewBox="0 0 24 24"
              aria-hidden="true"
              className={
                "h-[17px] w-[17px] flex-none fill-none stroke-current stroke-2 [stroke-linecap:round] [stroke-linejoin:round]" +
                (intentando ? " motion-safe:animate-spin" : "")
              }
            >
              <path d="M21 12a9 9 0 1 1-2.64-6.36" />
              <path d="M21 3v6h-6" />
            </svg>
            {intentando ? "Intentando…" : "Volver a intentar"}
          </button>
        </div>
      </section>
    </div>
  );
}
