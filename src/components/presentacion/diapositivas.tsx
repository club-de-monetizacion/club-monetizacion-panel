import { useState } from "react";
import type { CSSProperties, ReactNode } from "react";
import {
  Ban,
  CalendarOff,
  Clock,
  Gift,
  Globe,
  LifeBuoy,
  Link2Off,
  Megaphone,
  MessageCircle,
  Share2,
  ShieldAlert,
  User,
  UserX,
} from "lucide-react";
import { cn } from "@/lib/utils";
import e from "./presentacion.module.css";
import { ZONAS_EEUU, ZONAS_LATAM, convertir } from "./horas";
import type { Zona } from "./horas";
import type { IdDiapositiva } from "./titulos";

/* El contenido de la presentación de clases (primera versión: el PDF "Red and White
   Modern Creative Portfolio Presentation"). Todo está dibujado sobre un lienzo de
   1920×1080; `presentacion-clases.tsx` lo escala a la pantalla. */

const LOGO = "/branding/app-logo.png";

/** El contenido vive en una caja de 1920×1080 centrada; los fondos, en cambio, llenan
 * toda la pantalla (la diapositiva mide lo que mide la pantalla, nunca menos). */
function Contenido({ children }: { children: ReactNode }) {
  return (
    <div className="absolute left-1/2 top-1/2 h-[1080px] w-[1920px] -translate-x-1/2 -translate-y-1/2">
      {children}
    </div>
  );
}

/** Un bloque que entra con retraso `d` (ms) cuando su diapositiva pasa a ser la activa. */
function Entra({
  d = 0,
  zoom,
  className,
  style,
  children,
}: {
  d?: number;
  zoom?: boolean;
  className?: string;
  style?: CSSProperties;
  children?: ReactNode;
}) {
  return (
    <div
      className={cn(zoom ? e.entraZoom : e.entra, className)}
      style={{ "--d": d, ...style } as CSSProperties}
    >
      {children}
    </div>
  );
}

function Fondo() {
  return (
    <>
      <div className={e.fondo} />
      <div
        className={e.orbe}
        style={{
          left: -160,
          top: 520,
          width: 640,
          height: 640,
          background: "rgba(36,104,255,0.22)",
        }}
      />
      <div
        className={e.orbe}
        style={{
          right: -120,
          top: -140,
          width: 560,
          height: 560,
          background: "rgba(201,160,64,0.13)",
          animationDelay: "-6s",
        }}
      />
    </>
  );
}

/** El emblema del Club con su aro dorado. */
function Logo({ size, pulso, className }: { size: number; pulso?: boolean; className?: string }) {
  const aro = Math.max(3, Math.round(size / 28));
  return (
    <div
      className={cn("rounded-full", e.anilloOro, pulso && e.pulso, className)}
      style={{ width: size, height: size, padding: aro }}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={LOGO}
        alt="Club de Monetización"
        className="h-full w-full rounded-full object-cover"
        style={{ transform: "scale(1.03)" }}
        draggable={false}
      />
    </div>
  );
}

/** La marca discreta de las diapositivas de contenido. */
function Marca() {
  return (
    <Entra d={150} className="absolute right-[110px] top-[72px] flex items-center gap-5">
      <span
        className="text-[22px] font-semibold uppercase tracking-[0.28em]"
        style={{ color: "rgba(214,224,238,0.7)" }}
      >
        Club de Monetización
      </span>
      <Logo size={84} />
    </Entra>
  );
}

function Rotulo({ children, d = 100 }: { children: ReactNode; d?: number }) {
  return (
    <Entra d={d} className="flex items-center gap-6">
      <span className="block h-[3px] w-20 rounded-full" style={{ background: "#e8c060" }} />
      <span className="text-[26px] font-semibold uppercase tracking-[0.32em]" style={{ color: "#e8c060" }}>
        {children}
      </span>
    </Entra>
  );
}

/* ───────────────────────── 1 · Portada ───────────────────────── */

