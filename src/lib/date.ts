import { getISOWeek, parseISO, startOfISOWeek, subWeeks, addWeeks, isAfter, format } from "date-fns";

/**
 * Stichtag „bis einschließlich vorletzte Woche": der Montag der letzten Woche.
 * Alle Einträge mit weekStart < diesem Datum liegen in der vorletzten Woche
 * oder früher.
 */
export function cutoffVorletzteWoche(heute = new Date()): string {
  return format(subWeeks(startOfISOWeek(heute), 1), "yyyy-MM-dd");
}

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

/** Liste der ISO-Kalenderwochen, die ein Zeitraum [start..ende] berührt. */
export function kwsImZeitraum(startIso: string | null, endeIso: string | null): number[] {
  if (!startIso) return [];
  try {
    let cursor = startOfISOWeek(parseISO(startIso));
    const ende = endeIso ? parseISO(endeIso) : parseISO(startIso);
    const out: number[] = [];
    // Sicherheitslimit, falls Datenbereich unsinnig groß
    for (let i = 0; i < 60; i++) {
      out.push(getISOWeek(cursor));
      const next = addWeeks(cursor, 1);
      if (isAfter(next, ende)) break;
      cursor = next;
    }
    return out;
  } catch {
    return [];
  }
}

/** Kurzer Wochentag (Mo, Di, …) zu einem ISO-Datum. */
export function wochentagKurz(iso: string | null): string {
  if (!iso) return "";
  try {
    return ["So", "Mo", "Di", "Mi", "Do", "Fr", "Sa"][parseISO(iso).getDay()];
  } catch {
    return "";
  }
}
