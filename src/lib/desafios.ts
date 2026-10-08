/**
 * Desafíos: el catálogo de insignias y las cuentas del juego.
 *
 * Nada de aquí toca la base de datos. Qué escalones hay, cuántos puntos valen y cómo
 * se calcula el nivel viven en este archivo, así que cambiar un escalón (o añadir uno
 * más alto) no pide migrar nada: las insignias ganadas se guardan por su `clave`.
 */
import type { FormatoVideo, RedSocial, TipoLogro } from "@prisma/client";

/* ── Las redes ─────────────────────────────────────────────────────────────── */

export const REDES: RedSocial[] = ["INSTAGRAM", "TIKTOK", "YOUTUBE", "FACEBOOK"];

export const RED_INFO: Record<
  RedSocial,
  { nombre: string; color: string; ejemplo: string; dominios: string[] }
> = {
  INSTAGRAM: {
    nombre: "Instagram",
    color: "#EC4899",
    ejemplo: "https://instagram.com/tu_usuario",
    dominios: ["instagram.com"],
  },
  TIKTOK: {
    nombre: "TikTok",
    color: "#22d3ee",
    ejemplo: "https://tiktok.com/@tu_usuario",
    dominios: ["tiktok.com"],
  },
  YOUTUBE: {
    nombre: "YouTube",
    color: "#EF4444",
    ejemplo: "https://youtube.com/@tu_canal",
    dominios: ["youtube.com", "youtu.be"],
  },
  FACEBOOK: {
    nombre: "Facebook",
    color: "#3B82F6",
    ejemplo: "https://facebook.com/tu_pagina",
    dominios: ["facebook.com", "fb.com", "fb.watch"],
  },
};

/** ¿Este dominio es de esa red? Acepta subdominios (`www.`, `m.`, `vm.`…). */
export function esDeLaRed(host: string, red: RedSocial): boolean {
  return RED_INFO[red].dominios.some((d) => host === d || host.endsWith(`.${d}`));
}