function Portada() {
  return (
    <>
      <div className="absolute inset-0 bg-[#05091a]" />
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/presentacion/portada.jpg"
        alt=""
        className="absolute inset-0 h-full w-full object-cover"
        style={{ objectPosition: "50% 42%", filter: "brightness(0.62) saturate(1.1)" }}
        draggable={false}
      />
      <div
        className="absolute inset-0"
        style={{
          background:
            "linear-gradient(90deg, rgba(5,9,26,0.94) 0%, rgba(5,9,26,0.7) 38%, rgba(5,9,26,0.12) 78%), linear-gradient(0deg, rgba(5,9,26,0.85) 0%, transparent 42%)",
        }}
      />
      <div
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(900px 600px at 85% 78%, rgba(36,104,255,0.42), transparent 65%), radial-gradient(700px 500px at 8% 100%, rgba(30,92,232,0.35), transparent 65%)",
        }}
      />

<Contenido>
      <Entra zoom d={200} className="absolute right-[120px] top-[84px]">
        <Logo size={170} pulso />
      </Entra>

      <div className="absolute left-[140px] top-1/2 -translate-y-1/2">
        <Rotulo d={150}>Presentación de clases</Rotulo>

        <Entra d={350} className={cn(e.titulo, "mt-10 text-[212px] font-bold leading-[0.93] text-white")}>
          Club de
        </Entra>
        <Entra d={520} className={cn(e.titulo, "text-[212px] font-bold leading-[0.93] text-white")}>
          Monetización
        </Entra>

        <div
          className={cn(e.barra, "mt-12 h-[8px] w-[420px] rounded-full")}
          style={{ ["--d" as string]: 900, background: "linear-gradient(90deg,#ffd97d,#c9a040)" }}
        />

        <Entra d={1000} className="mt-9 text-[44px] font-light" style={{ color: "#d6e0ee" }}>
          Bienvenido al Club
        </Entra>
      </div>
</Contenido>
    </>
  );
}

/* ───────────────────────── 2 · Normas ───────────────────────── */

const NORMAS = [
  { texto: "No ventas", Icono: Ban },
  { texto: "No estafas", Icono: ShieldAlert },
  { texto: "No spam en la comunidad", Icono: Megaphone },
  { texto: "No compartir", Icono: Share2 },
  { texto: "No links peligrosos", Icono: Link2Off },
  { texto: "No molestar a los compañeros", Icono: UserX },
] as const;

function Normas() {
  return (
    <>
      <Fondo />
<Contenido>
      <Marca />

      <div className="absolute left-[140px] top-[84px]">
        <Rotulo>Comunidad</Rotulo>
        <Entra d={250} className={cn(e.titulo, "mt-7 text-[168px] font-bold leading-none text-white")}>
          Normas
        </Entra>
        <Entra d={380} className="mt-6 text-[36px] font-light" style={{ color: "#a8b8d0" }}>
          Para que el Club siga siendo un buen lugar para todos.
        </Entra>
      </div>

      <div className="absolute left-[140px] top-[470px] grid w-[1640px] grid-cols-3 gap-9">
        {NORMAS.map(({ texto, Icono }, i) => (
          <Entra
            key={texto}
            d={520 + i * 120}
            className={cn(e.cristal, "relative flex h-[240px] items-center gap-8 rounded-[34px] px-10")}
          >
            <span
              className="absolute left-10 top-5 text-[20px] font-bold tracking-[0.2em]"
              style={{ color: "rgba(232,192,96,0.8)" }}
            >
              {String(i + 1).padStart(2, "0")}
            </span>
            <span
              className="mt-4 flex h-[104px] w-[104px] shrink-0 items-center justify-center rounded-full"
              style={{
                background: "rgba(229,72,77,0.13)",
                border: "2px solid rgba(255,107,112,0.4)",
                color: "#ff7478",
              }}
            >
              <Icono size={50} strokeWidth={2} />
            </span>
            <span className={cn(e.titulo, "mt-4 text-[42px] font-semibold leading-[1.12] text-white")}>
              {texto}
            </span>
          </Entra>
        ))}
      </div>
</Contenido>
    </>
  );
}

