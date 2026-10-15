"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { PantallaCarga } from "@/components/layout/pantalla-carga";

const CLUB = "https://clubdemonetizacion.com";
const HAY = () => /(?:^|;\s*)club_hay=1/.test(document.cookie);

/**
 * LA SESIÓN NO SOBREVIVE A SU CIERRE (lo mismo que `club-vigila.js` del Club)
 *
 * Si se cierra sesión en el Club o en cualquier herramienta, esta pestaña no
 * puede seguir enseñando las tareas. Se vigila la pista `club_hay`, que el
 * navegador sí puede leer: si desaparece, se confirma con el servidor (Safari
 * a veces no la devuelve un instante) y solo entonces se va al Club, tapando
 * con la pantalla de carga. Un fallo de red nunca saca a nadie.
 *
 * Solo intervalos y `visibilitychange`/`pageshow`: ningún escuchador de rueda
 * ni de `touchmove`, el scroll no se toca.
 */
export function VigilaSesion() {
  const [fuera, setFuera] = useState(false);

  useEffect(() => {
    let habia = HAY();
    let dudando = false;
    let ido = false;

    const vete = () => {
      if (ido) return;
      ido = true;
      setFuera(true);
      window.location.replace(CLUB);
    };

    const confirma = async () => {
      if (dudando || ido) return;
      dudando = true;
      try {
        const r = await fetch("/api/sesion-club", { cache: "no-store", credentials: "same-origin" });
        if (r.ok) {
          const d = (await r.json()) as { dentro?: boolean };
          if (d && d.dentro === false) vete();
        }
      } catch {
        /* sin red no se echa a nadie */
      } finally {
        dudando = false;
      }
    };

    const mira = () => {
      const hay = HAY();
      if (habia && !hay) void confirma();
      if (hay) habia = true;
    };

    const reloj = setInterval(mira, 2500);
    const alVolver = () => {
      if (document.visibilityState === "visible") mira();
    };
    /* ⚠️ El botón «atrás» revive la página tal como estaba: si la pista ya no
       está, se recarga en el acto y el portero decide. */
    const alMostrar = (e: PageTransitionEvent) => {
      if (!e.persisted) return;
      if (habia && !HAY()) window.location.reload();
      else void confirma();
    };
    document.addEventListener("visibilitychange", alVolver);
    window.addEventListener("pageshow", alMostrar);
    return () => {
      clearInterval(reloj);
      document.removeEventListener("visibilitychange", alVolver);
      window.removeEventListener("pageshow", alMostrar);
    };
  }, []);

  return fuera ? createPortal(<PantallaCarga />, document.body) : null;
}
