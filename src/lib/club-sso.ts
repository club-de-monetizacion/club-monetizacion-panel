/**
 * LA SESIÓN DEL CLUB ES LA SESIÓN DE TAREAS
 *
 * Tareas no tiene puerta propia: es una herramienta más del Club. Se entra y se
 * sale con la misma cookie que la plataforma, la Bóveda, el Arsenal y el
 * Analizador. Aquí no hay formulario, ni contraseña, ni clave maestra.
 *
 * La sesión del Club es la cookie `club_sesion` (HttpOnly, firmada, en
 * `.clubdemonetizacion.com`), así que le llega a `tareas.`. No se descifra —el
 * secreto es del Club—: se le reenvía al Club y él dice de quién es, igual que
 * hace el Analizador. Esta app no guarda ningún secreto del Club.
 */

/** La plataforma: a donde se va a entrar, a volver y al salir. */
export const CLUB = "https://clubdemonetizacion.com";

/** El dominio padre: solo desde él se pueden borrar las cookies del Club. */
export const DOMINIO_CLUB = ".clubdemonetizacion.com";

/** Las tres cookies del Club. Solo `club_sesion` autoriza; las otras dos son
 *  pistas que el navegador puede leer para pintar sin esperar al servidor. */
export const GALLETA = "club_sesion";
export const PISTA = "club_hay";
export const NOMBRE = "club_nom";

/* A quién se le pregunta. Solo cambia en las pruebas locales, para no llamar
   nunca al Club de verdad desde una prueba. */
const PUERTA = process.env.CLUB_SESION_URL || CLUB + "/api/sesion";

export type QuienDelClub = { email: string; nombre: string; foto: string; rol: string };

export type RespuestaClub =
  | { estado: "dentro"; quien: QuienDelClub }
  /** el Club dice que esa cookie no es de nadie (caducada, falsa o bloqueada) */
  | { estado: "fuera" }
  /** el Club no contestó: no se decide nada, ni se echa a nadie */
  | { estado: "sin-respuesta" };

/* ⚠️ UNA SOLA PREGUNTA POR ENTRADA.
   Al entrar se pregunta dos veces seguidas (la ruta de entrada y el `authorize`
   de Auth.js): sin esto eran dos viajes al Club, medio segundo cada uno. La
   respuesta se guarda 30 s por huella de la cookie, nunca la cookie en claro. */
const MEMORIA = new Map<string, { r: RespuestaClub; hasta: number }>();
const VIDA_MEMORIA_MS = 30_000;

/** Un resumen corto de la cookie: sirve para saber si sigue siendo la misma
 *  sin guardar ni enseñar la cookie. */
export async function huellaDe(valor: string): Promise<string> {
  const resumen = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(valor));
  return Array.from(new Uint8Array(resumen).slice(0, 12), (b) =>
    b.toString(16).padStart(2, "0"),
  ).join("");
}

/** Le pregunta al Club de quién es esta cookie. Solo se le manda `club_sesion`:
 *  ninguna otra cookie de esta app sale de aquí. */
export async function preguntaAlClub(valor: string, esperaMs = 4000): Promise<RespuestaClub> {
  if (!valor) return { estado: "fuera" };
  const llave = await huellaDe(valor);
  const guardada = MEMORIA.get(llave);
  if (guardada && guardada.hasta > Date.now()) return guardada.r;

  let r: RespuestaClub;
  try {
    const res = await fetch(PUERTA, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        cookie: GALLETA + "=" + encodeURIComponent(valor),
      },
      body: JSON.stringify({ action: "yo" }),
      cache: "no-store",
      signal: AbortSignal.timeout(esperaMs),
    });
    if (res.status === 401 || res.status === 403) {
      r = { estado: "fuera" };
    } else if (!res.ok) {
      return { estado: "sin-respuesta" };
    } else {
      const d = (await res.json()) as {
        usuario?: { email?: string; nombre?: string; foto?: string; rol?: string } | null;
      };
      const u = d?.usuario;
      r = u?.email
        ? {
            estado: "dentro",
            quien: {
              email: String(u.email).trim().toLowerCase(),
              nombre: String(u.nombre ?? "").trim(),
              foto: String(u.foto ?? "").trim(),
              rol: String(u.rol ?? "miembro"),
            },
          }
        : { estado: "fuera" };
    }
  } catch {
    // Sin red o sin respuesta a tiempo: no se inventa una sesión ni se echa a nadie.
    return { estado: "sin-respuesta" };
  }
  if (MEMORIA.size > 500) MEMORIA.clear();
  MEMORIA.set(llave, { r, hasta: Date.now() + VIDA_MEMORIA_MS });
  return r;
}

/**
 * Quién entra a tareas: solo el equipo. Propietario, admin y equipo del Club son
 * ADMIN aquí; cualquier otro papel (un alumno) no tiene nada que hacer en los
 * tableros internos y vuelve al Club.
 */
export function papelEnTareas(rolDelClub: string): "ADMIN" | null {
  const r = String(rolDelClub || "").toLowerCase();
  return r === "propietario" || r === "admin" || r === "equipo" ? "ADMIN" : null;
}

/** El acceso del Club, que al entrar te devuelve aquí (su `?volver=`). */
export function aEntrarEnElClub(volver: string): string {
  return CLUB + "/?volver=" + encodeURIComponent(volver);
}

/** Solo rutas de esta misma app: un `volver` que apunte fuera (o a la propia
 *  puerta, que daría vueltas) se cambia por el inicio. */
export function rutaSegura(v: string | null | undefined): string {
  const s = String(v ?? "");
  if (!s.startsWith("/") || s.startsWith("//") || s.startsWith("/\\")) return "/";
  if (s.startsWith("/api/") || s.startsWith("/login")) return "/";
  return s;
}

/**
 * La dirección pública de esta app, tal como la escribió el navegador.
 *
 * ⚠️ NO SE SACA DE `nextUrl`. Detrás del servidor de Next (`next start`, y según
 * el despliegue) `nextUrl` trae el host interno: el `?volver=` del Club salía
 * como https://localhost:3101/… y la vuelta tras entrar se perdía. El host que
 * vale es el de la cabecera, como hace Auth.js con `trustHost`.
 */
export function origenPublico(headers: Headers, respaldo: URL): string {
  const primero = (v: string | null) => (v ?? "").split(",")[0].trim();
  const host = primero(headers.get("x-forwarded-host")) || primero(headers.get("host")) || respaldo.host;
  const proto = primero(headers.get("x-forwarded-proto")) || respaldo.protocol.replace(":", "");
  return proto + "://" + host;
}

/** ¿Esta petición llega por el dominio del Club? En local no: ahí las cookies
 *  van sin dominio, que si no el navegador no las acepta. */
export function enElDominioDelClub(host: string): boolean {
  const h = host.toLowerCase();
  return h === "clubdemonetizacion.com" || h.endsWith(".clubdemonetizacion.com");
}
