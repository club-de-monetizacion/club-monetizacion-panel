"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireAdmin, requireSession } from "@/lib/auth-helpers";
import {
  RED_INFO,
  REDES,
  SE_RECLAMA,
  claveLogro,
  escalonesPorDebajo,
  escaleraDe,
  logrosAlcanzados,
  mesAFecha,
  normalizarUrlCuenta,
} from "@/lib/desafios";
import { leerCanalYoutube } from "@/lib/youtube";
import type { RedSocial, TipoLogro } from "@prisma/client";

/**
 * Desafíos: los perfiles de creador, sus páginas, sus avances y sus insignias.
 *
 * Dos reglas que no se rompen aquí:
 *  - **Cada persona solo toca lo suyo.** Toda acción parte del `userId` de la sesión,
 *    nunca de un id que venga del navegador sin comprobarlo contra él.
 *  - **Solo el equipo (ADMIN) modera.** Quitar una insignia, ocultar a alguien o
 *    corregir una cifra ajena pasa por `requireAdmin`.
 */

/* ── Lo que se devuelve y se valida ────────────────────────────────────────── */

export type LogroNuevo = { tipo: TipoLogro; red: RedSocial | null; umbral: number };
type Resultado = { error: string } | { success: true; nuevos?: LogroNuevo[]; id?: string };

const redSchema = z.enum(REDES as [RedSocial, ...RedSocial[]]);
const MAX_SEGUIDORES = 1_000_000_000;
const MAX_CUENTAS = 24;

/** Una imagen ya comprimida en el navegador, como data URL. El tope evita que alguien
 *  suba un archivo enorme saltándose la pantalla. */
const imagenSchema = (maxBytes: number) =>
  z
    .string()
    .max(maxBytes, "La imagen es demasiado pesada")
    .regex(/^data:image\/(jpeg|png|webp);base64,[A-Za-z0-9+/=]+$/, "Imagen no válida");

const enlaceSchema = z
  .string()
  .trim()
  .max(500, "El enlace es demasiado largo")
  .refine((v) => {
    try {
      const u = new URL(v);
      return u.protocol === "https:" || u.protocol === "http:";
    } catch {
      return false;
    }
  }, "El enlace no es válido");

const primerError = (e: z.ZodError) => e.issues[0]?.message ?? "Datos inválidos";

function refrescar() {
  revalidatePath("/desafios", "layout");
}

/* ── Conceder insignias de seguidores y audiencia ──────────────────────────── */

/**
 * Compara las cifras actuales de la persona con el catálogo y crea las insignias de
 * seguidores y audiencia que le faltan. Una insignia que el equipo revocó **no se
 * vuelve a crear**: la fila sigue ahí y el índice único la respeta.
 */
async function concederAlcanzados(perfilId: string): Promise<LogroNuevo[]> {
  const [cuentas, existentes, dinero] = await Promise.all([
    prisma.cuentaSocial.findMany({
      where: { perfilId },
      select: { id: true, red: true, nombre: true, seguidores: true },
    }),
    prisma.logroCreador.findMany({ where: { perfilId }, select: { clave: true } }),
    prisma.ingresoCreador.aggregate({ where: { perfilId }, _sum: { centavos: true } }),
  ]);
  const tengo = new Set(existentes.map((l) => l.clave));
  const ingresosUsd = (dinero._sum.centavos ?? 0) / 100;
  const faltan = logrosAlcanzados(cuentas, ingresosUsd).filter((l) => !tengo.has(l.clave));
  if (faltan.length === 0) return [];

  await prisma.logroCreador.createMany({
    data: faltan.map((l) => ({
      perfilId,
      clave: l.clave,
      tipo: l.tipo,
      red: l.red,
      umbral: l.umbral,
    })),
    skipDuplicates: true,
  });
  return faltan.map(({ tipo, red, umbral }) => ({ tipo, red, umbral }));
}

async function miPerfil() {
  const session = await requireSession();
  const perfil = await prisma.perfilCreador.findUnique({
    where: { userId: session.user.id },
  });
  return { session, perfil };
}

async function miCuenta(cuentaId: string) {
  const { session, perfil } = await miPerfil();
  if (!perfil) throw new Error("Primero crea tu perfil");
  const cuenta = await prisma.cuentaSocial.findUnique({ where: { id: cuentaId } });
  if (!cuenta || cuenta.perfilId !== perfil.id) throw new Error("No encontrado");
  return { session, perfil, cuenta };
}

/* ── Mi perfil ─────────────────────────────────────────────────────────────── */

