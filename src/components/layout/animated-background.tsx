"use client";

import { useEffect, useRef } from "react";
import type { BackgroundType } from "@prisma/client";

function hexToRgb(hex: string) {
  const clean = hex.replace("#", "");
  const full =
    clean.length === 3
      ? clean
          .split("")
          .map((c) => c + c)
          .join("")
      : clean;
  const num = parseInt(full, 16);
  if (Number.isNaN(num)) return { r: 139, g: 92, b: 246 };
  return { r: (num >> 16) & 255, g: (num >> 8) & 255, b: num & 255 };
}

function relativeLuminance(hex: string) {
  const { r, g, b } = hexToRgb(hex);
  return (0.299 * r + 0.587 * g + 0.114 * b) / 255;
}

function ParticleCanvas({
  color,
  bg,
  isLight,
  animated,
}: {
  color: string;
  bg: string;
  isLight: boolean;
  animated: boolean;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const prefersReduced =
      !animated ||
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    let width = 0;
    let height = 0;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const { r, g, b } = hexToRgb(color);

    /* Cada estrella tiene su propia profundidad (`z`): las del fondo son pequeñas,
       tenues y lentas; las de delante, grandes y vivas. Eso da relieve a lo que
       antes era una malla plana. El parpadeo va por fase propia, así que no
       titilan todas a la vez. */
    type Estrella = {
      x: number; y: number; vx: number; vy: number;
      r: number; z: number; fase: number; vel: number;
    };
    let estrellas: Estrella[] = [];

    /* El halo se dibuja una sola vez en un lienzo aparte y luego se estampa. Pintar
       un degradado por estrella y por fotograma tira los fotogramas al suelo. */
    const HALO = 24;
    const halo = document.createElement("canvas");
    halo.width = halo.height = HALO * 2;
    const hctx = halo.getContext("2d");
    if (hctx) {
      const grad = hctx.createRadialGradient(HALO, HALO, 0, HALO, HALO, HALO);
      grad.addColorStop(0, `rgba(${r}, ${g}, ${b}, 0.95)`);
      grad.addColorStop(0.18, `rgba(${r}, ${g}, ${b}, 0.42)`);
      grad.addColorStop(0.55, `rgba(${r}, ${g}, ${b}, 0.10)`);
      grad.addColorStop(1, `rgba(${r}, ${g}, ${b}, 0)`);
      hctx.fillStyle = grad;
      hctx.fillRect(0, 0, HALO * 2, HALO * 2);
    }

    function resize() {
      if (!canvas) return;
      width = canvas.offsetWidth;
      height = canvas.offsetHeight;
      canvas.width = width * dpr;
      canvas.height = height * dpr;
      const count = Math.min(72, Math.round((width * height) / 22000));
      estrellas = Array.from({ length: count }, () => {
        const z = Math.random();                       // 0 = al fondo, 1 = delante
        return {
          x: Math.random() * width,
          y: Math.random() * height,
          vx: (Math.random() - 0.5) * (0.08 + z * 0.3),
          vy: (Math.random() - 0.5) * (0.08 + z * 0.3),
          r: 0.5 + z * 1.7,
          z,
          fase: Math.random() * Math.PI * 2,
          vel: 0.008 + Math.random() * 0.016,
        };
      });
    }

    const lineAlpha = isLight ? 0.13 : 0.15;
    const dotAlpha = isLight ? 0.5 : 0.72;

    /* El ratón atrae la mirada: las estrellas de alrededor brillan más y se enlazan
       entre ellas aunque estén algo lejos. Con el puntero fuera, el fondo sigue
       igual que siempre. */
    const RADIO_RATON = 190;
    let raton = { x: -9999, y: -9999, dentro: false };
    const mueve = (e: PointerEvent) => {
      const caja = canvas?.getBoundingClientRect();
      if (!caja) return;
      raton = { x: e.clientX - caja.left, y: e.clientY - caja.top, dentro: true };
    };
    const sale = () => { raton = { x: -9999, y: -9999, dentro: false }; };
    window.addEventListener("pointermove", mueve, { passive: true });
    window.addEventListener("pointerleave", sale);

    /* Se calcula una vez por estrella y por fotograma, no dentro del bucle de
       uniones: ahí eran miles de raíces cuadradas por fotograma y se notaba. */
    let cercania: number[] = [];
    function midaCercania() {
      const n = estrellas.length;
      if (cercania.length !== n) cercania = new Array(n).fill(0);
      if (!raton.dentro) { cercania.fill(0); return; }
      const rr = RADIO_RATON * RADIO_RATON;
      for (let i = 0; i < n; i++) {
        const p = estrellas[i];
        const dx = p.x - raton.x;
        const dy = p.y - raton.y;
        const d2 = dx * dx + dy * dy;
        cercania[i] = d2 > rr ? 0 : 1 - Math.sqrt(d2) / RADIO_RATON;
      }
    }

    let raf = 0;
    let t0 = 0;
    let ultimo = 0;
    const MS_POR_CUADRO = 1000 / 40;
    function frame(ahora: number) {
      if (!ctx) return;
      if (!prefersReduced) raf = requestAnimationFrame(frame);
      if (ahora - ultimo < MS_POR_CUADRO) return;                // tope de 40 fps
      ultimo = ahora;
      const paso = t0 ? Math.min((ahora - t0) / 16.67, 4) : 1;   // estable a 60 y a 120 Hz
      t0 = ahora;

      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, width, height);

      for (const p of estrellas) {
        p.x += p.vx * paso;
        p.y += p.vy * paso;
        p.fase += p.vel * paso;
        if (p.x < 0 || p.x > width) p.vx *= -1;
        if (p.y < 0 || p.y > height) p.vy *= -1;
      }
      midaCercania();

      // Las uniones, primero: las estrellas quedan encima y se ven nítidas.
      for (let i = 0; i < estrellas.length; i++) {
        const a = estrellas[i];
        const ca = cercania[i];
        for (let j = i + 1; j < estrellas.length; j++) {
          const bP = estrellas[j];
          const cercaMax = ca > cercania[j] ? ca : cercania[j];
          const alcance = 120 + cercaMax * 70;
          const dx = a.x - bP.x;
          const dy = a.y - bP.y;
          const d2 = dx * dx + dy * dy;
          if (d2 >= alcance * alcance) continue;      // sin raíz si no hace falta
          const dist = Math.sqrt(d2);
          const fuerza = 1 - dist / alcance;
          const viveza = 1 + cercaMax * 2.1;
          ctx.strokeStyle = `rgba(${r}, ${g}, ${b}, ${lineAlpha * fuerza * viveza})`;
          ctx.lineWidth = 0.6 + fuerza * 0.7;
          ctx.beginPath();
          ctx.moveTo(a.x, a.y);
          ctx.lineTo(bP.x, bP.y);
          ctx.stroke();
        }
      }

      for (let i = 0; i < estrellas.length; i++) {
        const p = estrellas[i];
        const titila = 0.72 + Math.sin(p.fase) * 0.28;
        const c = cercania[i];
        const alfa = Math.min(1, dotAlpha * (0.45 + p.z * 0.55) * titila * (1 + c * 1.5));
        const tam = p.r * (1 + c * 0.55);

        if (hctx && (p.z > 0.45 || c > 0.05)) {
          // El halo, que es lo que le da el brillo de estrella y no de punto plano.
          // Solo en las de delante (o cerca del ratón): en las del fondo no se nota.
          const brillo = tam * (5.5 + c * 3);
          ctx.globalAlpha = alfa * 0.5;
          ctx.drawImage(halo, p.x - brillo, p.y - brillo, brillo * 2, brillo * 2);
          ctx.globalAlpha = 1;
        }

        ctx.beginPath();
        ctx.fillStyle = `rgba(${r}, ${g}, ${b}, ${alfa})`;
        ctx.arc(p.x, p.y, tam, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    resize();
    frame(0);

    const ro = new ResizeObserver(resize);
    ro.observe(canvas);

    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      window.removeEventListener("pointermove", mueve);
      window.removeEventListener("pointerleave", sale);
    };
  }, [color, isLight, animated]);

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 h-full w-full"
      style={{ background: bg }}
    />
  );
}

