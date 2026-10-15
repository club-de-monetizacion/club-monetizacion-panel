import { NextResponse, type NextRequest } from "next/server";
import { GALLETA } from "@/lib/club-sso";

/**
 * ¿SIGUE ABIERTA LA SESIÓN DEL CLUB?
 *
 * La pregunta el vigilante de la página (`vigila-sesion.tsx`) cuando desaparece
 * la pista `club_hay`. La cookie de verdad es HttpOnly y el navegador no la ve:
 * aquí sí. No consulta al Club, solo mira si la cookie sigue puesta, que es lo
 * que cambia cuando alguien cierra sesión en cualquier herramienta.
 */
export function GET(req: NextRequest) {
  return NextResponse.json(
    { dentro: !!req.cookies.get(GALLETA)?.value },
    { headers: { "Cache-Control": "no-store" } },
  );
}
