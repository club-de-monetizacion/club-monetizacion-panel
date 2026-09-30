import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sigueValida } from "@/lib/panel-club";

/**
 * La foto de perfil, para que el panel del Club muestre la misma que esta app.
 *
 * El panel no guarda fotos (usa la inicial), así que esta app es la única que las
 * tiene. Para pedirla, el panel manda **el token de la persona que tiene dentro**, y
 * aquí se valida contra el panel mismo: así solo se devuelve la foto de quien está
 * de verdad en su sesión, y nadie puede preguntar por la de otro.
 */
export async function GET(req: Request) {
  const tok = (req.headers.get("authorization") || "").replace(/^Bearer\s+/i, "").trim();
  if (!tok) return NextResponse.json({ error: "Falta el token" }, { status: 401 });

  const quien = await sigueValida(tok);
  if (!quien.ok) return NextResponse.json({ error: "Sesión no válida" }, { status: 401 });

  const p = await prisma.user.findUnique({
    where: { email: quien.email.toLowerCase() },
    select: { name: true, image: true },
  });

  // Sin cuenta en esta app todavía: el panel sigue con su inicial, sin ruido.
  if (!p) return NextResponse.json({ ok: true, foto: null, nombre: null });

  return NextResponse.json(
    { ok: true, foto: p.image, nombre: p.name },
    { headers: { "cache-control": "private, max-age=300" } }
  );
}
