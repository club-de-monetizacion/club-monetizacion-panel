"use client";

import { useEffect, useState } from "react";
import { CLUB } from "@/lib/club-sso";

/* Cuándo se pulsó «Volver a intentar». Vive fuera del componente porque, si la
   base sigue sin contestar, Next vuelve a montar este aviso desde cero y lo que
   guardara dentro se pierde: el botón parecía no hacer nada. Así se ve
   «Intentando…» un momento aunque la respuesta llegue al instante. */
let intentoEn = 0;
const SE_VE_INTENTANDO = 1200;

/* Cuándo se pidió la pantalla por última vez desde el aviso, a mano o sola.
   También fuera del componente: lo comparten el botón y el reloj de abajo. */
let ultimoIntento = 0;
/* Cada cuánto vuelve a probar sola con la pestaña a la vista: lo mismo que el
   refresco vivo. */
const CADA = 15000;
/* Al volver a la pestaña, si se probó hace menos de esto, no se repite: `focus` y
   `visibilitychange` llegan juntos y no deben dar dos peticiones. */
const MINIMO_AL_VOLVER = 2000;

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
 *
 * **Y vuelve sola** (20 oct 2026). El refresco vivo pide la pantalla, pero eso
 * no quita este aviso: con la base ya de vuelta seguía «no disponible» hasta que
 * alguien pulsaba. Ahora, mientras el aviso está en pantalla, es él quien vuelve
 * a probar: cada 15 s con la pestaña a la vista y una vez al volver a ella (o al
 * volver la conexión). Con la pestaña de fondo, nada. Estos intentos no enseñan
 * «Intentando…»: eso es solo para el botón. El refresco vivo se calla mientras
 * tanto (ve `data-tareas-no-disponible`), así no se pide dos veces.
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

  /* Prueba sola, sin «Intentando…». La misma regla que el refresco vivo: «de
     fondo» es oculta y sin foco, y sin conexión no se pide nada. */
  useEffect(() => {
    /* El aviso acaba de salir (o de volver a salir tras un intento que falló): esa
       consulta cuenta como el último intento, y el siguiente va 15 s después. */
    ultimoIntento = Date.now();
    // Hubo un intento que no se hizo (pestaña de fondo o sin red): al volver se debe uno.
    let debe = false;

    const aLaVista = () =>
      document.visibilityState === "visible" || document.hasFocus();
    const sinRed = () =>
      typeof navigator.onLine === "boolean" && !navigator.onLine;

    const prueba = () => {
      ultimoIntento = Date.now();
      debe = false;
      retry();
    };

    const tic = () => {
      if (!aLaVista() || sinRed()) {
        debe = true;
        return;
      }
      if (Date.now() - ultimoIntento < CADA - 500) return;
      prueba();
    };

    const alVolver = () => {
      if (!aLaVista() || sinRed()) {
        debe = true;
        return;
      }
      if (debe && Date.now() - ultimoIntento >= MINIMO_AL_VOLVER) prueba();
    };

    const alMostrar = (e: PageTransitionEvent) => {
      if (!e.persisted) return;
      debe = true;
      alVolver();
    };

    const reloj = setInterval(tic, 5000);
    document.addEventListener("visibilitychange", alVolver);
    window.addEventListener("focus", alVolver);
    window.addEventListener("online", alVolver);
    window.addEventListener("pageshow", alMostrar);

    return () => {
      clearInterval(reloj);
      document.removeEventListener("visibilitychange", alVolver);
      window.removeEventListener("focus", alVolver);
      window.removeEventListener("online", alVolver);
      window.removeEventListener("pageshow", alMostrar);
    };
  }, [retry]);

  const otraVez = () => {
    if (intentando) return;
    intentoEn = Date.now();
    ultimoIntento = intentoEn;
    setIntentando(true);
    retry();
  };

  return (
    <div className="flex min-h-[60vh] items-center justify-center py-4 md:py-8">
      <section
        role="alert"
        data-tareas-no-disponible=""
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
