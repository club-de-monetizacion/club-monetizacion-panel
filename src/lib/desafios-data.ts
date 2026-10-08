/**
 * Las lecturas de Desafíos: el perfil de una persona y la tabla clasificatoria.
 * Solo lee. Las fechas salen como texto ISO para poder pasarlas a los componentes
 * del navegador.
 */
import { prisma } from "@/lib/prisma";
import {
  ES_DE_DINERO,
  audienciaTotal,
  mejorPorRed,
  nivelDe,
  puntosDe,
  puntosTotales,
  type Nivel,
} from "@/lib/desafios";
import type { EstadoLogro, RedSocial, TipoLogro } from "@prisma/client";

export type PuntoHistorial = { seguidores: number; fecha: string; nota: string | null };

export type CuentaVista = {
  id: string;
  red: RedSocial;
  nombre: string;
  url: string;
  foto: string | null;
  seguidores: number;
  leidoDeLaRed: string | null;
  historial: PuntoHistorial[];
};

export type LogroVista = {
  id: string;
  clave: string;
  tipo: TipoLogro;
  red: RedSocial | null;
  umbral: number;
  estado: EstadoLogro;
  enlace: string | null;
  /** La imagen de la prueba (solo en las pantallas que la enseñan) */
  captura: string | null;
  tieneCaptura: boolean;
  nota: string | null;
  origenClave: string | null;
  creadoEn: string;
  revocadoEn: string | null;
  revocadoPor: string | null;
  motivoRevocacion: string | null;
};

export type IngresoVista = {
  id: string;
  red: RedSocial;
  /** El primer día del mes, en ISO */
  mes: string;
  /** Dólares, con centavos */
  monto: number;
  nota: string | null;
  captura: string | null;
  tieneCaptura: boolean;
};

export type PerfilVista = {
  id: string;
  /** `null` en los perfiles de demostración */
  userId: string | null;
  esDemo: boolean;
  nombre: string;
  bio: string | null;
  nicho: string | null;
  foto: string | null;
  visible: boolean;
  ocultoPorEquipo: boolean;
  notaEquipo: string | null;
  /** Lo que la persona decidió mostrar. Quien mira siempre recibe lo que le toca ver. */
  mostrarSeguidores: boolean;
  mostrarIngresos: boolean;
  /** Verdadero si a quien mira se le **quitaron** esas cifras (no es su perfil ni es del equipo) */
  seguidoresOcultos: boolean;
  ingresosOcultos: boolean;
  creadoEn: string;
  cuentas: CuentaVista[];
  logros: LogroVista[];
  ingresos: IngresoVista[];
  /** Dólares ganados en total */
  ingresosUsd: number;
  puntos: number;
  nivel: Nivel;
  audiencia: number;
};

/** Quién está mirando un perfil: de eso depende lo que se le enseña. */
export type Espectador = { esMio: boolean; esEquipo: boolean };

/** Cuántos puntos del historial de cada página se mandan al navegador. */
const HISTORIAL_MAX = 60;

const perfilInclude = {
  user: { select: { image: true } },
  cuentas: {
    orderBy: { createdAt: "asc" as const },
    include: {
      avances: { orderBy: { createdAt: "desc" as const }, take: HISTORIAL_MAX },
    },
  },
  logros: { orderBy: { creadoEn: "desc" as const } },
  ingresos: { orderBy: { mes: "desc" as const } },
};

type PerfilConTodo = NonNullable<Awaited<ReturnType<typeof leerPerfil>>>;

function leerPerfil(where: { id: string } | { userId: string }) {
  return prisma.perfilCreador.findUnique({ where, include: perfilInclude });
}

