import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

/**
 * Un latido para que la app no se quede dormida.
 *
 * Sin esto, la primera persona que entraba tras un rato de calma pagaba casi un
 * segundo de más: la función del servidor arrancaba de cero y la base de datos
 * (Neon, que se suspende sola) tenía que despertar. Un cron lo llama cada pocos
 * minutos y los dos se quedan calientes.
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
    return NextResponse.json(
      { ok: false, error: String((e as Error)?.message || e).slice(0, 120) },
      { status: 503, headers: { "cache-control": "no-store" } }
    );
  }
}