/* ───────────────────────── 3 · Horarios ───────────────────────── */

const HORARIOS = [
  { nombre: "Soporte", desde: "3:00 pm", hasta: "11:00 pm", ini: 15, fin: 23, color: "#2468ff", Icono: LifeBuoy },
  {
    nombre: "Grupos de WhatsApp",
    desde: "3:00 pm",
    hasta: "8:00 pm",
    ini: 15,
    fin: 20,
    color: "#10b981",
    Icono: MessageCircle,
  },
  { nombre: "Diego Cabrera", desde: "9:00 am", hasta: "11:00 pm", ini: 9, fin: 23, color: "#e8c060", Icono: User },
] as const;

const EJE_INI = 9;
const EJE_FIN = 23;
const MARCAS = [9, 11, 13, 15, 17, 19, 21, 23];

const etiquetaHora = (h: number) => `${h > 12 ? h - 12 : h} ${h >= 12 ? "pm" : "am"}`;

function Horarios() {
  const ancho = 1280;
  return (
    <>
      <Fondo />
<Contenido>
      <Marca />

      <div className="absolute left-[140px] top-[84px]">
        <Rotulo>Atención del equipo · Hora de México</Rotulo>
        <Entra d={250} className={cn(e.titulo, "mt-7 text-[168px] font-bold leading-none text-white")}>
          Horarios
        </Entra>
      </div>

      <Entra
        d={450}
        className={cn(e.cristal, "absolute right-[140px] top-[196px] flex items-center gap-5 rounded-full px-9 py-5")}
      >
        <CalendarOff size={34} style={{ color: "#e8c060" }} />
        <span className="text-[30px] font-medium text-white">Sábados y domingos no son días laborales</span>
      </Entra>

      <div className="absolute left-[140px] top-[360px] grid w-[1640px] grid-cols-3 gap-10">
        {HORARIOS.map(({ nombre, desde, hasta, color, Icono }, i) => (
          <Entra
            key={nombre}
            d={500 + i * 150}
            className={cn(e.cristal, "relative overflow-hidden rounded-[34px] px-10 py-9")}
          >
            <div className="absolute inset-x-0 top-0 h-[7px]" style={{ background: color }} />
            <div className="flex items-center gap-5">
              <span
                className="flex h-[72px] w-[72px] items-center justify-center rounded-2xl"
                style={{ background: `${color}22`, color, border: `1.5px solid ${color}55` }}
              >
                <Icono size={36} />
              </span>
              <span className="text-[27px] font-bold uppercase tracking-[0.14em] text-white">{nombre}</span>
            </div>
            <div className="mt-8 flex items-baseline gap-5">
              <span className="w-[56px] text-[22px] font-semibold uppercase tracking-[0.2em]" style={{ color: "#a8b8d0" }}>
                De
              </span>
              <span className={cn(e.titulo, "text-[66px] font-bold leading-none text-white")}>{desde}</span>
            </div>
            <div className="mt-3 flex items-baseline gap-5">
              <span className="w-[56px] text-[22px] font-semibold uppercase tracking-[0.2em]" style={{ color: "#a8b8d0" }}>
                A
              </span>
              <span className={cn(e.titulo, "text-[66px] font-bold leading-none")} style={{ color }}>
                {hasta}
              </span>
            </div>
          </Entra>
        ))}
      </div>

      {/* Las tres franjas sobre un mismo eje, para ver de un vistazo cuándo coinciden. */}
      <Entra d={1000} className={cn(e.cristal, "absolute left-[140px] top-[735px] w-[1640px] rounded-[34px] px-10 pb-7 pt-8")}>
        {HORARIOS.map(({ nombre, ini, fin, color }, i) => (
          <div key={nombre} className="flex items-center gap-8" style={{ marginTop: i ? 16 : 0 }}>
            <span className="w-[230px] shrink-0 text-[22px] font-semibold uppercase tracking-[0.1em]" style={{ color: "#d6e0ee" }}>
              {nombre === "Grupos de WhatsApp" ? "WhatsApp" : nombre}
            </span>
            <div className="relative h-[26px]" style={{ width: ancho }}>
              <div className="absolute inset-0 rounded-full" style={{ background: "rgba(255,255,255,0.05)" }} />
              <div
                className={cn(e.barra, "absolute top-0 h-full rounded-full")}
                style={{
                  ["--d" as string]: 1200 + i * 160,
                  left: ((ini - EJE_INI) / (EJE_FIN - EJE_INI)) * ancho,
                  width: ((fin - ini) / (EJE_FIN - EJE_INI)) * ancho,
                  background: `linear-gradient(90deg, ${color}, ${color}cc)`,
                  boxShadow: `0 0 24px ${color}66`,
                }}
              />
            </div>
          </div>
        ))}
        <div className="mt-4 flex items-start gap-8">
          <span className="w-[230px] shrink-0" />
          <div className="relative h-[28px]" style={{ width: ancho }}>
            {MARCAS.map((h) => (
              <span
                key={h}
                className="absolute top-0 -translate-x-1/2 whitespace-nowrap text-[19px] font-medium"
                style={{ left: ((h - EJE_INI) / (EJE_FIN - EJE_INI)) * ancho, color: "#6b7c99" }}
              >
                {etiquetaHora(h)}
              </span>
            ))}
          </div>
        </div>
      </Entra>
</Contenido>
    </>
  );
}


