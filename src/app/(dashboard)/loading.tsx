/* Lo que se ve mientras el servidor trae los datos.
 *
 * Sin esto, Next esperaba a que terminaran TODAS las consultas antes de
 * mandar una sola línea: al entrar desde el Club la pestaña se quedaba en
 * blanco y parecía que la herramienta no cargaba. Ahora la estructura
 * aparece de inmediato y los datos entran encima. */
export default function Cargando() {
  return (
    <div className="animate-pulse space-y-6" aria-busy="true" aria-label="Cargando">
      <div className="space-y-2">
        <div className="h-6 w-64 rounded-lg bg-[var(--linea)]" />
        <div className="h-4 w-80 rounded-md bg-[var(--linea)] opacity-60" />
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {[0, 1, 2, 3].map((i) => (
          <div
            key={i}
            className="h-24 rounded-2xl border border-[var(--linea)] bg-[var(--panel)]"
          />
        ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        {[0, 1].map((col) => (
          <div
            key={col}
            className="space-y-3 rounded-2xl border border-[var(--linea)] bg-[var(--panel)] p-4"
          >
            <div className="h-4 w-40 rounded-md bg-[var(--linea)]" />
            {[0, 1, 2, 3].map((fila) => (
              <div key={fila} className="h-11 rounded-xl bg-[var(--linea)] opacity-50" />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