function AuroraBackground({
  color,
  bg,
  animated,
}: {
  color: string;
  bg: string;
  animated: boolean;
}) {
  const { r, g, b } = hexToRgb(color);
  const playState = animated ? "running" : "paused";
  return (
    <div className="absolute inset-0 overflow-hidden" style={{ background: bg }}>
      <div
        className="absolute left-1/4 top-1/4 h-[60vmax] w-[60vmax] rounded-full opacity-40 blur-[110px]"
        style={{
          background: `radial-gradient(circle, rgba(${r},${g},${b},0.9), transparent 70%)`,
          animation: "aurora-drift-1 22s ease-in-out infinite",
          animationPlayState: playState,
        }}
      />
      <div
        className="absolute right-1/4 top-1/3 h-[50vmax] w-[50vmax] rounded-full opacity-30 blur-[110px]"
        style={{
          background: `radial-gradient(circle, rgba(${Math.min(
            r + 60,
            255
          )},${Math.min(g + 20, 255)},${Math.max(b - 40, 0)},0.85), transparent 70%)`,
          animation: "aurora-drift-2 26s ease-in-out infinite",
          animationPlayState: playState,
        }}
      />
      <div
        className="absolute bottom-0 left-1/3 h-[55vmax] w-[55vmax] rounded-full opacity-25 blur-[120px]"
        style={{
          background: `radial-gradient(circle, rgba(${Math.max(
            r - 40,
            0
          )},${Math.min(g + 40, 255)},${Math.min(b + 60, 255)},0.85), transparent 70%)`,
          animation: "aurora-drift-3 30s ease-in-out infinite",
          animationPlayState: playState,
        }}
      />
    </div>
  );
}

