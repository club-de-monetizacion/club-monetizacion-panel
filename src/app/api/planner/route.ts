import { createHash } from "node:crypto";
import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

/**
 * El almacén del YouTube Planner.
 *
 * La herramienta viene del Panel de Maestría y habla su idioma (`plannerGet` /
 * `plannerSet`). Hasta el 10 nov 2026 aquí había UNA copia para todo el equipo.
 * Desde entonces **cada administrador tiene su panel** y decide con quién lo
 * comparte (Diego: «marcar a los administradores que pueden ver mi panel»).
 *
 * Cómo se guarda, sin cambiar el esquema (todo en `PlannerDoc`, una fila por
 * sección):
 * - El panel de Diego son las filas de siempre (`content_os_v2`, …): la copia que
 *   era del equipo es la suya y no se movió ni un byte.
 * - El de cualquier otra persona, `panel/<correo>/<sección>`.
 * - Con quién comparte cada quien, `compartir/<correo>` → `{ "<correo>": "ver" | "editar" }`.
 *
 * Quién ve qué lo decide SIEMPRE el servidor: el panel de otra persona solo se lee
 * si ella te lo compartió, y solo se escribe si te dejó editar.
 *
 * Entra quien tenga sesión en la plataforma, que son los administradores del Club.
 */

/** Las secciones que guarda la herramienta. Nada fuera de esta lista se acepta. */
const CLAVES = [
  "content_os_v2",      // los videos y su estado
  "content_tree_v3",    // el árbol de contenido
  "content_matrix_v1",  // la matriz de contenido
  "yt_spy_v1",          // el banco del espía
  "cover_os_v1",        // los proyectos de portadas
  "cov_resources_v1",   // las fotos y recursos
  "thumb_bank_v1",      // el banco de miniaturas
];
const ES_CLAVE = new Set(CLAVES);

/** Un JSON de sección puede ser grande (lleva imágenes en base64). */
const MAX = 4_500_000;

/**
 * LAS IMÁGENES VAN APARTE (11 nov 2026). Antes cada portada viajaba en base64 dentro
 * de su sección, y los videos ya pesaban 4.2 MB: Vercel no recibe más de 4.5 MB por
 * petición, así que las portadas que César subió esa tarde nunca se guardaron (413) y
 * al recargar ya no estaban. Ahora cada imagen es su propia fila `img/<huella>` y la
 * sección solo lleva su dirección (`/api/planner/img/<huella>`). La huella sale del
 * contenido: la misma imagen siempre cae en la misma fila y nunca se sube dos veces.
 * Las filas de imagen no se borran nunca.
 */
const filaImg = (id: string) => `img/${id}`;
const urlImg = (id: string) => `/api/planner/img/${id}`;
/** Solo estos tipos se sirven sueltos (un SVG puede llevar código: ese se queda dentro). */
const IMG_DENTRO = /data:image\/(?:png|jpeg|jpg|webp|gif|avif);base64,[A-Za-z0-9+/=]+/g;
/** Las miniaturas chiquitas (avatares, iconos) se quedan donde están. */
const MIN_APARTE = 8_000;
/** Una imagen sola tiene que caber en una petición. */
const MAX_IMG = 4_400_000;
const huella = (s: string) => createHash("sha256").update(s).digest("hex").slice(0, 40);

async function guardaImagen(data: string, yo: string) {
  const id = huella(data);
  const k = filaImg(id);
  const ya = await prisma.plannerDoc.findUnique({ where: { key: k }, select: { key: true } });
  if (!ya) {
    try {
      await prisma.plannerDoc.create({ data: { key: k, value: data, updatedBy: yo } });
    } catch {
      // Otra persona subió la misma imagen en el mismo instante: ya está guardada.
    }
  }
  return id;
}

/** Saca de una sección las imágenes que vengan dentro y deja su dirección. */
async function sacaImagenes(value: string, yo: string) {
  const grandes = [...new Set((value.match(IMG_DENTRO) || []).filter((s) => s.length >= MIN_APARTE))];
  if (!grandes.length) return value;
  const ids = new Map<string, string>();
  for (const d of grandes) ids.set(d, await guardaImagen(d, yo));
  return value.replace(IMG_DENTRO, (m) => (ids.has(m) ? urlImg(ids.get(m)!) : m));
}

/** Dueño de la copia que antes era de todo el equipo: sus filas no llevan prefijo. */
const DUENO_LEGADO = "diegocabrerarosas@gmail.com";

/**
 * Una pestaña abierta antes del cambio del 10 nov no sabe de paneles: pediría el
 * suyo sin decir de quién y podría subir lo que tenía en memoria (la copia del
 * equipo) a un panel que no es. Por eso la herramienta nueva manda `v: 2` y a la
 * vieja se le pide recargar.
 */
const VERSION_HERRAMIENTA = 3;
/**
 * La versión de la herramienta que está publicada. Viaja en cada sondeo: si una pestaña
 * abierta trae una más vieja, se recarga sola (11 nov 2026: César veía otra cosa en YT
 * porque tenía abierta la de antes).
 */
