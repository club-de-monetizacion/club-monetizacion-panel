import Link from "next/link";
import { ArrowRight, Check, Flame, Target } from "lucide-react";
import type { PerfilVista } from "@/lib/desafios-data";
import {
  RED_INFO,
  cifraDe,
  claveLogro,
  empujon,
  entero,
  fraseDelDia,
  misionesDeInicio,
  nombreNivel,
  proximasMetas,
  puntosDe,
  tituloLogro,
} from "@/lib/desafios";
import { Avatar } from "@/components/ui/avatar";
import { Barra } from "@/components/desafios/barra";
import { ChipNivel } from "@/components/desafios/chip-nivel";
import { Insignia } from "@/components/desafios/insignia";
import { RedIcon } from "@/components/desafios/red-icon";

/**
 * «Mi camino»: lo primero que ves al entrar. Lo usan la pantalla real y la demostración
 * pública (`soloLectura`, con `base` apuntando a /demo).
 */
export function MiCaminoVista({
  perfil,
  base = "/desafios",
  soloLectura = false,
}: {
  perfil: PerfilVista;
  base?: string;
  soloLectura?: boolean;
}) {
  // En la demostración no hay «Mis páginas» (se edita): se lleva a su ficha pública.
  const enlace = (ruta: string) =>
    ruta === "/paginas" && soloLectura ? `${base}/creador/${perfil.id}` : `${base}${ruta}`;

  const activos = perfil.logros.filter((l) => l.estado === "ACTIVO");
  const monetiza = perfil.logros.some((l) => l.clave === claveLogro("MONETIZACION", 1) && l.estado === "ACTIVO");
  // Lo primero siempre es la monetización; después, lo que esté más cerca.
  const metas = proximasMetas(perfil.cuentas, perfil.logros, perfil.ingresosUsd).slice(0, 3);
  const misiones = misionesDeInicio({
    tieneFoto: !!perfil.foto,
    cuentas: perfil.cuentas,
    avances: perfil.cuentas.reduce((s, c) => s + Math.max(0, c.historial.length - 1), 0),
    logrosVideo: activos.filter((l) => l.tipo === "VISTAS" || l.tipo === "LIKES").length,
    monetiza,
  });
  const faltanMisiones = misiones.filter((m) => !m.hecha);
  const recientes = activos.slice(0, 6);
  const { nivel } = perfil;
  const primerNombre = perfil.nombre.split(/\s+/)[0];

  return (
    <div className="animate-fade-in space-y-6">
      {/* Cabecera: quién eres, en qué nivel vas y la frase del día */}
      <section className="glass-panel relative overflow-hidden rounded-3xl p-5 md:p-7">
        <div className="pointer-events-none absolute -top-24 -right-24 h-72 w-72 rounded-full bg-[var(--oro)]/10 blur-3xl" />
        <div className="relative flex flex-col gap-5 md:flex-row md:items-center">
          <Avatar src={perfil.foto} name={perfil.nombre} size={84} className="ring-2 ring-[var(--oro)]/50" />
          <div className="min-w-0 flex-1">
            <p className="antetitulo">¡Hola, {primerNombre}!</p>
            <div className="mt-1 flex flex-wrap items-center gap-2">
              <h1 className="text-2xl font-bold md:text-3xl">{perfil.nombre}</h1>
              <ChipNivel numero={nivel.numero} nombre={nivel.nombre} />
            </div>
            <div className="mt-3 max-w-md">
              <div className="mb-1 flex justify-between text-xs text-[var(--ink-3)]">
                <span>{entero(perfil.puntos)} puntos</span>
                <span>Nivel {nivel.numero + 1} en {entero(nivel.hasta)}</span>
              </div>
              <Barra valor={nivel.avance} alto={10} />
              <p className="mt-1.5 text-xs text-[var(--ink-2)]">
                Te faltan <strong className="text-[var(--oro-claro)]">{entero(nivel.hasta - perfil.puntos)}</strong> puntos
                para ser «{nombreNivel(nivel.numero + 1)}».
              </p>
            </div>
          </div>
          <dl className="grid grid-cols-3 gap-3 text-center md:w-72">
            <Dato valor={entero(perfil.logros.filter((l) => l.estado === "ACTIVO").length)} etiqueta="Insignias" />
            <Dato valor={entero(perfil.audiencia)} etiqueta="Audiencia" />
            <Dato valor={String(perfil.cuentas.length)} etiqueta="Páginas" />
          </dl>
        </div>
        <p className="relative mt-5 flex items-start gap-2 border-t border-[var(--linea)] pt-4 text-sm text-[var(--ink-2)] italic">
          <Flame className="mt-0.5 h-4 w-4 shrink-0 text-[var(--oro)]" /> {fraseDelDia()}
        </p>
      </section>

      {/* Tus próximas metas: lo primero que ves al entrar */}
      <section>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="flex items-center gap-2 text-lg font-semibold">
            <Target className="h-5 w-5 text-[var(--oro)]" /> Tus próximas metas
          </h2>
          <Link href={enlace("/retos")} className="inline-flex items-center gap-1 text-xs text-[var(--oro-claro)] hover:underline">
            Ver todos los retos <ArrowRight className="h-3 w-3" />
          </Link>
        </div>
        {metas.length === 0 ? (
          <div className="glass-panel rounded-2xl p-6 text-center text-sm text-[var(--ink-2)]">
            Da de alta tu primera página y aquí aparecerán tus metas.{" "}
            <Link href={enlace("/paginas")} className="text-[var(--oro-claro)] underline">Agregar página</Link>
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-3">
            {perfil.cuentas.length === 0 && (
              <Link
                href={enlace("/paginas")}
                className="glass-panel flex flex-col justify-center rounded-2xl border-[var(--oro)]/40 p-4 transition hover:-translate-y-0.5"
              >
                <p className="text-sm font-semibold text-[var(--oro-claro)]">Da de alta tu primera página</p>
                <p className="mt-1 text-xs text-[var(--ink-2)]">
                  Así verás tus metas de seguidores y cuánto te falta para cada una.
                </p>
                <span className="mt-3 inline-flex items-center gap-1 text-xs text-[var(--oro-claro)]">
                  Agregar página <ArrowRight className="h-3 w-3" />
                </span>
              </Link>
            )}
            {metas.map((m) => (
              <article
                key={`${m.tipo}${m.red}${m.umbral}`}
                className={`glass-panel rounded-2xl p-4 ${m.tipo === "MONETIZACION" ? "border-[var(--oro)]/50" : ""}`}
              >
                <div className="flex items-center gap-3">
                  <Insignia tipo={m.tipo} umbral={m.umbral} red={m.red} estado="bloqueada" tamano={56} />
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-[var(--ink-0)]">{m.titulo}</p>
                    <p className="text-[11px] text-[var(--ink-3)]">+{puntosDe(m.tipo, m.umbral)} puntos</p>
                  </div>
                </div>
                {m.avance !== null && m.actual !== null ? (
                  <>
                    <div className="mt-4 flex justify-between text-xs tabular-nums text-[var(--ink-3)]">
                      <span>{cifraDe(m.tipo, m.actual)}</span>
                      <span>{cifraDe(m.tipo, m.umbral)}</span>
                    </div>
                    <Barra valor={m.avance} className="mt-1" />
                  </>
                ) : null}
                <p className="mt-3 text-xs text-[var(--ink-2)]">{empujon(m)}</p>
                {(m.tipo === "MONETIZACION" || m.tipo === "INGRESOS") && (
                  <Link href={enlace("/monetizacion")} className="mt-2 inline-flex items-center gap-1 text-xs font-medium text-[var(--oro-claro)] hover:underline">
                    {m.tipo === "MONETIZACION" ? "Activarla" : "Anotar ingresos"} <ArrowRight className="h-3 w-3" />
                  </Link>
                )}
              </article>
            ))}
          </div>
        )}
      </section>

      <div className="grid gap-6 lg:grid-cols-5">
        {/* Primeros pasos, mientras falten */}
        {faltanMisiones.length > 0 && (
          <section className="glass-panel rounded-2xl p-5 lg:col-span-2">
            <h2 className="font-semibold">Primeros pasos</h2>
            <p className="text-xs text-[var(--ink-3)]">{misiones.length - faltanMisiones.length} de {misiones.length} listos</p>
            <Barra valor={(misiones.length - faltanMisiones.length) / misiones.length} className="mt-2" alto={6} />
            <ul className="mt-4 space-y-2">
              {misiones.map((m) => (
                <li key={m.id}>
                  <Link
                    href={enlace(m.href.replace("/desafios", ""))}
                    className="flex items-center gap-3 rounded-lg px-2 py-1.5 text-sm hover:bg-white/5"
                  >
                    <span
                      className={
                        m.hecha
                          ? "flex h-5 w-5 items-center justify-center rounded-full bg-emerald-500/20 text-emerald-400"
                          : "h-5 w-5 rounded-full border border-[var(--flotante-borde)]"
                      }
                    >
                      {m.hecha && <Check className="h-3 w-3" />}
                    </span>
                    <span className={m.hecha ? "text-[var(--ink-3)] line-through" : "text-[var(--ink-1)]"}>{m.texto}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        )}

        {/* Mis páginas, de un vistazo */}
        <section className={`glass-panel rounded-2xl p-5 ${faltanMisiones.length > 0 ? "lg:col-span-3" : "lg:col-span-5"}`}>
          <div className="mb-3 flex items-center justify-between">
            <h2 className="font-semibold">Mis páginas</h2>
            <Link href={enlace("/paginas")} className="inline-flex items-center gap-1 text-xs text-[var(--oro-claro)] hover:underline">
              Anotar avance <ArrowRight className="h-3 w-3" />
            </Link>
          </div>
          {perfil.cuentas.length === 0 ? (
            <p className="text-sm text-[var(--ink-3)]">Todavía no hay páginas.</p>
          ) : (
            <ul className="divide-y divide-[var(--linea)]">
              {perfil.cuentas.map((c) => (
                <li key={c.id} className="flex items-center gap-3 py-2.5">
                  <Avatar src={c.foto} name={c.nombre} size={34} />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">{c.nombre}</p>
                    <p className="flex items-center gap-1 text-[11px] text-[var(--ink-3)]">
                      <RedIcon red={c.red} className="h-3 w-3" /> {RED_INFO[c.red].nombre}
                    </p>
                  </div>
                  <p className="font-[family-name:var(--font-titulos)] text-lg font-bold tabular-nums">{entero(c.seguidores)}</p>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>

      {/* Lo último que ganaste */}
      {recientes.length > 0 && (
        <section>
          <h2 className="mb-3 text-lg font-semibold">Tus últimas insignias</h2>
          <div className="glass-panel flex flex-wrap gap-5 rounded-2xl p-5">
            {recientes.map((l) => (
              <div key={l.id} className="flex w-24 flex-col items-center gap-1.5 text-center">
                <Insignia tipo={l.tipo} umbral={l.umbral} red={l.red} tamano={68} />
                <p className="text-[11px] leading-tight text-[var(--ink-2)]">{tituloLogro(l.tipo, l.umbral, l.red)}</p>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

function Dato({ valor, etiqueta }: { valor: string; etiqueta: string }) {
  return (
    <div className="rounded-xl bg-white/[0.04] px-2 py-3">
      <dd className="font-[family-name:var(--font-titulos)] text-lg leading-none font-bold tabular-nums">{valor}</dd>
      <dt className="mt-1 text-[10px] tracking-wider text-[var(--ink-3)] uppercase">{etiqueta}</dt>
    </div>
  );
}
