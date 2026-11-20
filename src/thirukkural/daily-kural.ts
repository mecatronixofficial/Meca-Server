export const TOTAL_KURALS = 1330;

const DAY_MS = 86_400_000;
/** The daily kural changes at midnight India time (IST, UTC+05:30, no daylight saving). */
const IST_OFFSET_MS = 330 * 60_000;

/** Today's date in India, as YYYY-MM-DD. */
export function indiaDate(now: Date = new Date()): string {
  return new Date(now.getTime() + IST_OFFSET_MS).toISOString().slice(0, 10);
}

/**
 * The kural shown on a given day: walks 1 → 1330 one per day, then starts again.
 * Same sequence the website used before (days since 1970-01-01, mod 1330), so the rotation carries on unchanged.
 */
export function kuralNumberForDate(date: string): number {
  const days = Math.floor(Date.parse(`${date}T00:00:00Z`) / DAY_MS);
  return (((days % TOTAL_KURALS) + TOTAL_KURALS) % TOTAL_KURALS) + 1;
}

/** When the given day's kural is replaced: the next midnight in India. */
export function nextChangeAt(date: string): Date {
  return new Date(Date.parse(`${date}T00:00:00Z`) + DAY_MS - IST_OFFSET_MS);
}
