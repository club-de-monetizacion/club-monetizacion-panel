"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/auth-helpers";
import { parseCaptura } from "@/lib/pendientes-parse";
import { aFecha, deFecha } from "@/lib/pendientes-fechas";
import type { KindPendiente } from "@prisma/client";

/**
 * Los pendientes privados de cada persona. Es la app de escritorio de Diego,
 * traída aquí: se captura todo de corrido (`#etiqueta @viernes !!`) y de ahí salen
 * la etiqueta, el plazo y la prioridad.
 *
 * Como en las tareas personales de antes: **cada acción comprueba que la fila es de
 * quien la pide**, sin excepción para administradores. Esta lista es privada.
 */

const textoSchema = z.string().trim().min(1, "Escribe algo").max(4000);
const TIPOS_VALIDOS = ["TAREA", "IDEA", "VIDEO", "SKOOL"] as const;

/* Solo la pantalla de Pendientes: refrescar también la portada en cada clic hacía
   que marcar una casilla recargase cosas que no habían cambiado. */
function refrescar() {
  revalidatePath("/pendientes");
}

async function miPendiente(id: string) {
  const session = await requireSession();
  const fila = await prisma.personalTask.findUnique({ where: { id } });
  if (!fila || fila.userId !== session.user.id) throw new Error("No encontrado");
  return { fila, userId: session.user.id };
}

export async function crearPendiente(texto: string, tipo: string = "TAREA", plazo?: string | null) {
  const session = await requireSession();
  const bruto = textoSchema.safeParse(texto);
  if (!bruto.success) return { error: bruto.error.issues[0]?.message ?? "Datos inválidos" };

  const p = parseCaptura(bruto.data);
  if (!p.text) return { error: "Escribe algo" };

  const kind = (TIPOS_VALIDOS as readonly string[]).includes(tipo)
    ? (tipo as KindPendiente)
    : "TAREA";

  // El plazo del selector manda sobre el que venga escrito con @
  const due = aFecha(plazo || p.due);

  // Lo nuevo va arriba: el orden más bajo es el primero de la lista.
  const primero = await prisma.personalTask.aggregate({
    where: { userId: session.user.id, done: false },
    _min: { order: true },
  });

  await prisma.personalTask.create({
    data: {
      title: p.text,
      tags: p.tags,
      priority: p.priority,
      due,
      kind,
      userId: session.user.id,
      order: (primero._min.order ?? 0) - 1,
    },
  });

  refrescar();
  return { success: true };
}

export async function cambiarTextoPendiente(id: string, texto: string) {
  const { fila } = await miPendiente(id);
  const bruto = textoSchema.safeParse(texto);
  if (!bruto.success) return { error: bruto.error.issues[0]?.message ?? "Datos inválidos" };

  /* Al editar se vuelve a leer la captura, como en la app de escritorio: si añades
     `#etiqueta` o `@viernes` mientras editas, se aplican. Lo que ya estaba puesto no
     se pierde si el texto nuevo no lo menciona. */
  const p = parseCaptura(bruto.data);
  if (!p.text) return { error: "Escribe algo" };

  await prisma.personalTask.update({
    where: { id },
    data: {
      title: p.text,
      tags: p.tags.length ? p.tags : fila.tags,
      priority: p.priority || fila.priority,
      due: p.due ? aFecha(p.due) : fila.due,
    },
  });

  refrescar();
  return { success: true };
}

export async function marcarPendiente(id: string, hecho: boolean) {
  await miPendiente(id);
  await prisma.personalTask.update({
    where: { id },
    data: { done: hecho, doneAt: hecho ? new Date() : null },
  });
  refrescar();
  return { success: true };
}

export async function cambiarTipoPendiente(id: string, tipo: string) {
  await miPendiente(id);
  if (!(TIPOS_VALIDOS as readonly string[]).includes(tipo)) return { error: "Tipo desconocido" };
  await prisma.personalTask.update({ where: { id }, data: { kind: tipo as KindPendiente } });
  refrescar();
  return { success: true };
}