/** De qué red es un enlace, por su dominio; `null` si no es de ninguna de las cuatro. */
export function detectarRed(bruta: string): RedSocial | null {
  let texto = bruta.trim();
  if (!texto) return null;
  if (!/^https?:\/\//i.test(texto)) texto = `https://${texto}`;
  try {
    const host = new URL(texto).hostname.toLowerCase().replace(/^www\./, "");
    return REDES.find((r) => esDeLaRed(host, r)) ?? null;
  } catch {
    return null;
  }
}

/**
 * Deja la dirección de una página en una forma única, para que la misma página no
 * entre dos veces escrita distinto: sin `www`, sin parámetros de rastreo, sin barra
 * final. Devuelve `null` si no es una dirección válida de esa red.
 */
export function normalizarUrlCuenta(
  bruta: string,
  red: RedSocial,
): { url: string; usuario: string | null } | null {
  let texto = bruta.trim();
  if (!texto) return null;
  if (!/^https?:\/\//i.test(texto)) texto = `https://${texto}`;
  let u: URL;
  try {
    u = new URL(texto);
  } catch {
    return null;
  }
  if (u.protocol !== "https:" && u.protocol !== "http:") return null;
  const host = u.hostname.toLowerCase().replace(/^www\./, "");
  if (!esDeLaRed(host, red)) return null;

  const ruta = u.pathname.replace(/\/+$/, "");
  // Sin ruta es solo el dominio, no una página.
  if (!ruta) return null;

  const [primero, segundo] = ruta.split("/").filter(Boolean);
  let usuario: string | null = null;
  if (primero?.startsWith("@")) usuario = primero;
  else if (["channel", "c", "user"].includes(primero ?? "") && segundo) usuario = segundo;
  else if (primero && !["profile.php", "pages", "people"].includes(primero)) usuario = primero;

  // Facebook identifica algunas páginas por `?id=`; es lo único que se conserva.
  const id = u.pathname.endsWith("profile.php") ? u.searchParams.get("id") : null;
  const resto = id ? `?id=${id}` : "";
  return { url: `https://${host}${ruta}${resto}`, usuario };
}

/* ── Videos por página ─────────────────────────────────────────────────────── */

/** Cómo se llama cada formato de YouTube, completo y corto. */
export const FORMATO_INFO: Record<FormatoVideo, { largo: string; corto: string; explica: string }> = {
  VERTICAL: { largo: "Shorts · vertical", corto: "Short", explica: "videos verticales (Shorts)" },
  HORIZONTAL: { largo: "Videos largos · horizontal", corto: "Largo", explica: "videos horizontales (largos)" },
};

/** En YouTube se cuentan aparte los verticales (Shorts) y los horizontales; en el resto, no. */
export const formatosDe = (red: RedSocial): (FormatoVideo | null)[] =>
  red === "YOUTUBE" ? ["VERTICAL", "HORIZONTAL"] : [null];

/**
 * Qué formato es un video de YouTube, según su enlace: los Shorts llevan `/shorts/`. En las
 * demás redes no hay formatos y devuelve `null`.
 */
export function formatoDeEnlace(url: string, red: RedSocial): FormatoVideo | null {
  if (red !== "YOUTUBE") return null;
  try {
    return new URL(url).pathname.toLowerCase().startsWith("/shorts/") ? "VERTICAL" : "HORIZONTAL";
  } catch {
    return null;
  }
}

/**
 * Deja limpio el enlace de un video y comprueba que sea de la red de su página: un video
 * de TikTok no vale como prueba de una página de Instagram. `null` si no es válido.
 */
export function normalizarEnlaceVideo(bruto: string, red: RedSocial): string | null {
  let texto = bruto.trim();
  if (!texto) return null;
  if (!/^https?:\/\//i.test(texto)) texto = `https://${texto}`;
  try {
    const u = new URL(texto);
    if (u.protocol !== "https:" && u.protocol !== "http:") return null;
    const host = u.hostname.toLowerCase().replace(/^www\./, "");
    if (!esDeLaRed(host, red)) return null;
    // Solo el dominio no es un video.
    if (u.pathname.replace(/\/+$/, "") === "" && !u.searchParams.has("v")) return null;
    return u.toString();
  } catch {
    return null;
  }
}

/** La clave de una insignia de vistas: pertenece a una página y, en YouTube, a un formato. */
export const claveVideo = (cuentaId: string, formato: FormatoVideo | null, umbral: number) =>
  `VISTAS:${cuentaId}:${formato ?? "-"}:${umbral}`;

/* ── Los escalones ─────────────────────────────────────────────────────────── */

/** Seguidores en una sola red, y el total sumando todas. */
export const ESCALERA_SEGUIDORES = [
  100, 500, 1_000, 5_000, 10_000, 25_000, 50_000, 100_000, 250_000, 500_000,
  1_000_000, 5_000_000, 10_000_000,
];
export const ESCALERA_AUDIENCIA = [
  1_000, 5_000, 10_000, 25_000, 50_000, 100_000, 250_000, 500_000, 1_000_000,
  5_000_000, 10_000_000, 50_000_000,
];
/** «Un video con N vistas», en cada página (y en YouTube, en cada formato). */
export const ESCALERA_VISTAS = [
  1_000, 5_000, 10_000, 50_000, 100_000, 500_000, 1_000_000, 5_000_000,
  10_000_000, 50_000_000, 100_000_000,
];
/** «Mi primer video con N likes». */
export const ESCALERA_LIKES = [
  100, 500, 1_000, 5_000, 10_000, 50_000, 100_000, 500_000, 1_000_000,
];

/** Dinero ganado en total, en dólares: del primer dólar al millón. */
export const ESCALERA_INGRESOS = [
  1, 100, 500, 1_000, 5_000, 10_000, 50_000, 100_000, 500_000, 1_000_000,
];
/** Un solo escalón: haber activado la monetización en alguna plataforma. */
export const ESCALERA_MONETIZACION = [1];

export function escaleraDe(tipo: TipoLogro): number[] {
  switch (tipo) {
    case "SEGUIDORES": return ESCALERA_SEGUIDORES;
    case "AUDIENCIA": return ESCALERA_AUDIENCIA;
    case "VISTAS": return ESCALERA_VISTAS;
    case "LIKES": return ESCALERA_LIKES;
    case "MONETIZACION": return ESCALERA_MONETIZACION;
    case "INGRESOS": return ESCALERA_INGRESOS;
  }
}

/**
 * Seguidores, audiencia e ingresos se ganan solos al anotar la cifra; vistas, likes y
 * haber activado la monetización se reclaman.
 */
export const SE_RECLAMA: Record<TipoLogro, boolean> = {
  SEGUIDORES: false,
  AUDIENCIA: false,
  VISTAS: true,
  LIKES: true,
  MONETIZACION: true,
  INGRESOS: false,
};

/** Las insignias de dinero. Su dueña decide si los demás las ven (`mostrarIngresos`). */
export const ES_DE_DINERO = (tipo: TipoLogro) => tipo === "INGRESOS";

export function claveLogro(tipo: TipoLogro, umbral: number, red?: RedSocial | null): string {
  return tipo === "SEGUIDORES" ? `${tipo}:${red}:${umbral}` : `${tipo}:${umbral}`;
}

/** Los escalones de la misma serie por debajo de uno dado (para concederlos de regalo). */
export function escalonesPorDebajo(tipo: TipoLogro, umbral: number): number[] {
  return escaleraDe(tipo).filter((n) => n < umbral);
}

/* ── Rangos, puntos y niveles ──────────────────────────────────────────────── */

export type Rango = {
  nombre: string;
  /** Color principal de la insignia */
  color: string;
  /** El tono claro, para el brillo */
  claro: string;
  emoji: string;
};

const RANGOS: { desde: number; rango: Rango }[] = [
  { desde: 0, rango: { nombre: "Bronce", color: "#b8743a", claro: "#e2a36b", emoji: "🥉" } },
  { desde: 1_000, rango: { nombre: "Plata", color: "#9aa8bd", claro: "#dbe4f2", emoji: "🥈" } },
  { desde: 10_000, rango: { nombre: "Oro", color: "#c9a040", claro: "#ffd97d", emoji: "🥇" } },
  { desde: 100_000, rango: { nombre: "Platino", color: "#4fd1c5", claro: "#b8f3ec", emoji: "💠" } },
  { desde: 1_000_000, rango: { nombre: "Diamante", color: "#4f8bff", claro: "#b9d3ff", emoji: "💎" } },
  { desde: 10_000_000, rango: { nombre: "Leyenda", color: "#c084fc", claro: "#ecd2ff", emoji: "👑" } },
];

/** El rango según la cifra del escalón: igual para seguidores, vistas y likes. */
export function rangoDe(umbral: number): Rango {
  let actual = RANGOS[0].rango;
  for (const r of RANGOS) if (umbral >= r.desde) actual = r.rango;
  return actual;
}

/**
 * El rango de una insignia. Casi siempre sale de la cifra, pero haber activado la
 * monetización vale oro aunque su «cifra» sea un 1.
 */
export function rangoLogro(tipo: TipoLogro, umbral: number): Rango {
  return tipo === "MONETIZACION" ? rangoDe(10_000) : rangoDe(umbral);
}

/** Puntos de un escalón: crecen despacio con la cifra, para que cada salto cuente. */
export function puntosDe(tipo: TipoLogro, umbral: number): number {
  // Activar la monetización es el primer gran hito: un valor fijo.
  if (tipo === "MONETIZACION") return 60;
  // El dinero es la meta de fondo del Club: pesa más que una cifra de seguidores.
  if (tipo === "INGRESOS") return Math.round((Math.log10(umbral) + 1) ** 2 * 8);
  const base = Math.round(Math.log10(umbral) ** 2 * 5);
  // La audiencia total repite lo que ya cuentan las redes sueltas: vale menos.
  if (tipo === "AUDIENCIA") return Math.round(base * 0.6);
  // Cada página tiene su propia escalera de vistas: valen un poco menos para que tener
  // muchas páginas no dispare los puntos.
  if (tipo === "VISTAS") return Math.round(base * 0.75);
  return base;
}

const NIVELES = [
  "Semilla", "Brote", "Explorador", "Creador", "Constante",
  "Influyente", "Estrella", "Referente", "Titán", "Leyenda",
];

/** El nombre de un nivel por su número (el 1 es «Semilla»). */
export const nombreNivel = (numero: number) =>
  NIVELES[Math.max(0, Math.min(numero - 1, NIVELES.length - 1))];

export type Nivel = {
  numero: number;
  nombre: string;
  /** Puntos con los que empezó este nivel */
  desde: number;
  /** Puntos con los que empieza el siguiente */
  hasta: number;
  /** 0–1 dentro del nivel */
  avance: number;
};

/** Cuántos puntos hacen falta para llegar al nivel `n` (el 1 es el de partida). */
export const puntosParaNivel = (n: number) => (n <= 1 ? 0 : 30 * (n - 1) ** 2);

/** Todos los niveles con nombre, de partida a cima, para enseñarlos en una galería. */
export const TODOS_LOS_NIVELES = NIVELES.map((nombre, i) => ({
  numero: i + 1,
  nombre,
  desde: puntosParaNivel(i + 1),
}));

/**
 * Cómo se ve la etiqueta de un nivel: del 1 (discreta) al 6 (la más llamativa). Cuanto más
 * alto el nivel, más brilla y más se mueve, para que quien llega vea qué hay al fondo.
 *   1 · niveles 1-2   sobria
 *   2 · niveles 3-4   dorada
 *   3 · niveles 5-6   dorada con destello
 *   4 · niveles 7-8   borde de aurora que gira
 *   5 · nivel 9       resplandor que late
 *   6 · nivel 10+     holográfica, con chispas
 */
export function estiloNivel(numero: number): 1 | 2 | 3 | 4 | 5 | 6 {
  if (numero >= 10) return 6;
  if (numero >= 9) return 5;
  if (numero >= 7) return 4;
  if (numero >= 5) return 3;
  if (numero >= 3) return 2;
  return 1;
}

export function nivelDe(puntos: number): Nivel {
  const numero = Math.floor(Math.sqrt(Math.max(0, puntos) / 30)) + 1;
  const desde = puntosParaNivel(numero);
  const hasta = puntosParaNivel(numero + 1);
  return {
    numero,
    nombre: nombreNivel(numero),
    desde,
    hasta,
    avance: Math.min(1, (puntos - desde) / (hasta - desde)),
  };
}

/* ── Cifras ────────────────────────────────────────────────────────────────── */

/** 1.250 → «1.2K», 3.400.000 → «3.4M». Para insignias y metas, donde sobra espacio poco. */
export function abreviar(n: number): string {
  const redondea = (v: number) => (v >= 100 ? Math.round(v) : Math.round(v * 10) / 10);
  if (n >= 1_000_000_000) return `${redondea(n / 1_000_000_000)}B`;
  if (n >= 1_000_000) return `${redondea(n / 1_000_000)}M`;
  if (n >= 1_000) return `${redondea(n / 1_000)}K`;
  return String(n);
}

export const entero = (n: number) => new Intl.NumberFormat("es-MX").format(n);

/** «$1,250». Siempre dólares. */
export const dolares = (n: number) => `$${entero(Math.round(n))}`;

/** «$1,250.50»: dinero con centavos, para las filas de ingresos. */
export const dolaresExactos = (n: number) =>
  `$${n.toLocaleString("es-MX", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

/** La cifra de una insignia o meta, con su unidad: «5K», «$1K». */
export function etiquetaCifra(tipo: TipoLogro, umbral: number): string {
  if (tipo === "MONETIZACION") return "$";
  return tipo === "INGRESOS" ? `$${abreviar(umbral)}` : abreviar(umbral);
}

/** Lo que falta o lo que hay, con su unidad. */
export const cifraDe = (tipo: TipoLogro, n: number) =>
  tipo === "INGRESOS" ? dolares(n) : entero(n);

/* ── Textos de las insignias ───────────────────────────────────────────────── */

export function tituloLogro(
  tipo: TipoLogro,
  umbral: number,
  red?: RedSocial | null,
  formato?: FormatoVideo | null,
): string {
  const cifra = abreviar(umbral);
  switch (tipo) {
    case "SEGUIDORES": return `${cifra} en ${red ? RED_INFO[red].nombre : "una red"}`;
    case "AUDIENCIA": return `${cifra} de audiencia`;
    case "VISTAS": return `Un video de ${cifra} vistas${formato ? ` · ${FORMATO_INFO[formato].corto}` : ""}`;
    case "LIKES": return `Un video de ${cifra} likes`;
    case "MONETIZACION": return "Monetización activada";
    case "INGRESOS": return `$${cifra} ganados`;
  }
}

export function descripcionLogro(tipo: TipoLogro, umbral: number, red?: RedSocial | null): string {
  const cifra = entero(umbral);
  switch (tipo) {
    case "SEGUIDORES": return `Llega a ${cifra} seguidores en ${red ? RED_INFO[red].nombre : "una de tus redes"}.`;
    case "AUDIENCIA": return `Suma ${cifra} seguidores entre todas tus redes.`;
    case "VISTAS": return `Publica un video que llegue a ${cifra} vistas.`;
    case "LIKES": return `Publica un video que llegue a ${cifra} likes.`;
    case "MONETIZACION": return "Activa la monetización en cualquiera de tus plataformas.";
    case "INGRESOS": return `Gana ${dolares(umbral)} en total con tu contenido.`;
  }
}

/* ── El estado de una persona ──────────────────────────────────────────────── */

export type CuentaMin = { id: string; red: RedSocial; nombre: string; seguidores: number };
export type LogroMin = {
  clave: string;
  tipo: TipoLogro;
  red: RedSocial | null;
  umbral: number;
  estado: "ACTIVO" | "REVOCADO";
};

/** Los puntos de una persona: la suma de sus insignias vigentes. */
export function puntosTotales(logros: LogroMin[]): number {
  return logros
    .filter((l) => l.estado === "ACTIVO")
    .reduce((s, l) => s + puntosDe(l.tipo, l.umbral), 0);
}

/** Seguidores de la página más grande de cada red. */
export function mejorPorRed(cuentas: CuentaMin[]): Partial<Record<RedSocial, number>> {
  const out: Partial<Record<RedSocial, number>> = {};
  for (const c of cuentas) out[c.red] = Math.max(out[c.red] ?? 0, c.seguidores);
  return out;
}

export const audienciaTotal = (cuentas: CuentaMin[]) =>
  cuentas.reduce((s, c) => s + c.seguidores, 0);

/**
 * Los escalones de seguidores, audiencia e ingresos que alcanza una persona con sus
 * cifras actuales. Es lo que se concede solo cuando anota un avance. Si ya ganó algo de
 * dinero, la monetización cuenta como activada: no hace falta reclamarla aparte.
 */
export function logrosAlcanzados(
  cuentas: CuentaMin[],
  ingresosUsd = 0,
): { clave: string; tipo: TipoLogro; red: RedSocial | null; umbral: number }[] {
  const out: { clave: string; tipo: TipoLogro; red: RedSocial | null; umbral: number }[] = [];
  const mejores = mejorPorRed(cuentas);
  for (const red of REDES) {
    const n = mejores[red] ?? 0;
    for (const umbral of ESCALERA_SEGUIDORES) {
      if (n >= umbral) out.push({ clave: claveLogro("SEGUIDORES", umbral, red), tipo: "SEGUIDORES", red, umbral });
    }
  }
  const total = audienciaTotal(cuentas);
  for (const umbral of ESCALERA_AUDIENCIA) {
    if (total >= umbral) out.push({ clave: claveLogro("AUDIENCIA", umbral), tipo: "AUDIENCIA", red: null, umbral });
  }
  if (ingresosUsd >= 1) {
    out.push({ clave: claveLogro("MONETIZACION", 1), tipo: "MONETIZACION", red: null, umbral: 1 });
    for (const umbral of ESCALERA_INGRESOS) {
      if (ingresosUsd >= umbral) out.push({ clave: claveLogro("INGRESOS", umbral), tipo: "INGRESOS", red: null, umbral });
    }
  }
  return out;
}

export type Meta = {
  tipo: TipoLogro;
  red: RedSocial | null;
  umbral: number;
  /** Dónde está ahora; `null` si no se mide (vistas y likes se reclaman) */
  actual: number | null;
  /** Lo que falta; `null` si no se mide */
  falta: number | null;
  /** 0–1 desde el escalón anterior hasta este; `null` si no se mide */
  avance: number | null;
  titulo: string;
  /** De qué página es (en las metas de video): «en lucia.finanzas · Short» */
  detalle?: string;
  formato?: FormatoVideo | null;
};

/**
 * Las próximas metas de una persona. **Lo primero es siempre activar la monetización**,
 * mientras no la tenga. Después van las que se miden (seguidores por red, audiencia e
 * ingresos), las más cercanas primero, y al final vistas y likes, que no tienen cifra
 * con la que medirlas.
 */
export function proximasMetas(cuentas: CuentaMin[], logros: LogroMin[], ingresosUsd = 0): Meta[] {
  const claves = new Set(logros.filter((l) => l.estado === "ACTIVO").map((l) => l.clave));
  // Un escalón revocado no se ofrece como meta: quien lo quitó fue el equipo.
  const revocadas = new Set(logros.filter((l) => l.estado === "REVOCADO").map((l) => l.clave));

  const medidas: Meta[] = [];
  const serie = (
    tipo: TipoLogro,
    red: RedSocial | null,
    actual: number,
    escalera: number[],
  ) => {
    const siguiente = escalera.find((u) => {
      const k = claveLogro(tipo, u, red);
      return actual < u && !claves.has(k) && !revocadas.has(k);
    });
    if (!siguiente) return;
    const previo = [...escalera].reverse().find((u) => u <= actual) ?? 0;
    medidas.push({
      tipo, red, umbral: siguiente, actual,
      falta: siguiente - actual,
      avance: Math.max(0, Math.min(1, (actual - previo) / (siguiente - previo))),
      titulo: tituloLogro(tipo, siguiente, red),
    });
  };

  const mejores = mejorPorRed(cuentas);
  // Solo las redes que la persona ya dio de alta: no se le exige una que no usa.
  for (const red of REDES) {
    if (red in mejores) serie("SEGUIDORES", red, mejores[red] ?? 0, ESCALERA_SEGUIDORES);
  }
  if (cuentas.length > 0) serie("AUDIENCIA", null, audienciaTotal(cuentas), ESCALERA_AUDIENCIA);
  // Los ingresos solo se miden cuando ya monetiza (o ya anotó dinero): antes la meta es activarla.
  const monetizaClave = claveLogro("MONETIZACION", 1);
  const monetiza = claves.has(monetizaClave) || ingresosUsd > 0;
  if (monetiza) serie("INGRESOS", null, ingresosUsd, ESCALERA_INGRESOS);

  // Las más avanzadas primero; a igual avance, las que faltan menos.
  medidas.sort((a, b) => (b.avance ?? 0) - (a.avance ?? 0) || (a.falta ?? 0) - (b.falta ?? 0));

  const sinMedir: Meta[] = [];

  // Videos: el escalón más bajo que le falta a alguna de sus páginas (y formatos). Se ofrece
  // uno solo, el más fácil, para no llenar la pantalla de metas.
  let video: Meta | null = null;
  for (const c of cuentas) {
    for (const formato of formatosDe(c.red)) {
      const u = ESCALERA_VISTAS.find((n) => {
        const k = claveVideo(c.id, formato, n);
        return !claves.has(k) && !revocadas.has(k);
      });
      if (u && (!video || u < video.umbral)) {
        video = {
          tipo: "VISTAS", red: c.red, umbral: u, actual: null, falta: null, avance: null,
          titulo: tituloLogro("VISTAS", u, c.red, formato),
          detalle: c.nombre,
          formato,
        };
      }
    }
  }
  if (video) sinMedir.push(video);

  const likes = ESCALERA_LIKES.find((n) => {
    const k = claveLogro("LIKES", n);
    return !claves.has(k) && !revocadas.has(k);
  });
  if (likes) {
    sinMedir.push({
      tipo: "LIKES", red: null, umbral: likes, actual: null, falta: null, avance: null,
      titulo: tituloLogro("LIKES", likes),
    });
  }
  const activar: Meta[] =
    monetiza || revocadas.has(monetizaClave)
      ? []
      : [{
          tipo: "MONETIZACION", red: null, umbral: 1, actual: null, falta: null, avance: null,
          // Como meta se dice en imperativo; «activada» es el nombre de la insignia ya ganada.
          titulo: "Activa tu monetización",
        }];
  return [...activar, ...medidas, ...sinMedir];
}

/* ── Las misiones de inicio ────────────────────────────────────────────────── */

export type Mision = { id: string; texto: string; hecha: boolean; href: string };

/** Los primeros pasos, para quien acaba de llegar. Desaparecen cuando están todos. */
export function misionesDeInicio(args: {
  tieneFoto: boolean;
  cuentas: CuentaMin[];
  avances: number;
  logrosVideo: number;
  monetiza: boolean;
}): Mision[] {
  const redes = new Set(args.cuentas.map((c) => c.red));
  return [
    { id: "foto", texto: "Pon tu foto de perfil", hecha: args.tieneFoto, href: "/desafios/paginas" },
    { id: "pagina", texto: "Da de alta tu primera página", hecha: args.cuentas.length > 0, href: "/desafios/paginas" },
    { id: "avance", texto: "Anota tus seguidores de hoy", hecha: args.avances > 0, href: "/desafios/paginas" },
    { id: "redes", texto: "Suma las cuatro redes", hecha: REDES.every((r) => redes.has(r)), href: "/desafios/paginas" },
    { id: "video", texto: "Reclama tu primer video con vistas", hecha: args.logrosVideo > 0, href: "/desafios/retos" },
    { id: "monetiza", texto: "Activa tu monetización", hecha: args.monetiza, href: "/desafios/monetizacion" },
  ];
}

/* ── Motivación ────────────────────────────────────────────────────────────── */

const FRASES = [
  "Un video más es un paso más cerca. No pares ahora.",
  "Los creadores que llegan son los que siguen publicando cuando nadie mira.",
  "Hoy no hace falta ser perfecto: hace falta publicar.",
  "Cada seguidor empezó siendo un desconocido que viste una vez. Sigue apareciendo.",
  "Tu mejor video todavía no lo has hecho.",
  "La constancia le gana al talento cuando el talento no es constante.",
  "Mil seguidores es solo cien veces diez. Un día a la vez.",
  "Lo que hoy parece lento, dentro de un año se verá como un salto.",
  "Mira cuánto has avanzado, no cuánto te falta.",
  "Publica hoy. Mañana te lo agradeces.",
  "El algoritmo premia a quien no se rinde.",
];

/** Una frase por día, igual para todos: así cambia cada mañana sin guardarse en ningún lado. */
export function fraseDelDia(fecha = new Date()): string {
  const dia = Math.floor(fecha.getTime() / 86_400_000);
  return FRASES[dia % FRASES.length];
}

/** El empujón que acompaña a una meta, según qué tan cerca esté. */
export function empujon(meta: Meta): string {
  if (meta.tipo === "MONETIZACION") return "Tu primer gran hito: que tu contenido empiece a pagarte.";
  if (meta.avance === null || meta.falta === null) return "Cuando lo logres, reclámalo con tu prueba.";
  const falta = cifraDe(meta.tipo, meta.falta);
  if (meta.avance >= 0.9) return `¡Casi! Te faltan solo ${falta}.`;
  if (meta.avance >= 0.6) return `Ya pasaste la mitad. Faltan ${falta}.`;
  if (meta.avance >= 0.25) return `Buen ritmo. Faltan ${falta}.`;
  return meta.tipo === "INGRESOS"
    ? `Faltan ${falta}. Todo ingreso grande empezó con un primer dólar.`
    : `Falta ${falta}. Todo gran canal empezó aquí.`;
}

/* ── Fechas ────────────────────────────────────────────────────────────────── */

/** «7 oct 2026». Siempre en la hora de México, para que servidor y navegador coincidan. */
export function fechaCorta(iso: string): string {
  return new Intl.DateTimeFormat("es-MX", {
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: "America/Mexico_City",
  }).format(new Date(iso));
}

/* ── Ingresos por mes ──────────────────────────────────────────────────────── */

/** «2026-10» → el primer día de ese mes, en UTC, o `null` si no es un mes válido o es futuro. */
export function mesAFecha(mes: string, hoy = new Date()): Date | null {
  const m = /^(\d{4})-(0[1-9]|1[0-2])$/.exec(mes);
  if (!m) return null;
  const fecha = new Date(Date.UTC(Number(m[1]), Number(m[2]) - 1, 1));
  const esteMes = Date.UTC(hoy.getUTCFullYear(), hoy.getUTCMonth(), 1);
  if (fecha.getTime() > esteMes || fecha.getUTCFullYear() < 2005) return null;
  return fecha;
}

/** «oct 2026», a partir de un mes guardado como fecha ISO. */
export function nombreDeMes(iso: string): string {
  return new Intl.DateTimeFormat("es-MX", { month: "short", year: "numeric", timeZone: "UTC" }).format(new Date(iso));
}
