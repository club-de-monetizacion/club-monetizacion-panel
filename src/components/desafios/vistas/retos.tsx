import Link from "next/link";
import { Trophy } from "lucide-react";
import type { LogroVista, PerfilVista } from "@/lib/desafios-data";
import {
  ESCALERA_AUDIENCIA,
  ESCALERA_LIKES,
  ESCALERA_SEGUIDORES,
  ESCALERA_VISTAS,
  RED_INFO,
  REDES,
  abreviar,
  claveLogro,
  entero,
  fechaCorta,
  mejorPorRed,
  audienciaTotal,
  puntosDe,
  rangoLogro,
  SE_RECLAMA,
  dolares,
  ESCALERA_INGRESOS,
  ESCALERA_MONETIZACION,
  tituloLogro,
} from "@/lib/desafios";
import { Barra } from "@/components/desafios/barra";
import { Insignia, type EstadoInsignia } from "@/components/desafios/insignia";
import { RedIcon } from "@/components/desafios/red-icon";
import { ReclamarBoton, RetirarBoton } from "@/components/desafios/reclamar-video";
import { VerPrueba } from "@/components/desafios/ver-prueba";
import type { RedSocial, TipoLogro } from "@prisma/client";

/** Todos los retos de una persona. Lo usan la pantalla real y la demostración pública. */
export function RetosVista({
  perfil,
  base = "/desafios",
  soloLectura = false,
}: {
  perfil: PerfilVista;
  base?: string;
  soloLectura?: boolean;
}) {
  const enlace = (ruta: string) =>
    ruta === "/paginas" && soloLectura ? `${base}/creador/${perfil.id}` : `${base}${ruta}`;

  const porClave = new Map<string, LogroVista>(perfil.logros.map((l) => [l.clave, l]));
  const mejores = mejorPorRed(perfil.cuentas);
  const total = audienciaTotal(perfil.cuentas);

  const totalEscalones =
    ESCALERA_SEGUIDORES.length * REDES.length +
    ESCALERA_AUDIENCIA.length + ESCALERA_VISTAS.length + ESCALERA_LIKES.length +
    ESCALERA_MONETIZACION.length + ESCALERA_INGRESOS.length;
  const ganadas = perfil.logros.filter((l) => l.estado === "ACTIVO").length;

  return (
    <div className="animate-fade-in space-y-8">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="antetitulo">Todos los retos</p>
          <h1 className="text-3xl font-bold">Tu colección de insignias</h1>
          <p className="mt-1 max-w-xl text-sm text-[var(--ink-2)]">
            Los seguidores y los ingresos se desbloquean solos cuando anotas tus avances. Los
            videos y la monetización los reclamas tú, con tu prueba.
          </p>
        </div>
        <div className="glass-panel w-full rounded-2xl p-4 sm:w-72">
          <div className="flex items-baseline justify-between">
            <p className="flex items-center gap-1.5 text-sm font-semibold"><Trophy className="h-4 w-4 text-[var(--oro)]" /> {ganadas} de {totalEscalones}</p>
            <p className="text-xs text-[var(--ink-3)]">{entero(perfil.puntos)} pts</p>
          </div>
          <Barra valor={ganadas / totalEscalones} className="mt-2" />
        </div>
      </header>

      {/* Lo primero: que el contenido empiece a pagar */}
      <Seccion titulo="Monetización" nota="Tu primer gran hito: activarla en cualquier plataforma que la ofrezca (YouTube, TikTok, Facebook…).">
        <div className="glass-panel rounded-2xl p-4">
          <Escalera tipo="MONETIZACION" red={null} escalera={ESCALERA_MONETIZACION} actual={null} porClave={porClave} soloLectura={soloLectura} />
        </div>
      </Seccion>

      <Seccion titulo="Dinero ganado" nota="Se suma todo lo que anotes en Monetización, en dólares. Tus cifras las ves solo tú si así lo decides.">
        <div className="glass-panel rounded-2xl p-4">
          <p className="mb-3 text-xs text-[var(--ink-3)]">
            Llevas <strong className="text-[var(--ink-0)]">{dolares(perfil.ingresosUsd)}</strong>
            {" · "}
            <Link href={enlace("/monetizacion")} className="text-[var(--oro-claro)] hover:underline">anotar ingresos</Link>
          </p>
          <Escalera tipo="INGRESOS" red={null} escalera={ESCALERA_INGRESOS} actual={Math.floor(perfil.ingresosUsd)} porClave={porClave} soloLectura={soloLectura} />
        </div>
      </Seccion>

      {/* Seguidores, red por red */}
      <Seccion titulo="Seguidores en cada red" nota="Cuenta tu página más grande de esa red.">
        <div className="space-y-4">
          {REDES.map((red) => (
            <div key={red} className="glass-panel rounded-2xl p-4">
              <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                <p className="flex items-center gap-2 font-semibold">
                  <RedIcon red={red} className="h-5 w-5" /> {RED_INFO[red].nombre}
                </p>
                {red in mejores ? (
                  <p className="text-xs text-[var(--ink-3)]">Tu mejor página: <strong className="text-[var(--ink-0)]">{entero(mejores[red] ?? 0)}</strong></p>
                ) : (
                  <Link href={enlace("/paginas")} className="text-xs text-[var(--oro-claro)] hover:underline">
                    Aún no tienes páginas aquí · agregar
                  </Link>
                )}
              </div>
              <Escalera
                tipo="SEGUIDORES"
                red={red}
                escalera={ESCALERA_SEGUIDORES}
                actual={mejores[red] ?? 0}
                porClave={porClave}
              />
            </div>
          ))}
        </div>
      </Seccion>

      <Seccion titulo="Audiencia total" nota="Todos tus seguidores de todas tus redes, sumados.">
        <div className="glass-panel rounded-2xl p-4">
          <p className="mb-3 text-xs text-[var(--ink-3)]">
            Ahora sumas <strong className="text-[var(--ink-0)]">{entero(total)}</strong>
          </p>
          <Escalera tipo="AUDIENCIA" red={null} escalera={ESCALERA_AUDIENCIA} actual={total} porClave={porClave} soloLectura={soloLectura} />
        </div>
      </Seccion>

      <Seccion titulo="Tu primer video con…  vistas" nota="Reclámala cuando un video tuyo llegue. Si reclamas una alta, las de abajo van incluidas.">
        <div className="glass-panel rounded-2xl p-4">
          <Escalera tipo="VISTAS" red={null} escalera={ESCALERA_VISTAS} actual={null} porClave={porClave} soloLectura={soloLectura} />
        </div>
      </Seccion>

      <Seccion titulo="Tu primer video con…  likes" nota="Lo mismo, pero con los me gusta.">
        <div className="glass-panel rounded-2xl p-4">
          <Escalera tipo="LIKES" red={null} escalera={ESCALERA_LIKES} actual={null} porClave={porClave} soloLectura={soloLectura} />
        </div>
      </Seccion>
    </div>
  );
}