const perfilSchema = z.object({
  nombre: z.string().trim().min(2, "Escribe cómo te llamas").max(60, "Máximo 60 letras"),
  bio: z.string().trim().max(280, "La bio admite 280 caracteres").optional(),
  nicho: z.string().trim().max(40, "El nicho admite 40 caracteres").optional(),
  // undefined = no tocar la foto · null = quitarla · texto = la nueva
  foto: imagenSchema(200_000).nullable().optional(),
  visible: z.boolean(),
  mostrarSeguidores: z.boolean().optional(),
  mostrarIngresos: z.boolean().optional(),
});

export async function guardarPerfil(entrada: z.input<typeof perfilSchema>): Promise<Resultado> {
  const { session } = await miPerfil();
  const datos = perfilSchema.safeParse(entrada);
  if (!datos.success) return { error: primerError(datos.error) };
  const { nombre, bio, nicho, foto, visible, mostrarSeguidores, mostrarIngresos } = datos.data;

  const comunes = {
    nombre,
    bio: bio || null,
    nicho: nicho || null,
    visible,
    ...(mostrarSeguidores !== undefined ? { mostrarSeguidores } : {}),
    ...(mostrarIngresos !== undefined ? { mostrarIngresos } : {}),
    ...(foto !== undefined ? { foto } : {}),
  };
  const perfil = await prisma.perfilCreador.upsert({
    where: { userId: session.user.id },
    update: comunes,
    create: { userId: session.user.id, ...comunes },
  });
  refrescar();
  return { success: true, id: perfil.id };
}

const privacidadSchema = z.object({
  visible: z.boolean().optional(),
  mostrarSeguidores: z.boolean().optional(),
  mostrarIngresos: z.boolean().optional(),
});

/** Cambia qué datos ven los demás. Se guarda al instante, sin tocar el resto del perfil. */
export async function cambiarPrivacidad(entrada: z.input<typeof privacidadSchema>): Promise<Resultado> {
  const { perfil } = await miPerfil();
  if (!perfil) return { error: "Primero crea tu perfil" };
  const datos = privacidadSchema.safeParse(entrada);
  if (!datos.success) return { error: primerError(datos.error) };
  await prisma.perfilCreador.update({ where: { id: perfil.id }, data: datos.data });
  refrescar();
  return { success: true };
}

/** Borra el perfil entero de quien lo pide: páginas, avances e insignias incluidas. */
export async function borrarMiPerfil(): Promise<Resultado> {
  const { perfil } = await miPerfil();
  if (!perfil) return { error: "No tienes perfil" };
  await prisma.perfilCreador.delete({ where: { id: perfil.id } });
  refrescar();
  return { success: true };
}

/* ── Mis páginas ───────────────────────────────────────────────────────────── */

const cuentaSchema = z.object({
  red: redSchema,
  nombre: z.string().trim().min(1, "Ponle nombre a la página").max(80, "Máximo 80 letras"),
  url: z.string().trim().min(1, "Pega el enlace de tu página").max(300),
  seguidores: z.coerce
    .number()
    .int("Solo números enteros")
    .min(0, "No puede ser negativo")
    .max(MAX_SEGUIDORES, "Esa cifra no es realista"),
  foto: imagenSchema(200_000).nullable().optional(),
});

export async function agregarCuenta(entrada: z.input<typeof cuentaSchema>): Promise<Resultado> {
  const { perfil } = await miPerfil();
  if (!perfil) return { error: "Primero crea tu perfil" };

  const datos = cuentaSchema.safeParse(entrada);
  if (!datos.success) return { error: primerError(datos.error) };
  const { red, nombre, seguidores, foto } = datos.data;

  const norm = normalizarUrlCuenta(datos.data.url, red);
  if (!norm) {
    return {
      error: `Ese enlace no es de ${RED_INFO[red].nombre}. Debe ser algo como ${RED_INFO[red].ejemplo}`,
    };
  }

  const cuantas = await prisma.cuentaSocial.count({ where: { perfilId: perfil.id } });
  if (cuantas >= MAX_CUENTAS) return { error: `Máximo ${MAX_CUENTAS} páginas por perfil` };

  const repetida = await prisma.cuentaSocial.findUnique({
    where: { perfilId_url: { perfilId: perfil.id, url: norm.url } },
  });
  if (repetida) return { error: "Ya diste de alta esa página" };

  const cuenta = await prisma.cuentaSocial.create({
    data: {
      perfilId: perfil.id,
      red,
      nombre,
      url: norm.url,
      seguidores,
      foto: foto ?? null,
      avances: { create: { seguidores } },
    },
  });
  const nuevos = await concederAlcanzados(perfil.id);
  refrescar();
  return { success: true, id: cuenta.id, nuevos };
}