function aVista(p: PerfilConTodo, conCapturas: boolean, espectador: Espectador): PerfilVista {
  // Su dueña y el equipo lo ven todo; los demás, solo lo que ella decidió mostrar.
  const verTodo = espectador.esMio || espectador.esEquipo;
  const ocultaSeguidores = !verTodo && !p.mostrarSeguidores;
  const ocultaIngresos = !verTodo && !p.mostrarIngresos;

  const cuentasCompletas: CuentaVista[] = p.cuentas.map((c) => ({
    id: c.id,
    red: c.red,
    nombre: c.nombre,
    url: c.url,
    foto: c.foto,
    seguidores: c.seguidores,
    leidoDeLaRed: c.leidoDeLaRed?.toISOString() ?? null,
    // Del más antiguo al más reciente, para dibujar la línea de izquierda a derecha.
    historial: [...c.avances].reverse().map((a) => ({
      seguidores: a.seguidores,
      fecha: a.createdAt.toISOString(),
      nota: a.nota,
    })),
  }));
  const logrosCompletos: LogroVista[] = p.logros.map((l) => ({
    id: l.id,
    clave: l.clave,
    tipo: l.tipo,
    red: l.red,
    umbral: l.umbral,
    estado: l.estado,
    enlace: l.enlace,
    // Las capturas pesan: solo viajan a las pantallas que las enseñan.
    captura: conCapturas ? l.captura : null,
    tieneCaptura: !!l.captura,
    nota: l.nota,
    origenClave: l.origenClave,
    creadoEn: l.creadoEn.toISOString(),
    revocadoEn: l.revocadoEn?.toISOString() ?? null,
    revocadoPor: l.revocadoPor,
    motivoRevocacion: l.motivoRevocacion,
  }));
  const ingresosCompletos: IngresoVista[] = p.ingresos.map((i) => ({
    id: i.id,
    red: i.red,
    mes: i.mes.toISOString(),
    monto: i.centavos / 100,
    nota: i.nota,
    captura: conCapturas ? i.captura : null,
    tieneCaptura: !!i.captura,
  }));

  // Los puntos y el nivel se calculan con **todo**, para que no cambien según quién mira.
  const puntos = puntosTotales(logrosCompletos);
  const audiencia = audienciaTotal(cuentasCompletas);
  const ingresosUsd = p.ingresos.reduce((s, i) => s + i.centavos, 0) / 100;

  // Lo oculto se quita aquí, en el servidor: nunca viaja al navegador de quien no debe verlo.
  const cuentas = ocultaSeguidores
    ? cuentasCompletas.map((c) => ({ ...c, seguidores: 0, historial: [], leidoDeLaRed: null }))
    : cuentasCompletas;
  const logros = ocultaIngresos
    ? logrosCompletos.filter((l) => !ES_DE_DINERO(l.tipo))
    : logrosCompletos;
  return {
    id: p.id,
    userId: p.userId,
    esDemo: p.esDemo,
    nombre: p.nombre,
    bio: p.bio,
    nicho: p.nicho,
    // Si no puso foto en Desafíos, se usa la de su cuenta.
    foto: p.foto ?? p.user?.image ?? null,
    visible: p.visible,
    ocultoPorEquipo: p.ocultoPorEquipo,
    notaEquipo: espectador.esEquipo ? p.notaEquipo : null,
    mostrarSeguidores: p.mostrarSeguidores,
    mostrarIngresos: p.mostrarIngresos,
    seguidoresOcultos: ocultaSeguidores,
    ingresosOcultos: ocultaIngresos,
    creadoEn: p.createdAt.toISOString(),
    cuentas,
    logros,
    ingresos: ocultaIngresos ? [] : ingresosCompletos,
    ingresosUsd: ocultaIngresos ? 0 : ingresosUsd,
    puntos,
    nivel: nivelDe(puntos),
    audiencia: ocultaSeguidores ? 0 : audiencia,
  };
}

/** El perfil de una persona por su usuario (lo ve ella misma, así que sale completo). */
export async function perfilDe(userId: string, conCapturas = true) {
  const p = await leerPerfil({ userId });
  return p ? aVista(p, conCapturas, { esMio: true, esEquipo: false }) : null;
}

/**
 * Un perfil por su id, tal como lo ve quien mira: su dueña y el equipo lo ven completo;
 * los demás, sin lo que ella decidió ocultar.
 */
export async function perfilVistoPor(
  id: string,
  quien: { userId: string; esEquipo: boolean },
  conCapturas = true,
) {
  const p = await leerPerfil({ id });
  if (!p) return null;
  return aVista(p, conCapturas, { esMio: p.userId !== null && p.userId === quien.userId, esEquipo: quien.esEquipo });
}

/* ── La tabla clasificatoria ───────────────────────────────────────────────── */

const DIAS_CRECIMIENTO = 30;

export type FilaTabla = {
  id: string;
  nombre: string;
  foto: string | null;
  nicho: string | null;
  esDemo: boolean;
  puntos: number;
  nivel: { numero: number; nombre: string };
  /** `null` si la persona decidió no mostrar sus seguidores */
  audiencia: number | null;
  /** Seguidores ganados en los últimos 30 días, entre todas sus páginas; `null` si los oculta */
  crecimiento: number | null;
  seguidoresOcultos: boolean;
  /** La página más grande de cada red */
  redes: { red: RedSocial; seguidores: number }[];
  insignias: number;
  /** Sus tres insignias de más valor, para lucirlas en la fila */
  destacadas: { tipo: TipoLogro; red: RedSocial | null; umbral: number }[];
  oculto: boolean;
};