/* ───────────────────── 3b · Tu hora (Latam, España y EE. UU.) ───────────────────── */

function TablaHoras({ zonas, rotulo, titulo, subtitulo }: { zonas: Zona[]; rotulo: string; titulo: string; subtitulo: string }) {
  // La fecha de hoy se toma una sola vez, para que el horario de verano salga bien.
  const [ahora] = useState(() => new Date());
  const filas = zonas.length;
  const alto = filas > 5 ? 68 : 118;
  return (
    <>
      <Fondo />
      <Contenido>
        <Marca />
        <div className="absolute left-[140px] top-[64px]">
          <Rotulo>{rotulo}</Rotulo>
          <Entra d={250} className={cn(e.titulo, "mt-5 text-[130px] font-bold leading-none text-white")}>
            {titulo}
          </Entra>
          <Entra d={380} className="mt-3 text-[32px] font-light" style={{ color: "#a8b8d0" }}>
            {subtitulo}
          </Entra>
        </div>

        <Entra d={500} className={cn(e.cristal, "absolute left-[140px] w-[1640px] overflow-hidden rounded-[30px]")} style={{ top: filas > 5 ? 305 : 360 }}>
          <div className="grid items-center px-9 py-4" style={{ gridTemplateColumns: "560px repeat(3, 1fr)", background: "rgba(255,255,255,0.05)" }}>
            <span className="flex items-center gap-3 text-[22px] font-semibold uppercase tracking-[0.14em]" style={{ color: "#e8c060" }}>
              <Globe size={26} /> País o región
            </span>
            {HORARIOS.map((h) => (
              <span key={h.nombre} className="flex items-center gap-3 text-[22px] font-bold uppercase tracking-[0.1em] text-white">
                <span className="h-4 w-4 rounded-full" style={{ background: h.color }} />
                {h.nombre}
              </span>
            ))}
          </div>
          {zonas.map((z, i) => (
            <div
              key={z.tz + z.etiqueta}
              className="grid items-center px-9"
              style={{
                gridTemplateColumns: "560px repeat(3, 1fr)",
                height: alto,
                borderTop: "1px solid rgba(140,170,220,0.14)",
                background: i === 0 && zonas === ZONAS_LATAM ? "rgba(232,192,96,0.08)" : undefined,
              }}
            >
              <div className="pr-6">
                <div className={cn(e.titulo, "text-[28px] font-semibold leading-tight text-white")}>{z.etiqueta}</div>
                {z.detalle && (
                  <div className="mt-0.5 text-[19px] leading-tight" style={{ color: "#6b7c99" }}>
                    {z.detalle}
                  </div>
                )}
              </div>
              {HORARIOS.map((h) => {
                const d = convertir(z.tz, h.ini, ahora);
                const a = convertir(z.tz, h.fin, ahora);
                return (
                  <div key={h.nombre} className={cn(e.titulo, "whitespace-nowrap text-[31px] font-semibold text-white")} suppressHydrationWarning>
                    {d.texto}
                    {d.dia !== 0 && <Dia n={d.dia} />}
                    <span style={{ color: "#6b7c99" }}> – </span>
                    <span style={{ color: h.color }}>{a.texto}</span>
                    {a.dia !== 0 && <Dia n={a.dia} />}
                  </div>
                );
              })}
            </div>
          ))}
        </Entra>

        <Entra d={800} className="absolute bottom-[56px] left-[140px] text-[22px]" style={{ color: "#6b7c99" }}>
          Horarios convertidos desde la hora de México. Se ajustan solos con el horario de verano. +1 = día siguiente.
        </Entra>
      </Contenido>
    </>
  );
}

