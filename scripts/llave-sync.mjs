/* Da la llave de sincronización de una persona, para pegarla en su app de escritorio.

   Uso:
     npx vercel env pull .env.local --environment=production --yes
     node scripts/llave-sync.mjs tu@correo.com
     rm -f .env.local

   La llave se deriva de AUTH_SECRET y del id de la persona, así que no se guarda en
   ninguna tabla. Quien la tenga puede leer y escribir los pendientes de esa persona
   (nada más): trátala como una contraseña. */
import fs from "node:fs";
import path from "node:path";
import { createHmac } from "node:crypto";
import { PrismaClient } from "@prisma/client";

const raiz = path.resolve(import.meta.dirname, "..");
const correo = process.argv.find((a) => a.includes("@"));
if (!correo) {
  console.error("Falta el correo:\n  node scripts/llave-sync.mjs tu@correo.com");
  process.exit(1);
}

for (const n of [".env.local", ".env"]) {
  const f = path.join(raiz, n);
  if (!fs.existsSync(f)) continue;
  const txt = fs.readFileSync(f, "utf8");
  for (const k of ["DATABASE_URL", "AUTH_SECRET"]) {
    if (process.env[k]) continue;
    const m = txt.match(new RegExp(k + '="?([^"\\n]+)'));
    if (m) process.env[k] = m[1];
  }
}
if (!process.env.DATABASE_URL || !process.env.AUTH_SECRET) {
  console.error("Faltan DATABASE_URL o AUTH_SECRET. Corre antes:\n" +
    "  npx vercel env pull .env.local --environment=production --yes");
  process.exit(1);
}

const prisma = new PrismaClient();
const p = await prisma.user.findUnique({
  where: { email: correo.toLowerCase() },
  select: { id: true, name: true, email: true },
});
await prisma.$disconnect();

if (!p) {
  console.error(`No hay cuenta con el correo ${correo}.`);
  process.exit(1);
}

const firma = createHmac("sha256", process.env.AUTH_SECRET)
  .update("pendientes:" + p.id)
  .digest("base64url");
const llave = Buffer.from(p.id).toString("base64url") + "." + firma;

console.log(`${p.name || p.email}`);
console.log(llave);
