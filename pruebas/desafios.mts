/* Comprueba la lógica pura de Desafíos (sin base de datos ni red):
     node pruebas/desafios.mts */
import {
  ESCALERA_SEGUIDORES, abreviar, claveLogro, escalonesPorDebajo, logrosAlcanzados,
  nivelDe, normalizarUrlCuenta, proximasMetas, puntosDe, puntosTotales, rangoDe,
  fraseDelDia, empujon, misionesDeInicio, mesAFecha, puntosDe as pts, rangoLogro,
  etiquetaCifra, tituloLogro, dolaresExactos, ESCALERA_INGRESOS, SE_RECLAMA,
  claveVideo, formatoDeEnlace, formatosDe, normalizarEnlaceVideo, estiloNivel, TODOS_LOS_NIVELES, puntosParaNivel,
} from "../src/lib/desafios.ts";

const fallos: string[] = [];
const comprueba = (bien: boolean, que: string) => {
  console.log(`  ${bien ? "✓" : "✗"} ${que}`);
  if (!bien) fallos.push(que);
};

console.log("Enlaces de páginas");
const ig = normalizarUrlCuenta("www.Instagram.com/mi_cuenta/?igsh=abc", "INSTAGRAM");
comprueba(ig?.url === "https://instagram.com/mi_cuenta", `Instagram se limpia: ${ig?.url}`);
comprueba(ig?.usuario === "mi_cuenta", "saca el usuario");
comprueba(normalizarUrlCuenta("https://instagram.com/mi_cuenta", "TIKTOK") === null, "un enlace de otra red se rechaza");
comprueba(normalizarUrlCuenta("https://evil.com/instagram.com/x", "INSTAGRAM") === null, "un dominio falso se rechaza");
comprueba(normalizarUrlCuenta("https://instagram.com.evil.com/x", "INSTAGRAM") === null, "un subdominio engañoso se rechaza");
comprueba(normalizarUrlCuenta("https://instagram.com/", "INSTAGRAM") === null, "solo el dominio no es una página");
comprueba(normalizarUrlCuenta("javascript:alert(1)", "INSTAGRAM") === null, "javascript: se rechaza");
comprueba(normalizarUrlCuenta("https://youtube.com/@Canal/", "YOUTUBE")?.usuario === "@Canal", "YouTube @canal");
comprueba(normalizarUrlCuenta("https://m.facebook.com/profile.php?id=123&ref=x", "FACEBOOK")?.url === "https://m.facebook.com/profile.php?id=123", "Facebook profile.php conserva solo el id");
comprueba(normalizarUrlCuenta("https://vm.tiktok.com/ZM123/", "TIKTOK") !== null, "TikTok corto vm.tiktok.com");
comprueba(normalizarUrlCuenta("", "TIKTOK") === null, "vacío se rechaza");

console.log("Rangos, puntos y niveles");
comprueba(rangoDe(500).nombre === "Bronce" && rangoDe(1000).nombre === "Plata" && rangoDe(10_000).nombre === "Oro", "rangos por cifra");
comprueba(rangoDe(10_000_000).nombre === "Leyenda", "10M es Leyenda");
comprueba(puntosDe("SEGUIDORES", 1000) < puntosDe("SEGUIDORES", 10_000), "más alto vale más");
comprueba(puntosDe("AUDIENCIA", 10_000) < puntosDe("SEGUIDORES", 10_000), "audiencia vale menos que la red");
comprueba(nivelDe(0).numero === 1 && nivelDe(0).avance === 0, "0 puntos = nivel 1");
comprueba(nivelDe(30).numero === 2, "30 puntos = nivel 2");
comprueba(nivelDe(119).numero === 2 && nivelDe(120).numero === 3, "frontera del nivel 3");
const n = nivelDe(75);
comprueba(n.avance > 0 && n.avance < 1 && n.hasta > 75, "avance dentro del nivel");
comprueba(nivelDe(1_000_000).nombre === "Leyenda", "el nivel más alto no se sale de la lista");
comprueba(abreviar(1500) === "1.5K" && abreviar(1_000_000) === "1M" && abreviar(950) === "950" && abreviar(10_000) === "10K", "abreviar");