function Dia({ n }: { n: number }) {
  return (
    <sup className="ml-1 text-[17px] font-bold" style={{ color: "#e8c060" }}>
      {n > 0 ? `+${n}` : n}
    </sup>
  );
}

function HorariosLatam() {
  return (
    <TablaHoras
      zonas={ZONAS_LATAM}
      rotulo="Tu hora"
      titulo="Latinoamérica y España"
      subtitulo="Los mismos horarios, en la hora de tu país"
    />
  );
}

function HorariosEeuu() {
  return (
    <TablaHoras
      zonas={ZONAS_EEUU}
      rotulo="Tu hora"
      titulo="Estados Unidos"
      subtitulo="Los mismos horarios, en la hora de tu zona"
    />
  );
}

/* ───────────────────────── 4 · Activa tu cuenta ───────────────────────── */

function ActivaTuCuenta() {
  return (
    <>
      <div className="absolute inset-0 bg-[#05091a]" />
      <Entra zoom d={0} className="absolute inset-x-0 top-0 h-[calc(50%+340px)]">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/presentacion/activa-tu-cuenta.jpg"
          alt="Formulario de activación de cuenta del Club en una laptop"
          className="h-full w-full object-cover"
          draggable={false}
        />
      </Entra>
      <div
        className="absolute inset-0"
        style={{
          background:
            "linear-gradient(180deg, rgba(5,9,26,0.25) 0%, transparent 25%, rgba(5,9,26,0.55) 62%, #05091a 88%), radial-gradient(1000px 520px at 6% 100%, rgba(36,104,255,0.34), transparent 65%), radial-gradient(800px 460px at 100% 100%, rgba(201,160,64,0.14), transparent 65%)",
        }}
      />
<Contenido>
      <Marca />

      <div className="absolute bottom-[96px] left-[140px]">
        <Entra d={350} className={cn(e.titulo, "text-[188px] font-bold leading-[0.95] text-white")}>
          Activa tu cuenta
        </Entra>
        <Entra d={600} className="mt-9 flex items-center gap-7">
          <span
            className={cn(e.anilloOro, e.pulso, "flex h-[92px] w-[92px] items-center justify-center rounded-full")}
            style={{ color: "#1a1200" }}
          >
            <Gift size={46} strokeWidth={2.2} />
          </span>
          <span className={cn(e.titulo, e.oroTexto, "text-[84px] font-semibold leading-none")}>y recibe tu regalo</span>
        </Entra>
      </div>
</Contenido>
    </>
  );
}

/* ───────────────────────── 5 · Actualizaciones ───────────────────────── */

const ACTUALIZACIONES = [
  { titulo: "Infracciones y baneos", foto: "infracciones", estado: "Próximamente" },
  { titulo: "Mentalidad de creador", foto: "mentalidad", estado: "Próximamente" },
  { titulo: "Monetiza con Avatars", foto: "avatars", detalle: "Crea tu primer avatar de IA", estado: "Próximamente" },
  { titulo: "Automatizaciones de contenido", foto: "automatizaciones", estado: "Próximamente" },
] as const;

