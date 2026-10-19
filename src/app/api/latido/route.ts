import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

/**
 * Un latido: dice si la base responde.
 *
 * Antes lo llamaba un cron cada 5 min para que la base (Neon, que se suspende sola)
 * no se durmiera nunca. Eso la tenía encendida las 24 horas y, lo más probable,
 * agotó la cuota gratis: el 17 oct 2026 Tareas dejó de abrir. El cron ya no existe
 * (`vercel.json`); la ruta se queda para comprobar a mano si la base está viva.
 *
 * No toca nada ni devuelve nada de nadie.
 */
export async function GET() {
  const t0 = Date.now();
  try {
    await prisma.$queryRaw`SELECT 1`;
    return NextResponse.json(
      { ok: true, ms: Date.now() - t0 },
      { headers: { "cache-control": "no-store" } }
    );
  } catch (e) {
    /* ⚠️ El detalle, solo al log. El mensaje de Prisma trae el nombre del servidor
       de la base («Can't reach database server at …»), y esta ruta es pública. */
    console.error("[latido] la base no respondió:", e);
    return NextResponse.json(
      { ok: false, error: "La base no responde" },
      { status: 503, headers: { "cache-control": "no-store" } }
    );
  }
}