export async function cambiarPrioridadPendiente(id: string, prioridad: number) {
  await miPendiente(id);
  const n = Math.max(0, Math.min(2, Math.round(prioridad)));
  await prisma.personalTask.update({ where: { id }, data: { priority: n } });
  refrescar();
  return { success: true };
}

export async function cambiarPlazoPendiente(id: string, plazo: string | null) {
  await miPendiente(id);
  await prisma.personalTask.update({ where: { id }, data: { due: aFecha(plazo) } });
  refrescar();
  return { success: true };
}

export async function borrarPendiente(id: string) {
  await miPendiente(id);
  // Las subtareas se van con él (onDelete: Cascade en el esquema).
  await prisma.personalTask.delete({ where: { id } });
  refrescar();
  return { success: true };
}

export async function limpiarHechos() {
  const session = await requireSession();
  const { count } = await prisma.personalTask.deleteMany({
    where: { userId: session.user.id, done: true },
  });
  refrescar();
  return { success: true, borrados: count };
}

/* ── Subtareas ─────────────────────────────────────────────────────────────── */

export async function agregarSubtarea(taskId: string, texto: string) {
  await miPendiente(taskId);
  const t = z.string().trim().min(1).max(500).safeParse(texto);
  if (!t.success) return { error: "Escribe algo" };

  const ultimo = await prisma.personalSubtask.aggregate({
    where: { taskId },
    _max: { order: true },
  });
  await prisma.personalSubtask.create({
    data: { title: t.data, taskId, order: (ultimo._max.order ?? -1) + 1 },
  });
  refrescar();
  return { success: true };
}

async function miSubtarea(id: string) {
  const session = await requireSession();
  const sub = await prisma.personalSubtask.findUnique({
    where: { id },
    include: { task: { select: { userId: true } } },
  });
  if (!sub || sub.task.userId !== session.user.id) throw new Error("No encontrada");
  return sub;
}

export async function marcarSubtarea(id: string, hecho: boolean) {
  await miSubtarea(id);
  await prisma.personalSubtask.update({ where: { id }, data: { done: hecho } });
  refrescar();
  return { success: true };
}

export async function borrarSubtarea(id: string) {
  await miSubtarea(id);
  await prisma.personalSubtask.delete({ where: { id } });
  refrescar();
  return { success: true };
}

export async function plegarSubtareas(taskId: string, plegadas: boolean) {
  await miPendiente(taskId);
  await prisma.personalTask.update({
    where: { id: taskId },
    data: { subsFolded: plegadas },
  });
  refrescar();
  return { success: true };
}

/* ── Lectura ───────────────────────────────────────────────────────────────── */

export type PendienteVista = {
  id: string;
  texto: string;
  tipo: KindPendiente;
  hecho: boolean;
  prioridad: number;
  plazo: string | null;
  etiquetas: string[];
  plegadas: boolean;
  creado: string;
  subtareas: { id: string; texto: string; hecho: boolean }[];
};

export async function misPendientes(): Promise<PendienteVista[]> {
  const session = await requireSession();
  const filas = await prisma.personalTask.findMany({
    where: { userId: session.user.id },
    include: { subtasks: { orderBy: { order: "asc" } } },
    orderBy: [{ done: "asc" }, { order: "asc" }, { createdAt: "desc" }],
  });

  return filas.map((f) => ({
    id: f.id,
    texto: f.title,
    tipo: f.kind,
    hecho: f.done,
    prioridad: f.priority,
    plazo: deFecha(f.due),
    etiquetas: f.tags,
    plegadas: f.subsFolded,
    creado: f.createdAt.toISOString(),
    subtareas: f.subtasks.map((s) => ({ id: s.id, texto: s.title, hecho: s.done })),
  }));
}
