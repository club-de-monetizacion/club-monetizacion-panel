/** Cuando ya no hay perfiles de demostración (se borraron antes de publicar). */
export function SinDemo() {
  return (
    <div className="glass-panel mx-auto max-w-md rounded-2xl p-8 text-center">
      <p className="text-3xl">🧪</p>
      <p className="mt-2 font-semibold">No hay una demostración disponible</p>
      <p className="mt-1 text-sm text-[var(--ink-3)]">Los perfiles de ejemplo ya no están.</p>
    </div>
  );
}
