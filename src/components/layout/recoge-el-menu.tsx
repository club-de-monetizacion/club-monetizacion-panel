"use client";

import { useEffect } from "react";

/**
 * Recoge el menú lateral mientras esta pantalla esté abierta, y lo devuelve a como
 * estaba al salir.
 *
 * Va por un evento en vez de por el estado del armazón a propósito: el armazón no se
 * remonta al cambiar de pantalla, y cualquier intento de decidirlo ahí acababa
 * peleándose con el refresco automático, que lo volvía a abrir a los pocos segundos.
 * Así solo pasa una vez, al entrar, y el botón de la cabecera sigue mandando.
 */
export function RecogeElMenu() {
  useEffect(() => {
    /* Con un salto de turno a propósito: en React los efectos de los hijos corren
       antes que los del padre, así que avisar aquí mismo llegaba antes de que el
       armazón estuviera escuchando y el aviso se perdía. */
    const avisa = (recoger: boolean) =>
      window.dispatchEvent(new CustomEvent("ccm:menu", { detail: { recoger } }));

    const t = setTimeout(() => avisa(true), 0);
    return () => {
      clearTimeout(t);
      avisa(false);
    };
  }, []);

  return null;
}
