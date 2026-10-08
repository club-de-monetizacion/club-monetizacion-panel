/* Perfiles de DEMOSTRACIÓN de Desafíos: gente inventada, con páginas y cifras inventadas,
   para enseñar cómo se ve con datos. No existe ninguna de estas personas ni estas páginas.

   Cómo se usa:
     node scripts/desafios-demo.mjs            crea (o recrea) los cuatro perfiles
     node scripts/desafios-demo.mjs --quitar   los borra. HAZLO ANTES DE PUBLICAR.

   Qué los distingue y por qué es seguro borrarlos:
     · llevan `esDemo = true` y **no tienen usuario** (`userId` vacío), así que no salen
       en la lista del equipo ni en los selectores de asignar tareas;
     · `--quitar` borra solo las filas con `esDemo = true`: nunca toca un perfil real.
       Sus páginas, avances, insignias e ingresos se van con ellos (borrado en cascada).

   Los cuatro, de menos a más:
     Camila Ortega   · empezando, 1 semana
     Andrés Paredes  · intermedio, 3 meses, aún sin monetizar
     Mateo Quintero  · 6 meses, ya monetiza (y oculta cuánto gana, para enseñar la privacidad)
     Sofía Lara      · grande, 6 meses, monetiza fuerte y lo enseña */
import fs from "node:fs";
import path from "node:path";
import { PrismaClient } from "@prisma/client";
import { claveLogro, claveVideo, escalonesPorDebajo, logrosAlcanzados } from "../src/lib/desafios.ts";

const raiz = path.resolve(import.meta.dirname, "..");
if (!process.env.DATABASE_URL) {
  for (const n of [".env.local", ".env"]) {
    const f = path.join(raiz, n);
    if (!fs.existsSync(f)) continue;
    const m = fs.readFileSync(f, "utf8").match(/DATABASE_URL="?([^"\n]+)/);
    if (m) { process.env.DATABASE_URL = m[1]; break; }
  }
}
if (!process.env.DATABASE_URL) { console.error("Falta DATABASE_URL"); process.exit(1); }

const prisma = new PrismaClient();
const DIA = 86_400_000;
const AHORA = Date.now();
const hace = (dias) => new Date(AHORA - dias * DIA);

/* Cuántos perfiles de demostración hay ahora mismo */
const hayDemo = await prisma.perfilCreador.count({ where: { esDemo: true } });

/* ── --quitar ── */
if (process.argv.includes("--quitar")) {
  const r = await prisma.perfilCreador.deleteMany({ where: { esDemo: true } });
  console.log(`✓ borrados ${r.count} perfiles de demostración (con sus páginas, avances, insignias e ingresos)`);
  await prisma.$disconnect();
  process.exit(0);
}