const HERRAMIENTA_PUBLICADA = 13; // 13 = «Principal anterior» en las pruebas A/B (24 nov 2026) · 12 = portadas en prueba A/B (24 nov 2026) · 11 = el Árbol solo quita del Árbol + Ctrl+Z/Ctrl+Y (23 nov 2026) · 10 = publicados aparte, por fecha (23 nov 2026) · 9 = clic derecho en las portadas (23 nov 2026) · 8 = el día de hoy marcado en el calendario (23 nov 2026) · 7 = calendario con portadas que se arrastran (23 nov 2026) · 6 = miniaturas ligeras (?w=) · 5 = imágenes aparte y guardar sin pisar a nadie (11 nov 2026)

type Permiso = "ver" | "editar";
/** Lo que se guarda por persona: también «no», para quitar a alguien de un «todos». */
type Guardado = Permiso | "no";

/**
 * Lo que se comparte sin que nadie tenga que marcarlo. Diego, 11 nov 2026: «quiero
 * compartir mi calendario con los administradores. Punto. Que puedan ver lo que estoy
 * acomodando yo, y que puedan editarlo». Su panel lo ven y lo editan TODOS los
 * administradores («*»), como cuando era la copia del equipo. En Compartir puede bajar a
 * alguien a «Ver» o quitarlo («No» se guarda como "no").
 */
const SIEMPRE_COMPARTIDO: Record<string, Record<string, Guardado>> = {
  [DUENO_LEGADO]: { "*": "editar" },
};

const correo = (s: unknown) => String(s ?? "").trim().toLowerCase();
const fila = (dueno: string, clave: string) =>
  dueno === DUENO_LEGADO ? clave : `panel/${dueno}/${clave}`;
const filaCompartir = (dueno: string) => `compartir/${dueno}`;
const filasDe = (dueno: string) => CLAVES.map((c) => fila(dueno, c));
/** De la fila guardada a la sección que conoce la herramienta. */
const claveDe = (dueno: string, key: string) =>
  dueno === DUENO_LEGADO ? key : key.slice(`panel/${dueno}/`.length);

/** La foto solo si es razonable mandarla en una lista (algunas son base64 grandes). */
const fotoLigera = (s: string | null | undefined) =>
  s && s.length < 400_000 ? s : "";

function leeMapa(texto: string | null | undefined): Record<string, Guardado> {
  const limpio: Record<string, Guardado> = {};
  try {
    const m = JSON.parse(texto || "{}");
    for (const [k, v] of Object.entries(m || {})) {
      if (v === "ver" || v === "editar" || v === "no") limpio[k === "*" ? "*" : correo(k)] = v;
    }
  } catch {
    // Una fila ilegible cuenta como «no compartido con nadie».
  }
  return limpio;
}

/** Lo guardado por el dueño encima de lo que se comparte siempre. */
async function compartidoPor(dueno: string) {
  const f = await prisma.plannerDoc.findUnique({ where: { key: filaCompartir(dueno) } });
  return { ...(SIEMPRE_COMPARTIDO[dueno] || {}), ...leeMapa(f?.value) };
}

/** El permiso que de verdad tiene una persona con ese mapa: el suyo, o el de «todos». */
function efectivo(m: Record<string, Guardado>, quien: string): Permiso | null {
  const v = m[quien] ?? m["*"];
  return v === "ver" || v === "editar" ? v : null;
}

/** Lo que puede hacer `yo` con el panel de `dueno`: editar, ver o nada. */
async function permisoSobre(yo: string, dueno: string): Promise<Permiso | null> {
  if (yo === dueno) return "editar";
  return efectivo(await compartidoPor(dueno), yo);
}

const respuesta = (cuerpo: object, status = 200) => NextResponse.json(cuerpo, { status });

/* Una revisión A/B hace ~12 búsquedas en YouTube y baja las portadas: hasta 60 s. */
export const maxDuration = 60;

/* ══════════════════════════════════════════════════════════════════════════════
   PRUEBAS A/B DE PORTADAS (24 nov 2026)

   Diego: «hay canales que tienen portadas con prueba A/B y no aparecen; si un video
   tiene, que al darle clic me enseñe las demás, y que se guarden por si el creador
   las borra».

   Cómo lo hace YouTube (comprobado ese día): cada visitante ve UNA variante. La
   principal vive en /vi/<id>/maxresdefault.jpg (pública); las de la prueba son
   /vi/<id>/hq720_custom_N.jpg y solo se abren con la firma (`sqp` + `rs`) que
   YouTube pone en sus resultados, y esa firma CADUCA en minutos (sin firma, 404).
   Por eso: se pide la búsqueda varias veces como visitante nuevo (sin cookies; a
   cada uno le toca su variante), se apuntan las portadas y títulos distintos, y
   cada portada se BAJA EN ESE MOMENTO y se guarda como cualquier imagen del Planner
   (`img/<huella>`, filas que no se borran nunca). Con 14 búsquedas salieron las 3
   variantes de un video de prueba.

   Filas nuevas (no cambian el esquema; mismas `PlannerDoc`):
   - `ytab/<videoId>` → el registro del video: portadas y títulos vistos, con cuándo
     se vieron por primera y última vez. Solo se AÑADE: lo que el creador quite sigue.
   - `ytde/<huellaImagen>` → videoId: de qué video salió una portada. Lo apunta
     ytThumb («Obtener portada» con un link) y la revisión A/B; así una tarjeta sabe
     de qué video es su portada sin guardar nada más en la tarjeta.
   ══════════════════════════════════════════════════════════════════════════════ */
