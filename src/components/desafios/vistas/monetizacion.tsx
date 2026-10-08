import { BadgeCheck, Wallet } from "lucide-react";
import type { PerfilVista } from "@/lib/desafios-data";
import {
  ESCALERA_INGRESOS,
  RED_INFO,
  REDES,
  claveLogro,
  dolares,
  dolaresExactos,
  proximasMetas,
  fechaCorta,
  nombreDeMes,
} from "@/lib/desafios";
import { Barra } from "@/components/desafios/barra";
import { IngresosManager } from "@/components/desafios/ingresos-manager";
import { Insignia } from "@/components/desafios/insignia";
import { PrivacidadSwitch } from "@/components/desafios/privacidad-switch";
import { RedIcon } from "@/components/desafios/red-icon";
import { ReclamarBoton } from "@/components/desafios/reclamar-video";

/** Monetización: activarla y cuánto se gana. Lo usan la pantalla real y la demostración pública. */
export function MonetizacionVista({
  perfil,
  soloLectura = false,
}: {
  perfil: PerfilVista;
  soloLectura?: boolean;
}) {
  const activa = perfil.logros.find((l) => l.clave === claveLogro("MONETIZACION", 1));
  const revisada = activa?.estado === "REVOCADO";
  const monetiza = activa?.estado === "ACTIVO";

  const esteMes = new Date().toISOString().slice(0, 7);
  const delMes = perfil.ingresos.filter((i) => i.mes.startsWith(esteMes)).reduce((s, i) => s + i.monto, 0);
  const porRed = REDES.map((red) => ({
    red,
    total: perfil.ingresos.filter((i) => i.red === red).reduce((s, i) => s + i.monto, 0),
  })).filter((r) => r.total > 0);

  const metaDinero = proximasMetas(perfil.cuentas, perfil.logros, perfil.ingresosUsd).find((m) => m.tipo === "INGRESOS");
  const ganadosDinero = perfil.logros.filter((l) => l.tipo === "INGRESOS" && l.estado === "ACTIVO").length;

  return (
    <div className="animate-fade-in space-y-6">
      <header>
        <p className="antetitulo">Monetización</p>
        <h1 className="text-3xl font-bold">Que tu contenido te pague</h1>
        <p className="mt-1 max-w-xl text-sm text-[var(--ink-2)]">
          Activar la monetización es el primer gran hito. Después, anota cuánto vas ganando y sube
          por la escalera, del primer dólar al millón.
        </p>
      </header>

      {/* Paso 1: activarla */}
      <section className="glass-panel relative overflow-hidden rounded-2xl p-5">
        <div className="pointer-events-none absolute -top-16 -right-16 h-56 w-56 rounded-full bg-[var(--oro)]/10 blur-3xl" />
        <div className="relative flex flex-col gap-4 sm:flex-row sm:items-center">
          <Insignia tipo="MONETIZACION" umbral={1} estado={monetiza ? "ganada" : revisada ? "revocada" : "bloqueada"} tamano={84} />
          <div className="flex-1">
            {monetiza ? (
              <>
                <p className="flex items-center gap-1.5 text-lg font-semibold text-[var(--oro-claro)]">
                  <BadgeCheck className="h-5 w-5" /> ¡Monetización activada!
                </p>
                <p className="text-sm text-[var(--ink-2)]">Lo lograste el {fechaCorta(activa!.creadoEn)}. Ahora, a hacerla crecer.</p>
              </>
            ) : revisada ? (
              <>
                <p className="text-lg font-semibold">El equipo revisó esta insignia</p>
                <p className="text-sm text-[var(--ink-2)]">Si crees que fue un error, escríbele al equipo del Club.</p>
              </>
            ) : (
              <>
                <p className="text-lg font-semibold">Tu primera meta: activar la monetización</p>
                <p className="text-sm text-[var(--ink-2)]">
                  En cualquier plataforma que la ofrezca. Cuando la tengas, reclámala; si solo anotas
                  un ingreso de $1 o más, se activa sola.
                </p>
              </>
            )}
          </div>
          {!monetiza && !revisada && !soloLectura && (
            <div className="sm:w-56">
              <ReclamarBoton tipo="MONETIZACION" umbral={1} destacado />
            </div>
          )}
        </div>
      </section>

      {/* Paso 2: cuánto */}
      <section className="grid gap-4 md:grid-cols-3">
        <div className="glass-panel rounded-2xl p-4">
          <p className="flex items-center gap-1.5 text-[11px] tracking-wider text-[var(--ink-3)] uppercase"><Wallet className="h-3.5 w-3.5" /> Ganado en total</p>
          <p className="mt-1 font-[family-name:var(--font-titulos)] text-3xl font-bold tabular-nums">{dolaresExactos(perfil.ingresosUsd)}</p>
          <p className="text-xs text-[var(--ink-3)]">{ganadosDinero} {ganadosDinero === 1 ? "insignia" : "insignias"} de dinero</p>
        </div>
        <div className="glass-panel rounded-2xl p-4">
          <p className="text-[11px] tracking-wider text-[var(--ink-3)] uppercase">Este mes</p>
          <p className="mt-1 font-[family-name:var(--font-titulos)] text-3xl font-bold tabular-nums">{dolaresExactos(delMes)}</p>
          <div className="mt-1 flex flex-wrap gap-x-3 text-xs text-[var(--ink-3)]">
            {porRed.length === 0 ? "Aún sin ingresos" : porRed.map((r) => (
              <span key={r.red} className="inline-flex items-center gap-1"><RedIcon red={r.red} className="h-3 w-3" />{RED_INFO[r.red].nombre} {dolares(r.total)}</span>
            ))}
          </div>
        </div>
        <div className="glass-panel rounded-2xl p-4">
          <p className="text-[11px] tracking-wider text-[var(--ink-3)] uppercase">Siguiente insignia de dinero</p>
          {metaDinero && metaDinero.actual !== null && metaDinero.avance !== null ? (
            <>
              <p className="mt-1 font-semibold">{metaDinero.titulo}</p>
              <Barra valor={metaDinero.avance} className="mt-2" />
              <p className="mt-1 text-xs text-[var(--ink-3)]">{dolares(metaDinero.actual)} de {dolares(metaDinero.umbral)}</p>
            </>
          ) : (
            <p className="mt-1 text-sm text-[var(--ink-2)]">
              {perfil.ingresosUsd >= ESCALERA_INGRESOS[ESCALERA_INGRESOS.length - 1] ? "¡Las tienes todas!" : "Anota tu primer ingreso para empezar la escalera."}
            </p>
          )}
        </div>
      </section>

      {soloLectura ? (
        <p className="flex items-center gap-2 rounded-xl border border-[var(--linea)] bg-white/[0.03] p-3 text-sm text-[var(--ink-2)]">
          {perfil.mostrarIngresos ? "Esta persona decidió mostrar cuánto gana a los demás." : "Esta persona decidió mantener sus ingresos ocultos para los demás."}
          {" "}Cada quien lo decide con un interruptor.
        </p>
      ) : (
      <PrivacidadSwitch
        campo="mostrarIngresos"
        valor={perfil.mostrarIngresos}
        titulo="Mostrar cuánto gano"
        descripcion="Tus ingresos y tus insignias de dinero. Tus demás insignias se ven siempre."
      />
      )}

      {soloLectura ? (
        <section>
          <h2 className="mb-3 text-lg font-semibold">Historial</h2>
          <p className="mb-3 text-xs text-[var(--ink-3)]">
            Aquí anotas lo que ganas cada mes en cada plataforma (en la versión real hay un formulario).
          </p>
          <ul className="space-y-2">
            {perfil.ingresos.map((i) => (
              <li key={i.id} className="fila-tabla flex items-center gap-3 p-3">
                <RedIcon red={i.red} className="h-6 w-6 shrink-0" />
                <p className="flex-1 text-sm font-medium capitalize">{nombreDeMes(i.mes)} · <span className="normal-case">{RED_INFO[i.red].nombre}</span></p>
                <p className="font-[family-name:var(--font-titulos)] text-lg font-bold tabular-nums">{dolaresExactos(i.monto)}</p>
              </li>
            ))}
            {perfil.ingresos.length === 0 && <li className="glass-panel rounded-2xl p-6 text-center text-sm text-[var(--ink-3)]">Aún no ha anotado ingresos.</li>}
          </ul>
        </section>
      ) : (
        <IngresosManager ingresos={perfil.ingresos} />
      )}
    </div>
  );
}
