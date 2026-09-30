/* Trae los pendientes de la app de escritorio (el JSON del Mac) a la cuenta de su
   dueño en la plataforma.

   Cómo se usa:
     npx vercel env pull .env.local --environment=production --yes
     node scripts/importar-pendientes.mjs diegocabrerarosas@gmail.com
     rm -f .env.local

   Se puede correr las veces que haga falta: cada pendiente lleva el id que tenía en
   el Mac (`externalId`), así que el segundo pase actualiza en vez de duplicar.
   Nada se borra: lo que ya esté en la plataforma y no venga en el archivo se queda.

   Con --seco no escribe nada, solo dice qué haría. */
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { PrismaClient } from "@prisma/client";

const raiz = path.resolve(import.meta.dirname, "..");
const correo = process.argv.find((a) => a.includes("@"));
const seco = process.argv.includes("--seco");

if (!correo) {
  console.error("Falta el correo de la persona:\n" +
    "  node scripts/importar-pendientes.mjs tu@correo.com [--seco]");
  process.exit(1);
}

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

const ORIGEN = process.env.PENDIENTES_JSON ||
  path.join(os.homedir(), "Library", "Application Support", "Pendientes", "pendientes.json");

if (!fs.existsSync(ORIGEN)) {
  console.error("No encuentro el archivo de la app de escritorio:\n  " + ORIGEN);
  process.exit(1);
}

const crudo = JSON.parse(fs.readFileSync(ORIGEN, "utf8"));
const items = (crudo.items || []).filter((i) => i && !i.deleted);

const TIPOS = { tarea: "TAREA", idea: "IDEA", video: "VIDEO", skool: "SKOOL" };

/* El Mac guarda el plazo como 'AAAA-MM-DD' en hora local. Se crea la fecha a
   mediodía UTC para que ningún cambio de zona la mueva de día. */
function aFecha(s) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(String(s || ""))) return null;
  const [a, m, d] = s.split("-").map(Number);
  return new Date(Date.UTC(a, m - 1, d, 12, 0, 0));
}

const prisma = new PrismaClient();

const persona = await prisma.user.findUnique({ where: { email: correo.toLowerCase() } });
if (!persona) {
  console.error(`No hay ninguna cuenta con el correo ${correo}. Entra una vez en la ` +
    "plataforma con ese correo y vuelve a correr esto.");
  await prisma.$disconnect();
  process.exit(1);
}

console.log(`Origen : ${ORIGEN}`);
console.log(`Destino: ${persona.name || persona.email} (${persona.email})`);
console.log(`Traigo : ${items.length} pendientes${seco ? "  · EN SECO, no escribo nada" : ""}\n`);

let nuevos = 0, puestos = 0, pasos = 0;

for (const it of items) {
  const texto = String(it.text || "").trim();
  if (!texto) continue;

  const datos = {
    title: texto,
    kind: TIPOS[String(it.kind || "tarea").toLowerCase()] || "TAREA",
    priority: Math.max(0, Math.min(2, Number(it.priority) || 0)),
    due: aFecha(it.due),
    tags: Array.isArray(it.tags) ? it.tags.map(String) : [],
    order: Number.isFinite(it.order) ? Number(it.order) : 0,
    subsFolded: !!it.subsPlegadas,
    done: it.status === "hecha" || !!it.doneAt,
    doneAt: it.doneAt ? new Date(it.doneAt) : null,
    userId: persona.id,
    externalId: String(it.id),
  };

  const subs = (Array.isArray(it.subs) ? it.subs : [])
    .filter((s) => s && String(s.text || "").trim())
    .map((s, i) => ({ title: String(s.text).trim(), done: !!s.done, order: i }));

  if (seco) {
    console.log(`  · ${datos.kind.padEnd(5)} ${texto.slice(0, 58)}${texto.length > 58 ? "…" : ""}` +
      `${datos.due ? "  [plazo]" : ""}${subs.length ? `  [${subs.length} pasos]` : ""}`);
    continue;
  }

  const ya = await prisma.personalTask.findUnique({
    where: { userId_externalId: { userId: persona.id, externalId: datos.externalId } },
  });

  if (ya) {
    await prisma.personalTask.update({ where: { id: ya.id }, data: datos });
    // Las subtareas se rehacen: son la copia fiel de lo que hay en el Mac.
    await prisma.personalSubtask.deleteMany({ where: { taskId: ya.id } });
    if (subs.length) {
      await prisma.personalSubtask.createMany({
        data: subs.map((s) => ({ ...s, taskId: ya.id })),
      });
      pasos += subs.length;
    }
    puestos++;
  } else {
    const creado = await prisma.personalTask.create({ data: datos });
    if (subs.length) {
      await prisma.personalSubtask.createMany({
        data: subs.map((s) => ({ ...s, taskId: creado.id })),
      });
      pasos += subs.length;
    }
    nuevos++;
  }
}

if (!seco) {
  const total = await prisma.personalTask.count({ where: { userId: persona.id } });
  console.log(`\n✓ ${nuevos} nuevos · ${puestos} actualizados · ${pasos} pasos`);
  console.log(`  ahora tienes ${total} pendientes en la plataforma`);
}

await prisma.$disconnect();