const edicionCuentaSchema = z.object({
  nombre: z.string().trim().min(1, "Ponle nombre a la página").max(80),
  foto: imagenSchema(200_000).nullable().optional(),
});

/** Cambia el nombre o la foto de una página. Los seguidores van por `registrarAvance`. */
export async function editarCuenta(
  cuentaId: string,
  entrada: z.input<typeof edicionCuentaSchema>,
): Promise<Resultado> {
  await miCuenta(cuentaId);
  const datos = edicionCuentaSchema.safeParse(entrada);
  if (!datos.success) return { error: primerError(datos.error) };
  await prisma.cuentaSocial.update({
    where: { id: cuentaId },
    data: {
      nombre: datos.data.nombre,
      ...(datos.data.foto !== undefined ? { foto: datos.data.foto } : {}),
    },
  });
  refrescar();
  return { success: true };
}

export async function borrarCuenta(cuentaId: string): Promise<Resultado> {
  await miCuenta(cuentaId);
  // Las insignias ya ganadas se quedan: son un logro, no un dato de la página.
  await prisma.cuentaSocial.delete({ where: { id: cuentaId } });
  refrescar();
  return { success: true };
}

/* ── Anotar un avance ──────────────────────────────────────────────────────── */

const avanceSchema = z.object({
  seguidores: z.coerce
    .number()
    .int("Solo números enteros")
    .min(0, "No puede ser negativo")
    .max(MAX_SEGUIDORES, "Esa cifra no es realista"),
  nota: z.string().trim().max(200, "La nota admite 200 caracteres").optional(),
});

export async function registrarAvance(
  cuentaId: string,
  entrada: z.input<typeof avanceSchema>,
): Promise<Resultado> {
  const { perfil, cuenta } = await miCuenta(cuentaId);
  const datos = avanceSchema.safeParse(entrada);
  if (!datos.success) return { error: primerError(datos.error) };
  const { seguidores, nota } = datos.data;

  // Una cifra de YouTube leída de la red no se pisa a mano: si no, el sello de
  // «dato leído de YouTube» dejaría de significar algo.
  if (cuenta.leidoDeLaRed) {
    return { error: "Esta página se lee sola de YouTube. Usa «Actualizar desde YouTube»." };
  }
  if (seguidores === cuenta.seguidores && !nota) {
    return { error: "Es la misma cifra que ya tenías" };
  }

  await prisma.$transaction([
    prisma.cuentaSocial.update({ where: { id: cuentaId }, data: { seguidores } }),
    prisma.avanceCuenta.create({ data: { cuentaId, seguidores, nota: nota || null } }),
  ]);
  const nuevos = await concederAlcanzados(perfil.id);
  refrescar();
  return { success: true, nuevos };
}

/** Lee los seguidores de un canal de YouTube directamente de YouTube. */
export async function actualizarDesdeYoutube(cuentaId: string): Promise<Resultado> {
  const { perfil, cuenta } = await miCuenta(cuentaId);
  if (cuenta.red !== "YOUTUBE") return { error: "Solo funciona con canales de YouTube" };

  const lectura = await leerCanalYoutube(cuenta.url);
  if (!lectura.ok) return { error: lectura.error };

  const { seguidores, foto } = lectura.canal;
  await prisma.$transaction([
    prisma.cuentaSocial.update({
      where: { id: cuentaId },
      data: {
        seguidores,
        leidoDeLaRed: new Date(),
        // Se respeta la foto que la persona ya puso; si no tiene, se usa la del canal.
        ...(!cuenta.foto && foto ? { foto } : {}),
      },
    }),
    ...(seguidores !== cuenta.seguidores
      ? [prisma.avanceCuenta.create({ data: { cuentaId, seguidores, nota: "Leído de YouTube" } })]
      : []),
  ]);
  const nuevos = await concederAlcanzados(perfil.id);
  refrescar();
  return { success: true, nuevos };
}

/* ── Reclamar un video ─────────────────────────────────────────────────────── */

const reclamoSchema = z.object({
  tipo: z.enum(["VISTAS", "LIKES", "MONETIZACION"]),
  umbral: z.coerce.number().int(),
  red: redSchema.nullable().optional(),
  // La prueba es opcional: puede ser solo el enlace, solo la captura, o nada.
  enlace: enlaceSchema.optional().or(z.literal("")),
  captura: imagenSchema(900_000).nullable().optional(),
  nota: z.string().trim().max(300, "La nota admite 300 caracteres").optional(),
});