function Seccion({ titulo, nota, children }: { titulo: string; nota: string; children: React.ReactNode }) {
  return (
    <section>
      <h2 className="text-lg font-semibold">{titulo}</h2>
      <p className="mb-3 text-xs text-[var(--ink-3)]">{nota}</p>
      {children}
    </section>
  );
}

/** Una fila de insignias, de la primera a la última, ganadas y por ganar. */
function Escalera({
  tipo,
  red,
  escalera,
  actual,
  porClave,
  soloLectura = false,
}: {
  tipo: TipoLogro;
  red: RedSocial | null;
  escalera: number[];
  /** Cifra actual para decir «faltan N»; `null` si no se mide (vistas y likes) */
  actual: number | null;
  porClave: Map<string, LogroVista>;
  /** En la demostración pública no se reclama ni se retira nada */
  soloLectura?: boolean;
}) {
  // El primer escalón sin ganar es «el que sigue»: se marca para dar un destino.
  const siguiente = escalera.find((u) => {
    const l = porClave.get(claveLogro(tipo, u, red));
    return !l;
  });
  return (
    <div className="grid grid-cols-[repeat(auto-fill,minmax(92px,1fr))] gap-x-2 gap-y-5">
      {escalera.map((umbral) => {
        const logro = porClave.get(claveLogro(tipo, umbral, red));
        const estado: EstadoInsignia =
          logro?.estado === "ACTIVO" ? "ganada" : logro?.estado === "REVOCADO" ? "revocada" : "bloqueada";
        const reclamable = SE_RECLAMA[tipo] && !logro;
        return (
          <div key={umbral} className="flex flex-col items-center gap-1.5 text-center">
            <Insignia tipo={tipo} umbral={umbral} red={red} estado={estado} tamano={66} />
            <p className="text-[11px] leading-tight font-medium" style={{ color: estado === "ganada" ? rangoLogro(tipo, umbral).claro : "var(--ink-3)" }}>
              {rangoLogro(tipo, umbral).nombre} · {puntosDe(tipo, umbral)} pts
            </p>
            {logro?.estado === "ACTIVO" && (
              <div className="space-y-0.5">
                <p className="text-[10px] text-[var(--ink-3)]">{fechaCorta(logro.creadoEn)}</p>
                <VerPrueba
                  titulo={tituloLogro(tipo, umbral, red)}
                  enlace={logro.enlace}
                  captura={logro.captura}
                  nota={logro.nota}
                />
                {SE_RECLAMA[tipo] && !soloLectura && <div><RetirarBoton logroId={logro.id} /></div>}
              </div>
            )}
            {logro?.estado === "REVOCADO" && (
              <p className="text-[10px] leading-tight text-red-300" title={logro.motivoRevocacion ?? undefined}>
                Revisada por el equipo
              </p>
            )}
            {reclamable && soloLectura && <p className="text-[10px] text-[var(--ink-3)]">Se reclama con tu prueba</p>}
            {reclamable && !soloLectura && <ReclamarBoton tipo={tipo as "VISTAS" | "LIKES" | "MONETIZACION"} umbral={umbral} destacado={umbral === siguiente} />}
            {!logro && actual !== null && (
              <p className={`text-[10px] ${umbral === siguiente ? "font-semibold text-[var(--oro-claro)]" : "text-[var(--ink-3)]"}`}>
                {umbral === siguiente ? "Siguiente · " : ""}faltan {tipo === "INGRESOS" ? "$" : ""}{abreviar(Math.max(0, umbral - actual))}
              </p>
            )}
          </div>
        );
      })}
    </div>
  );
}
