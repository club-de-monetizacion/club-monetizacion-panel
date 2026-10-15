import { ExternalLink, Maximize2, Timer } from "lucide-react";

const AVISOS = ["Toma notas", "Toma agua", "Clases grabadas", "Activa tu cuenta", "Descansa la vista"];

/** El timer de 5 minutos para la pausa de la clase. Es una página estática
 * (public/presentacion/timer.html), por eso va con <a> y no con <Enlace>. */
export function TimerPanel() {
  return (
    <div className="glass-panel grid gap-6 rounded-2xl p-5 md:grid-cols-[minmax(0,1.15fr)_minmax(0,1fr)] md:p-6">
      <a
        href="/presentacion/timer.html"
        target="_blank"
        rel="noopener"
        aria-label="Abrir el timer de 5 minutos en una página nueva"
        className="group focus-ring relative block aspect-video overflow-hidden rounded-xl border border-[var(--panel-border)]"
        style={{
          background:
            "radial-gradient(60% 70% at 85% 30%, rgba(36,104,255,0.45), transparent), radial-gradient(50% 60% at 10% 100%, rgba(201,160,64,0.3), transparent), #05091a",
        }}
      >
        <div className="absolute inset-y-0 left-0 flex max-w-[62%] flex-col justify-center gap-1 p-5 sm:p-7">
          <span className="text-[10px] font-semibold uppercase tracking-[0.28em] text-[var(--oro-claro)] sm:text-xs">
            Interludio · 5 minutos
          </span>
          <span
            className="text-3xl font-bold leading-[0.98] text-white sm:text-5xl"
            style={{ fontFamily: "var(--font-titulos), var(--font-sans), sans-serif" }}
          >
            Una pequeña
            <br />
            <span className="text-[var(--oro-claro)]">pausa</span>
          </span>
        </div>
        <span
          className="absolute right-[7%] top-1/2 flex aspect-square w-[27%] -translate-y-1/2 items-center justify-center rounded-full border-[4px] border-[var(--oro-claro)] text-xl font-bold text-white shadow-[0_0_30px_rgba(255,217,125,0.35)] transition duration-500 group-hover:scale-[1.06] sm:text-3xl"
          style={{ fontFamily: "var(--font-titulos), var(--font-sans), sans-serif", background: "rgba(5,9,26,0.6)" }}
        >
          5:00
        </span>
        <span className="absolute bottom-4 right-4 hidden h-12 w-12 sm:flex items-center justify-center rounded-full bg-[var(--accent)] text-[#1a1200] shadow-lg transition group-hover:scale-110">
          <Timer className="h-5 w-5" />
        </span>
      </a>

      <div className="flex flex-col justify-center">
        <h3 className="text-lg font-semibold text-[var(--ink-0)]">Timer de 5 minutos</h3>
        <p className="mt-2 text-sm leading-relaxed text-[var(--ink-2)]">
          Para la pausa entre las partes de la clase: le das play, corre la cuenta de 5 minutos y van
          pasando solos los avisos, cada uno con su animación. Al terminar suena una campanita.
        </p>

        <div className="mt-4 flex flex-wrap gap-1.5">
          {AVISOS.map((aviso, i) => (
            <span
              key={aviso}
              className="rounded-full bg-[var(--panel-strong)] px-2.5 py-1 text-xs text-[var(--ink-1)]"
            >
              <span className="mr-1.5 text-[var(--oro-claro)]">{i + 1}</span>
              {aviso}
            </span>
          ))}
        </div>

        <div className="mt-5 flex flex-wrap items-center gap-3">
          <a
            href="/presentacion/timer.html"
            target="_blank"
            rel="noopener"
            className="focus-ring inline-flex items-center gap-2 rounded-lg bg-[var(--accent)] px-4 py-2.5 text-sm font-semibold text-[#1a1200] transition hover:brightness-110"
          >
            <ExternalLink className="h-4 w-4" />
            Abrir timer
          </a>
          <span className="inline-flex items-center gap-1.5 text-xs text-[var(--ink-3)]">
            <Maximize2 className="h-3.5 w-3.5" />
            <kbd className="rounded bg-[var(--panel-strong)] px-1.5 py-0.5 font-sans">Espacio</kbd> play / pausa ·{" "}
            <kbd className="rounded bg-[var(--panel-strong)] px-1.5 py-0.5 font-sans">F</kbd> pantalla completa
          </span>
        </div>
      </div>
    </div>
  );
}
