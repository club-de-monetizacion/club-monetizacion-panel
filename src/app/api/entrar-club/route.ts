import { NextResponse, type NextRequest } from "next/server";
import { signIn } from "@/auth";
import {
  CLUB,
  GALLETA,
  aEntrarEnElClub,
  origenPublico,
  papelEnTareas,
  preguntaAlClub,
  rutaSegura,
} from "@/lib/club-sso";

/**
 * ENTRAR CON LA SESIÓN DEL CLUB
 *
 * Aquí llega el portero (`authorized` en `auth.ts`) cuando trae la cookie del
 * Club y todavía no hay sesión de tareas, o es de otra persona. Nadie ve nada:
 * todo son redirecciones del servidor, y en el peor caso la pantalla de carga.
 *
 * Vive en una ruta y no en una página porque `signIn` solo puede dejar su cookie
 * desde una ruta o una acción de servidor; desde una página se traga el error.
 *
 *   · cookie válida y del equipo → se crea la sesión y se vuelve a donde ibas
 *   · cookie que el Club no reconoce → al acceso del Club (con la vuelta aquí)
 *   · del Club pero no del equipo → a su panel del Club, sin vuelta: si se le
 *     devolviera aquí, el Club lo rebotaría otra vez y se vería el tiovivo
 *   · el Club no contesta → pantalla de carga que vuelve a probar sola
 */
const LIMITE_VUELTAS = 3;
const VUELTAS = "tareas_vueltas";

export async function GET(req: NextRequest) {
  const aqui = req.nextUrl;
  // ⚠️ el origen público, no el de `nextUrl` (ver `origenPublico`)
  const origen = origenPublico(req.headers, aqui);
  const volver = rutaSegura(aqui.searchParams.get("volver"));
  const valor = req.cookies.get(GALLETA)?.value ?? "";
  const ir = (destino: string | URL) => NextResponse.redirect(destino, 303);

  if (!valor) return ir(aEntrarEnElClub(new URL(volver, origen).href));

  /* ⚠️ RED DE SEGURIDAD CONTRA EL BUCLE. Si el navegador no guardara la cookie
     de la sesión (bloqueo de cookies, modo raro), el portero mandaría aquí una y
     otra vez hasta el «demasiadas redirecciones» del navegador. A la tercera en
     20 s se para y se va al Club. */
  const vueltas = Number(req.cookies.get(VUELTAS)?.value ?? "0") || 0;
  if (vueltas >= LIMITE_VUELTAS) {
    const r = ir(CLUB);
    r.cookies.set(VUELTAS, "", { path: "/", maxAge: 0 });
    return r;
  }

  const club = await preguntaAlClub(valor);
  if (club.estado === "fuera") return ir(aEntrarEnElClub(new URL(volver, origen).href));
  if (club.estado === "sin-respuesta") return ir(reintento(aqui, origen, volver));
  if (!papelEnTareas(club.quien.rol)) return ir(CLUB);

  try {
    // `authorize` vuelve a preguntar, pero la respuesta ya está en memoria.
    await signIn("club", { galleta: valor, redirect: false });
  } catch {
    // La base no respondió al crear la sesión: se reintenta, no se enseña un error.
    return ir(reintento(aqui, origen, volver));
  }

  const r = ir(new URL(volver, origen));
  r.cookies.set(VUELTAS, String(vueltas + 1), {
    path: "/",
    maxAge: 20,
    sameSite: "lax",
    httpOnly: true,
    secure: origen.startsWith("https:"),
  });
  return r;
}

/** La pantalla de carga de `/login`, que vuelve a probar sola un par de veces. */
function reintento(aqui: URL, origen: string, volver: string): URL {
  const n = Number(aqui.searchParams.get("intento") ?? "0") || 0;
  if (n >= 2) return new URL(CLUB);
  const u = new URL("/login", origen);
  u.searchParams.set("reintento", String(n + 1));
  u.searchParams.set("volver", volver);
  return u;
}
