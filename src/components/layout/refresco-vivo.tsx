"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

/**
 * Mantiene la pantalla al día sin que nadie recargue.
 *
 * Pide los datos de nuevo cada pocos segundos y React solo repinta lo que cambió:
 * no se pierde el texto a medio escribir ni el sitio donde estabas leyendo.
 *
 * Tres cuidados para no gastar de balde:
 * - **Con la pestaña de fondo no pregunta nada.** Al volver a ella refresca una vez,
 *   así lo primero que se ve ya está al día.
 * - Sin conexión se calla, y refresca en cuanto vuelve.
 * - Un solo temporizador para toda la plataforma: va en el layout, no en cada
 *   pantalla.
 */
export function RefrescoVivo({ cada = 8000 }: { cada?: number }) {
  const router = useRouter();

  useEffect(() => {
    let reloj: ReturnType<typeof setInterval> | null = null;

    const refresca = () => {
      if (document.visibilityState !== "visible") return;
      if (!navigator.onLine) return;
      router.refresh();
    };

    const arranca = () => {
      if (reloj) return;
      reloj = setInterval(refresca, cada);
    };
    const para = () => {
      if (!reloj) return;
      clearInterval(reloj);
      reloj = null;
    };

    const alCambiarVisibilidad = () => {
      if (document.visibilityState === "visible") {
        refresca();     // lo primero que se vea ya está al día
        arranca();
      } else {
        para();         // de fondo no se pregunta nada
      }
    };

    if (document.visibilityState === "visible") arranca();
    document.addEventListener("visibilitychange", alCambiarVisibilidad);
    window.addEventListener("online", refresca);
    window.addEventListener("focus", refresca);

    return () => {
      para();
      document.removeEventListener("visibilitychange", alCambiarVisibilidad);
      window.removeEventListener("online", refresca);
      window.removeEventListener("focus", refresca);
    };
  }, [router, cada]);

  return null;
}
