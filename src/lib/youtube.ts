/**
 * Leer los seguidores de un canal de YouTube con la API pública de Google.
 *
 * Es la única red de las cuatro que lo permite sin que la persona autorice nada:
 * Instagram, Facebook y TikTok solo entregan esos datos a apps aprobadas por ellas y
 * con el permiso de cada dueño, y rascar sus páginas va contra sus condiciones. Esas
 * tres se anotan a mano.
 *
 * Necesita `YOUTUBE_API_KEY` (una clave de la API de datos de YouTube v3, gratuita). Si
 * no está, `youtubeDisponible()` es falso y la pantalla no ofrece el botón.
 */

export const youtubeDisponible = () => !!process.env.YOUTUBE_API_KEY;

export type CanalYoutube = {
  nombre: string;
  seguidores: number;
  foto: string | null;
};

/** Cómo identifica YouTube el canal según la forma de la dirección. */
function buscaCanal(url: string): { param: string; valor: string } | null {
  let u: URL;
  try {
    u = new URL(url);
  } catch {
    return null;
  }
  const partes = u.pathname.split("/").filter(Boolean);
  const [a, b] = partes;
  if (a?.startsWith("@")) return { param: "forHandle", valor: a };
  if (a === "channel" && b) return { param: "id", valor: b };
  if (a === "user" && b) return { param: "forUsername", valor: b };
  // /c/nombre es una forma antigua que la API ya no resuelve; se trata como handle.
  if (a === "c" && b) return { param: "forHandle", valor: `@${b}` };
  return null;
}

export async function leerCanalYoutube(
  url: string,
): Promise<{ ok: true; canal: CanalYoutube } | { ok: false; error: string }> {
  const clave = process.env.YOUTUBE_API_KEY;
  if (!clave) return { ok: false, error: "La lectura automática de YouTube no está activada" };

  const canal = buscaCanal(url);
  if (!canal) {
    return {
      ok: false,
      error: "Usa la dirección del canal (youtube.com/@tucanal) para leer los seguidores",
    };
  }

  const api = new URL("https://www.googleapis.com/youtube/v3/channels");
  api.searchParams.set("part", "snippet,statistics");
  api.searchParams.set(canal.param, canal.valor);
  api.searchParams.set("key", clave);

  try {
    const res = await fetch(api, { cache: "no-store", signal: AbortSignal.timeout(8_000) });
    if (!res.ok) return { ok: false, error: "YouTube no contestó. Anota la cifra a mano." };
    const datos = (await res.json()) as {
      items?: {
        snippet?: { title?: string; thumbnails?: Record<string, { url?: string }> };
        statistics?: { subscriberCount?: string; hiddenSubscriberCount?: boolean };
      }[];
    };
    const item = datos.items?.[0];
    if (!item) return { ok: false, error: "No encontré ese canal. Revisa la dirección." };
    if (item.statistics?.hiddenSubscriberCount) {
      return { ok: false, error: "Ese canal tiene los suscriptores ocultos. Anota la cifra a mano." };
    }
    const n = Number(item.statistics?.subscriberCount);
    if (!Number.isFinite(n)) return { ok: false, error: "YouTube no devolvió los suscriptores" };
    const fotos = item.snippet?.thumbnails ?? {};
    return {
      ok: true,
      canal: {
        nombre: item.snippet?.title ?? "",
        seguidores: n,
        foto: fotos.medium?.url ?? fotos.default?.url ?? null,
      },
    };
  } catch {
    return { ok: false, error: "No se pudo contactar YouTube. Anota la cifra a mano." };
  }
}
