/**
 * Lo que se ve en el instante en que se pulsa algo, mientras el servidor contesta.
 * Sin esto la app parecía colgada: el clic no daba ninguna señal hasta que llegaban
 * los datos. Next lo pinta al momento, sin esperar a nadie.
 */
export default function Cargando() {
  return (
    <div className="animate-fade-in space-y-4" aria-busy="true" aria-live="polite">
      <div className="flex items-center gap-3">
        <span className="h-4 w-4 animate-spin rounded-full border-2 border-[var(--accent)] border-t-transparent" />
        <span className="text-sm text-[var(--ink-2)]">Cargando…</span>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        {[0, 1, 2, 3].map((i) => (
          <div
            key={i}
            className="glass-panel h-24 animate-pulse rounded-2xl"
            style={{ animationDelay: `${i * 90}ms` }}
          />
        ))}
      </div>

      <div className="glass-panel space-y-3 rounded-2xl p-4">
        {[0, 1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className="h-5 animate-pulse rounded-lg bg-[var(--panel-strong)]"
            style={{ width: `${88 - i * 9}%`, animationDelay: `${i * 70}ms` }}
          />
        ))}
      </div>
    </div>
  );
}
