/**
 * Fechas de los pendientes. Portado de la app de escritorio (`fechas.js`), donde
 * lleva meses en uso.
 *
 * Se guardan como 'AAAA-MM-DD' en hora local: sin hora ni zona, que es lo que evita
 * que un pendiente "de hoy" aparezca como de ayer según dónde se abra.
 */

export const DIAS = [
  "domingo", "lunes", "martes", "miercoles", "jueves", "viernes", "sabado",
];
export const MESES = [
  "ene", "feb", "mar", "abr", "may", "jun", "jul", "ago", "sep", "oct", "nov", "dic",
];

const dosDigitos = (n: number) => String(n).padStart(2, "0");

export function aTexto(d: Date) {
  return `${d.getFullYear()}-${dosDigitos(d.getMonth() + 1)}-${dosDigitos(d.getDate())}`;
}

export const hoyTexto = () => aTexto(new Date());

export function desdeTexto(s: string | null | undefined): Date | null {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(String(s || ""))) return null;
  const [a, m, d] = String(s).split("-").map(Number);
  const f = new Date(a, m - 1, d);
  return f.getFullYear() === a && f.getMonth() === m - 1 && f.getDate() === d ? f : null;
}

const sinAcentos = (s: string) =>
  s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();

/** Interpreta lo que se escribe tras @: @hoy, @manana, @viernes, @15/10, @+3d. */
export function interpreta(bruto: string): string | null {
  const t = sinAcentos(String(bruto || "").trim());
  if (!t) return null;
  const hoy = new Date();
  hoy.setHours(0, 0, 0, 0);

  if (t === "hoy") return aTexto(hoy);
  if (t === "manana") { hoy.setDate(hoy.getDate() + 1); return aTexto(hoy); }
  if (t === "pasado" || t === "pasadomanana") {
    hoy.setDate(hoy.getDate() + 2);
    return aTexto(hoy);
  }

  // @+3d / @+2s : dentro de N días o semanas
  const rel = t.match(/^\+(\d{1,3})\s*(d|dia|dias|s|sem|semana|semanas)?$/);
  if (rel) {
    const n = Number(rel[1]) * (/^s/.test(rel[2] || "d") ? 7 : 1);
    hoy.setDate(hoy.getDate() + n);
    return aTexto(hoy);
  }

  // @viernes : el próximo día con ese nombre (hoy no cuenta)
  const idx = DIAS.indexOf(t);
  if (idx !== -1) {
    const falta = ((idx - hoy.getDay() + 7) % 7) || 7;
    hoy.setDate(hoy.getDate() + falta);
    return aTexto(hoy);
  }

  // @15/10, @15-10, @15/10/2026
  const num = t.match(/^(\d{1,2})[/\-.](\d{1,2})(?:[/\-.](\d{2,4}))?$/);
  if (num) {
    const dia = Number(num[1]);
    const mes = Number(num[2]);
    let anio = num[3] ? Number(num[3]) : hoy.getFullYear();
    if (anio < 100) anio += 2000;
    if (mes < 1 || mes > 12 || dia < 1 || dia > 31) return null;
    let f = new Date(anio, mes - 1, dia);
    if (f.getMonth() !== mes - 1) return null;            // 31 de febrero y similares
    // Sin año explícito, una fecha ya pasada se entiende del año que viene.
    if (!num[3] && f < hoy) f = new Date(anio + 1, mes - 1, dia);
    return aTexto(f);
  }

  // @15oct / @15 oct
  const conMes = t.match(/^(\d{1,2})\s*([a-z]{3,})$/);
  if (conMes) {
    const mes = MESES.indexOf(conMes[2].slice(0, 3));
    if (mes === -1) return null;
    const dia = Number(conMes[1]);
    let f = new Date(hoy.getFullYear(), mes, dia);
    if (f.getMonth() !== mes) return null;
    if (f < hoy) f = new Date(hoy.getFullYear() + 1, mes, dia);
    return aTexto(f);
  }
  return null;
}

/** Cuántos días faltan (negativo si ya pasó). */
export function diasPara(texto: string | null | undefined): number | null {
  const f = desdeTexto(texto);
  if (!f) return null;
  const hoy = new Date();
  hoy.setHours(0, 0, 0, 0);
  f.setHours(0, 0, 0, 0);
  return Math.round((f.getTime() - hoy.getTime()) / 86400000);
}

/** Texto corto para la interfaz: «hoy», «ayer», «en 3 días», «hace 2 días»… */
export function comoTexto(texto: string | null | undefined) {
  const dias = diasPara(texto);
  if (dias === null) return "";
  if (dias === 0) return "hoy";
  if (dias === 1) return "mañana";
  if (dias === -1) return "ayer";
  if (dias > 1 && dias <= 14) return `en ${dias} días`;
  if (dias < -1) return `hace ${-dias} días`;
  const f = desdeTexto(texto)!;
  return `${f.getDate()} ${MESES[f.getMonth()]}`;
}

export const vencida = (texto: string | null | undefined) => {
  const d = diasPara(texto);
  return d !== null && d < 0;
};
export const paraHoy = (texto: string | null | undefined) => diasPara(texto) === 0;

/** La base guarda DateTime; aquí se trabaja con 'AAAA-MM-DD' en hora local. */
export const deFecha = (d: Date | null | undefined) => (d ? aTexto(new Date(d)) : null);
export const aFecha = (s: string | null | undefined) => desdeTexto(s);
