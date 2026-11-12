"use client";

import { useEffect, useState } from "react";
import { Apple, Download, MonitorDown, MousePointerClick, Keyboard, BellRing, Laptop } from "lucide-react";
import { MARCA_ESCRITORIO } from "@/lib/escritorio";

type Info = {
  version: string;
  fecha: string;
  descargas: Record<"macArm" | "macIntel" | "windows", { url: string; peso: string }>;
};
type Equipo = "macArm" | "macIntel" | "mac" | "windows" | "otro";

/** Qué computadora es. En Chrome se sabe si la Mac es de chip Apple o Intel; en Safari no. */
async function detecta(): Promise<Equipo> {
  const ua = navigator.userAgent;
  if (/Windows/i.test(ua)) return "windows";
  if (!/Macintosh|Mac OS X/i.test(ua)) return "otro";
  try {
    const uad = (navigator as Navigator & {
      userAgentData?: { getHighEntropyValues: (h: string[]) => Promise<{ architecture?: string }> };
    }).userAgentData;
    if (uad) {
      const { architecture } = await uad.getHighEntropyValues(["architecture"]);
      if (architecture === "arm") return "macArm";
      if (architecture === "x86") return "macIntel";
    }
  } catch {}
  try {
    const gl = document.createElement("canvas").getContext("webgl");
    const ext = gl?.getExtension("WEBGL_debug_renderer_info");
    const r = ext && gl ? String(gl.getParameter(ext.UNMASKED_RENDERER_WEBGL)) : "";
    if (/Apple M\d|Apple GPU/i.test(r)) return "macArm";
    if (/Intel|AMD|Radeon/i.test(r)) return "macIntel";
  } catch {}
  return "mac";
}

const NOMBRE = {
  macArm: "Mac con chip Apple (M1, M2, M3, M4)",
  macIntel: "Mac con Intel",
  windows: "Windows (PC)",
} as const;

