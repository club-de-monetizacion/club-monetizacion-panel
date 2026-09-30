import { createHmac, timingSafeEqual } from "node:crypto";

/**
 * La llave que usa la app de escritorio para sincronizar sin navegador.
 *
 * Se deriva del `AUTH_SECRET` y del id de la persona, así que **no hace falta
 * guardarla en ninguna tabla**: se comprueba con una cuenta. Y si algún día hay que
 * invalidar todas, se cambia `AUTH_SECRET` y caducan de golpe (igual que las
 * sesiones, que ya dependen de él).
 *
 * No caduca por sí sola: es para un dispositivo que es de la persona, como la llave
 * de casa. Quien tenga esta llave puede leer y escribir los pendientes de esa
 * persona, nada más: ni tareas del equipo, ni nada de nadie más.
 */
const secreto = () => process.env.AUTH_SECRET ?? "";

const firma = (userId: string) =>
  createHmac("sha256", secreto()).update("pendientes:" + userId).digest("base64url");

export function haceLlaveSync(userId: string) {
  return Buffer.from(userId).toString("base64url") + "." + firma(userId);
}

/** Devuelve el id de la persona, o null si la llave no vale. */
export function leeLlaveSync(llave: string | null | undefined): string | null {
  if (!secreto()) return null;
  const partes = String(llave || "").split(".");
  if (partes.length !== 2) return null;
  let userId = "";
  try {
    userId = Buffer.from(partes[0], "base64url").toString("utf8");
  } catch {
    return null;
  }
  if (!userId) return null;

  const esperada = Buffer.from(firma(userId));
  const dada = Buffer.from(partes[1]);
  // Comparación en tiempo constante: no filtra la firma por los tiempos de respuesta.
  if (esperada.length !== dada.length || !timingSafeEqual(esperada, dada)) return null;
  return userId;
}
