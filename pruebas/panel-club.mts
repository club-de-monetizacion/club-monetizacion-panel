import { entrarEquipo, sigueValida, papelDelRol, entraComoDueno } from "../src/lib/panel-club.ts";

const fallos: string[] = [];
const comprueba = (bien: boolean, que: string) => {
  console.log(`  ${bien ? "✓" : "✗"} ${que}`);
  if (!bien) fallos.push(que);
};

// Los papeles del panel se traducen bien, y nada más entra
comprueba(papelDelRol("maestro") === "ADMIN", "maestro → ADMIN");
comprueba(papelDelRol("equipo") === "ADMIN", "equipo → ADMIN");
comprueba(papelDelRol("mirar") === "MIEMBRO", "mirar → MIEMBRO (solo consulta)");
comprueba(papelDelRol("alumno") === null, "un papel desconocido NO entra");
comprueba(papelDelRol(null) === null, "sin papel NO entra");
comprueba(papelDelRol("") === null, "papel vacío NO entra");

// Contra el panel de verdad
const mala = await entrarEquipo("noexiste@ejemplo.com", "incorrecta");
comprueba(mala.ok === false, "una contraseña incorrecta es rechazada");
comprueba(!mala.ok && /incorrect/i.test(mala.error), `el mensaje del panel llega tal cual: "${!mala.ok ? mala.error : ""}"`);

const vacia = await entrarEquipo("", "");
comprueba(vacia.ok === false, "correo vacío es rechazado");

const tokFalso = await sigueValida("token.inventado");
comprueba(tokFalso.ok === false, "un token inventado no vale");
comprueba(!tokFalso.ok && tokFalso.caducada === true, "y se trata como sesión caducada (401)");

// La clave maestra del dueño
const maestraMala = await entraComoDueno("no-es-la-clave", "0000");
comprueba(maestraMala.ok === false, "una clave maestra falsa es rechazada");
const maestraVacia = await entraComoDueno("", "");
comprueba(maestraVacia.ok === false, "clave maestra vacía es rechazada");

// Un panel inalcanzable NO debe echar a nadie
process.env.PANEL_CLUB_URL = "https://no-existe-este-dominio-jamas-12345.com/api";
const { sigueValida: sv2 } = await import("../src/lib/panel-club.ts?caido");
const caido = await sv2("cualquier-token");
comprueba(caido.ok === false && caido.caducada === false, "si el panel está caído, NO cierra la sesión de nadie");

console.log(fallos.length ? `\n✗ ${fallos.length} fallo(s)` : "\n✓ las 14 comprobaciones pasaron");
process.exit(fallos.length ? 1 : 0);

// Cómo correrla:  node --experimental-strip-types pruebas/panel-club.mts
// Habla con el panel de verdad, así que necesita conexión. No toca la base de datos
// ni necesita credenciales: comprueba que los rechazos y los papeles se manejan bien.