function Actualizaciones() {
  return (
    <>
      <Fondo />
<Contenido>
      <Marca />

      <div className="absolute left-[140px] top-[84px]">
        <Rotulo>Novedades de las clases</Rotulo>
        <Entra d={250} className={cn(e.titulo, "mt-7 text-[150px] font-bold leading-none text-white")}>
          Actualizaciones
        </Entra>
      </div>

      <div className="absolute left-[140px] top-[400px] grid w-[1640px] grid-cols-4 gap-8">
        {ACTUALIZACIONES.map((c, i) => (
          <Entra
            key={c.titulo}
            d={500 + i * 160}
            className={cn(e.cristal, "overflow-hidden rounded-[32px]")}
            style={{ height: 590 }}
          >
            <div className="relative h-[262px] overflow-hidden">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={`/presentacion/cursos/${c.foto}.jpg`}
                alt=""
                className="h-full w-full object-cover"
                draggable={false}
              />
              <div
                className="absolute inset-0"
                style={{ background: "linear-gradient(180deg, transparent 55%, rgba(8,14,34,0.7) 100%)" }}
              />
              <span
                className="absolute left-5 top-5 flex h-12 w-12 items-center justify-center rounded-full text-[20px] font-bold"
                style={{ background: "rgba(5,9,26,0.7)", border: "1.5px solid rgba(232,192,96,0.7)", color: "#e8c060" }}
              >
                {i + 1}
              </span>
            </div>
            <div className="px-8 pb-8 pt-7">
              <div className={cn(e.titulo, "text-[38px] font-bold leading-[1.12] text-white")}>{c.titulo}</div>
              {"detalle" in c && (
                <div className="mt-4 text-balance text-[26px] leading-snug" style={{ color: "#a8b8d0" }}>
                  {c.detalle}
                </div>
              )}
              {"estado" in c && (
                <div
                  className="mt-6 inline-flex items-center gap-3 rounded-full px-5 py-2.5 text-[22px] font-semibold uppercase tracking-[0.12em]"
                  style={{ color: "#e8c060", border: "1.5px solid rgba(232,192,96,0.55)", background: "rgba(232,192,96,0.08)" }}
                >
                  <Clock size={22} />
                  {c.estado}
                </div>
              )}
            </div>
          </Entra>
        ))}
      </div>
</Contenido>
    </>
  );
}

/* ───────────────────────── 6 · Cierre ───────────────────────── */

function Cierre() {
  return (
    <>
      <Fondo />
      <div
        className="absolute inset-0"
        style={{ background: "radial-gradient(760px 560px at 50% 42%, rgba(201,160,64,0.16), transparent 70%)" }}
      />
      <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
        <Entra zoom d={100}>
          <Logo size={300} pulso />
        </Entra>
        <Entra d={500} className={cn(e.titulo, "mt-14 text-[132px] font-bold leading-none text-white")}>
          ¡Bienvenido al Club!
        </Entra>
        <div
          className={cn(e.barra, "mt-10 h-[7px] w-[320px] rounded-full")}
          style={{ ["--d" as string]: 800, background: "linear-gradient(90deg,#ffd97d,#c9a040)" }}
        />
        <Entra d={950} className="mt-10 text-[42px] font-light" style={{ color: "#d6e0ee" }}>
          ¿Dudas? Escríbele a Soporte.
        </Entra>
      </div>
    </>
  );
}

const CONTENIDO: Record<IdDiapositiva, () => ReactNode> = {
  portada: Portada,
  normas: Normas,
  horarios: Horarios,
  "horarios-latam": HorariosLatam,
  "horarios-eeuu": HorariosEeuu,
  "activa-tu-cuenta": ActivaTuCuenta,
  actualizaciones: Actualizaciones,
  cierre: Cierre,
};

export function Diapositiva({ id }: { id: IdDiapositiva }) {
  const Contenido = CONTENIDO[id];
  return <Contenido />;
}
