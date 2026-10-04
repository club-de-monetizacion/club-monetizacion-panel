/**
 * Los horarios del Club están en hora de México (CDMX / Guadalajara, UTC-6 todo el año).
 * Aquí se convierten a otras zonas con `Intl` y la fecha de hoy, así el horario de
 * verano de Estados Unidos, Chile, Cuba o España se ajusta solo, sin tablas a mano.
 */
const ZONA_BASE = "America/Mexico_City";
/** México ya no cambia de hora: UTC-6 fijo. */
const DESFASE_MEXICO_H = 6;

export type Zona = { etiqueta: string; detalle?: string; tz: string };

export const ZONAS_LATAM: Zona[] = [
  { etiqueta: "México", detalle: "Hora base · CDMX y Guadalajara", tz: ZONA_BASE },
  { etiqueta: "Centroamérica", detalle: "Guatemala, El Salvador, Honduras, Nicaragua, Costa Rica", tz: "America/Guatemala" },
  { etiqueta: "Colombia, Perú, Ecuador y Panamá", tz: "America/Bogota" },
  { etiqueta: "Cuba", tz: "America/Havana" },
  { etiqueta: "Venezuela, Bolivia, Rep. Dominicana y Puerto Rico", tz: "America/Caracas" },
  { etiqueta: "Chile", tz: "America/Santiago" },
  { etiqueta: "Argentina, Uruguay y Paraguay", tz: "America/Argentina/Buenos_Aires" },
  { etiqueta: "España", detalle: "Península", tz: "Europe/Madrid" },
];

export const ZONAS_EEUU: Zona[] = [
  { etiqueta: "Pacífico (PT)", detalle: "California, Oregón, Washington, Nevada", tz: "America/Los_Angeles" },
  { etiqueta: "Montaña (MT)", detalle: "Colorado, Utah, Nuevo México, Montana", tz: "America/Denver" },
  { etiqueta: "Centro (CT)", detalle: "Texas, Illinois, Luisiana, Misuri", tz: "America/Chicago" },
  { etiqueta: "Este (ET)", detalle: "Nueva York, Florida, Georgia, Carolinas", tz: "America/New_York" },
];

function partes(fecha: Date, tz: string) {
  const formato = new Intl.DateTimeFormat("en-US", {
    timeZone: tz,
    year: "numeric",
    month: "numeric",
    day: "numeric",
    hour: "numeric",
    minute: "numeric",
    hourCycle: "h23",
  });
  const o: Record<string, number> = {};
  for (const p of formato.formatToParts(fecha)) if (p.type !== "literal") o[p.type] = Number(p.value);
  return o;
}

/** La hora `horaMx` (0-23, hora de México) de hoy, vista en la zona `tz`. */
export function convertir(tz: string, horaMx: number, ahora: Date): { texto: string; dia: number } {
  const base = partes(ahora, ZONA_BASE);
  const instante = new Date(Date.UTC(base.year, base.month - 1, base.day, horaMx + DESFASE_MEXICO_H, 0));
  const p = partes(instante, tz);
  const dia = Math.round(
    (Date.UTC(p.year, p.month - 1, p.day) - Date.UTC(base.year, base.month - 1, base.day)) / 86_400_000,
  );
  const h = p.hour % 12 || 12;
  return {
    texto: `${h}:${String(p.minute).padStart(2, "0")} ${p.hour >= 12 ? "pm" : "am"}`,
    dia,
  };
}