/* Un generador con semilla: los mismos números cada vez, sin azar de verdad */
function semilla(n) {
  let a = n >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/**
 * La curva de una página: crece despacio al principio y se acelera, con altibajos, y
 * nunca baja. `cada` es cada cuántos días se anotó un avance.
 */
function curva({ ini, fin, dias, cada, rnd }) {
  const puntos = [];
  let previo = ini;
  for (let d = dias; d >= 0; d -= cada) {
    const t = (dias - d) / dias;                       // 0 → 1
    const base = ini + (fin - ini) * Math.pow(t, 1.7);
    const ruido = 1 + (rnd() - 0.5) * 0.06;            // ±3 %
    let v = Math.round(Math.max(previo, base * (t === 0 || t === 1 ? 1 : ruido)));
    if (d === 0) v = fin;                              // hoy es la cifra final exacta
    puntos.push({ diasAtras: d, v });
    previo = v;
  }
  return puntos;
}

const PERFILES = [
  {
    nombre: "Camila Ortega", nicho: "Recetas fáciles", dias: 7, cada: 1,
    bio: "Cocino para quien no sabe cocinar. Empecé hace una semana: sígueme el viaje.",
    semilla: 11,
    cuentas: [
      { red: "TIKTOK", nombre: "Camila Cocina (demo)", handle: "demo_camila_ortega", ini: 38, fin: 320 },
      { red: "INSTAGRAM", nombre: "camila.cocina (demo)", handle: "demo_camila_ortega", ini: 15, fin: 140 },
    ],
  },
  {
    nombre: "Andrés Paredes", nicho: "Finanzas para jóvenes", dias: 90, cada: 3,
    bio: "Explico dinero sin palabras raras. Meta: llegar a 1,000 en YouTube y monetizar.",
    semilla: 23,
    cuentas: [
      { red: "TIKTOK", nombre: "Andrés Finanzas (demo)", handle: "demo_andres_paredes", ini: 800, fin: 9800 },
      { red: "INSTAGRAM", nombre: "andres.finanzas (demo)", handle: "demo_andres_paredes", ini: 300, fin: 4200 },
      { red: "YOUTUBE", nombre: "Andrés Paredes (demo)", handle: "@demo_andres_paredes", ini: 20, fin: 650 },
    ],
    // `cuenta` es la posición de la página en `cuentas`
    videos: [
      { tipo: "VISTAS", cuenta: 0, umbral: 10_000, diasAtras: 41 },
      { tipo: "VISTAS", cuenta: 2, formato: "HORIZONTAL", umbral: 1_000, diasAtras: 20 },
      { tipo: "LIKES", umbral: 1_000, diasAtras: 41 },
    ],
  },
  {
    nombre: "Mateo Quintero", nicho: "Fitness en casa", dias: 180, cada: 4,
    bio: "Rutinas sin gimnasio. Ya monetizo en YouTube y TikTok.",
    semilla: 37, mostrarIngresos: false,
    cuentas: [
      { red: "YOUTUBE", nombre: "Mateo Fit (demo)", handle: "@demo_mateo_quintero", ini: 400, fin: 12800 },
      { red: "TIKTOK", nombre: "Mateo Fit (demo)", handle: "demo_mateo_quintero", ini: 1200, fin: 31000 },
      { red: "INSTAGRAM", nombre: "mateo.fit (demo)", handle: "demo_mateo_quintero", ini: 600, fin: 9400 },
    ],
    ingresos: [
      { red: "YOUTUBE", mesesAtras: 2, usd: 38.4 }, { red: "YOUTUBE", mesesAtras: 1, usd: 142.1 },
      { red: "YOUTUBE", mesesAtras: 0, usd: 265.75 },
      { red: "TIKTOK", mesesAtras: 1, usd: 60 }, { red: "TIKTOK", mesesAtras: 0, usd: 120.5 },
    ],
    videos: [
      { tipo: "VISTAS", cuenta: 0, formato: "VERTICAL", umbral: 100_000, diasAtras: 60 },
      { tipo: "VISTAS", cuenta: 0, formato: "HORIZONTAL", umbral: 10_000, diasAtras: 40 },
      { tipo: "VISTAS", cuenta: 1, umbral: 50_000, diasAtras: 70 },
      { tipo: "LIKES", umbral: 5_000, diasAtras: 70 },
    ],
  },
  {
    nombre: "Sofía Lara", nicho: "Negocios online", dias: 180, cada: 4,
    bio: "Enseño a montar un negocio desde el celular. Vivo de mi contenido desde hace meses.",
    semilla: 53, mostrarIngresos: true,
    cuentas: [
      { red: "TIKTOK", nombre: "Sofía Negocios (demo)", handle: "demo_sofia_lara", ini: 2000, fin: 86000 },
      { red: "INSTAGRAM", nombre: "sofia.negocios (demo)", handle: "demo_sofia_lara", ini: 1500, fin: 41000 },
      { red: "YOUTUBE", nombre: "Sofía Lara (demo)", handle: "@demo_sofia_lara", ini: 800, fin: 12500 },
      { red: "FACEBOOK", nombre: "Sofía Lara Negocios (demo)", handle: "demo_sofia_lara", ini: 300, fin: 8300 },
    ],
    ingresos: [
      ...[120, 310, 640, 1100, 1650, 2300].map((usd, i) => ({ red: "YOUTUBE", mesesAtras: 5 - i, usd: usd + 0.35 * i })),
      ...[180, 420, 800, 1250].map((usd, i) => ({ red: "TIKTOK", mesesAtras: 3 - i, usd })),
      ...[60, 140, 210].map((usd, i) => ({ red: "FACEBOOK", mesesAtras: 2 - i, usd })),
    ],
    videos: [
      { tipo: "VISTAS", cuenta: 0, umbral: 500_000, diasAtras: 55 },
      { tipo: "VISTAS", cuenta: 1, umbral: 100_000, diasAtras: 30 },
      { tipo: "VISTAS", cuenta: 2, formato: "VERTICAL", umbral: 500_000, diasAtras: 45 },
      { tipo: "VISTAS", cuenta: 2, formato: "HORIZONTAL", umbral: 50_000, diasAtras: 35 },
      { tipo: "VISTAS", cuenta: 3, umbral: 10_000, diasAtras: 20 },
      { tipo: "LIKES", umbral: 50_000, diasAtras: 55 },
    ],
  },
];

/** El primer día del mes de hace `n` meses, en UTC (como se guardan los ingresos). */
function mesDeHace(n) {
  const d = new Date(AHORA);
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth() - n, 1));
}
/** Cuándo «ocurre» el ingreso de un mes: a mitad de mes, o hoy si es el mes en curso. */
function fechaDeIngreso(n) {
  const m = mesDeHace(n);
  const mitad = new Date(m.getTime() + 14 * DIA);
  return mitad.getTime() > AHORA ? new Date(AHORA) : mitad;
}

