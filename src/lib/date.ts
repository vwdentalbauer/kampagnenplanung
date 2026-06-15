import { getISOWeek, parseISO, startOfISOWeek, format } from "date-fns";

/** Kalenderwoche aus einem ISO-Datum. */
export function kwAusDatum(iso: string | null): number | null {
  if (!iso) return null;
  try {
    return getISOWeek(parseISO(iso));
  } catch {
    return null;
  }
}

/** Quartal (Q1–Q4) aus einem ISO-Datum. */
export function quartalAusDatum(iso: string | null): string | null {
  if (!iso) return null;
  try {
    const m = parseISO(iso).getMonth();
    return `Q${Math.floor(m / 3) + 1}`;
  } catch {
    return null;
  }
}

/** Montag der Woche zu einem Datum (ISO). */
export function wochenStart(iso: string): string {
  return format(startOfISOWeek(parseISO(iso)), "yyyy-MM-dd");
}

export function formatDatum(iso: string | null): string {
  if (!iso) return "—";
  try {
    return format(parseISO(iso), "dd.MM.yyyy");
  } catch {
    return iso;
  }
}
