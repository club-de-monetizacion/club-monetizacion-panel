import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

/**
 * Para la app de escritorio (11 nov 2026): cuántos pendientes tiene la persona sin terminar
 * y cuáles ya cumplieron su plazo. Con eso pinta el número del botón flotante y, a la 1 pm,
 * avisa de los vencidos (como hacía la app de Pendientes del Mac).
 *
 * Con la sesión de la web, igual que cualquier página: la app de escritorio es la misma
 * web, así que manda la misma cookie. Solo los pendientes de quien pregunta.
 */
export const dynamic = "force-dynamic";

/** Hoy en Ciudad de México, como 'AAAA-MM-DD'. */
function hoyMx() {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Mexico_City", year: "numeric", month: "2-digit", day: "2-digit",
  }).format(new Date());
}

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ ok: false, error: "Sin sesión" }, { status: 401, headers: { "cache-control": "no-store" } });
  }
  const yo = session.user.id;
  /* El plazo se guarda a mediodía UTC de su día: «vence hoy o ya venció» = hasta el final de hoy. */
  const [a, m, d] = hoyMx().split("-").map(Number);
  const finDeHoy = new Date(Date.UTC(a, m - 1, d, 23, 59, 59));

  const [sinHacer, vencidos] = await Promise.all([
    prisma.personalTask.count({ where: { userId: yo, done: false, deletedAt: null } }),
    prisma.personalTask.findMany({
      where: { userId: yo, done: false, deletedAt: null, due: { not: null, lte: finDeHoy } },
      select: { id: true, title: true, due: true },
      orderBy: { due: "asc" },
      take: 20,
    }),
  ]);

  return NextResponse.json(
    {
      ok: true,
      sinHacer,
      vencidos: vencidos.map((v) => ({ id: v.id, texto: v.title, plazo: v.due ? v.due.toISOString().slice(0, 10) : null })),
    },
    { headers: { "cache-control": "no-store" } }
  );
}
