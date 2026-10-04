"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { CSSProperties, TouchEvent } from "react";
import Link from "next/link";
import { ArrowLeft, ChevronLeft, ChevronRight, Maximize2, Minimize2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { Diapositiva } from "./diapositivas";
import { DIAPOSITIVAS } from "./titulos";
import e from "./presentacion.module.css";

const ANCHO = 1920;
const ALTO = 1080;
const TOTAL = DIAPOSITIVAS.length;
/** Cuánto tarda en esconderse la barra de controles si no se mueve el ratón. */
const ESPERA_CONTROLES_MS = 2800;

type DocumentoConPrefijo = Document & {
  webkitFullscreenElement?: Element | null;
  webkitExitFullscreen?: () => Promise<void> | void;
};
type ElementoConPrefijo = HTMLElement & { webkitRequestFullscreen?: () => Promise<void> | void };

const pantallaCompletaActiva = () => {
  const d = document as DocumentoConPrefijo;
  return !!(d.fullscreenElement ?? d.webkitFullscreenElement);
};

/** Una diapositiva pasada del hash de la URL (`#3`) al índice, o 0 si no vale. */
const indiceDelHash = () => {
  const n = Number.parseInt(window.location.hash.replace("#", ""), 10);
  return Number.isFinite(n) && n >= 1 && n <= TOTAL ? n - 1 : 0;
};

export function PresentacionClases() {
  const raiz = useRef<HTMLDivElement>(null);
  const [actual, setActual] = useState(0);
  const [medida, setMedida] = useState({ escala: 1, ancho: ANCHO, alto: ALTO });
  const [completa, setCompleta] = useState(false);
  const [controles, setControles] = useState(true);
  const [listo, setListo] = useState(false);
  const temporizador = useRef<ReturnType<typeof setTimeout> | null>(null);
  const toqueInicial = useRef<{ x: number; y: number } | null>(null);

  const ir = useCallback((destino: number) => {
    setActual(Math.min(TOTAL - 1, Math.max(0, destino)));
  }, []);
  const siguiente = useCallback(() => setActual((p) => Math.min(TOTAL - 1, p + 1)), []);
  const anterior = useCallback(() => setActual((p) => Math.max(0, p - 1)), []);

  const alternarPantallaCompleta = useCallback(async () => {
    const el = raiz.current as ElementoConPrefijo | null;
    if (!el) return;
    try {
      if (pantallaCompletaActiva()) {
        const d = document as DocumentoConPrefijo;
        await (d.exitFullscreen?.() ?? d.webkitExitFullscreen?.());
      } else {
        await (el.requestFullscreen?.() ?? el.webkitRequestFullscreen?.());
      }
    } catch {
      // El navegador puede negarse (iframe, permisos): no pasa nada, se sigue en ventana.
    }
  }, []);

  /* Al montar: empezar en la diapositiva del enlace (`#3`) y mostrar la presentación. */
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setActual(indiceDelHash());
    setListo(true);
    const alCambiarHash = () => setActual(indiceDelHash());
    window.addEventListener("hashchange", alCambiarHash);
    return () => window.removeEventListener("hashchange", alCambiarHash);
  }, []);

  /* El número de diapositiva queda en la URL para poder compartir o recargar. */
  useEffect(() => {
    if (!listo) return;
    window.history.replaceState(null, "", `#${actual + 1}`);
  }, [actual, listo]);

  /* El lienzo de 1920×1080 se escala para caber siempre entero en la pantalla. */
  useEffect(() => {
    const ajustar = () => {
      const el = raiz.current;
      if (!el) return;
      // El contenido (1920×1080) siempre cabe entero; el lienzo se agranda en el eje que
      // sobre para que los fondos llenen la pantalla sin franjas ni recortes.
      const w = el.clientWidth || ANCHO;
      const h = el.clientHeight || ALTO;
      const escala = Math.min(w / ANCHO, h / ALTO);
      setMedida({ escala, ancho: Math.ceil(w / escala), alto: Math.ceil(h / escala) });
    };
    ajustar();
    const observador = new ResizeObserver(ajustar);
    if (raiz.current) observador.observe(raiz.current);
    return () => observador.disconnect();
  }, []);

  /* Pantalla completa: sincronizar el estado cuando el navegador entra o sale (Esc). */
  useEffect(() => {
    const sincronizar = () => setCompleta(pantallaCompletaActiva());
    document.addEventListener("fullscreenchange", sincronizar);
    document.addEventListener("webkitfullscreenchange", sincronizar);
    return () => {
      document.removeEventListener("fullscreenchange", sincronizar);
      document.removeEventListener("webkitfullscreenchange", sincronizar);
    };
  }, []);

  /* Los controles aparecen al mover el ratón y se esconden solos. */
  const mostrarControles = useCallback(() => {
    setControles(true);
    if (temporizador.current) clearTimeout(temporizador.current);
    temporizador.current = setTimeout(() => setControles(false), ESPERA_CONTROLES_MS);
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    mostrarControles();
    return () => {
      if (temporizador.current) clearTimeout(temporizador.current);
    };
  }, [mostrarControles]);

  /* Teclado: flechas, espacio, Re Pág / Av Pág, inicio/fin, números y F. */
  useEffect(() => {
    const alPulsar = (ev: KeyboardEvent) => {
      if (ev.metaKey || ev.ctrlKey || ev.altKey) return;
      const tecla = ev.key;
      // Con un botón o enlace enfocado, Enter y Espacio son para activarlo, no para avanzar.
      if ((tecla === "Enter" || tecla === " ") && (ev.target as HTMLElement | null)?.closest("button, a")) return;
      let atendida = true;
      if (["ArrowRight", "ArrowDown", "PageDown", " ", "Enter"].includes(tecla)) siguiente();
      else if (["ArrowLeft", "ArrowUp", "PageUp", "Backspace"].includes(tecla)) anterior();
      else if (tecla === "Home") ir(0);
      else if (tecla === "End") ir(TOTAL - 1);
      else if (tecla === "f" || tecla === "F") void alternarPantallaCompleta();
      else if (/^[1-9]$/.test(tecla)) ir(Number(tecla) - 1);
      else atendida = false;
      if (atendida) {
        ev.preventDefault();
        mostrarControles();
      }
    };
    window.addEventListener("keydown", alPulsar);
    return () => window.removeEventListener("keydown", alPulsar);
  }, [siguiente, anterior, ir, alternarPantallaCompleta, mostrarControles]);

  /* Gesto de deslizar en pantallas táctiles. */
  const alTocar = (ev: TouchEvent) => {
    const t = ev.touches[0];
    toqueInicial.current = { x: t.clientX, y: t.clientY };
  };
  const alSoltar = (ev: TouchEvent) => {
    const inicio = toqueInicial.current;
    toqueInicial.current = null;
    if (!inicio) return;
    const t = ev.changedTouches[0];
    const dx = t.clientX - inicio.x;
    const dy = t.clientY - inicio.y;
    if (Math.abs(dx) > 55 && Math.abs(dx) > Math.abs(dy) * 1.4) {
      if (dx < 0) siguiente();
      else anterior();
    }
    mostrarControles();
  };

  const posicion = (i: number) => (i === actual ? "activa" : i < actual ? "antes" : "despues");

  return (
    <div
      ref={raiz}
      className={cn(e.raiz, !controles && e.sinCursor)}
      role="region"
      aria-roledescription="presentación"
      aria-label="Presentación de clases del Club de Monetización"
      tabIndex={-1}
      onMouseMove={mostrarControles}
      onTouchStart={alTocar}
      onTouchEnd={alSoltar}
    >
      <div
        className={e.lienzo}
        style={
          {
            width: medida.ancho,
            height: medida.alto,
            transform: `scale(${medida.escala})`,
            visibility: listo ? "visible" : "hidden",
          } as CSSProperties
        }
      >
        {DIAPOSITIVAS.map((d, i) => (
          <section
            key={d.id}
            className={e.slide}
            data-pos={posicion(i)}
            aria-hidden={i !== actual}
            aria-label={`${i + 1} de ${TOTAL}: ${d.titulo}`}
          >
            <Diapositiva id={d.id} />
          </section>
        ))}
      </div>

      {/* Todo lo de abajo vive en pantalla, no en el lienzo: no se escala con él. */}
      <button
        type="button"
        className={cn(e.borde, e.bordeIzq, !controles && e.oculta)}
        onClick={anterior}
        disabled={actual === 0}
        aria-label="Diapositiva anterior"
      >
        <ChevronLeft size={56} strokeWidth={1.6} />
      </button>
      <button
        type="button"
        className={cn(e.borde, e.bordeDer, !controles && e.oculta)}
        onClick={siguiente}
        disabled={actual === TOTAL - 1}
        aria-label="Diapositiva siguiente"
      >
        <ChevronRight size={56} strokeWidth={1.6} />
      </button>

      {!completa && (
        <div className={cn(e.superior, !controles && e.oculta)}>
          <Link
            href="/soporte"
            className="inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium"
            style={{
              color: "#d6e0ee",
              background: "rgba(8,14,34,0.78)",
              border: "1px solid rgba(140,170,220,0.22)",
              backdropFilter: "blur(12px)",
            }}
          >
            <ArrowLeft size={16} />
            Volver a Soporte
          </Link>
        </div>
      )}

      {listo && actual === 0 && controles && !completa && (
        <div className={e.aviso}>← → para cambiar de diapositiva · F para pantalla completa</div>
      )}

      {!completa && (
      <div className={cn(e.controles, !controles && e.oculta)}>
        <button type="button" className={e.boton} onClick={anterior} disabled={actual === 0} aria-label="Anterior">
          <ChevronLeft size={22} />
        </button>
        <div className="flex items-center gap-2 px-2" role="tablist" aria-label="Diapositivas">
          {DIAPOSITIVAS.map((d, i) => (
            <button
              key={d.id}
              type="button"
              role="tab"
              aria-selected={i === actual}
              aria-label={`Ir a ${d.titulo}`}
              title={`${i + 1}. ${d.titulo}`}
              className={e.punto}
              data-activo={i === actual}
              onClick={() => ir(i)}
            />
          ))}
        </div>
        <span
          className="min-w-[52px] text-center text-sm tabular-nums"
          style={{ color: "#a8b8d0" }}
          aria-live="polite"
        >
          {actual + 1} / {TOTAL}
        </span>
        <button
          type="button"
          className={e.boton}
          onClick={siguiente}
          disabled={actual === TOTAL - 1}
          aria-label="Siguiente"
        >
          <ChevronRight size={22} />
        </button>
        <span className="mx-1 h-6 w-px" style={{ background: "rgba(140,170,220,0.25)" }} />
        <button
          type="button"
          className={e.boton}
          onClick={() => void alternarPantallaCompleta()}
          aria-label={completa ? "Salir de pantalla completa" : "Pantalla completa"}
          title={completa ? "Salir de pantalla completa (F)" : "Pantalla completa (F)"}
        >
          {completa ? <Minimize2 size={20} /> : <Maximize2 size={20} />}
        </button>
      </div>
      )}

      <div className={e.progreso} style={{ width: `${((actual + 1) / TOTAL) * 100}%` }} />
    </div>
  );
}
