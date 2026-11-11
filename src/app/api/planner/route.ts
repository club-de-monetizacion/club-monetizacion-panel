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
const HERRAMIENTA_PUBLICADA = 3;

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

export async function POST(req: Request) {
  const session = await auth();
  const yo = correo(session?.user?.email);
  if (!session?.user || !yo) {
    return respuesta({ ok: false, error: "Sin sesión" }, 401);
  }

  let cuerpo: {
    action?: string; key?: string; value?: string; de?: string; v?: number;
    compartido?: Record<string, string>;
  } = {};
  try {
    cuerpo = await req.json();
  } catch {
    return respuesta({ ok: false, error: "Cuerpo ilegible" }, 400);
  }
  const accion = cuerpo.action;

  /* ── Las tres acciones de datos: piden la herramienta nueva y permiso ── */
  if (accion === "plannerGet" || accion === "plannerSet" || accion === "plannerCuando") {
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
        values[k] = f.value;
        cuando[k] = f.updatedAt.getTime();
        masReciente = Math.max(masReciente, f.updatedAt.getTime());
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
      const value = String(cuerpo.value ?? "");
      if (!ES_CLAVE.has(key)) {
        return respuesta({ ok: false, error: "Sección desconocida" }, 400);
      }
      if (value.length > MAX) {
        return respuesta({ ok: false, error: "Esa sección pesa demasiado para guardarla" }, 413);
      }
      const k = fila(dueno, key);
      const guardada = await prisma.plannerDoc.upsert({
        where: { key: k },
        update: { value, updatedBy: yo },
        create: { key: k, value, updatedBy: yo },
      });
      /* La hora que quedó guardada, no la de ahora mismo: es la que va a devolver el
         sondeo, y así quien acaba de guardar reconoce su propio cambio sin margen. */
      return respuesta({ ok: true, ahora: guardada.updatedAt.getTime() });
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
    // De la mejor calidad a la peor: no todos los videos tienen maxres.
    for (const q of ["maxresdefault", "sddefault", "hqdefault"]) {
      try {
        const r = await fetch(`https://i.ytimg.com/vi/${id}/${q}.jpg`, { cache: "no-store" });
        if (!r.ok) continue;
        const buf = Buffer.from(await r.arrayBuffer());
        // YouTube devuelve una imagen gris de 1 KB cuando esa calidad no existe.
        if (buf.length > 5000) {
          return respuesta({ ok: true, dataUrl: "data:image/jpeg;base64," + buf.toString("base64") });
        }
      } catch {
        // Se prueba la calidad siguiente.
      }
    }
    return respuesta(
      { ok: false, error: "No se pudo obtener la portada de ese video — revisa el link." },
      404
    );
  }

  return respuesta({ ok: false, error: "Acción desconocida" }, 400);
}
