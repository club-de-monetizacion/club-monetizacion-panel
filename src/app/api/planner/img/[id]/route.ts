import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

/**
 * Una imagen del YouTube Planner (portadas, recursos, banco de miniaturas). Desde el
 * 11 nov 2026 cada imagen vive en su fila `img/<huella>` y las secciones solo llevan
 * esta dirección (ver `api/planner/route.ts`). La huella sale del contenido, así que lo
 * que hay detrás de una dirección no cambia nunca.
 *
 * ⚡ RÁPIDAS (11 nov 2026, Diego: «las imágenes están cargando muy lento, si alguien sube
 * algo se tarda en cargar»). Las portadas pesan 2–3 MB (PNG de 1280×720) y las tarjetas
 * las enseñan a 300 px: `?w=<ancho>` da una copia en WebP de ese ancho (40–80 KB). La
 * original sigue igual y es la que usa el editor de portadas.
 * Y se guardan en la red de Vercel (`s-maxage`): la primera vez se prepara, las demás
 * llegan al instante a todo el equipo. Como la dirección es la huella del contenido
 * (160 bits al azar), quien no está en el Planner no la conoce.
 */
const ANCHOS = new Set([160, 320, 480, 640, 960, 1280, 1600]);
const GUARDA = "public, max-age=31536000, s-maxage=31536000, immutable";

export async function GET(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const sinCache = { "cache-control": "no-store" };
  const session = await auth();
  if (!session?.user?.email) return new Response("Sin sesión", { status: 401, headers: sinCache });

  const { id } = await ctx.params;
  if (!/^[a-f0-9]{40}$/.test(id)) return new Response("No existe", { status: 404, headers: sinCache });

  const f = await prisma.plannerDoc.findUnique({ where: { key: `img/${id}` } });
  if (!f) return new Response("No existe", { status: 404, headers: sinCache });

  const m = /^data:(image\/(?:png|jpeg|jpg|webp|gif|avif));base64,([A-Za-z0-9+/=]+)$/.exec(f.value);
  if (!m) return new Response("Ilegible", { status: 500, headers: sinCache });
  const tipo = m[1] === "image/jpg" ? "image/jpeg" : m[1];
  const original = Buffer.from(m[2], "base64");

  const w = Number(new URL(req.url).searchParams.get("w")) || 0;
  if (ANCHOS.has(w) && tipo !== "image/gif") {
    try {
      const sharp = (await import("sharp")).default;
      const chica = await sharp(original).rotate().resize({ width: w, withoutEnlargement: true })
        .webp({ quality: 80 }).toBuffer();
      return new Response(new Uint8Array(chica), {
        headers: { "content-type": "image/webp", "cache-control": GUARDA, "x-content-type-options": "nosniff" },
      });
    } catch (e) {
      console.error("[planner img] no se pudo achicar:", e instanceof Error ? e.message : e);
      // sin la copia chica se manda la original: tarda más, pero se ve
    }
  }

  return new Response(new Uint8Array(original), {
    headers: { "content-type": tipo, "cache-control": GUARDA, "x-content-type-options": "nosniff" },
  });
}
