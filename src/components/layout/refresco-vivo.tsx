"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";

/* Al volver, si el último refresco fue hace menos de esto, no se repite: `focus` y
   `visibilitychange` llegan juntos y no deben dar dos peticiones. */
const MINIMO_AL_VOLVER = 2000;

/**
 * Mantiene la pantalla al día sin que nadie recargue.
 *
 * Pide los datos de nuevo cada pocos segundos y React repinta solo lo que cambió: no
 * se pierde el texto a medio escribir ni el sitio donde estabas leyendo.
 *
 * **Con la pestaña de fondo no se pide nada** (19 oct 2026). Cada refresco despierta
 * la base (Neon) y la mantenía encendida día y noche con una pestaña olvidada; junto
 * con el latido de cada 5 min, lo más probable es que eso agotara la cuota gratis:
 * el 17 oct Tareas dejó de abrir. Al volver a la pestaña se refresca **una vez**,
 * así lo primero que se ve ya está al día.
 *
 * ⚠️ «De fondo» es oculta **y** sin foco. Algunos envoltorios (la app de escritorio,
 * una webview, el navegador embebido de una app) informan mal de `visibilityState`:
 * dicen «hidden» aunque se esté usando. Con el foco puesto, se refresca igual.
 *
 * **Con el aviso «Tareas no está disponible ahora» en pantalla, se calla** (20 oct
 * 2026). Refrescar no quita ese aviso (es el límite de error de Next), así que
 * quien vuelve a probar es el aviso (`app/(dashboard)/error.tsx`), con este mismo
 * ritmo. Si los dos pidieran, serían dos peticiones cada 15 s.
 *
 * Un solo reloj para toda la plataforma: va en el layout, no en cada pantalla.
 *
 * **Se calla en las pantallas que llevan una herramienta dentro de un marco** (el
 * YouTube Planner): refrescar ahí volvía a montar el marco y la herramienta se
 * recargaba de cero cada pocos segundos, con su pantalla de bienvenida y todo. Esas
 * herramientas traen su propio tiempo real por dentro.
 */
export function RefrescoVivo({ cada = 15000 }: { cada?: number }) {
  const router = useRouter();
  const ruta = usePathname();

  /* Las pantallas que llevan una herramienta en un marco. Si crece la lista, aquí
     se añade. */
  const conHerramienta = (r: string) => r.startsWith("/youtube-planner");

  useEffect(() => {
    if (conHerramienta(ruta ?? "")) return;   // ahí no se refresca nada

    /* Arranca el reloj AHORA, no en cero. Con `ultimo = 0` el primer tic caía
       a los 4 s de entrar y volvía a pedir la pantalla entera cuando todavía
       se estaba terminando de abrir: la herramienta se sentía lenta justo al
       llegar, que es cuando más se nota. */
    let ultimo = Date.now();
    /* Hubo un refresco que no se hizo (pestaña de fondo o sin red): al volver se
       debe uno. */
    let debe = false;

    const aLaVista = () =>
      document.visibilityState === "visible" || document.hasFocus();
    const sinRed = () =>
      typeof navigator.onLine === "boolean" && !navigator.onLine;
    // El aviso de error.tsx está en pantalla: él se encarga de volver a probar.
    const conAviso = () => !!document.querySelector("[data-tareas-no-disponible]");

    const refresca = () => {
      ultimo = Date.now();
      debe = false;
      router.refresh();
    };

    const tic = () => {
      /* Con el aviso no se pide nada, y al quitarse (la pantalla ya viene fresca)
         el reloj empieza de cero. */
      if (conAviso()) {
        ultimo = Date.now();
        debe = false;
        return;
      }
      // De fondo o sin conexión no se pide nada: se queda debiendo para la vuelta.
      if (!aLaVista() || sinRed()) {
        debe = true;
        return;
      }
      if (Date.now() - ultimo < cada - 500) return;
      refresca();
    };

    const alVolver = () => {
      if (conAviso()) return;   // al volver, el aviso prueba por su cuenta
      if (!aLaVista() || sinRed()) {
        debe = true;   // se fue de la pestaña: a partir de aquí no se pide nada
        return;
      }
      // Una sola vez al volver, aunque lleguen varios avisos seguidos.
      if (debe && Date.now() - ultimo >= MINIMO_AL_VOLVER) refresca();
    };

    // Al volver de la caché del navegador (atrás/adelante) la pantalla es vieja.
    const alMostrar = (e: PageTransitionEvent) => {
      if (!e.persisted) return;
      debe = true;
      alVolver();
    };

    const reloj = setInterval(tic, Math.min(cada, 5000));
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
  }, [router, ruta, cada]);

  return null;
}
