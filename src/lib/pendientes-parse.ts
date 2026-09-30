/**
 * La captura rápida de Pendientes: se escribe todo de corrido y de ahí sale la
 * etiqueta, el plazo y la prioridad. Portado de la app de escritorio (`store.js`).
 *
 *   Grabar módulo 4 #master @viernes !!
 *   → texto "Grabar módulo 4", etiqueta "master", plazo el viernes, urgente
 */
import { interpreta } from "./pendientes-fechas";

export type Capturado = {
  text: string;
  tags: string[];
  /** 0 normal · 1 importante (!) · 2 urgente (!!) */
  priority: number;
  /** 'AAAA-MM-DD' o null */
  due: string | null;
};

export function parseCaptura(text: string): Capturado {
  const tags: string[] = [];
  let priority = 0;
  let due: string | null = null;

  let limpio = String(text || "")
    .replace(/(^|\s)#([\p{L}\p{N}_-]+)/gu, (_m, sp: string, tag: string) => {
      tags.push(tag.toLowerCase());
      return sp;
    })
    // @hoy, @viernes, @15/10, @+3d… Si no se entiende como fecha (por ejemplo una
    // mención tipo @diegocabrera22) se deja en el texto tal cual.
    .replace(/(^|\s)@([\p{L}\p{N}+/\-.]+)/gu, (m: string, sp: string, valor: string) => {
      const f = interpreta(valor);
      if (!f) return m;
      due = f;
      return sp;
    })
    .replace(/(^|\s)(!{1,2})(?=\s|$)/g, (_m, sp: string, bangs: string) => {
      priority = Math.max(priority, bangs.length);
      return sp;
    });

  // Se colapsan los espacios pero se respetan los saltos de línea: un pendiente
  // puede ser varias líneas, o un enlace con notas debajo.
  limpio = limpio
    .replace(/[^\S\n]+/g, " ")
    .replace(/ *\n */g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();

  return { text: limpio, tags: [...new Set(tags)], priority, due };
}

/** Los cuatro tipos, con su nombre y su color. */
export const TIPOS = [
  { id: "TAREA", label: "Tarea", corto: "TAREA", color: "#22c55e" },
  { id: "IDEA", label: "Idea", corto: "IDEA", color: "#eab308" },
  { id: "VIDEO", label: "Video", corto: "VIDEO", color: "#ef4444" },
  { id: "SKOOL", label: "Skool", corto: "SKOOL", color: "#8b5cf6" },
] as const;

export type TipoId = (typeof TIPOS)[number]["id"];

export const TIPO_POR_ID = Object.fromEntries(TIPOS.map((t) => [t.id, t])) as Record<
  TipoId,
  (typeof TIPOS)[number]
>;

export const PRIORIDADES = [
  { n: 0, label: "", titulo: "Normal" },
  { n: 1, label: "!", titulo: "Importante" },
  { n: 2, label: "!!", titulo: "Urgente" },
] as const;
