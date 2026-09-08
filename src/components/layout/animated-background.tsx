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

    type Particle = { x: number; y: number; vx: number; vy: number; r: number };
    let particles: Particle[] = [];

    function resize() {
      if (!canvas) return;
      width = canvas.offsetWidth;
      height = canvas.offsetHeight;
      canvas.width = width * dpr;
      canvas.height = height * dpr;
      const count = Math.min(90, Math.round((width * height) / 16000));
      particles = Array.from({ length: count }, () => ({
        x: Math.random() * width,
        y: Math.random() * height,
        vx: (Math.random() - 0.5) * 0.25,
        vy: (Math.random() - 0.5) * 0.25,
        r: Math.random() * 1.6 + 0.6,
      }));
    }

    const { r, g, b } = hexToRgb(color);
    const lineAlpha = isLight ? 0.14 : 0.16;
    const dotAlpha = isLight ? 0.55 : 0.75;

    let raf = 0;
    function frame() {
      if (!ctx) return;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, width, height);

      for (const p of particles) {
        p.x += p.vx;
        p.y += p.vy;
        if (p.x < 0 || p.x > width) p.vx *= -1;
        if (p.y < 0 || p.y > height) p.vy *= -1;
      }

      for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
          const a = particles[i];
          const bP = particles[j];
          const dx = a.x - bP.x;
          const dy = a.y - bP.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < 140) {
            ctx.strokeStyle = `rgba(${r}, ${g}, ${b}, ${
              lineAlpha * (1 - dist / 140)
            })`;
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(a.x, a.y);
            ctx.lineTo(bP.x, bP.y);
            ctx.stroke();
          }
        }
      }

      for (const p of particles) {
        ctx.beginPath();
        ctx.fillStyle = `rgba(${r}, ${g}, ${b}, ${dotAlpha})`;
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fill();
      }

      if (!prefersReduced) raf = requestAnimationFrame(frame);
    }

    resize();
    frame();

    const ro = new ResizeObserver(resize);
    ro.observe(canvas);

    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
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
