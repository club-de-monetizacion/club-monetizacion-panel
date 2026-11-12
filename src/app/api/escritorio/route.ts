import { NextResponse } from "next/server";
import { ESCRITORIO } from "@/lib/escritorio";

/**
 * La versión publicada de la app de escritorio y sus descargas. Pública a propósito: la
 * app pregunta aquí si hay versión nueva antes de que la persona haya entrado, y no lleva
 * ningún dato de nadie.
 */
export function GET() {
  return NextResponse.json(
    { ok: true, version: ESCRITORIO.version, fecha: ESCRITORIO.fecha, descargas: ESCRITORIO.descargas },
    { headers: { "cache-control": "no-store" } }
  );
}
