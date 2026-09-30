"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

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
 */
export function RefrescoVivo({
  cada = 8000,
  cadaDeFondo = 30000,
}: {
  cada?: number;
  cadaDeFondo?: number;
}) {
  const router = useRouter();

  useEffect(() => {
    let reloj: ReturnType<typeof setInterval> | null = null;
    let ultimo = 0;

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

    reloj = setInterval(tic, Math.min(cada, 4000));
    document.addEventListener("visibilitychange", alVolver);
    window.addEventListener("focus", alVolver);
    window.addEventListener("online", alVolver);

    return () => {
      if (reloj) clearInterval(reloj);
      document.removeEventListener("visibilitychange", alVolver);
      window.removeEventListener("focus", alVolver);
      window.removeEventListener("online", alVolver);
    };
  }, [router, cada, cadaDeFondo]);

  return null;
}
