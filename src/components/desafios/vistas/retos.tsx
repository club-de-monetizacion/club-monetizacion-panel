import Link from "next/link";
import { Monitor, Smartphone, Trophy } from "lucide-react";
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
  claveVideo,
  entero,
  FORMATO_INFO,
  formatosDe,
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
import { ReclamarBoton, ReclamarVideoBoton, RetirarBoton } from "@/components/desafios/reclamar-video";
import { VerPrueba } from "@/components/desafios/ver-prueba";
import type { FormatoVideo, RedSocial, TipoLogro } from "@prisma/client";

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

  const escalerasDeVideo = perfil.cuentas.reduce((n, c) => n + formatosDe(c.red).length, 0);
  const totalEscalones =
    ESCALERA_SEGUIDORES.length * REDES.length +
    ESCALERA_AUDIENCIA.length + ESCALERA_VISTAS.length * escalerasDeVideo + ESCALERA_LIKES.length +
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

      <Seccion
        titulo="Videos con más vistas, página por página"
        nota="Cada página tiene su propia escalera: el primer video con 1,000 vistas y de ahí hacia arriba. Pega el enlace del video (la captura es opcional). Si reclamas un escalón alto, los de abajo van incluidos."
      >
        {perfil.cuentas.length === 0 ? (
          <p className="glass-panel rounded-2xl p-6 text-sm text-[var(--ink-3)]">
            Da de alta una página para tener su escalera de vistas.{" "}
            <Link href={enlace("/paginas")} className="text-[var(--oro-claro)] hover:underline">Agregar página</Link>
          </p>
        ) : (
          <div className="space-y-4">
            {perfil.cuentas.map((c) => (
              <div key={c.id} className="glass-panel rounded-2xl p-4">
                <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                  <p className="flex items-center gap-2 font-semibold">
                    <RedIcon red={c.red} className="h-5 w-5" /> {c.nombre}
                    <span className="text-xs font-normal text-[var(--ink-3)]">{RED_INFO[c.red].nombre}</span>
                  </p>
                </div>
                {c.red === "YOUTUBE" && (
                  <p className="mb-4 rounded-lg border border-[var(--oro)]/25 bg-[var(--oro)]/[0.07] p-3 text-xs text-[var(--oro-claro)]">
                    <strong>Recuerda:</strong> en YouTube cuentan por separado los <strong>Shorts (vertical)</strong> y
                    los <strong>videos largos (horizontal)</strong>. Tienes una escalera para cada uno y puedes ganar las
                    insignias de los dos.
                  </p>
                )}
                <div className="space-y-5">
                  {formatosDe(c.red).map((formato) => (
                    <div key={formato ?? "unico"}>
                      {formato && (
                        <p className="mb-2 flex items-center gap-1.5 text-xs font-semibold tracking-wide text-[var(--ink-2)] uppercase">
                          {formato === "VERTICAL" ? <Smartphone className="h-3.5 w-3.5" /> : <Monitor className="h-3.5 w-3.5" />}
                          {FORMATO_INFO[formato].largo}
                        </p>
                      )}
                      <Escalera
                        tipo="VISTAS"
                        red={c.red}
                        escalera={ESCALERA_VISTAS}
                        actual={null}
                        porClave={porClave}
                        soloLectura={soloLectura}
                        claveDe={(u) => claveVideo(c.id, formato, u)}
                        formato={formato}
                        video={{ cuentaId: c.id, pagina: c.nombre }}
                      />
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
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
  claveDe,
  formato = null,
  video,
}: {
  tipo: TipoLogro;
  red: RedSocial | null;
  escalera: number[];
  /** Cifra actual para decir «faltan N»; `null` si no se mide (vistas y likes) */
  actual: number | null;
  porClave: Map<string, LogroVista>;
  /** En la demostración pública no se reclama ni se retira nada */
  soloLectura?: boolean;
  /** Cómo se llama la clave de cada escalón, si no es la de siempre (vistas por página) */
  claveDe?: (umbral: number) => string;
  /** En las vistas de YouTube: de cuál de los dos formatos es esta escalera */
  formato?: FormatoVideo | null;
  /** Si es una escalera de vistas de una página: de cuál */
  video?: { cuentaId: string; pagina: string };
}) {
  const clave = (u: number) => (claveDe ? claveDe(u) : claveLogro(tipo, u, red));
  // El primer escalón sin ganar es «el que sigue»: se marca para dar un destino.
  const siguiente = escalera.find((u) => {
    const l = porClave.get(clave(u));
    return !l;
  });
  return (
    <div className="grid grid-cols-[repeat(auto-fill,minmax(92px,1fr))] gap-x-2 gap-y-5">
      {escalera.map((umbral) => {
        const logro = porClave.get(clave(umbral));
        const estado: EstadoInsignia =
          logro?.estado === "ACTIVO" ? "ganada" : logro?.estado === "REVOCADO" ? "revocada" : "bloqueada";
        const reclamable = SE_RECLAMA[tipo] && !logro;
        return (
          <div key={umbral} className="flex flex-col items-center gap-1.5 text-center">
            <Insignia tipo={tipo} umbral={umbral} red={red} formato={formato} estado={estado} tamano={66} />
            <p className="text-[11px] leading-tight font-medium" style={{ color: estado === "ganada" ? rangoLogro(tipo, umbral).claro : "var(--ink-3)" }}>
              {rangoLogro(tipo, umbral).nombre} · {puntosDe(tipo, umbral)} pts
            </p>
            {logro?.estado === "ACTIVO" && (
              <div className="space-y-0.5">
                <p className="text-[10px] text-[var(--ink-3)]">{fechaCorta(logro.creadoEn)}</p>
                <VerPrueba
                  titulo={tituloLogro(tipo, umbral, red, formato)}
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
            {reclamable && soloLectura && <p className="text-[10px] text-[var(--ink-3)]">Se reclama con el enlace del video</p>}
            {reclamable && !soloLectura && video && (
              <ReclamarVideoBoton
                cuentaId={video.cuentaId}
                paginaNombre={video.pagina}
                red={red as RedSocial}
                formato={formato}
                umbral={umbral}
                destacado={umbral === siguiente}
              />
            )}
            {reclamable && !soloLectura && !video && (
              <ReclamarBoton tipo={tipo as "LIKES" | "MONETIZACION"} umbral={umbral} destacado={umbral === siguiente} />
            )}
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