const YT_ID = /^[\w-]{11}$/;
const filaAB = (id: string) => `ytab/${id}`;
const filaDe = (img: string) => `ytde/${img}`;
const NAVEGADOR =
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36";
/** Cuántas veces se pregunta por revisión, y de cuántas en cuántas a la vez. */
const MUESTRAS = 12, A_LA_VEZ = 6;
/** Una revisión reciente se reutiliza (sin «forzar»); con «forzar», no antes de 2 min. */
const FRESCA = 6 * 3600e3, MIN_FORZAR = 2 * 60e3;

type PortadaAB = {
  img: string; clave: string; primera: number; ultima: number; veces: number; ancho?: number;
  /** Las claves de YouTube que resultaron ser ESTA imagen (la principal suele ser también custom_1). */
  claves?: string[];
  /** Huella visual (dHash 16×16): la misma portada en otro tamaño cuenta como una sola. */
  vis?: string;
};
type TituloAB = { t: string; primera: number; ultima: number; veces: number };
type RegistroAB = { id: string; portadas: PortadaAB[]; titulos: TituloAB[]; revisado: number; muestras: number };

function leeAB(texto: string | null | undefined): RegistroAB | null {
  try {
    const o = JSON.parse(texto || "null");
    if (!o || !YT_ID.test(o.id)) return null;
    return {
      id: o.id,
      portadas: Array.isArray(o.portadas) ? o.portadas : [],
      titulos: Array.isArray(o.titulos) ? o.titulos : [],
      revisado: Number(o.revisado) || 0,
      muestras: Number(o.muestras) || 0,
    };
  } catch {
    return null;
  }
}

/** Lo que ve la herramienta: la principal primero, luego las variantes. */
function vistaAB(reg: RegistroAB) {
  const orden = (k: string) => (k === "default" ? 0 : Number(k.replace(/\D/g, "")) || 9);
  const portadas = [...reg.portadas]
    .sort((a, b) => orden(a.clave) - orden(b.clave) || b.ultima - a.ultima)
    .map((p) => ({
      url: urlImg(p.img), img: p.img, clave: p.clave, claves: p.claves || [p.clave], ancho: p.ancho || 0,
      primera: p.primera, ultima: p.ultima, veces: p.veces,
      enPrueba: !!reg.revisado && p.ultima === reg.revisado,
    }));
  const titulos = [...reg.titulos]
    .sort((a, b) => b.veces - a.veces)
    .map((t) => ({ t: t.t, primera: t.primera, ultima: t.ultima, veces: t.veces, enPrueba: !!reg.revisado && t.ultima === reg.revisado }));
  return { id: reg.id, ab: portadas.length > 1 || titulos.length > 1, revisado: reg.revisado, muestras: reg.muestras, portadas, titulos };
}

/** Huella visual: 256 bits de «más claro que el de al lado» en una miniatura gris de 17×16. */
async function huellaVisual(data: string): Promise<string> {
  try {
    const sharp = (await import("sharp")).default;
    const buf = Buffer.from(data.slice(data.indexOf(",") + 1), "base64");
    const px = await sharp(buf).toColourspace("b-w").resize(17, 16, { fit: "fill" }).raw().toBuffer();
    let bits = "";
    for (let r = 0; r < 16; r++) for (let c = 0; c < 16; c++) bits += px[r * 17 + c] > px[r * 17 + c + 1] ? "1" : "0";
    return BigInt("0b" + bits).toString(16).padStart(64, "0");
  } catch {
    return "";
  }
}
/** Cuántos de los 256 bits cambian. La misma portada en otro tamaño da 0–10; otra portada, 100+. */
function distancia(a?: string, b?: string) {
  if (!a || !b || a.length !== b.length) return 999;
  let d = 0;
  for (let i = 0; i < a.length; i++) { let x = parseInt(a[i], 16) ^ parseInt(b[i], 16); while (x) { d += x & 1; x >>= 1; } }
  return d;
}
const MISMA_PORTADA = 24;

/** La portada principal (pública), de la mejor calidad a la peor: no todos tienen maxres. */
async function portadaYT(id: string): Promise<string | null> {
  for (const q of ["maxresdefault", "sddefault", "hqdefault"]) {
    try {
      const r = await fetch(`https://i.ytimg.com/vi/${id}/${q}.jpg`, { cache: "no-store" });
      if (!r.ok) continue;
      const buf = Buffer.from(await r.arrayBuffer());
      // YouTube devuelve una imagen gris de 1 KB cuando esa calidad no existe.
      if (buf.length > 5000) return "data:image/jpeg;base64," + buf.toString("base64");
    } catch {
      // Se prueba la calidad siguiente.
    }
  }
  return null;
}

/** Apunta de qué video salió una portada (si ya estaba, no escribe). */
async function apuntaDe(img: string, id: string, yo: string) {
  try {
    const k = filaDe(img);
    const ya = await prisma.plannerDoc.findUnique({ where: { key: k }, select: { value: true } });
    if (!ya) await prisma.plannerDoc.create({ data: { key: k, value: id, updatedBy: yo } });
  } catch {
    // Dos a la vez: ya quedó apuntada.
  }
}