// Se recrean siempre desde cero: así correrlo dos veces no duplica nada.
if (hayDemo) await prisma.perfilCreador.deleteMany({ where: { esDemo: true } });

for (const p of PERFILES) {
  const rnd = semilla(p.semilla);
  const inicio = hace(p.dias);

  // La historia de cada página
  const cuentas = p.cuentas.map((c) => ({
    ...c,
    historial: curva({ ini: c.ini, fin: c.fin, dias: p.dias, cada: p.cada, rnd }),
  }));

  // Qué pasó cada día: lo que valía cada página, y cuánto dinero llevaba, en cada momento.
  const ingresos = p.ingresos ?? [];
  const momentos = new Set();
  for (const c of cuentas) for (const h of c.historial) momentos.add(h.diasAtras);
  for (const i of ingresos) momentos.add(Math.max(0, Math.round((AHORA - fechaDeIngreso(i.mesesAtras).getTime()) / DIA)));

  const fechaLogro = new Map();   // clave → cuándo se ganó
  const datosLogro = new Map();   // clave → { tipo, red, umbral }
  for (const dAtras of [...momentos].sort((a, b) => b - a)) {
    const valor = (c) => {
      // el último avance anotado hasta ese día
      const hasta = c.historial.filter((h) => h.diasAtras >= dAtras).pop();
      return hasta ? hasta.v : 0;
    };
    const dinero = ingresos
      .filter((i) => (AHORA - fechaDeIngreso(i.mesesAtras).getTime()) / DIA >= dAtras - 0.5)
      .reduce((s, i) => s + i.usd, 0);
    const alcanzados = logrosAlcanzados(
      cuentas.map((c, k) => ({ id: String(k), red: c.red, nombre: c.nombre, seguidores: valor(c) })),
      dinero,
    );
    for (const l of alcanzados) {
      if (!fechaLogro.has(l.clave)) {
        fechaLogro.set(l.clave, hace(dAtras));
        datosLogro.set(l.clave, { tipo: l.tipo, red: l.red, umbral: l.umbral });
      }
    }
  }

  const perfil = await prisma.perfilCreador.create({
    data: {
      esDemo: true,
      nombre: p.nombre,
      nicho: p.nicho,
      bio: p.bio,
      mostrarIngresos: p.mostrarIngresos ?? false,
      createdAt: inicio,
    },
  });

  const cuentasCreadas = [];
  for (const c of cuentas) {
    const cuenta = await prisma.cuentaSocial.create({
      data: {
        perfilId: perfil.id,
        red: c.red,
        nombre: c.nombre,
        url: c.red === "YOUTUBE"
          ? `https://youtube.com/${c.handle}`
          : `https://${c.red.toLowerCase()}.com/${c.red === "TIKTOK" ? "@" : ""}${c.handle}`,
        seguidores: c.fin,
        createdAt: inicio,
      },
    });
    cuentasCreadas.push(cuenta);
    // El salto más grande se anota como «se hizo viral», como lo haría una persona.
    let mayor = { i: -1, salto: 0 };
    c.historial.forEach((h, i) => {
      const salto = i === 0 ? 0 : h.v - c.historial[i - 1].v;
      if (salto > mayor.salto) mayor = { i, salto };
    });
    await prisma.avanceCuenta.createMany({
      data: c.historial.map((h, i) => ({
        cuentaId: cuenta.id,
        seguidores: h.v,
        createdAt: hace(h.diasAtras),
        nota: i === mayor.i && p.dias > 14 ? "Un video se hizo viral" : null,
      })),
    });
  }

  for (const i of ingresos) {
    await prisma.ingresoCreador.create({
      data: {
        perfilId: perfil.id,
        red: i.red,
        mes: mesDeHace(i.mesesAtras),
        centavos: Math.round(i.usd * 100),
        createdAt: fechaDeIngreso(i.mesesAtras),
      },
    });
  }

  // Las insignias que se ganan solas, con la fecha en que de verdad se cruzó cada escalón
  const filas = [...fechaLogro].map(([clave, creadoEn]) => ({ perfilId: perfil.id, clave, creadoEn, ...datosLogro.get(clave) }));

  // Las de video, reclamadas: el escalón y los de abajo, igual que al reclamar de verdad.
  // Las de vistas son de una página (y, en YouTube, de un formato); las de likes, generales.
  for (const v of p.videos ?? []) {
    const creadoEn = hace(v.diasAtras);
    if (v.tipo === "VISTAS") {
      const cuenta = cuentasCreadas[v.cuenta];
      const formato = v.formato ?? null;
      const clave = claveVideo(cuenta.id, formato, v.umbral);
      const enlace =
        cuenta.red === "YOUTUBE"
          ? (formato === "VERTICAL" ? "https://youtube.com/shorts/DEMO0000001" : "https://youtube.com/watch?v=DEMO0000002")
          : `${cuenta.url}/video/DEMO0000003`;
      const comunes = { perfilId: perfil.id, tipo: "VISTAS", red: cuenta.red, cuentaId: cuenta.id, paginaNombre: cuenta.nombre, formato, creadoEn };
      filas.push({ ...comunes, clave, umbral: v.umbral, enlace, nota: "Perfil de demostración" });
      for (const u of escalonesPorDebajo("VISTAS", v.umbral)) {
        filas.push({ ...comunes, clave: claveVideo(cuenta.id, formato, u), umbral: u, origenClave: clave });
      }
    } else {
      const clave = claveLogro(v.tipo, v.umbral);
      filas.push({ perfilId: perfil.id, clave, tipo: v.tipo, red: null, umbral: v.umbral, creadoEn, nota: "Perfil de demostración" });
      for (const u of escalonesPorDebajo(v.tipo, v.umbral)) {
        filas.push({ perfilId: perfil.id, clave: claveLogro(v.tipo, u), tipo: v.tipo, red: null, umbral: u, creadoEn, origenClave: clave });
      }
    }
  }
  await prisma.logroCreador.createMany({ data: filas, skipDuplicates: true });

  const total = ingresos.reduce((s, i) => s + i.usd, 0);
  console.log(
    `✓ ${p.nombre.padEnd(15)} ${String(p.dias).padStart(3)} días · ${cuentas.length} páginas · ` +
    `${filas.length} insignias${total ? ` · $${total.toFixed(0)} ganados` : ""}`,
  );
}

console.log("\nSon perfiles de MENTIRA. Antes de publicar:  node scripts/desafios-demo.mjs --quitar");
await prisma.$disconnect();