console.log("Insignias que se ganan solas");
const cuentas = [
  { id: "1", red: "INSTAGRAM" as const, nombre: "a", seguidores: 1200 },
  { id: "2", red: "INSTAGRAM" as const, nombre: "b", seguidores: 300 },
  { id: "3", red: "TIKTOK" as const, nombre: "c", seguidores: 5000 },
];
const alc = logrosAlcanzados(cuentas);
const claves = new Set(alc.map((l) => l.clave));
comprueba(claves.has("SEGUIDORES:INSTAGRAM:1000"), "Instagram usa la página más grande (1200 ≥ 1000)");
comprueba(!claves.has("SEGUIDORES:INSTAGRAM:5000"), "no suma páginas de la misma red para una red");
comprueba(claves.has("SEGUIDORES:TIKTOK:5000") && claves.has("SEGUIDORES:TIKTOK:100"), "TikTok llega a 5K y a los de abajo");
comprueba(claves.has("AUDIENCIA:5000") && !claves.has("AUDIENCIA:10000"), "audiencia suma todo (6500)");
comprueba(!claves.has("SEGUIDORES:YOUTUBE:100"), "una red sin páginas no da nada");
comprueba(escalonesPorDebajo("VISTAS", 10_000).join() === "1000,5000", "los de abajo de 10K vistas");

console.log("Metas cercanas");
const metas = proximasMetas(cuentas, alc.map((l) => ({ ...l, estado: "ACTIVO" as const })));
comprueba(metas[0].tipo === "MONETIZACION" && metas[1].avance !== null, "primero la monetización y luego las medibles");
comprueba(metas.every((m, i) => i === 0 || m.avance === null || metas[i - 1].avance === null || (metas[i - 1].avance ?? 0) >= (m.avance ?? 0)), "ordenadas de más cerca a más lejos");
const ig2 = metas.find((m) => m.tipo === "SEGUIDORES" && m.red === "INSTAGRAM");
comprueba(ig2?.umbral === 5000 && ig2.falta === 3800, `Instagram: siguiente 5K, faltan ${ig2?.falta}`);
comprueba(!metas.some((m) => m.red === "YOUTUBE"), "no se exige una red que no usa");
comprueba(metas.some((m) => m.tipo === "VISTAS") && metas.some((m) => m.tipo === "LIKES"), "vistas y likes aparecen como retos sin medir");
const conRevocada = proximasMetas(cuentas, [{ clave: claveLogro("SEGUIDORES", 5000, "INSTAGRAM"), tipo: "SEGUIDORES", red: "INSTAGRAM", umbral: 5000, estado: "REVOCADO" }]);
comprueba(!conRevocada.some((m) => m.red === "INSTAGRAM" && m.umbral === 5000), "una revocada no se ofrece de meta");
comprueba(proximasMetas([], []).every((m) => m.avance === null), "sin páginas solo quedan los retos de video");
comprueba(puntosTotales([{ clave: "x", tipo: "VISTAS", red: null, umbral: 1000, estado: "REVOCADO" }]) === 0, "una revocada no suma puntos");
comprueba(ESCALERA_SEGUIDORES.includes(1000) && ESCALERA_SEGUIDORES.includes(5000) && ESCALERA_SEGUIDORES.includes(10_000), "1K, 5K y 10K están");

