/**
 * The whole team works out of Guadalajara, Jalisco — fixed UTC-6 year-round
 * since Mexico dropped DST for the interior states in 2022. Every "what day
 * is it" calculation in the app must use this zone instead of the runtime's
 * own clock: Vercel's server runs in UTC, so past ~6pm local the server's
 * UTC calendar date had already rolled to the next day while it was still
 * "today" here — checklists logged to tomorrow, the calendar's "today" ring
 * landed a day ahead, etc.
 *
 * No Prisma import here on purpose: this file is safe to use from both
 * server code and "use client" components.
 */
export const APP_TIME_ZONE = "America/Mexico_City";

/** Today's date, as reckoned in `APP_TIME_ZONE`, returned as a UTC-midnight
 * `Date` — the convention every date-only field in this app uses (dueDate,
 * calendar grid days, task logs). */
export function todayInAppZone(): Date {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: APP_TIME_ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(new Date());
  const get = (type: string) => Number(parts.find((p) => p.type === type)?.value);
  return new Date(Date.UTC(get("year"), get("month") - 1, get("day")));
}