/** Una búsqueda como visitante nuevo (sin cookies): YouTube le asigna su variante. */
async function buscaComoVisitante(q: string): Promise<unknown> {
  try {
    const r = await fetch("https://www.youtube.com/youtubei/v1/search?prettyPrint=false", {
      method: "POST",
      headers: { "content-type": "application/json", "user-agent": NAVEGADOR, "accept-language": "es-MX,es;q=0.9" },
      body: JSON.stringify({ context: { client: { clientName: "WEB", clientVersion: "2.20251120.01.00", hl: "es", gl: "MX" } }, query: q }),
      cache: "no-store",
      signal: AbortSignal.timeout(9000),
    });
    return r.ok ? await r.json() : null;
  } catch {
    return null;
  }
}

const textoDe = (t: unknown): string => {
  const o = t as { simpleText?: string; runs?: { text?: string }[]; content?: string } | null;
  if (!o) return "";
  return String(o.simpleText ?? o.content ?? (o.runs || []).map((r) => r.text || "").join("")).trim();
};

/** De una respuesta de búsqueda: las portadas (la más grande de cada una) y el título de ESE video. */
function recogeDe(nodo: unknown, id: string, portadas: Map<string, { url: string; ancho: number }>, titulos: Set<string>) {
  const re = new RegExp(`/vi/${id}/(?:hq720|hqdefault|sddefault|maxresdefault|mqdefault)(_custom_\\d+)?\\.(?:jpg|webp)`);
  const pila: unknown[] = [nodo];
  let pasos = 0;
  while (pila.length && pasos++ < 400_000) {
    const o = pila.pop();
    if (!o || typeof o !== "object") continue;
    if (Array.isArray(o)) { for (const x of o) pila.push(x); continue; }
    const r = o as Record<string, unknown>;
    if (typeof r.url === "string" && r.url.includes(`/vi/${id}/`)) {
      const m = re.exec(r.url);
      if (m) {
        const clave = m[1] ? m[1].slice(1) : "default";
        const ancho = Number(r.width) || 0;
        const ya = portadas.get(clave);
        if (!ya || ancho > ya.ancho) portadas.set(clave, { url: r.url, ancho });
      }
    }
    // videoRenderer (title.runs) y lockupViewModel (metadata…title.content)
    if (r.videoId === id && r.title) { const t = textoDe(r.title); if (t) titulos.add(t); }
    if (r.contentId === id) {
      const md = (r.metadata as { lockupMetadataViewModel?: { title?: unknown } } | undefined)?.lockupMetadataViewModel;
      const t = textoDe(md?.title);
      if (t) titulos.add(t);
    }
    for (const v of Object.values(r)) if (v && typeof v === "object") pila.push(v);
  }
}

/** Baja una portada firmada en el momento (la firma caduca) y la deja como imagen del Planner. */
async function bajaPortada(url: string): Promise<string | null> {
  try {
    const r = await fetch(url, {
      headers: { "user-agent": NAVEGADOR, accept: "image/jpeg,image/webp;q=0.9,image/*;q=0.8", referer: "https://www.youtube.com/" },
      cache: "no-store",
      signal: AbortSignal.timeout(9000),
    });
    if (!r.ok) return null;
    const tipo = (r.headers.get("content-type") || "image/jpeg").split(";")[0].trim();
    if (!/^image\/(jpeg|webp|png|avif)$/.test(tipo)) return null;
    const buf = Buffer.from(await r.arrayBuffer());
    if (buf.length < 3000 || buf.length > 3_000_000) return null;
    return `data:${tipo};base64,${buf.toString("base64")}`;
  } catch {
    return null;
  }
}

/**
 * Revisa un video y junta lo visto con lo que ya estaba. Nada se quita nunca.
 * `agrega`: una portada que alguien vio y ya no sale (p. ej. rescatada del caché),
 * para que quede guardada con las demás.
 */