console.log("Monetización e ingresos");
const sinDinero = proximasMetas(cuentas, [], 0);
comprueba(sinDinero[0].tipo === "MONETIZACION", "la primera meta es activar la monetización");
comprueba(!sinDinero.some((m) => m.tipo === "INGRESOS"), "sin monetizar no se mide el dinero");
const conMonet = proximasMetas(cuentas, [{ clave: claveLogro("MONETIZACION", 1), tipo: "MONETIZACION", red: null, umbral: 1, estado: "ACTIVO" }], 40);
comprueba(!conMonet.some((m) => m.tipo === "MONETIZACION"), "ya monetizando: deja de ser meta");
const dinero = conMonet.find((m) => m.tipo === "INGRESOS");
comprueba(dinero?.umbral === 100 && dinero.falta === 60, `siguiente de dinero: $100, faltan $${dinero?.falta}`);
comprueba(proximasMetas(cuentas, [{ clave: claveLogro("MONETIZACION", 1), tipo: "MONETIZACION", red: null, umbral: 1, estado: "REVOCADO" }], 0).every((m) => m.tipo !== "MONETIZACION"), "una monetización revocada no se vuelve a ofrecer");
comprueba(proximasMetas(cuentas, [], 5).every((m) => m.tipo !== "MONETIZACION") && proximasMetas(cuentas, [], 5).some((m) => m.tipo === "INGRESOS"), "con ingresos anotados, la monetización cuenta como hecha");
const g0 = new Set(logrosAlcanzados(cuentas, 0).map((l) => l.clave));
comprueba(!g0.has("MONETIZACION:1") && !g0.has("INGRESOS:1"), "sin dinero no hay insignias de dinero");
const g1 = new Set(logrosAlcanzados(cuentas, 1).map((l) => l.clave));
comprueba(g1.has("MONETIZACION:1") && g1.has("INGRESOS:1") && !g1.has("INGRESOS:100"), "el primer dólar activa la monetización y da $1");
const g2 = new Set(logrosAlcanzados(cuentas, 1250.5).map((l) => l.clave));
comprueba(g2.has("INGRESOS:1000") && g2.has("INGRESOS:500") && !g2.has("INGRESOS:5000"), "$1,250 llega a $1K pero no a $5K");
comprueba(ESCALERA_INGRESOS[0] === 1 && ESCALERA_INGRESOS.includes(1000) && ESCALERA_INGRESOS.includes(1_000_000), "la escalera va del primer dólar al millón");
comprueba(pts("MONETIZACION", 1) === 60 && pts("INGRESOS", 1) > 0, "monetizar y el primer dólar dan puntos");
comprueba(pts("INGRESOS", 1000) > pts("SEGUIDORES", 1000), "el dinero pesa más que los seguidores");
comprueba(rangoLogro("MONETIZACION", 1).nombre === "Oro", "monetización es oro");
comprueba(etiquetaCifra("MONETIZACION", 1) === "$" && etiquetaCifra("INGRESOS", 5000) === "$5K" && etiquetaCifra("VISTAS", 5000) === "5K", "etiquetas de la insignia");
comprueba(tituloLogro("INGRESOS", 1000) === "$1K ganados" && tituloLogro("MONETIZACION", 1) === "Monetización activada", "títulos");
comprueba(SE_RECLAMA.MONETIZACION && !SE_RECLAMA.INGRESOS, "monetización se reclama; ingresos se ganan solos");
comprueba(dolaresExactos(1250.5) === "$1,250.50" && dolaresExactos(0) === "$0.00", "dinero con centavos");
comprueba(mesAFecha("2026-10", new Date("2026-10-15"))?.toISOString() === "2026-10-01T00:00:00.000Z", "mes válido → primer día");
comprueba(mesAFecha("2026-11", new Date("2026-10-15")) === null, "un mes futuro se rechaza");
comprueba(mesAFecha("2026-13") === null && mesAFecha("hola") === null && mesAFecha("1999-01") === null, "meses inválidos se rechazan");
comprueba(/Primer dólar|primer dólar/.test(empujon({ tipo: "INGRESOS", red: null, umbral: 100, actual: 5, falta: 95, avance: 0.04, titulo: "x" })), "empujón de dinero habla de dinero");
comprueba(misionesDeInicio({ tieneFoto: true, cuentas: [], avances: 0, logrosVideo: 0, monetiza: true }).find((m) => m.id === "monetiza")?.hecha === true, "misión de monetizar");

