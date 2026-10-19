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
import { VERSION } from "@/lib/version";

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
 *   · la base o el Club siguen sin contestar tras dos intentos → la página
 *     «Tareas no está disponible ahora», con un botón para volver al Club. Antes
 *     se regresaba al Club en silencio y nadie sabía qué había pasado (17 oct
 *     2026: la base dejó de responder y Tareas «no abría» sin decir nada).
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
  if (club.estado === "sin-respuesta") {
    const otra = reintento(aqui, origen, volver);
    return otra ? ir(otra) : noDisponible(volver);
  }
  if (!papelEnTareas(club.quien.rol)) return ir(CLUB);

  try {
    // `authorize` vuelve a preguntar, pero la respuesta ya está en memoria.
    await signIn("club", { galleta: valor, redirect: false });
  } catch {
    /* La base no respondió al crear la sesión: se reintenta sola un par de veces
       y, si sigue sin responder, se dice. (El detalle ya lo deja Auth.js en el
       log; aquí no se enseña ningún error técnico.) */
    const otra = reintento(aqui, origen, volver);
    return otra ? ir(otra) : noDisponible(volver);
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

/** La pantalla de carga de `/login`, que vuelve a probar sola un par de veces.
 *  Tras el segundo intento devuelve `null`: ya no se reintenta, se avisa. */
function reintento(aqui: URL, origen: string, volver: string): URL | null {
  const n = Number(aqui.searchParams.get("intento") ?? "0") || 0;
  if (n >= 2) return null;
  const u = new URL("/login", origen);
  u.searchParams.set("reintento", String(n + 1));
  u.searchParams.set("volver", volver);
  return u;
}

/** Para meter un texto dentro del HTML sin que rompa nada. */
const esc = (t: string) =>
  t.replace(/[&<>"']/g, (c) =>
    ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c] as string,
  );

/**
 * «TAREAS NO ESTÁ DISPONIBLE AHORA»
 *
 * Se pinta aquí mismo y no en una página de React porque es justo lo que sale
 * cuando la base no responde: no puede depender de nada que la necesite. Lleva el
 * cielo, la tarjeta, la tipografía y el botón dorado del Club, y dos salidas:
 * volver al Club o volver a intentar (que repite la entrada desde cero).
 *
 * Sin zoom, igual que el resto del dominio: la etiqueta viewport, el script de
 * `gesture*` (el pellizco de Safari) y `touch-action:manipulation` (el doble
 * toque del iPhone), lo mismo que el bloque «NADA DE ZOOM» de `globals.css`.
 */
function noDisponible(volver: string): Response {
  const otraVez = "/api/entrar-club?volver=" + encodeURIComponent(volver);
  const html = `<!doctype html>
<html lang="es">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no, viewport-fit=cover">
<meta name="theme-color" content="#05091a">
<meta name="robots" content="noindex, nofollow">
<title>Tareas no está disponible — Club de Monetización</title>
<link rel="icon" href="/branding/logo-club.png">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@500;700&family=Inter:wght@400;500;600;800&display=swap" rel="stylesheet">
<style>
:root{--oro-xclaro:#ffd97d;--oro-claro:#e8c060;--oro:#c9a040;--azul-hondo:#05091a;--azul-oscuro:#080e22;--azul-medio:#0d1830;--ink-2:#a8b8d0;--ink-3:#6b7c99;--linea:rgba(120,150,200,.14)}
*,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
html{background:var(--azul-hondo);touch-action:manipulation;-webkit-text-size-adjust:100%;text-size-adjust:100%}
*{touch-action:manipulation}
body{min-height:100vh;min-height:100dvh;display:flex;flex-direction:column;overflow-x:clip;background:var(--azul-hondo);color:#fff;font-family:Inter,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif;line-height:1.55;-webkit-font-smoothing:antialiased}
body::before{content:"";position:fixed;inset:0;z-index:0;pointer-events:none;background:radial-gradient(900px 620px at 12% 2%,rgba(30,92,232,.26),transparent 62%),radial-gradient(760px 560px at 92% 4%,rgba(201,160,64,.16),transparent 60%),radial-gradient(1100px 700px at 50% 108%,rgba(36,104,255,.16),transparent 66%)}
body::after{content:"";position:fixed;inset:0;z-index:0;pointer-events:none;opacity:.5;background-image:radial-gradient(rgba(255,255,255,.045) 1px,transparent 1px);background-size:3px 3px}
main{position:relative;z-index:1;flex:1;display:flex;align-items:center;justify-content:center;padding:32px 16px}
.caja{width:min(520px,100%);text-align:center;padding:40px 30px 32px;border-radius:22px;background:linear-gradient(168deg,var(--azul-medio),var(--azul-oscuro));border:1px solid var(--linea);box-shadow:0 24px 60px -34px rgba(0,0,0,.9);animation:sube .5s cubic-bezier(.2,.8,.2,1) both}
@keyframes sube{from{opacity:0;transform:translateY(14px)}to{opacity:1;transform:none}}
.logo{width:72px;height:72px;object-fit:contain;display:block;margin:0 auto 22px;filter:drop-shadow(0 6px 22px rgba(201,160,64,.4))}
.kicker{font-family:"Space Grotesk",Inter,sans-serif;font-size:11px;font-weight:700;letter-spacing:.24em;text-transform:uppercase;color:var(--oro);margin-bottom:12px}
h1{font-family:"Space Grotesk",Inter,sans-serif;font-size:clamp(24px,6.4vw,31px);font-weight:700;line-height:1.18;letter-spacing:-.3px;text-wrap:balance}
p{color:var(--ink-2);font-size:15.5px;line-height:1.65;margin:14px auto 0;max-width:400px;text-wrap:pretty}
.acc{display:flex;gap:12px;justify-content:center;flex-wrap:wrap;margin-top:28px}
.btn{display:inline-flex;align-items:center;justify-content:center;gap:9px;white-space:nowrap;padding:14px 22px;border:1px solid transparent;border-radius:13px;font-size:15px;font-weight:800;text-decoration:none;-webkit-tap-highlight-color:transparent;transition:transform .15s,box-shadow .15s,color .2s,border-color .2s,background .2s}
.btn svg{width:17px;height:17px;flex:none;fill:none;stroke:currentColor;stroke-width:2;stroke-linecap:round;stroke-linejoin:round}
.btn-oro{position:relative;overflow:hidden;color:#1a1200;background:linear-gradient(135deg,var(--oro-xclaro),var(--oro));box-shadow:0 8px 26px rgba(201,160,64,.28)}
.btn-oro::after{content:"";position:absolute;top:0;bottom:0;left:-45%;width:38%;background:linear-gradient(100deg,transparent,rgba(255,255,255,.55),transparent);transform:skewX(-18deg);animation:barre 4.6s ease-in-out infinite}
@keyframes barre{0%{left:-45%}55%,100%{left:125%}}
.btn-oro:hover{transform:translateY(-1px);box-shadow:0 12px 32px rgba(201,160,64,.4)}
.btn-fantasma{color:var(--ink-2);font-weight:600;border:1px solid rgba(120,150,200,.16)}
.btn-fantasma:hover{color:#fff;border-color:rgba(120,150,200,.32);background:rgba(255,255,255,.045)}
.btn:active{transform:scale(.97)}
.btn:focus-visible{outline:2px solid var(--oro-claro);outline-offset:3px}
.pie{position:relative;z-index:1;text-align:center;font-size:12px;color:var(--ink-3);padding:0 16px calc(18px + env(safe-area-inset-bottom,0px))}
@media (max-width:480px){.caja{padding:32px 20px 24px}.acc{flex-direction:column}.btn{width:100%}}
@media (prefers-reduced-motion:reduce){.caja{animation:none}.btn-oro::after{animation:none;opacity:0}}
</style>
<script>["gesturestart","gesturechange","gestureend"].forEach(function(t){document.addEventListener(t,function(e){e.preventDefault()})})</script>
</head>
<body>
<main>
  <section class="caja" role="alert">
    <img class="logo" src="/branding/logo-club.png" alt="" width="72" height="72">
    <div class="kicker">Club de Monetización</div>
    <h1>Tareas no está disponible ahora</h1>
    <p>No pudimos abrir los tableros. Tus tareas siguen guardadas: vuelve a intentarlo en un rato.</p>
    <div class="acc">
      <a class="btn btn-oro" href="${esc(CLUB)}"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M19 12H5"/><path d="m12 19-7-7 7-7"/></svg>Volver al Club</a>
      <a class="btn btn-fantasma" href="${esc(otraVez)}"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M21 12a9 9 0 1 1-2.64-6.36"/><path d="M21 3v6h-6"/></svg>Volver a intentar</a>
    </div>
  </section>
</main>
<div class="pie">Tareas · ${esc(VERSION)}</div>
</body>
</html>`;
  return new Response(html, {
    status: 503,
    headers: {
      "content-type": "text/html; charset=utf-8",
      "cache-control": "no-store",
      "retry-after": "120",
    },
  });
}
