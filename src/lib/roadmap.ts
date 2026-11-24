import {
  addDays,
  addMonths,
  differenceInCalendarDays,
  endOfMonth,
  format,
  getISOWeek,
  parseISO,
  startOfISOWeek,
  startOfMonth,
} from "date-fns";
import type { Kampagne } from "../types";

/**
 * Gerüst für die Roadmap-Ansicht: welche Spalten das Raster zeigt (Wochen
 * oder Monate), wie sie sich zu Kopfgruppen bündeln und wo der Balken für
 * den Gesamtzeitraum liegt.
 *
 * Bewusst ohne React und ohne Supabase-Import, damit alles ohne Browser
 * testbar ist – die Wochen-/Monatsrechnerei ist genau die Stelle, an der sich
 * Fehler um eine Woche einschleichen.
 */

/** Monatsnamen fest hinterlegt statt über die Locale: in der CI ist nicht
 *  garantiert, dass deutsche Monatsnamen verfügbar sind. */
const MONATSNAMEN = [
  "Januar",
  "Februar",
  "März",
  "April",
  "Mai",
  "Juni",
  "Juli",
  "August",
  "September",
  "Oktober",
  "November",
  "Dezember",
];

/** Sicherheitsgrenzen, damit ein unsinniger Zeitraum kein endloses Raster baut. */
const MAX_WOCHEN = 80;
const MAX_MONATE = 36;

/** Feinheit der Zeitachse. Wochen fürs Detail, Monate für den Jahresüberblick. */
export type Zeitraster = "woche" | "monat";

/** Eine Spalte des Rasters. */
export interface Spalte {
  /** Eindeutiger Schlüssel: Montag (Woche) bzw. „yyyy-mm" (Monat). */
  key: string;
  /** Obere Zeile im Spaltenkopf, z.B. „KW 21" oder „Mai". */
  titel: string;
  /** Untere Zeile, z.B. „18.05.–24.05." oder „2026". */
  unter: string;
  /** Erster und letzter Tag der Spalte (ISO). */
  start: string;
  ende: string;
}

/** Zusammenfassung mehrerer Spalten im Kopf: Monate über Wochen, Jahre über Monaten. */
export interface Kopfgruppe {
  key: string;
  name: string;
  /** Anzahl Spalten, die die Gruppe überspannt. */
  spalten: number;
}

export interface Zeitraum {
  von: string;
  bis: string;
}

const iso = (d: Date) => format(d, "yyyy-MM-dd");

/** „18.05." – Kurzform für die Spaltenköpfe. */
const kurz = (d: string) => `${d.slice(8, 10)}.${d.slice(5, 7)}.`;

/**
 * Welchen Zeitraum deckt die Roadmap ab?
 *
 * Maßgeblich sind sowohl die Maßnahmen als auch der gepflegte Gesamtzeitraum –
 * im Vorbild laufen die Aktivitäten der eigentlichen Aktion voraus, und beides
 * gehört ins Bild.
 */
export function roadmapZeitraum(
  tasks: Kampagne[],
  start: string | null,
  ende: string | null,
): Zeitraum | null {
  const daten: string[] = [];
  for (const t of tasks) {
    if (t.weekStart) daten.push(t.weekStart);
    if (t.endDatum) daten.push(t.endDatum);
  }
  if (start) daten.push(start);
  if (ende) daten.push(ende);
  if (daten.length === 0) return null;
  daten.sort();
  return { von: daten[0], bis: daten[daten.length - 1] };
}

/** Vereinigt mehrere Zeiträume – für die gemeinsame Achse mehrerer Kampagnen. */
export function vereinige(zeitraeume: (Zeitraum | null)[]): Zeitraum | null {
  const da = zeitraeume.filter((z): z is Zeitraum => !!z);
  if (da.length === 0) return null;
  return {
    von: da.map((z) => z.von).sort()[0],
    bis: da.map((z) => z.bis).sort().reverse()[0],
  };
}

/** Alle Kalenderwochen, die der Zeitraum berührt. */
export function wochenImZeitraum(von: string, bis: string): Spalte[] {
  let cursor: Date;
  let letzter: Date;
  try {
    cursor = startOfISOWeek(parseISO(von));
    letzter = parseISO(bis);
  } catch {
    return [];
  }
  const out: Spalte[] = [];
  while (out.length < MAX_WOCHEN) {
    const start = iso(cursor);
    const ende = iso(addDays(cursor, 6));
    out.push({
      key: start,
      titel: `KW ${getISOWeek(cursor)}`,
      unter: `${kurz(start)}–${kurz(ende)}`,
      start,
      ende,
    });
    cursor = addDays(cursor, 7);
    if (cursor > letzter) break;
  }
  return out;
}

/** Alle Monate, die der Zeitraum berührt. */
export function monateImZeitraum(von: string, bis: string): Spalte[] {
  let cursor: Date;
  let letzter: Date;
  try {
    cursor = startOfMonth(parseISO(von));
    letzter = parseISO(bis);
  } catch {
    return [];
  }
  const out: Spalte[] = [];
  while (out.length < MAX_MONATE) {
    const start = iso(cursor);
    out.push({
      key: start.slice(0, 7),
      titel: MONATSNAMEN[cursor.getMonth()],
      unter: String(cursor.getFullYear()),
      start,
      ende: iso(endOfMonth(cursor)),
    });
    cursor = addMonths(cursor, 1);
    if (cursor > letzter) break;
  }
  return out;
}