async function revisaAB(
  id: string, yo: string,
  o: { forzar?: boolean; agrega?: { data?: string; clave?: string; titulo?: string; visto?: number } }
): Promise<RegistroAB> {
  const k = filaAB(id);
  const antes = await prisma.plannerDoc.findUnique({ where: { key: k } });
  const viejo = leeAB(antes?.value);
  const ahora = Date.now();
  const extra = o.agrega && /^data:image\/(?:png|jpeg|jpg|webp|avif);base64,[A-Za-z0-9+/=]+$/.test(String(o.agrega.data || ""))
    && String(o.agrega.data).length < MAX_IMG ? o.agrega : null;
  /* Reciente y sin forzar: se devuelve lo guardado y no se le pregunta a YouTube. */
  if (viejo && !extra && ahora - viejo.revisado < (o.forzar ? MIN_FORZAR : FRESCA)) return viejo;

  const vistas = new Map<string, { img: string; ancho: number; vis: string }>();
  const titulos = new Set<string>();
  let muestras = 0;
  if (!extra || o.forzar || !viejo) {
    /* La principal, pública (la misma imagen que da «Obtener portada»: misma huella). */
    const principal = await portadaYT(id);
    if (principal) {
      const img = await guardaImagen(principal, yo);
      vistas.set("default", { img, ancho: 1280, vis: await huellaVisual(principal) });
      await apuntaDe(img, id, yo);
    }
    /* Las variantes: búsquedas como visitantes nuevos; con el título, además del id. */
    const encontradas = new Map<string, { url: string; ancho: number }>();
    for (let i = 0; i < MUESTRAS; i += A_LA_VEZ) {
      const unTitulo = [...titulos][0];
      const qs = Array.from({ length: Math.min(A_LA_VEZ, MUESTRAS - i) }, (_, j) => (unTitulo && (i + j) % 2 ? unTitulo : id));
      const res = await Promise.all(qs.map(buscaComoVisitante));
      for (const r of res) if (r) { muestras++; recogeDe(r, id, encontradas, titulos); }
    }
    for (const [clave, { url, ancho }] of encontradas) {
      if (clave === "default") continue;   // la principal ya se bajó en grande
      const d = await bajaPortada(url);
      if (!d) continue;
      const img = await guardaImagen(d, yo);
      vistas.set(clave, { img, ancho, vis: await huellaVisual(d) });
      await apuntaDe(img, id, yo);
    }
  }

  /* YouTube no contestó nada: se queda lo que había (y si no había nada, se avisa). */
  if (!vistas.size && !titulos.size && !extra) {
    if (viejo) return viejo;
    throw new Error("YouTube no respondió");
  }

  /* Juntar con lo que ya estaba, sin pisar a otra revisión que haya guardado a la vez. */
  for (let intento = 0; intento < 3; intento++) {
    const fila = intento === 0 ? antes : await prisma.plannerDoc.findUnique({ where: { key: k } });
    const base = leeAB(fila?.value) || { id, portadas: [], titulos: [], revisado: 0, muestras: 0 };
    const reg: RegistroAB = {
      ...base,
      portadas: base.portadas.map((p) => ({ ...p })),
      titulos: base.titulos.map((t) => ({ ...t })),
    };
    for (const [clave, v] of vistas) {
      /* La misma imagen, o la misma portada en otro tamaño: una sola, con la copia más grande. */
      const ya = reg.portadas.find((p) => p.img === v.img) || reg.portadas.find((p) => distancia(p.vis, v.vis) <= MISMA_PORTADA);
      if (ya) {
        if (ya.ultima !== ahora) ya.veces += 1;
        ya.ultima = ahora;
        ya.claves = [...new Set([...(ya.claves || [ya.clave]), clave])];
        if ((v.ancho || 0) > (ya.ancho || 0)) { ya.img = v.img; ya.ancho = v.ancho; ya.vis = v.vis || ya.vis; }
        ya.clave = ya.claves.includes("default") ? "default" : [...ya.claves].sort()[0];
      } else {
        reg.portadas.push({ img: v.img, clave, claves: [clave], primera: ahora, ultima: ahora, veces: 1, ancho: v.ancho, vis: v.vis });
      }
    }
    for (const t of titulos) {
      const ya = reg.titulos.find((x) => x.t === t);
      if (ya) { ya.ultima = ahora; ya.veces += 1; }
      else reg.titulos.push({ t, primera: ahora, ultima: ahora, veces: 1 });
    }
    if (extra) {
      const img = await guardaImagen(String(extra.data), yo);
      await apuntaDe(img, id, yo);
      const visto = Number(extra.visto) || ahora;
      /* «default»: una principal que el creador ya cambió (la herramienta la llama «Principal anterior») */
      const clave = /^(?:default|custom_\d+)$/.test(String(extra.clave)) ? String(extra.clave) : "rescatada";
      const vis = await huellaVisual(String(extra.data));
      if (!reg.portadas.some((p) => p.img === img || distancia(p.vis, vis) <= MISMA_PORTADA)) {
        reg.portadas.push({ img, clave, claves: [clave], primera: visto, ultima: visto, veces: 1, vis });
      }
      const t = String(extra.titulo || "").trim().slice(0, 200);
      if (t && !reg.titulos.some((x) => x.t === t)) reg.titulos.push({ t, primera: visto, ultima: visto, veces: 1 });
    }
    if (vistas.size || titulos.size) { reg.revisado = ahora; reg.muestras += muestras; }
    const value = JSON.stringify(reg);
    try {
      if (fila) await prisma.plannerDoc.update({ where: { key: k, updatedAt: fila.updatedAt }, data: { value, updatedBy: yo } });
      else await prisma.plannerDoc.create({ data: { key: k, value, updatedBy: yo } });
      return reg;
    } catch {
      // Otra revisión guardó en medio: se vuelve a leer y se junta otra vez.
    }
  }
  throw new Error("no se pudo guardar la revisión");
}

