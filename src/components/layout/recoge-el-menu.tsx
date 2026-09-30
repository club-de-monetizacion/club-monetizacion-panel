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
    window.dispatchEvent(new CustomEvent("ccm:menu", { detail: { recoger: true } }));
    return () => {
      window.dispatchEvent(new CustomEvent("ccm:menu", { detail: { recoger: false } }));
    };
  }, []);

  return null;
}