/**
 * «Mi video llegó a N vistas/likes» o «ya tengo la monetización activada». Concede ese escalón y, de regalo, los de abajo de
 * la misma serie que aún no tenga: quien llegó a 10 mil pasó por las mil.
 */
export async function reclamarLogro(entrada: z.input<typeof reclamoSchema>): Promise<Resultado> {
  const { perfil } = await miPerfil();
  if (!perfil) return { error: "Primero crea tu perfil" };

  const datos = reclamoSchema.safeParse(entrada);
  if (!datos.success) return { error: primerError(datos.error) };
  const { tipo, umbral, red, enlace, captura, nota } = datos.data;
  if (!SE_RECLAMA[tipo] || !escaleraDe(tipo).includes(umbral)) {
    return { error: "Ese escalón no existe" };
  }

  const clave = claveLogro(tipo, umbral);
  const yaEsta = await prisma.logroCreador.findUnique({
    where: { perfilId_clave: { perfilId: perfil.id, clave } },
  });
  if (yaEsta?.estado === "ACTIVO") return { error: "Ya tienes esta insignia" };
  if (yaEsta?.estado === "REVOCADO") {
    return { error: "El equipo revisó esta insignia. Escríbele al equipo si crees que fue un error." };
  }

  await prisma.logroCreador.create({
    data: {
      perfilId: perfil.id,
      clave,
      tipo,
      red: red ?? null,
      umbral,
      enlace: enlace || null,
      captura: captura ?? null,
      nota: nota || null,
    },
  });
  // Los escalones de abajo, sin prueba propia: cuelgan de este.
  const debajo = escalonesPorDebajo(tipo, umbral);
  if (debajo.length > 0) {
    await prisma.logroCreador.createMany({
      data: debajo.map((u) => ({
        perfilId: perfil.id,
        clave: claveLogro(tipo, u),
        tipo,
        red: red ?? null,
        umbral: u,
        origenClave: clave,
      })),
      skipDuplicates: true,
    });
  }
  refrescar();
  return { success: true, nuevos: [{ tipo, red: red ?? null, umbral }] };
}

/** Retira una insignia de video que la persona reclamó por error. */
export async function retirarLogro(logroId: string): Promise<Resultado> {
  const { perfil } = await miPerfil();
  if (!perfil) return { error: "No tienes perfil" };
  const logro = await prisma.logroCreador.findUnique({ where: { id: logroId } });
  if (!logro || logro.perfilId !== perfil.id) return { error: "No encontrado" };
  if (!SE_RECLAMA[logro.tipo]) return { error: "Esa insignia se gana sola, no se retira" };
  // Una revocada la decidió el equipo: borrarla dejaría reclamarla otra vez.
  if (logro.estado === "REVOCADO") return { error: "El equipo revisó esta insignia" };

  await prisma.logroCreador.deleteMany({
    where: {
      perfilId: perfil.id,
      estado: "ACTIVO",
      OR: [{ id: logroId }, { origenClave: logro.clave }],
    },
  });
  refrescar();
  return { success: true };
}

/* ── Moderación: solo el equipo ────────────────────────────────────────────── */

/** Quita una insignia (y las que colgaban de ella). Queda anotado quién y por qué. */
export async function revocarLogro(logroId: string, motivo: string): Promise<Resultado> {
  const { user } = await requireAdmin();
  const logro = await prisma.logroCreador.findUnique({ where: { id: logroId } });
  if (!logro) return { error: "No encontrado" };

  await prisma.logroCreador.updateMany({
    where: {
      perfilId: logro.perfilId,
      estado: "ACTIVO",
      OR: [{ id: logroId }, { origenClave: logro.clave }],
    },
    data: {
      estado: "REVOCADO",
      revocadoEn: new Date(),
      revocadoPor: user.name ?? user.id,
      motivoRevocacion: motivo.trim().slice(0, 300) || null,
    },
  });
  refrescar();
  return { success: true };
}

export async function restaurarLogro(logroId: string): Promise<Resultado> {
  await requireAdmin();
  const logro = await prisma.logroCreador.findUnique({ where: { id: logroId } });
  if (!logro) return { error: "No encontrado" };
  await prisma.logroCreador.updateMany({
    where: {
      perfilId: logro.perfilId,
      estado: "REVOCADO",
      OR: [{ id: logroId }, { origenClave: logro.clave }],
    },
    data: { estado: "ACTIVO", revocadoEn: null, revocadoPor: null, motivoRevocacion: null },
  });
  refrescar();
  return { success: true };
}