export function spaltenImZeitraum(raster: Zeitraster, von: string, bis: string): Spalte[] {
  return raster === "monat" ? monateImZeitraum(von, bis) : wochenImZeitraum(von, bis);
}

/**
 * Kopfzeile über dem Raster: bei Wochenspalten die Monate, bei Monatsspalten
 * die Jahre. Eine Woche zählt zu dem Monat, in dem ihr Montag liegt; so bleibt
 * jede Spalte genau einer Gruppe zugeordnet.
 */
export function kopfgruppen(raster: Zeitraster, spalten: Spalte[]): Kopfgruppe[] {
  const out: Kopfgruppe[] = [];
  for (const s of spalten) {
    const key = raster === "monat" ? s.start.slice(0, 4) : s.start.slice(0, 7);
    const letzte = out[out.length - 1];
    if (letzte?.key === key) {
      letzte.spalten++;
      continue;
    }
    const name =
      raster === "monat"
        ? key
        : `${MONATSNAMEN[Number(key.slice(5, 7)) - 1]} ${key.slice(0, 4)}`;
    out.push({ key, name, spalten: 1 });
  }
  return out;
}

/** Liegt die Spalte (ganz oder teilweise) im Gesamtzeitraum? */
export function spalteImBand(spalte: Spalte, zeitraum: Zeitraum | null): boolean {
  if (!zeitraum) return false;
  return !(spalte.ende < zeitraum.von || spalte.start > zeitraum.bis);
}

/**
 * Lage des Zeitraum-Balkens, in Prozent der Rasterbreite.
 *
 * Gerechnet wird in Spaltenanteilen, nicht in Tagen: Die Spalten sind im
 * Raster gleich breit, Monate aber unterschiedlich lang – eine reine
 * Tagesrechnung würde den Balken dort verschieben.
 */
export function bandPosition(
  zeitraum: Zeitraum | null,
  spalten: Spalte[],
): { links: number; breite: number } | null {
  if (!zeitraum || spalten.length === 0) return null;

  /** Position eines Datums als Bruchteil über alle Spalten (0 … n). */
  const anteil = (datum: string, alsEnde: boolean): number => {
    for (let i = 0; i < spalten.length; i++) {
      const s = spalten[i];
      if (datum > s.ende) continue;
      const tage = differenceInCalendarDays(parseISO(s.ende), parseISO(s.start)) + 1;
      if (datum < s.start) return i; // liegt vor dieser Spalte
      const versatz = differenceInCalendarDays(parseISO(datum), parseISO(s.start));
      return i + (versatz + (alsEnde ? 1 : 0)) / tage;
    }
    return spalten.length;
  };

  const n = spalten.length;
  const links = Math.max(0, anteil(zeitraum.von, false));
  const rechts = Math.min(n, anteil(zeitraum.bis, true));
  if (rechts <= links) return null;
  return { links: (links / n) * 100, breite: ((rechts - links) / n) * 100 };
}

/** Schlüssel der Spalte, in die ein Datum fällt. */
export function spaltenKey(raster: Zeitraster, datum: string): string | null {
  try {
    return raster === "monat"
      ? datum.slice(0, 7)
      : iso(startOfISOWeek(parseISO(datum)));
  } catch {
    return null;
  }
}

/**
 * Ordnet die Maßnahmen dem Raster zu: je Kanal und Spalte die passenden
 * Einträge. Zugeordnet wird über den Spaltenschlüssel (Wochen-Montag bzw.
 * Monat), nicht über die KW-Nummer – sonst landen Einträge aus verschiedenen
 * Jahren in derselben Spalte.
 */
export function zuordnen(
  tasks: Kampagne[],
  raster: Zeitraster,
  spalten: Spalte[],
): Map<string, Map<string, Kampagne[]>> {
  const bekannt = new Set(spalten.map((s) => s.key));
  const out = new Map<string, Map<string, Kampagne[]>>();
  for (const t of tasks) {
    if (!t.weekStart) continue;
    const key = spaltenKey(raster, t.weekStart);
    if (!key || !bekannt.has(key)) continue;
    const kanal = kanalVon(t);
    if (!out.has(kanal)) out.set(kanal, new Map());
    const proSpalte = out.get(kanal)!;
    if (!proSpalte.has(key)) proSpalte.set(key, []);
    proSpalte.get(key)!.push(t);
  }
  return out;
}

/** Kanal einer Maßnahme, leere Angaben zusammengefasst. */
export function kanalVon(t: Kampagne): string {
  return t.kanal.trim() || "Ohne Kanal";
}

/**
 * Farben für die Kanäle einer Roadmap.
 *
 * Vergeben wird der Reihe nach über die alphabetisch sortierte Kanalliste.
 * Das ist wichtiger als eine feste Farbe je Kanalname: In einer Ansicht
 * müssen sich die Spuren sicher unterscheiden lassen, und ein Verfahren über
 * den Namen (etwa eine Prüfsumme) kann zwei Kanäle auf dieselbe Farbe legen.
 */
const KANAL_FARBEN = [
  "#5b5bd6",
  "#0b8a8a",
  "#c2410c",
  "#2563eb",
  "#be185d",
  "#8a6d3b",
  "#15803d",
  "#7c3aed",
  "#b91c1c",
  "#0e7490",
];

export function kanalFarben(kanaele: string[]): Map<string, string> {
  const sortiert = [...new Set(kanaele)].sort((a, b) => a.localeCompare(b, "de"));
  return new Map(sortiert.map((k, i) => [k, KANAL_FARBEN[i % KANAL_FARBEN.length]]));
}
