import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { leeLlaveSync } from "@/lib/sync-token";
import type { KindPendiente } from "@prisma/client";

/**
 * Sincroniza los pendientes con la app de escritorio.
 *
 * La app del Mac no es un navegador con sesión, así que se identifica con su llave
 * (`Authorization: Bearer …`), que solo da acceso a los pendientes de esa persona.
 *
 * Va en las dos direcciones de una vez: se manda lo que cambió en el Mac y se recibe
 * lo que cambió aquí. Cuando los dos tocaron lo mismo, **gana el más reciente** por
 * `updatedAt`, igual que hacía la app entre el Mac y el iPhone.
 */

const TIPOS: Record<string, KindPendiente> = {
  tarea: "TAREA", idea: "IDEA", video: "VIDEO", skool: "SKOOL",
};
const TIPO_A_TEXTO: Record<KindPendiente, string> = {
  TAREA: "tarea", IDEA: "idea", VIDEO: "video", SKOOL: "skool",
};

/** El Mac guarda 'AAAA-MM-DD'; aquí es DateTime. Mediodía UTC para que ningún
    cambio de zona mueva la fecha de día. */
function aFecha(s: unknown) {
  if (typeof s !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(s)) return null;
  const [a, m, d] = s.split("-").map(Number);
  return new Date(Date.UTC(a, m - 1, d, 12, 0, 0));
}
function aTextoFecha(d: Date | null) {
  if (!d) return null;
  const z = new Date(d);
  return `${z.getUTCFullYear()}-${String(z.getUTCMonth() + 1).padStart(2, "0")}-${String(
    z.getUTCDate()
  ).padStart(2, "0")}`;
}

type ItemMac = {
  id?: string;
  text?: string;
  kind?: string;
  status?: string;
  priority?: number;
  tags?: string[];
  due?: string | null;
  order?: number;
  subs?: { id?: string; text?: string; done?: boolean }[];
  subsPlegadas?: boolean;
  doneAt?: number | null;
  updatedAt?: number;
  deleted?: boolean;
};

export async function POST(req: Request) {
  const userId = leeLlaveSync(
    (req.headers.get("authorization") || "").replace(/^Bearer\s+/i, "")
  );
  if (!userId) {
    return NextResponse.json({ error: "Llave no válida" }, { status: 401 });
  }

  const persona = await prisma.user.findUnique({ where: { id: userId }, select: { id: true } });
  if (!persona) return NextResponse.json({ error: "Cuenta no encontrada" }, { status: 401 });

  let cuerpo: { items?: ItemMac[]; desde?: number } = {};
  try {
    cuerpo = await req.json();
  } catch {
    return NextResponse.json({ error: "Cuerpo ilegible" }, { status: 400 });
  }

  const entran = Array.isArray(cuerpo.items) ? cuerpo.items : [];
  const desde = Number(cuerpo.desde) || 0;
  let guardados = 0;
  let borrados = 0;

  for (const it of entran) {
    const externalId = String(it.id || "").trim();
    if (!externalId) continue;

    const ya = await prisma.personalTask.findUnique({
      where: { userId_externalId: { userId, externalId } },
    });

    // Lo borrado en el Mac se borra aquí. Si nunca llegó, no hay nada que hacer.
    if (it.deleted) {
      if (ya) {
        await prisma.personalTask.delete({ where: { id: ya.id } });
        borrados++;
      }
      continue;
    }

    const texto = String(it.text || "").trim();
    if (!texto) continue;

    // Si lo de aquí es más nuevo, se deja: el Mac lo recibirá en la respuesta.
    const suFecha = Number(it.updatedAt) || 0;
    if (ya && suFecha && ya.updatedAt.getTime() > suFecha) continue;

    const datos = {
      title: texto,
      kind: TIPOS[String(it.kind || "tarea").toLowerCase()] ?? "TAREA",
      priority: Math.max(0, Math.min(2, Number(it.priority) || 0)),
      due: aFecha(it.due),
      tags: Array.isArray(it.tags) ? it.tags.map(String) : [],
      order: Number.isFinite(it.order) ? Number(it.order) : 0,
      subsFolded: !!it.subsPlegadas,
      done: it.status === "hecha" || !!it.doneAt,
      doneAt: it.doneAt ? new Date(it.doneAt) : null,
      userId,
      externalId,
    };

    const subs = (Array.isArray(it.subs) ? it.subs : [])
      .filter((s) => s && String(s.text || "").trim())
      .map((s, i) => ({ title: String(s.text).trim(), done: !!s.done, order: i }));

    const fila = ya
      ? await prisma.personalTask.update({ where: { id: ya.id }, data: datos })
      : await prisma.personalTask.create({ data: datos });

    // Las subtareas se rehacen: el Mac manda la lista completa cada vez.
    await prisma.personalSubtask.deleteMany({ where: { taskId: fila.id } });
    if (subs.length) {
      await prisma.personalSubtask.createMany({
        data: subs.map((s) => ({ ...s, taskId: fila.id })),
      });
    }
    guardados++;
  }

  // Y de vuelta: lo que cambió aquí desde la última vez, en el formato del Mac.
  const salen = await prisma.personalTask.findMany({
    where: { userId, ...(desde ? { updatedAt: { gt: new Date(desde) } } : {}) },
    include: { subtasks: { orderBy: { order: "asc" } } },
  });

  return NextResponse.json({
    ok: true,
    guardados,
    borrados,
    ahora: Date.now(),
    items: salen.map((f) => ({
      id: f.externalId || f.id,
      text: f.title,
      kind: TIPO_A_TEXTO[f.kind],
      status: f.done ? "hecha" : "pendiente",
      priority: f.priority,
      tags: f.tags,
      due: aTextoFecha(f.due),
      order: f.order,
      subs: f.subtasks.map((s) => ({ id: s.id, text: s.title, done: s.done })),
      subsPlegadas: f.subsFolded,
      createdAt: f.createdAt.getTime(),
      doneAt: f.doneAt ? f.doneAt.getTime() : null,
      updatedAt: f.updatedAt.getTime(),
      deleted: false,
    })),
  });
}

/** Para que la app de escritorio pueda comprobar que la llave sirve. */
export async function GET(req: Request) {
  const userId = leeLlaveSync(
    (req.headers.get("authorization") || "").replace(/^Bearer\s+/i, "")
  );
  if (!userId) return NextResponse.json({ error: "Llave no válida" }, { status: 401 });
  const p = await prisma.user.findUnique({
    where: { id: userId },
    select: { name: true, email: true },
  });
  if (!p) return NextResponse.json({ error: "Cuenta no encontrada" }, { status: 401 });
  const cuantos = await prisma.personalTask.count({ where: { userId } });
  return NextResponse.json({ ok: true, nombre: p.name, correo: p.email, pendientes: cuantos });
}