/** El equipo corrige una cifra que no cuadra. Queda en el historial con su nota. */
export async function corregirSeguidores(
  cuentaId: string,
  seguidores: number,
): Promise<Resultado> {
  await requireAdmin();
  const n = z.coerce.number().int().min(0).max(MAX_SEGUIDORES).safeParse(seguidores);
  if (!n.success) return { error: "Cifra no válida" };
  const cuenta = await prisma.cuentaSocial.findUnique({ where: { id: cuentaId } });
  if (!cuenta) return { error: "No encontrado" };

  await prisma.$transaction([
    prisma.cuentaSocial.update({ where: { id: cuentaId }, data: { seguidores: n.data } }),
    prisma.avanceCuenta.create({
      data: { cuentaId, seguidores: n.data, nota: "Corregido por el equipo" },
    }),
  ]);
  refrescar();
  return { success: true };
}

export async function quitarCuentaComoEquipo(cuentaId: string): Promise<Resultado> {
  await requireAdmin();
  await prisma.cuentaSocial.delete({ where: { id: cuentaId } }).catch(() => null);
  refrescar();
  return { success: true };
}

/** Saca (o devuelve) a alguien de la tabla clasificatoria, y deja una nota solo para el equipo. */
export async function moderarPerfil(
  perfilId: string,
  cambios: { oculto?: boolean; nota?: string },
): Promise<Resultado> {
  await requireAdmin();
  await prisma.perfilCreador.update({
    where: { id: perfilId },
    data: {
      ...(cambios.oculto !== undefined ? { ocultoPorEquipo: cambios.oculto } : {}),
      ...(cambios.nota !== undefined ? { notaEquipo: cambios.nota.trim().slice(0, 1000) || null } : {}),
    },
  });
  refrescar();
  return { success: true };
}

export async function borrarPerfilComoEquipo(perfilId: string): Promise<Resultado> {
  await requireAdmin();
  await prisma.perfilCreador.delete({ where: { id: perfilId } }).catch(() => null);
  refrescar();
  return { success: true };
}

/* ── Ingresos ──────────────────────────────────────────────────────────────── */

const ingresoSchema = z.object({
  red: redSchema,
  /** «2026-10» */
  mes: z.string(),
  /** Dólares, con hasta dos decimales */
  monto: z.coerce
    .number()
    .min(0, "No puede ser negativo")
    .max(1_000_000, "Esa cifra no es realista")
    .refine((n) => Math.abs(n * 100 - Math.round(n * 100)) < 1e-6, "Usa como máximo dos decimales"),
  nota: z.string().trim().max(200, "La nota admite 200 caracteres").optional(),
  captura: imagenSchema(900_000).nullable().optional(),
});

/**
 * Anota lo que se ganó en una plataforma en un mes. Si ya había algo de ese mes y esa
 * red, **se corrige** en vez de sumarse: así un error de dedo se arregla sin duplicar.
 * Todo en dólares.
 */
export async function registrarIngreso(entrada: z.input<typeof ingresoSchema>): Promise<Resultado> {
  const { perfil } = await miPerfil();
  if (!perfil) return { error: "Primero crea tu perfil" };

  const datos = ingresoSchema.safeParse(entrada);
  if (!datos.success) return { error: primerError(datos.error) };
  const { red, monto, nota, captura } = datos.data;
  const mes = mesAFecha(datos.data.mes);
  if (!mes) return { error: "Elige un mes que no sea futuro" };

  const centavos = Math.round(monto * 100);
  await prisma.ingresoCreador.upsert({
    where: { perfilId_red_mes: { perfilId: perfil.id, red, mes } },
    update: { centavos, nota: nota || null, ...(captura !== undefined ? { captura } : {}) },
    create: { perfilId: perfil.id, red, mes, centavos, nota: nota || null, captura: captura ?? null },
  });
  const nuevos = await concederAlcanzados(perfil.id);
  refrescar();
  return { success: true, nuevos };
}

export async function borrarIngreso(ingresoId: string): Promise<Resultado> {
  const { perfil } = await miPerfil();
  if (!perfil) return { error: "No tienes perfil" };
  // `deleteMany` con el perfil en el filtro: solo borra si la fila es suya.
  const r = await prisma.ingresoCreador.deleteMany({ where: { id: ingresoId, perfilId: perfil.id } });
  if (r.count === 0) return { error: "No encontrado" };
  refrescar();
  return { success: true };
}

/** El equipo quita una fila de ingresos que no cuadra. Las insignias se revisan aparte. */
export async function quitarIngresoComoEquipo(ingresoId: string): Promise<Resultado> {
  await requireAdmin();
  await prisma.ingresoCreador.delete({ where: { id: ingresoId } }).catch(() => null);
  refrescar();
  return { success: true };
}
