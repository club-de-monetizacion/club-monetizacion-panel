/* Respalda la base de datos completa a un JSON con fecha, antes de cualquier cambio
   de esquema. Solo lee.

   Cómo se usa:
     npx vercel env pull .env.local --environment=production --yes
     node scripts/respaldar-db.mjs
     (y borra .env.local después: lleva la contraseña de la base dentro)

   Hazlo SIEMPRE antes de `prisma db push` contra producción. */
import fs from "node:fs";
import path from "node:path";
import { PrismaClient } from "@prisma/client";

const raiz = path.resolve(import.meta.dirname, "..");

// Prisma lee DATABASE_URL del entorno; si no está, se toma de .env.local
if (!process.env.DATABASE_URL) {
  for (const n of [".env.local", ".env"]) {
    const f = path.join(raiz, n);
    if (!fs.existsSync(f)) continue;
    const m = fs.readFileSync(f, "utf8").match(/DATABASE_URL="?([^"\n]+)/);
    if (m) { process.env.DATABASE_URL = m[1]; break; }
  }
}
if (!process.env.DATABASE_URL) {
  console.error("Falta DATABASE_URL. Corre antes:\n" +
    "  npx vercel env pull .env.local --environment=production --yes");
  process.exit(1);
}

const prisma = new PrismaClient();

/* Los modelos que guardan trabajo de la gente. Si añades uno al esquema, añádelo
   aquí: un respaldo incompleto es peor que ninguno, porque da falsa tranquilidad. */
const MODELOS = [
  "user", "account", "session", "project", "task", "checklistItem",
  "attachment", "comment", "cannedResponse", "faqItem", "quickLink",
  "idea", "ideaConnection", "ideaNode", "ideaNodeConnection",
  "dailyTaskItem", "dailyTaskLog", "personalTask",
];

const datos = {};
const fallos = [];

for (const m of MODELOS) {
  if (typeof prisma[m]?.findMany !== "function") { fallos.push(`${m}: no existe`); continue; }
  try {
    datos[m] = await prisma[m].findMany();
  } catch (e) {
    fallos.push(`${m}: ${e.message?.slice(0, 120)}`);
  }
}

// Los que existen en el esquema nuevo pero puede que no estén en la base todavía
for (const m of ["personalSubtask"]) {
  if (typeof prisma[m]?.findMany !== "function") continue;
  try { datos[m] = await prisma[m].findMany(); } catch { /* aún sin crear: normal */ }
}

await prisma.$disconnect();

const dir = path.join(raiz, "_respaldos");
fs.mkdirSync(dir, { recursive: true });
const marca = new Date().toISOString().slice(0, 16).replace(/[-:T]/g, "");
const destino = path.join(dir, `base-${marca}.json`);
fs.writeFileSync(destino, JSON.stringify(datos, null, 1));

console.log(`✓ respaldo en _respaldos/${path.basename(destino)}`);
for (const [m, filas] of Object.entries(datos)) {
  if (filas.length) console.log(`  · ${m}: ${filas.length}`);
}
if (fallos.length) {
  console.log("  no se pudieron leer:");
  for (const f of fallos) console.log("   ·", f);
}
