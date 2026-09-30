/* Pone la identidad del Club (el dorado y el azul noche) a las cuentas que todavía
   tienen los colores de la plantilla.

   Cómo se usa:
     npx vercel env pull .env.local --environment=production --yes
     node scripts/poner-identidad-club.mjs [--seco]
     rm -f .env.local

   Solo toca a quien tenga EXACTAMENTE los valores viejos de la plantilla: si alguien
   eligió su propio color a propósito, se le respeta. */
import fs from "node:fs";
import path from "node:path";
import { PrismaClient } from "@prisma/client";

const raiz = path.resolve(import.meta.dirname, "..");
const seco = process.argv.includes("--seco");

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

const VIEJO_ACENTO = "#8b5cf6";
const VIEJO_FONDO = "#0b0f19";
const ORO = "#c9a040";
const NOCHE = "#05091a";

const prisma = new PrismaClient();

const gente = await prisma.user.findMany({
  select: { id: true, name: true, email: true, accentColor: true, backgroundColor: true },
});

const porCambiar = gente.filter(
  (p) => p.accentColor === VIEJO_ACENTO || p.backgroundColor === VIEJO_FONDO
);

console.log(`${gente.length} cuentas · ${porCambiar.length} con los colores de la plantilla` +
  `${seco ? "  · EN SECO, no escribo nada" : ""}\n`);

for (const p of porCambiar) {
  const acento = p.accentColor === VIEJO_ACENTO ? ORO : p.accentColor;
  const fondo = p.backgroundColor === VIEJO_FONDO ? NOCHE : p.backgroundColor;
  console.log(`  · ${p.name || p.email}: ${p.accentColor} → ${acento} · ${p.backgroundColor} → ${fondo}`);
  if (seco) continue;
  await prisma.user.update({
    where: { id: p.id },
    data: { accentColor: acento, backgroundColor: fondo },
  });
}

if (!seco && porCambiar.length) {
  console.log(`\n✓ ${porCambiar.length} cuentas con la identidad del Club.`);
  console.log("  Quien quiera otro color lo cambia en su perfil.");
}
if (!porCambiar.length) console.log("  Nada que cambiar.");

await prisma.$disconnect();
