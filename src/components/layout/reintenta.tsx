"use client";

import { useEffect } from "react";

/** Vuelve a intentar entrar al cabo de un momento, sin que nadie pulse nada. */
export function Reintenta({ a, espera = 1500 }: { a: string; espera?: number }) {
  useEffect(() => {
    const t = setTimeout(() => window.location.replace(a), espera);
    return () => clearTimeout(t);
  }, [a, espera]);
  return null;
}
