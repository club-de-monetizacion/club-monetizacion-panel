import Link from "next/link";
import { ExternalLink, Maximize2, MonitorPlay } from "lucide-react";
import { DIAPOSITIVAS } from "@/components/presentacion/titulos";

/** La pestaña "Presentación de clases" de Soporte: una vista previa y el botón que
 * abre la presentación en una página nueva (sin barra lateral, lista para proyectar). */
export function PresentacionPanel() {
  return (
    <div className="glass-panel grid gap-6 rounded-2xl p-5 md:grid-cols-[minmax(0,1.15fr)_minmax(0,1fr)] md:p-6">
      <Link
        href="/presentacion"
        target="_blank"
        rel="noopener"
        aria-label="Abrir la presentación de clases en una página nueva"
        className="group focus-ring relative block aspect-video overflow-hidden rounded-xl border border-[var(--panel-border)]"
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/presentacion/portada.jpg"
          alt=""
          className="absolute inset-0 h-full w-full object-cover transition duration-500 group-hover:scale-[1.04]"
          style={{ objectPosition: "50% 42%", filter: "brightness(0.6)" }}
        />
        <div
          className="absolute inset-0"
          style={{
            background:
              "linear-gradient(90deg, rgba(5,9,26,0.92), rgba(5,9,26,0.35) 70%), radial-gradient(60% 70% at 90% 90%, rgba(36,104,255,0.4), transparent)",
          }}
        />
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/branding/app-logo.png"
          alt=""
          className="absolute right-4 top-4 h-11 w-11 rounded-full ring-2 ring-[var(--oro-claro)]"
        />
        <div className="absolute inset-y-0 left-0 flex flex-col justify-center gap-1 p-5 sm:p-7">
          <span className="text-[10px] font-semibold uppercase tracking-[0.28em] text-[var(--oro-claro)] sm:text-xs">
            Presentación de clases
          </span>
          <span
            className="text-3xl font-bold leading-[0.98] text-white sm:text-5xl"
            style={{ fontFamily: "var(--font-titulos), var(--font-sans), sans-serif" }}
          >
            Club de
            <br />
            Monetización
          </span>
        </div>
        <span className="absolute bottom-4 right-4 flex h-12 w-12 items-center justify-center rounded-full bg-[var(--accent)] text-[#1a1200] shadow-lg transition group-hover:scale-110">
          <MonitorPlay className="h-5 w-5" />
        </span>
      </Link>

      <div className="flex flex-col justify-center">
        <h3 className="text-lg font-semibold text-[var(--ink-0)]">Presentación de clases</h3>
        <p className="mt-2 text-sm leading-relaxed text-[var(--ink-2)]">
          La presentación de bienvenida del Club: las normas, los horarios de atención y las
          novedades de las clases. Se abre en una página nueva, lista para ponerla en pantalla
          completa y proyectarla.
        </p>

        <div className="mt-4 flex flex-wrap gap-1.5">
          {DIAPOSITIVAS.map((d, i) => (
            <span
              key={d.id}
              className="rounded-full bg-[var(--panel-strong)] px-2.5 py-1 text-xs text-[var(--ink-1)]"
            >
              <span className="mr-1.5 text-[var(--oro-claro)]">{i + 1}</span>
              {d.titulo}
            </span>
          ))}
        </div>

        <div className="mt-5 flex flex-wrap items-center gap-3">
          <Link
            href="/presentacion"
            target="_blank"
            rel="noopener"
            className="focus-ring inline-flex items-center gap-2 rounded-lg bg-[var(--accent)] px-4 py-2.5 text-sm font-semibold text-[#1a1200] transition hover:brightness-110"
          >
            <ExternalLink className="h-4 w-4" />
            Abrir presentación
          </Link>
          <span className="inline-flex items-center gap-1.5 text-xs text-[var(--ink-3)]">
            <Maximize2 className="h-3.5 w-3.5" />
            Pulsa <kbd className="rounded bg-[var(--panel-strong)] px-1.5 py-0.5 font-sans">F</kbd> para pantalla
            completa · <kbd className="rounded bg-[var(--panel-strong)] px-1.5 py-0.5 font-sans">←</kbd>{" "}
            <kbd className="rounded bg-[var(--panel-strong)] px-1.5 py-0.5 font-sans">→</kbd> para avanzar
          </span>
        </div>
      </div>
    </div>
  );
}
