import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

/**
 * El almacén del YouTube Planner, compartido por todo el equipo.
 *
 * La herramienta viene del Panel de Maestría, donde cada alumno guarda lo suyo. Aquí
 * hay **una sola copia**: lo que cambia cualquier administrador lo ven los demás.
 * Habla el mismo idioma que allá (`plannerGet` / `plannerSet`), así que la
 * herramienta no se tocó: solo apunta a esta dirección.
 *
 * Entra quien tenga sesión en la plataforma, que son los administradores del Club.
 */

/** Las secciones que guarda la herramienta. Nada fuera de esta lista se acepta. */
const CLAVES = new Set([
  "content_os_v2",      // los videos y su estado
  "content_tree_v3",    // el árbol de contenido
  "content_matrix_v1",  // la matriz de contenido
  "yt_spy_v1",          // el banco del espía
  "cover_os_v1",        // los proyectos de portadas
  "cov_resources_v1",   // las fotos y recursos
  "thumb_bank_v1",      // el banco de miniaturas
]);

/** Un JSON de sección puede ser grande (lleva imágenes en base64). */
const MAX = 4_500_000;

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ ok: false, error: "Sin sesión" }, { status: 401 });
  }

  let cuerpo: { action?: string; key?: string; value?: string } = {};
  try {
    cuerpo = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: "Cuerpo ilegible" }, { status: 400 });
  }

  if (cuerpo.action === "plannerGet") {
    const filas = await prisma.plannerDoc.findMany();
    const values: Record<string, string> = {};
    /* Cuándo se tocó cada sección. Va junto con los datos a propósito: quien acaba
       de traerlos ya sabe de qué momento son, y así no confunde lo que acaba de
       leer con un cambio nuevo de otra persona. */
    const cuando: Record<string, number> = {};
    let masReciente = 0;
    for (const f of filas) {
      values[f.key] = f.value;
      cuando[f.key] = f.updatedAt.getTime();
      masReciente = Math.max(masReciente, f.updatedAt.getTime());
    }
    return NextResponse.json({ ok: true, values, cuando, desde: masReciente });
  }

  if (cuerpo.action === "plannerSet") {
    const key = String(cuerpo.key || "");
    const value = String(cuerpo.value ?? "");
    if (!CLAVES.has(key)) {
      return NextResponse.json({ ok: false, error: "Sección desconocida" }, { status: 400 });
    }
    if (value.length > MAX) {
      return NextResponse.json(
        { ok: false, error: "Esa sección pesa demasiado para guardarla" },
        { status: 413 }
      );
    }
    const quien = session.user.email || session.user.name || null;
    const fila = await prisma.plannerDoc.upsert({
      where: { key },
      update: { value, updatedBy: quien },
      create: { key, value, updatedBy: quien },
    });
    /* La hora que quedó guardada, no la de ahora mismo: es la que va a devolver el
       sondeo, y así quien acaba de guardar reconoce su propio cambio sin margen. */
    return NextResponse.json({ ok: true, ahora: fila.updatedAt.getTime() });
  }

  /** Para el tiempo real: dice cuándo se tocó cada sección, sin traer el contenido. */
  if (cuerpo.action === "plannerCuando") {
    const filas = await prisma.plannerDoc.findMany({
      select: { key: true, updatedAt: true, updatedBy: true },
    });
    return NextResponse.json({
      ok: true,
      cuando: Object.fromEntries(filas.map((f) => [f.key, f.updatedAt.getTime()])),
      quien: Object.fromEntries(filas.map((f) => [f.key, f.updatedBy])),
    });
  }

  // La herramienta pregunta quién es al arrancar.
  if (cuerpo.action === "me") {
    return NextResponse.json({
      ok: true,
      role: session.user.role === "ADMIN" ? "admin" : "member",
      me: {
        name: session.user.name || "",
        email: session.user.email || "",
        photo: session.user.image || "",
        unlocked: { f2: true },   // en el Club no hay fases que desbloquear
      },
    });
  }

  /* La portada de un video de YouTube, a partir de su link. Va por el servidor y no
     desde el navegador porque i.ytimg.com no permite leer la imagen desde otra
     página (haría falta CORS), y la herramienta la necesita como datos para poder
     ponerla en el lienzo. Misma lógica que en el panel del Máster. */
  if (cuerpo.action === "ytThumb") {
    const u = String((cuerpo as { url?: string }).url || "");
    const m = u.match(
      /(?:youtube\.com\/(?:watch\?v=|shorts\/|embed\/|live\/)|youtu\.be\/)([\w-]{6,20})/i
    );
    if (!m) {
      return NextResponse.json(
        { ok: false, error: "Pega un link de video de YouTube (youtube.com/watch?v=… o youtu.be/…)." },
        { status: 400 }
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
          return NextResponse.json({
            ok: true,
            dataUrl: "data:image/jpeg;base64," + buf.toString("base64"),
          });
        }
      } catch {
        // Se prueba la calidad siguiente.
      }
    }
    return NextResponse.json(
      { ok: false, error: "No se pudo obtener la portada de ese video — revisa el link." },
      { status: 404 }
    );
  }

  return NextResponse.json({ ok: false, error: "Acción desconocida" }, { status: 400 });
}
