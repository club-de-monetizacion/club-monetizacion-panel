"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";

/**
 * Mantiene la pantalla al día sin que nadie recargue.
 *
 * Pide los datos de nuevo cada pocos segundos y React repinta solo lo que cambió: no
 * se pierde el texto a medio escribir ni el sitio donde estabas leyendo.
 *
 * **Refresca siempre**, solo más despacio cuando la pestaña está de fondo. Se probó
 * antes a callar del todo mirando `visibilityState`, y algunos envoltorios (la app de
 * escritorio, una webview, el navegador embebido de una app) informan de eso tan mal
 * que no refrescaban nunca. Más vale una petición pequeña de más que una pantalla
 * desactualizada.
 *
 * Un solo reloj para toda la plataforma: va en el layout, no en cada pantalla.
 *
 * **Se calla en las pantallas que llevan una herramienta dentro de un marco** (el
 * YouTube Planner): refrescar ahí volvía a montar el marco y la herramienta se
 * recargaba de cero cada pocos segundos, con su pantalla de bienvenida y todo. Esas
 * herramientas traen su propio tiempo real por dentro.
 */
export function RefrescoVivo({
  cada = 15000,
  cadaDeFondo = 45000,
}: {
  cada?: number;
  cadaDeFondo?: number;
}) {
  const router = useRouter();
  const ruta = usePathname();

  /* Las pantallas que llevan una herramienta en un marco. Si crece la lista, aquí
     se añade. */
  const conHerramienta = (r: string) => r.startsWith("/youtube-planner");

  useEffect(() => {
    if (conHerramienta(ruta ?? "")) return;   // ahí no se refresca nada

    let reloj: ReturnType<typeof setInterval> | null = null;
    /* Arranca el reloj AHORA, no en cero. Con `ultimo = 0` el primer tic caía
       a los 4 s de entrar y volvía a pedir la pantalla entera cuando todavía
       se estaba terminando de abrir: la herramienta se sentía lenta justo al
       llegar, que es cuando más se nota. */
    let ultimo = Date.now();

    const aLaVista = () =>
      document.visibilityState === "visible" || document.hasFocus();

    const tic = () => {
      // Sin conexión no se pide nada; se reintenta en la vuelta siguiente.
      if (typeof navigator.onLine === "boolean" && !navigator.onLine) return;
      const espera = aLaVista() ? cada : cadaDeFondo;
      const ahora = Date.now();
      if (ahora - ultimo < espera - 500) return;
      ultimo = ahora;
      router.refresh();
    };

    const alVolver = () => {
      // Al volver a la pestaña, lo primero que se vea ya está al día.
      ultimo = 0;
      tic();
    };

    reloj = setInterval(tic, Math.min(cada, 5000));
    document.addEventListener("visibilitychange", alVolver);
    window.addEventListener("focus", alVolver);
    window.addEventListener("online", alVolver);

    return () => {
      if (reloj) clearInterval(reloj);
      document.removeEventListener("visibilitychange", alVolver);
      window.removeEventListener("focus", alVolver);
      window.removeEventListener("online", alVolver);
    };
  }, [router, ruta, cada, cadaDeFondo]);

  return null;
}