function GradientBackground({
  color,
  bg,
  animated,
}: {
  color: string;
  bg: string;
  animated: boolean;
}) {
  return (
    <div
      className="absolute inset-0 bg-[length:200%_200%]"
      style={{
        backgroundImage: `linear-gradient(120deg, ${bg}, ${color}33, ${bg})`,
        animation: "gradient-shift 18s ease infinite",
        animationPlayState: animated ? "running" : "paused",
      }}
    />
  );
}

export function AnimatedBackground({
  type,
  color,
  accent,
  animated = true,
}: {
  type: BackgroundType;
  color: string;
  accent: string;
  animated?: boolean;
}) {
  const isLight = relativeLuminance(color) > 0.6;

  return (
    <div
      className="fixed inset-0 -z-10 transition-colors duration-500"
      aria-hidden
    >
      {type === "PARTICLES" && (
        <ParticleCanvas color={accent} bg={color} isLight={isLight} animated={animated} />
      )}
      {type === "AURORA" && (
        <AuroraBackground color={accent} bg={color} animated={animated} />
      )}
      {type === "GRADIENT" && (
        <GradientBackground color={accent} bg={color} animated={animated} />
      )}
      {type === "SOLID" && (
        <div className="absolute inset-0" style={{ background: color }} />
      )}
      <div
        className="absolute inset-0"
        style={{
          background: isLight
            ? "radial-gradient(circle at 50% 0%, rgba(255,255,255,0), rgba(255,255,255,0.4) 100%)"
            : "radial-gradient(circle at 50% 0%, rgba(0,0,0,0), rgba(0,0,0,0.35) 100%)",
        }}
      />
    </div>
  );
}