/**
 * Todos los perfiles con sus cifras. Con `incluirOcultos` salen también los que la
 * persona o el equipo sacaron de la tabla (lo usa la pantalla de moderación).
 */
export async function filasDeLaTabla(incluirOcultos = false, verTodo = false): Promise<FilaTabla[]> {
  const corte = new Date(Date.now() - DIAS_CRECIMIENTO * 86_400_000);
  const perfiles = await prisma.perfilCreador.findMany({
    where: incluirOcultos ? {} : { visible: true, ocultoPorEquipo: false },
    include: {
      user: { select: { image: true } },
      cuentas: { select: { id: true, red: true, nombre: true, seguidores: true } },
      logros: { where: { estado: "ACTIVO" }, select: { clave: true, tipo: true, red: true, umbral: true, estado: true } },
    },
  });

  const cuentaIds = perfiles.flatMap((p) => p.cuentas.map((c) => c.id));
  // El último valor de cada página **antes** de la ventana (la base para medir)…
  const [antes, dentro] = await Promise.all([
    prisma.avanceCuenta.findMany({
      where: { cuentaId: { in: cuentaIds }, createdAt: { lt: corte } },
      orderBy: { createdAt: "desc" },
      distinct: ["cuentaId"],
      select: { cuentaId: true, seguidores: true },
    }),
    // …y el primero de dentro, por si la página nació dentro de la ventana.
    prisma.avanceCuenta.findMany({
      where: { cuentaId: { in: cuentaIds }, createdAt: { gte: corte } },
      orderBy: { createdAt: "asc" },
      distinct: ["cuentaId"],
      select: { cuentaId: true, seguidores: true },
    }),
  ]);
  const base = new Map<string, number>();
  for (const a of dentro) base.set(a.cuentaId, a.seguidores);
  for (const a of antes) base.set(a.cuentaId, a.seguidores);   // lo anterior manda

  return perfiles.map((p) => {
    const mejores = mejorPorRed(p.cuentas);
    const crecimiento = p.cuentas.reduce(
      (s, c) => s + Math.max(0, c.seguidores - (base.get(c.id) ?? c.seguidores)),
      0,
    );
    const puntos = puntosTotales(p.logros);
    const n = nivelDe(puntos);
    const oculta = !verTodo && !p.mostrarSeguidores;
    // Las insignias de dinero también delatan cuánto gana: si lo oculta, no se lucen.
    const lucibles = verTodo || p.mostrarIngresos ? p.logros : p.logros.filter((l) => !ES_DE_DINERO(l.tipo));
    return {
      id: p.id,
      nombre: p.nombre,
      foto: p.foto ?? p.user?.image ?? null,
      nicho: p.nicho,
      esDemo: p.esDemo,
      puntos,
      nivel: { numero: n.numero, nombre: n.nombre },
      audiencia: oculta ? null : audienciaTotal(p.cuentas),
      crecimiento: oculta ? null : crecimiento,
      seguidoresOcultos: oculta,
      redes: oculta
        ? []
        : (Object.entries(mejores) as [RedSocial, number][]).map(([red, seguidores]) => ({
            red,
            seguidores,
          })),
      insignias: lucibles.length,
      destacadas: [...lucibles]
        .sort((a, b) => puntosDe(b.tipo, b.umbral) - puntosDe(a.tipo, a.umbral))
        .slice(0, 3)
        .map(({ tipo, red, umbral }) => ({ tipo, red, umbral })),
      oculto: !p.visible || p.ocultoPorEquipo,
    };
  });
}

export type Orden = "puntos" | "audiencia" | "crecimiento";

export function ordenar(filas: FilaTabla[], por: Orden): FilaTabla[] {
  // Quien oculta sus seguidores no entra en las tablas que los usan.
  const clave = (f: FilaTabla) => f[por] ?? -1;
  return [...filas].sort(
    (a, b) => clave(b) - clave(a) || b.puntos - a.puntos || a.nombre.localeCompare(b.nombre),
  );
}

/** Las insignias de video reclamadas en los últimos `dias`, para que el equipo las revise. */
export async function reclamosRecientes(dias = 14) {
  const desde = new Date(Date.now() - dias * 86_400_000);
  return prisma.logroCreador.findMany({
    where: { tipo: { in: ["VISTAS", "LIKES"] }, origenClave: null, creadoEn: { gte: desde } },
    orderBy: { creadoEn: "desc" },
    take: 50,
    include: { perfil: { select: { id: true, nombre: true } } },
  });
}
