import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

/**
 * Una imagen del YouTube Planner (portadas, recursos, banco de miniaturas). Desde el
 * 11 nov 2026 cada imagen vive en su fila `img/<huella>` y las secciones solo llevan
 * esta dirección (ver `api/planner/route.ts`). La huella sale del contenido, así que lo
 * que hay detrás de una dirección no cambia nunca: el navegador la guarda para siempre.
 *
 * Solo con sesión en la plataforma, como el resto del Planner.
 */
export async function GET(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.email) return new Response("Sin sesión", { status: 401 });

  const { id } = await ctx.params;
  if (!/^[a-f0-9]{40}$/.test(id)) return new Response("No existe", { status: 404 });

  const f = await prisma.plannerDoc.findUnique({ where: { key: `img/${id}` } });
  if (!f) return new Response("No existe", { status: 404 });

  const m = /^data:(image\/(?:png|jpeg|jpg|webp|gif|avif));base64,([A-Za-z0-9+/=]+)$/.exec(f.value);
  if (!m) return new Response("Ilegible", { status: 500 });

  return new Response(Buffer.from(m[2], "base64"), {
    headers: {
      "content-type": m[1] === "image/jpg" ? "image/jpeg" : m[1],
      "cache-control": "private, max-age=31536000, immutable",
      "x-content-type-options": "nosniff",
    },
  });
}