export async function POST(req: Request) {
  const session = await auth();
  const yo = correo(session?.user?.email);
  if (!session?.user || !yo) {
    return respuesta({ ok: false, error: "Sin sesión" }, 401);
  }

  let cuerpo: {
    action?: string; key?: string; value?: string; de?: string; v?: number;
    base?: number; data?: string;
    compartido?: Record<string, string>;
  } = {};
  try {
    cuerpo = await req.json();
  } catch {
    return respuesta({ ok: false, error: "Cuerpo ilegible" }, 400);
  }
  const accion = cuerpo.action;

  /* ── Las tres acciones de datos: piden la herramienta nueva y permiso ── */
  if (accion === "plannerGet" || accion === "plannerSet" || accion === "plannerCuando" || accion === "plannerImg") {
    if (Number(cuerpo.v) < VERSION_HERRAMIENTA || !cuerpo.v) {
      return respuesta(
        { ok: false, viejo: true, error: "El Planner se actualizó: recarga la página." },
        409
      );
    }
    const dueno = correo(cuerpo.de) || yo;
    const permiso = await permisoSobre(yo, dueno);
    if (!permiso) {
      return respuesta(
        { ok: false, sinAcceso: true, error: "Este panel ya no está compartido contigo." },
        403
      );
    }

    if (accion === "plannerGet") {
      const filas = await prisma.plannerDoc.findMany({ where: { key: { in: filasDe(dueno) } } });
      const values: Record<string, string> = {};
      /* Cuándo se tocó cada sección. Va junto con los datos a propósito: quien acaba
         de traerlos ya sabe de qué momento son, y así no confunde lo que acaba de
         leer con un cambio nuevo de otra persona. */
      const cuando: Record<string, number> = {};
      let masReciente = 0;
      for (const f of filas) {
        const k = claveDe(dueno, f.key);
        let valor = f.value, hora = f.updatedAt;
        /* ⚡ Una sección que aún trae imágenes dentro (guardada antes de que fueran aparte)
           se aligera la primera vez que alguien la abre: las imágenes pasan a su fila y la
           sección queda en direcciones. Solo si nadie la tocó mientras tanto (si no, se
           responde aligerada igual y la guarda quien la cambió). Nada se pierde: es la
           misma imagen, en su sitio. */
        if (valor.length > 20_000 && valor.includes("data:image/")) {
          try {
            const ligero = await sacaImagenes(valor, f.updatedBy || yo);
            if (ligero !== valor) {
              try {
                const g = await prisma.plannerDoc.update({
                  where: { key: f.key, updatedAt: f.updatedAt },
                  data: { value: ligero, updatedBy: f.updatedBy },
                });
                hora = g.updatedAt;
              } catch { /* alguien guardó encima: lo suyo manda */ }
              valor = ligero;
            }
          } catch (e) { console.error("[planner] no se pudo aligerar", f.key, e); }
        }
        values[k] = valor;
        cuando[k] = hora.getTime();
        masReciente = Math.max(masReciente, hora.getTime());
      }
      let duenoInfo = { email: dueno, name: "", image: "" };
      if (dueno !== yo) {
        const u = await prisma.user.findFirst({
          where: { email: { equals: dueno, mode: "insensitive" } },
          select: { name: true, image: true },
        });
        duenoInfo = { email: dueno, name: u?.name || "", image: fotoLigera(u?.image) };
      }
      return respuesta({ ok: true, values, cuando, desde: masReciente, permiso, dueno: duenoInfo });
    }

    if (accion === "plannerSet") {
      if (permiso !== "editar") {
        return respuesta({ ok: false, soloVer: true, error: "Este panel solo lo puedes ver." }, 403);
      }
      const key = String(cuerpo.key || "");
      if (!ES_CLAVE.has(key)) {
        return respuesta({ ok: false, error: "Sección desconocida" }, 400);
      }
      /* Lo que todavía traiga imágenes dentro (una pestaña vieja) se guarda igual: las
         imágenes salen a su fila y la sección queda ligera. */
      const value = await sacaImagenes(String(cuerpo.value ?? ""), yo);
      if (value.length > MAX) {
        return respuesta({ ok: false, error: "Esa sección pesa demasiado para guardarla" }, 413);
      }
      const k = fila(dueno, key);
      /* Sin pisar a nadie. La herramienta dice sobre qué versión hizo su cambio (`base`, la
         hora de la última copia que conoce). Si alguien guardó encima mientras tanto, aquí
         no se escribe: se le devuelve lo de ahora para que junte los dos cambios y vuelva a
         guardar. Antes ganaba el último, y una pestaña con una copia vieja borraba lo que
         otra persona acababa de subir. Una pestaña vieja no manda `base`: guarda como antes. */
      const conBase = cuerpo.base !== undefined && cuerpo.base !== null && Number.isFinite(Number(cuerpo.base));
      let guardada;
      if (conBase) {
        const base = Number(cuerpo.base);
        try {
          guardada = base > 0
            ? await prisma.plannerDoc.update({
                where: { key: k, updatedAt: new Date(base) },
                data: { value, updatedBy: yo },
              })
            : await prisma.plannerDoc.create({ data: { key: k, value, updatedBy: yo } });
        } catch {
          const ahora = await prisma.plannerDoc.findUnique({ where: { key: k } });
          return respuesta({
            ok: false, conflicto: true,
            value: ahora?.value ?? null,
            cuando: ahora ? ahora.updatedAt.getTime() : 0,
            quien: ahora?.updatedBy || "",
          }, 409);
        }
      } else {
        guardada = await prisma.plannerDoc.upsert({
          where: { key: k },
          update: { value, updatedBy: yo },
          create: { key: k, value, updatedBy: yo },
        });
      }
      /* La hora que quedó guardada, no la de ahora mismo: es la que va a devolver el
         sondeo, y así quien acaba de guardar reconoce su propio cambio sin margen. */
      return respuesta({ ok: true, ahora: guardada.updatedAt.getTime(), value });
    }

    /* Una imagen sola, antes de guardar la sección que la usa: así ninguna petición pasa
       del límite por muchas portadas que tenga el panel. */
    if (accion === "plannerImg") {
      if (permiso !== "editar") {
        return respuesta({ ok: false, soloVer: true, error: "Este panel solo lo puedes ver." }, 403);
      }
      const data = String(cuerpo.data || "");
      if (!/^data:image\/(?:png|jpeg|jpg|webp|gif|avif);base64,[A-Za-z0-9+/=]+$/.test(data)) {
        return respuesta({ ok: false, error: "Eso no es una imagen" }, 400);
      }
      if (data.length > MAX_IMG) {
        return respuesta({ ok: false, error: "La imagen pesa demasiado" }, 413);
      }
      const id = await guardaImagen(data, yo);
      return respuesta({ ok: true, id, url: urlImg(id) });
    }

    /* plannerCuando — para el tiempo real: cuándo se tocó cada sección, sin el contenido. */
    const filas = await prisma.plannerDoc.findMany({
      where: { key: { in: filasDe(dueno) } },
      select: { key: true, updatedAt: true, updatedBy: true },
    });
    return respuesta({
      ok: true,
      permiso,
      herramienta: HERRAMIENTA_PUBLICADA,
      cuando: Object.fromEntries(filas.map((f) => [claveDe(dueno, f.key), f.updatedAt.getTime()])),
      quien: Object.fromEntries(filas.map((f) => [claveDe(dueno, f.key), f.updatedBy])),
    });
  }

  /* ── Compartir mi panel: quién hay y con quién lo comparto ── */
  if (accion === "compartirLeer") {
    const gente = await prisma.user.findMany({
      where: { NOT: { email: { equals: yo, mode: "insensitive" } } },
      select: { email: true, name: true, image: true },
      orderBy: { name: "asc" },
    });
    const mapa = await compartidoPor(yo);
    const lista = gente.map((g) => ({ email: correo(g.email), name: g.name || "", image: fotoLigera(g.image) }));
    return respuesta({
      ok: true,
      gente: lista,
      /* Lo que cada quien puede hacer hoy con mi panel (ya con «todos» aplicado). */
      compartido: Object.fromEntries(lista.map((g) => [g.email, efectivo(mapa, g.email) || ""])),
    });
  }

  if (accion === "compartirGuardar") {
    /* Llega solo lo que se tocó: { correo: "ver" | "editar" | "" }. «""» = No. */
    const pedido: Record<string, Guardado> = {};
    for (const [k, v] of Object.entries(cuerpo.compartido || {})) {
      const c = correo(k);
      if (!c || c === yo || c === "*") continue;
      pedido[c] = v === "ver" || v === "editar" ? v : "no";
    }
    /* Solo personas que existen en la plataforma (o sea, administradores). */
    const existen = await prisma.user.findMany({
      where: { email: { in: Object.keys(pedido), mode: "insensitive" } },
      select: { email: true },
    });
    const validos = new Set(existen.map((e) => correo(e.email)));
    const k = filaCompartir(yo);
    const antes = await prisma.plannerDoc.findUnique({ where: { key: k } });
    const guardado = leeMapa(antes?.value);
    for (const [c, v] of Object.entries(pedido)) if (validos.has(c)) guardado[c] = v;
    await prisma.plannerDoc.upsert({
      where: { key: k },
      update: { value: JSON.stringify(guardado), updatedBy: yo },
      create: { key: k, value: JSON.stringify(guardado), updatedBy: yo },
    });
    /* Lo que de verdad quedó para cada quien (con «todos» aplicado). */
    const mapa = await compartidoPor(yo);
    const gente = await prisma.user.findMany({
      where: { NOT: { email: { equals: yo, mode: "insensitive" } } },
      select: { email: true },
    });
    return respuesta({
      ok: true,
      compartido: Object.fromEntries(gente.map((g) => [correo(g.email), efectivo(mapa, correo(g.email)) || ""])),
    });
  }

  /* ── Compartidos conmigo: los paneles que otros me abrieron ── */
  if (accion === "compartidosConmigo") {
    const filas = await prisma.plannerDoc.findMany({
      where: { key: { startsWith: "compartir/" } },
      select: { key: true, value: true },
    });
    const mapas = new Map<string, Record<string, Guardado>>();
    for (const [dueno, m] of Object.entries(SIEMPRE_COMPARTIDO)) mapas.set(dueno, { ...m });
    for (const f of filas) {
      const dueno = f.key.slice("compartir/".length);
      mapas.set(dueno, { ...(mapas.get(dueno) || {}), ...leeMapa(f.value) });
    }
    const mios: { dueno: string; permiso: Permiso }[] = [];
    for (const [dueno, m] of mapas) {
      const p = efectivo(m, yo);
      if (p && dueno !== yo) mios.push({ dueno, permiso: p });
    }
    if (!mios.length) return respuesta({ ok: true, paneles: [] });

    const personas = await prisma.user.findMany({
      where: { email: { in: mios.map((m) => m.dueno), mode: "insensitive" } },
      select: { email: true, name: true, image: true },
    });
    const porCorreo = new Map(personas.map((p) => [correo(p.email), p]));
    const tocadas = await prisma.plannerDoc.findMany({
      where: { key: { in: mios.flatMap((m) => filasDe(m.dueno)) } },
      select: { key: true, updatedAt: true },
    });
    const paneles = mios
      .filter((m) => porCorreo.has(m.dueno))
      .map((m) => {
        const p = porCorreo.get(m.dueno)!;
        const suyas = new Set(filasDe(m.dueno));
        const cuando = tocadas
          .filter((t) => suyas.has(t.key))
          .reduce((max, t) => Math.max(max, t.updatedAt.getTime()), 0);
        /* El de Diego es el panel del equipo: a él se entra por defecto. */
        return { email: m.dueno, name: p.name || "", image: fotoLigera(p.image), permiso: m.permiso, cuando, principal: m.dueno === DUENO_LEGADO };
      })
      .sort((a, b) => (a.name || a.email).localeCompare(b.name || b.email, "es"));
    return respuesta({ ok: true, paneles });
  }

  // La herramienta pregunta quién es al arrancar.
  if (accion === "me") {
    return respuesta({
      ok: true,
      role: session.user.role === "ADMIN" ? "admin" : "member",
      me: {
        name: session.user.name || "",
        email: yo,
        photo: session.user.image || "",
        unlocked: { f2: true },   // en el Club no hay fases que desbloquear
      },
    });
  }

  /* La portada de un video de YouTube, a partir de su link. Va por el servidor y no
     desde el navegador porque i.ytimg.com no permite leer la imagen desde otra
     página (haría falta CORS), y la herramienta la necesita como datos para poder
     ponerla en el lienzo. Misma lógica que en el panel del Máster. */
  if (accion === "ytThumb") {
    const u = String((cuerpo as { url?: string }).url || "");
    const m = u.match(
      /(?:youtube\.com\/(?:watch\?v=|shorts\/|embed\/|live\/)|youtu\.be\/)([\w-]{6,20})/i
    );
    if (!m) {
      return respuesta(
        { ok: false, error: "Pega un link de video de YouTube (youtube.com/watch?v=… o youtu.be/…)." },
        400
      );
    }
    const id = m[1];
    const dataUrl = await portadaYT(id);
    if (dataUrl) {
      /* La portada queda ligada a su video (ver PRUEBAS A/B): así la tarjeta que la use
         sabe de qué video de YouTube salió, sin guardar nada más en la tarjeta. */
      if (YT_ID.test(id)) await apuntaDe(huella(dataUrl), id, yo);
      return respuesta({ ok: true, dataUrl, yt: YT_ID.test(id) ? id : "" });
    }
    return respuesta(
      { ok: false, error: "No se pudo obtener la portada de ese video — revisa el link." },
      404
    );
  }

  /* ── PRUEBAS A/B DE PORTADAS (24 nov 2026) ──
     ytAB: revisa un video y guarda TODAS las portadas (y títulos) que YouTube está
     probando con él. ytABVer: lo ya guardado de varios videos, sin preguntarle a YouTube. */
  if (accion === "ytAB") {
    const c = cuerpo as { id?: string; forzar?: boolean; agrega?: { data?: string; clave?: string; titulo?: string; visto?: number } };
    const id = String(c.id || "");
    if (!YT_ID.test(id)) return respuesta({ ok: false, error: "Ese no es un video de YouTube." }, 400);
    try {
      const reg = await revisaAB(id, yo, { forzar: !!c.forzar, agrega: c.agrega });
      return respuesta({ ok: true, ...vistaAB(reg) });
    } catch (e) {
      console.error("[planner ytAB]", id, e instanceof Error ? e.message : e);
      return respuesta({ ok: false, error: "No se pudo revisar ese video ahora. Inténtalo en un momento." }, 502);
    }
  }
  if (accion === "ytABVer") {
    const c = cuerpo as { ids?: unknown; imgs?: unknown };
    const imgs = [...new Set((Array.isArray(c.imgs) ? c.imgs : []).map(String).filter((s) => /^[a-f0-9]{40}$/.test(s)))].slice(0, 400);
    const deImg: Record<string, string> = {};
    if (imgs.length) {
      const filas = await prisma.plannerDoc.findMany({ where: { key: { in: imgs.map(filaDe) } }, select: { key: true, value: true } });
      for (const f of filas) if (YT_ID.test(f.value)) deImg[f.key.slice(5)] = f.value;
    }
    const ids = [...new Set([...(Array.isArray(c.ids) ? c.ids : []).map(String), ...Object.values(deImg)].filter((s) => YT_ID.test(s)))].slice(0, 400);
    const videos: Record<string, ReturnType<typeof vistaAB>> = {};
    if (ids.length) {
      const filas = await prisma.plannerDoc.findMany({ where: { key: { in: ids.map(filaAB) } }, select: { key: true, value: true } });
      for (const f of filas) {
        const reg = leeAB(f.value);
        if (reg) videos[reg.id] = vistaAB(reg);
      }
    }
    return respuesta({ ok: true, deImg, videos });
  }

  return respuesta({ ok: false, error: "Acción desconocida" }, 400);
}