export function Descargas({ info }: { info: Info }) {
  const [equipo, setEquipo] = useState<Equipo | null>(null);
  const [enLaApp, setEnLaApp] = useState<string | null>(null);

  useEffect(() => {
    const m = navigator.userAgent.match(/TareasClubEscritorio\/([\d.]+)/);
    // Solo el navegador sabe si está dentro de la app y qué equipo es.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (m && navigator.userAgent.includes(MARCA_ESCRITORIO)) setEnLaApp(m[1]);
    detecta().then(setEquipo);
  }, []);

  const principal: Array<keyof typeof NOMBRE> =
    equipo === "macArm" ? ["macArm"] : equipo === "macIntel" ? ["macIntel"] : equipo === "mac" ? ["macArm", "macIntel"]
      : equipo === "windows" ? ["windows"] : [];
  const otros = (Object.keys(NOMBRE) as Array<keyof typeof NOMBRE>).filter((k) => !principal.includes(k));

  return (
    <div className="grid gap-4 lg:grid-cols-[1.25fr_1fr]">
      <section className="glass-panel rounded-2xl p-5">
        <div className="mb-4 flex items-center gap-3">
          <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-[var(--oro)]/[0.12] text-[var(--oro-claro)]">
            <MonitorDown className="h-5 w-5" />
          </span>
          <div>
            <p className="font-[family-name:var(--font-titulos)] text-base font-semibold text-[var(--ink-0)]">
              Tareas del Club para escritorio
            </p>
            <p className="text-xs text-[var(--ink-3)]">
              Versión {info.version} · {info.fecha}
            </p>
          </div>
        </div>

        {enLaApp ? (
          <p className="rounded-xl border border-[var(--linea)] bg-white/[0.03] p-4 text-sm text-[var(--ink-1)]">
            Ya estás en la app de escritorio (versión {enLaApp}).
            {enLaApp !== info.version && " Hay una versión nueva: descárgala abajo e instálala encima."}
          </p>
        ) : null}

        {equipo === null ? (
          <div className="h-12 animate-pulse rounded-xl bg-white/[0.04]" />
        ) : (
          <div className="flex flex-col gap-2.5">
            {principal.map((k) => (
              <a key={k} href={info.descargas[k].url} className="btn-oro flex items-center justify-center gap-2.5 rounded-xl px-5 py-3 text-sm">
                {k === "windows" ? <Laptop className="h-4 w-4" /> : <Apple className="h-4 w-4" />}
                Descargar para {NOMBRE[k]}
                <span className="opacity-70">· {info.descargas[k].peso}</span>
              </a>
            ))}
            {equipo === "mac" && (
              <p className="text-xs text-[var(--ink-3)]">
                ¿Cuál es tu Mac? Menú de la manzana → «Acerca de esta Mac»: si dice «Chip Apple», la primera; si dice «Intel», la segunda.
              </p>
            )}
            {otros.length > 0 && (
              <div className="mt-2 flex flex-col gap-2">
                <p className="text-[11px] font-semibold tracking-[0.18em] text-[var(--ink-3)] uppercase">
                  {principal.length ? "Otras computadoras" : "Elige tu computadora"}
                </p>
                {otros.map((k) => (
                  <a key={k} href={info.descargas[k].url} className="btn-fantasma flex items-center gap-2.5 rounded-xl px-4 py-2.5 text-sm">
                    <Download className="h-4 w-4" />
                    {NOMBRE[k]}
                    <span className="ml-auto text-xs text-[var(--ink-3)]">{info.descargas[k].peso}</span>
                  </a>
                ))}
              </div>
            )}
          </div>
        )}

        <ul className="mt-5 space-y-3 border-t border-[var(--linea)] pt-4 text-sm text-[var(--ink-2)]">
          <li className="flex gap-3">
            <Laptop className="mt-0.5 h-4 w-4 shrink-0 text-[var(--oro)]" />
            <span>Es la misma Tareas: entras con tu cuenta del Club (correo o Google) y ves lo mismo que aquí.</span>
          </li>
          <li className="flex gap-3">
            <MousePointerClick className="mt-0.5 h-4 w-4 shrink-0 text-[var(--oro)]" />
            <span>Un botón flotante encima de todo, con cuántos pendientes tienes: tócalo y apunta lo que se te ocurra.</span>
          </li>
          <li className="flex gap-3">
            <Keyboard className="mt-0.5 h-4 w-4 shrink-0 text-[var(--oro)]" />
            <span>
              Captura rápida desde cualquier programa: <b className="text-[var(--ink-1)]">⌘⇧Espacio</b> en Mac,{" "}
              <b className="text-[var(--ink-1)]">Ctrl+Shift+Espacio</b> en Windows.
            </span>
          </li>
          <li className="flex gap-3">
            <BellRing className="mt-0.5 h-4 w-4 shrink-0 text-[var(--oro)]" />
            <span>A la 1 pm te avisa de los pendientes que ya cumplieron su plazo.</span>
          </li>
        </ul>
      </section>

      <section className="glass-panel rounded-2xl p-5 text-sm text-[var(--ink-2)]">
        <p className="mb-3 font-[family-name:var(--font-titulos)] text-base font-semibold text-[var(--ink-0)]">
          Cómo instalarla
        </p>
        <div>
          <p className="mb-1.5 text-[11px] font-semibold tracking-[0.18em] text-[var(--oro)] uppercase">En Mac</p>
          <ol className="mb-5 list-decimal space-y-1.5 pl-5">
            <li>Abre el archivo que bajó y arrastra «Tareas del Club» a la carpeta Aplicaciones.</li>
            <li>Ábrela desde Aplicaciones. La primera vez la Mac avisa que no pudo verificarla: toca «Listo».</li>
            <li>
              Ve a Configuración del Sistema → Privacidad y seguridad, baja hasta «Tareas del Club» y toca «Abrir de todas
              formas». Solo se hace una vez.
            </li>
          </ol>
        </div>
        <p className="mb-1.5 text-[11px] font-semibold tracking-[0.18em] text-[var(--oro)] uppercase">En Windows</p>
        <ol className="mb-5 list-decimal space-y-1.5 pl-5">
          <li>Abre el instalador que bajó.</li>
          <li>Si sale «Windows protegió tu PC», toca «Más información» y luego «Ejecutar de todas formas».</li>
          <li>Se instala sola y queda en el menú Inicio y en el escritorio.</li>
        </ol>
        <p className="rounded-xl border border-[var(--linea)] bg-white/[0.03] p-3 text-xs text-[var(--ink-3)]">
          Ese aviso sale porque la app es nuestra y no de una tienda: es la misma Tareas del equipo. Al cerrar la ventana la
          app sigue junto al reloj (o en la barra de arriba en Mac) con el botón flotante; para salir, usa «Salir» en ese menú.
        </p>
      </section>
    </div>
  );
}