console.log("Videos por página");
comprueba(formatosDe("YOUTUBE").join() === "VERTICAL,HORIZONTAL", "YouTube tiene dos formatos");
comprueba(formatosDe("TIKTOK").length === 1 && formatosDe("TIKTOK")[0] === null, "las demás redes no tienen formatos");
comprueba(formatoDeEnlace("https://www.youtube.com/shorts/abc123", "YOUTUBE") === "VERTICAL", "un enlace /shorts/ es vertical");
comprueba(formatoDeEnlace("https://youtube.com/watch?v=abc123", "YOUTUBE") === "HORIZONTAL", "un video normal es horizontal");
comprueba(formatoDeEnlace("https://youtu.be/abc123", "YOUTUBE") === "HORIZONTAL", "youtu.be corto es horizontal");
comprueba(formatoDeEnlace("https://tiktok.com/@a/video/1", "TIKTOK") === null, "TikTok no tiene formato");
comprueba(normalizarEnlaceVideo("https://www.tiktok.com/@a/video/123", "TIKTOK") !== null, "enlace de video de TikTok válido");
comprueba(normalizarEnlaceVideo("https://www.tiktok.com/@a/video/123", "INSTAGRAM") === null, "un video de TikTok no vale para una página de Instagram");
comprueba(normalizarEnlaceVideo("https://evil.com/youtube.com/watch?v=1", "YOUTUBE") === null, "dominio falso rechazado");
comprueba(normalizarEnlaceVideo("https://youtube.com", "YOUTUBE") === null && normalizarEnlaceVideo("", "YOUTUBE") === null, "solo el dominio o vacío no es un video");
comprueba(normalizarEnlaceVideo("javascript:alert(1)", "YOUTUBE") === null, "javascript: rechazado");
comprueba(normalizarEnlaceVideo("youtube.com/watch?v=abc", "YOUTUBE") !== null, "acepta el enlace sin https");
comprueba(claveVideo("c1", "VERTICAL", 1000) !== claveVideo("c1", "HORIZONTAL", 1000), "vertical y horizontal tienen claves distintas");
comprueba(claveVideo("c1", null, 1000) !== claveVideo("c2", null, 1000), "dos páginas tienen claves distintas");
const dosPaginas = [
  { id: "yt", red: "YOUTUBE" as const, nombre: "Mi canal", seguidores: 10 },
  { id: "tt", red: "TIKTOK" as const, nombre: "Mi tiktok", seguidores: 10 },
];
const mv = proximasMetas(dosPaginas, [], 0).find((m) => m.tipo === "VISTAS");
comprueba(mv?.umbral === 1000 && !!mv.detalle, "meta de video: el primer escalón, con su página");
const todoYt = [
  ...[1000].map((u) => ({ clave: claveVideo("yt", "VERTICAL", u), tipo: "VISTAS" as const, red: "YOUTUBE" as const, umbral: u, estado: "ACTIVO" as const })),
  ...[1000].map((u) => ({ clave: claveVideo("yt", "HORIZONTAL", u), tipo: "VISTAS" as const, red: "YOUTUBE" as const, umbral: u, estado: "ACTIVO" as const })),
  { clave: claveVideo("tt", null, 1000), tipo: "VISTAS" as const, red: "TIKTOK" as const, umbral: 1000, estado: "ACTIVO" as const },
];
const mv2 = proximasMetas(dosPaginas, todoYt, 0).find((m) => m.tipo === "VISTAS");
comprueba(mv2?.umbral === 5000, "con 1K en todas, la meta de video sube a 5K");
const soloVert = proximasMetas([dosPaginas[0]], [todoYt[0]], 0).find((m) => m.tipo === "VISTAS");
comprueba(soloVert?.umbral === 1000 && soloVert.formato === "HORIZONTAL", "con el vertical hecho, falta el horizontal de YouTube");
comprueba(tituloLogro("VISTAS", 10_000, "YOUTUBE", "VERTICAL") === "Un video de 10K vistas · Short" && tituloLogro("VISTAS", 10_000, "TIKTOK") === "Un video de 10K vistas", "títulos con formato");
comprueba(pts("VISTAS", 10_000) < pts("LIKES", 10_000), "las vistas por página valen un poco menos");

console.log("Niveles");
comprueba(estiloNivel(1) === 1 && estiloNivel(2) === 1 && estiloNivel(3) === 2 && estiloNivel(5) === 3 && estiloNivel(7) === 4 && estiloNivel(9) === 5 && estiloNivel(10) === 6 && estiloNivel(40) === 6, "el estilo sube con el nivel");
comprueba(TODOS_LOS_NIVELES.length === 10 && TODOS_LOS_NIVELES[0].desde === 0 && TODOS_LOS_NIVELES[9].desde === puntosParaNivel(10), "la galería tiene los 10 niveles, de 0 puntos hacia arriba");
comprueba(TODOS_LOS_NIVELES.every((n, i) => i === 0 || n.desde > TODOS_LOS_NIVELES[i - 1].desde), "cada nivel pide más puntos que el anterior");

console.log("Textos");
comprueba(/Casi/.test(empujon({ ...metas[1], avance: 0.95, falta: 50 })), "empujón de «casi»");
comprueba(fraseDelDia(new Date(0)).length > 10, "hay frase del día");
comprueba(fraseDelDia(new Date(86_400_000 * 3)) === fraseDelDia(new Date(86_400_000 * 3 + 5000)), "misma frase todo el día");
comprueba(misionesDeInicio({ tieneFoto: false, cuentas: [], avances: 0, logrosVideo: 0, monetiza: false }).every((m) => !m.hecha), "recién llegado: ninguna misión hecha");

console.log(fallos.length ? `\n${fallos.length} fallo(s)` : "\nTodo bien");
process.exit(fallos.length ? 1 : 0);
