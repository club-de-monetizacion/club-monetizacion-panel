import { NextResponse, type NextRequest } from "next/server";
import {
  CLUB,
  DOMINIO_CLUB,
  GALLETA,
  NOMBRE,
  PISTA,
  enElDominioDelClub,
  origenPublico,
} from "@/lib/club-sso";

/**
 * CERRAR SESIÓN AQUÍ ES CERRAR SESIÓN EN TODO EL CLUB
 *
 * Es el mismo protocolo que en el resto del Club: se borran las tres cookies del
 * Club en el dominio padre (`club_sesion`, `club_hay`, `club_nom`) y la sesión
 * propia de Auth.js, y se va a la portada del Club ya sin sesión.
 *
 * ⚠️ TODO EN UNA SOLA RESPUESTA. Antes se borraba con un `fetch` y luego
 * `signOut()` de Auth.js decidía a dónde ir: como clubdemonetizacion.com es otro
 * origen, Auth.js lo cambiaba por la portada de tareas, que volvía a entrar sola
 * y acababa abriendo el panel con la sesión puesta. Ahora el formulario hace un
 * POST normal, esta respuesta borra todo y manda al Club con un 303: el navegador
 * aplica los borrados antes de dar el salto.
 *
 * Es POST a propósito: un enlace o una imagen de otra web no pueden cerrarle la
 * sesión a nadie.
 */
export async function POST(req: NextRequest) {
  const r = NextResponse.redirect(CLUB, 303);
  /* ⚠️ El host y el protocolo de la cabecera, no los de `nextUrl`: con `next
     start` este traía «localhost» y las cookies del Club se borraban sin su
     dominio, o sea que NO se borraban y la sesión seguía viva en el Club. */
  const origen = new URL(origenPublico(req.headers, req.nextUrl));
  const segura = origen.protocol === "https:";
  const delClub = enElDominioDelClub(origen.hostname);
  const borra = (nombre: string, soloServidor: boolean, enDominio: boolean) =>
    r.cookies.set(nombre, "", {
      ...(enDominio ? { domain: DOMINIO_CLUB } : {}),
      path: "/",
      maxAge: 0,
      expires: new Date(0),
      secure: segura || nombre.startsWith("__"),
      sameSite: "lax",
      httpOnly: soloServidor,
    });

  // Las tres del Club, donde las dejó el Club: en el dominio padre. En local
  // (pruebas) no hay dominio padre y van sin él.
  borra(GALLETA, true, delClub);
  borra(PISTA, false, delClub);
  borra(NOMBRE, false, delClub);

  // La sesión propia: todas las cookies de Auth.js, también los trozos `.0`, `.1`
  // en que parte la sesión cuando es grande.
  for (const c of req.cookies.getAll()) {
    if (/^(__Secure-|__Host-)?authjs\./.test(c.name)) borra(c.name, true, false);
  }
  r.headers.set("Cache-Control", "no-store");
  return r;
}
