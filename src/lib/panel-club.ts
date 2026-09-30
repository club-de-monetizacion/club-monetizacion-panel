/**
 * El panel del Club (`panel.clubdemonetizacion.com`) es la única fuente de verdad de
 * quién entra y con qué papel. Esta app **no guarda contraseñas**: se las pasa al
 * panel y obedece su respuesta.
 *
 * El panel es un sistema en producción con alumnos que pagaron: desde aquí solo se
 * consulta, nunca se modifica. Ver TRABAJO-EN-EQUIPO.md.
 */
import type { Role } from "@prisma/client";

const PANEL =
  process.env.PANEL_CLUB_URL ?? "https://panel.clubdemonetizacion.com/api/encuesta";

/** Un panel lento no puede dejar el login colgado. */
const ESPERA_MAX_MS = 10_000;

/** Los papeles que reparte el panel. `mirar` es de solo consulta. */
export type RolPanel = "maestro" | "equipo" | "mirar";

export type Entrada =
  | { ok: true; tok: string; nombre: string | null; rol: RolPanel }
  | { ok: false; error: string };

async function pide(cuerpo: Record<string, unknown>): Promise<{
  estado: number;
  datos: Record<string, unknown>;
}> {
  const res = await fetch(PANEL, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(cuerpo),
    cache: "no-store",
    signal: AbortSignal.timeout(ESPERA_MAX_MS),
  });
  let datos: Record<string, unknown> = {};
  try {
    datos = (await res.json()) as Record<string, unknown>;
  } catch {
    // El panel contestó algo que no era JSON; se trata como fallo, no se adivina.
  }
  return { estado: res.status, datos };
}

const texto = (v: unknown): string | null =>
  typeof v === "string" && v.trim() ? v.trim() : null;

/** Valida correo y contraseña contra el panel. La contraseña no se guarda aquí. */
export async function entrarEquipo(email: string, clave: string): Promise<Entrada> {
  try {
    const { estado, datos } = await pide({
      action: "entrarEquipo",
      email,
      clave,
    });

    if (estado === 200 && datos.ok === true) {
      const tok = texto(datos.tok);
      const rol = texto(datos.rol) as RolPanel | null;
      if (!tok || !rol) return { ok: false, error: "El panel contestó sin token ni papel" };
      return { ok: true, tok, nombre: texto(datos.nombre), rol };
    }

    // El panel ya escribe mensajes claros («Correo o contraseña incorrectos»,
    // «sin-verificar»): se muestran tal cual en vez de inventar otros.
    return { ok: false, error: texto(datos.error) ?? "No se pudo iniciar sesión" };
  } catch {
    return { ok: false, error: "No se pudo contactar el panel del Club" };
  }
}

/**
 * Comprueba que la sesión sigue viva. El panel relee la ficha de la persona en cada
 * llamada, así que quitarle el acceso allá surte efecto aquí sin esperar a que caduque
 * el token.
 */
export async function sigueValida(
  tok: string,
): Promise<{ ok: true; rol: RolPanel; email: string } | { ok: false; caducada: boolean }> {
  try {
    const { estado, datos } = await pide({ action: "yo", tok });
    if (estado === 200 && datos.ok === true) {
      const rol = texto(datos.rol) as RolPanel | null;
      const email = texto(datos.email);
      if (rol && email) return { ok: true, rol, email };
    }
    // 401/403 = el panel dice que ya no entra. Cualquier otra cosa (500, caída) no
    // puede echar a nadie: sería dejar al equipo fuera por un fallo pasajero.
    return { ok: false, caducada: estado === 401 || estado === 403 };
  } catch {
    return { ok: false, caducada: false };
  }
}

/**
 * Diego no tiene contraseña de equipo: entra al panel con su clave maestra. El panel
 * la reconoce en la misma llamada `yo` (su `quienEs` prueba primero la clave maestra
 * y devuelve el papel `maestro`), así que no hay que añadirle nada.
 *
 * **La clave maestra no se guarda en ningún sitio de esta app**, ni siquiera en la
 * sesión: se valida una vez al entrar y se olvida. Por eso la sesión del dueño no se
 * revalida contra el panel; dura lo que dure su sesión y se corta al salir.
 */
export async function entraComoDueno(
  clave: string,
  pin: string,
): Promise<{ ok: true } | { ok: false; error: string }> {
  try {
    const { estado, datos } = await pide({ action: "yo", pass: clave, pin });
    if (estado === 200 && datos.ok === true && texto(datos.rol) === "maestro") {
      return { ok: true };
    }
    return { ok: false, error: "La clave maestra o el PIN no son correctos" };
  } catch {
    return { ok: false, error: "No se pudo contactar el panel del Club" };
  }
}

/**
 * El papel del panel manda. `maestro` y `equipo` son los administradores del Club;
 * `mirar` solo consulta. Cualquier otro valor no entra.
 */
export function papelDelRol(rol: string | null | undefined): Role | null {
  switch (rol) {
    case "maestro":
    case "equipo":
      return "ADMIN";
    case "mirar":
      return "MIEMBRO";
    default:
      return null;
  }
}
