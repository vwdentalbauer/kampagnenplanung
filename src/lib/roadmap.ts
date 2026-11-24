import { addDays, format, getISOWeek, parseISO, startOfISOWeek } from "date-fns";
import type { Kampagne } from "../types";

/**
 * Gerüst für die Roadmap-Ansicht einer Kampagne: welche Kalenderwochen das
 * Raster zeigt, wie sie sich auf Monate verteilen und wo der Balken für den
 * Gesamtzeitraum liegt.
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

/** Sicherheitsgrenze, damit ein unsinniger Zeitraum kein endloses Raster baut. */
const MAX_WOCHEN = 80;

export interface RoadmapWoche {
  /** ISO-Kalenderwoche (1–53). */
  kw: number;
  /** Montag der Woche (ISO yyyy-mm-dd). */
  start: string;
  /** Sonntag der Woche (ISO yyyy-mm-dd). */
  ende: string;
}

export interface RoadmapMonat {
  /** yyyy-mm – zum Zuordnen der Wochen. */
  key: string;
  /** z.B. „Juni 2026". */
  name: string;
  /** Anzahl Wochen, die dieser Monat im Raster einnimmt (Spaltenbreite). */
  wochen: number;
}

export interface Zeitraum {
  von: string;
  bis: string;
}

/**
 * Welchen Zeitraum deckt die Roadmap ab?
 *
 * Maßgeblich sind sowohl die Maßnahmen als auch der gepflegte Gesamtzeitraum –
 * im Beispiel laufen die Aktivitäten (ab KW 21) der eigentlichen Aktion
 * (ab KW 26) voraus, und beides gehört ins Bild.
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

/** Alle Kalenderwochen, die der Zeitraum berührt – je eine Rasterspalte. */
export function wochenImZeitraum(von: string, bis: string): RoadmapWoche[] {
  let cursor: Date;
  let letzter: Date;
  try {
    cursor = startOfISOWeek(parseISO(von));
    letzter = parseISO(bis);
  } catch {
    return [];
  }
  const out: RoadmapWoche[] = [];
  while (out.length < MAX_WOCHEN) {
    const montag = format(cursor, "yyyy-MM-dd");
    out.push({
      kw: getISOWeek(cursor),
      start: montag,
      ende: format(addDays(cursor, 6), "yyyy-MM-dd"),
    });
    cursor = addDays(cursor, 7);
    if (cursor > letzter) break;
  }
  return out;
}

/**
 * Fasst die Wochen zu Monaten zusammen – für die Kopfzeile über dem Raster.
 * Eine Woche zählt zu dem Monat, in dem ihr Montag liegt; so bleibt jede
 * Woche genau einer Monatsspalte zugeordnet.
 */
export function monateAusWochen(wochen: RoadmapWoche[]): RoadmapMonat[] {
  const out: RoadmapMonat[] = [];
  for (const w of wochen) {
    const key = w.start.slice(0, 7);
    const letzter = out[out.length - 1];
    if (letzter?.key === key) {
      letzter.wochen++;
      continue;
    }
    const [jahr, monat] = key.split("-");
    out.push({ key, name: `${MONATSNAMEN[Number(monat) - 1]} ${jahr}`, wochen: 1 });
  }
  return out;
}

/** Liegt die Woche (ganz oder teilweise) im Gesamtzeitraum? */
export function wocheImBand(woche: RoadmapWoche, zeitraum: Zeitraum | null): boolean {
  if (!zeitraum) return false;
  return !(woche.ende < zeitraum.von || woche.start > zeitraum.bis);
}

/**
 * Lage des Zeitraum-Balkens über dem Raster, in Prozent der Rasterbreite.
 * Gerechnet wird in Tagen über alle Wochen, damit der Balken auch mitten in
 * einer Woche beginnen und enden kann.
 */
export function bandPosition(
  zeitraum: Zeitraum | null,
  wochen: RoadmapWoche[],
): { links: number; breite: number } | null {
  if (!zeitraum || wochen.length === 0) return null;
  const tag = 86400000;
  const rasterStart = parseISO(wochen[0].start).getTime();
  const gesamtTage = wochen.length * 7;
  const vonTag = (parseISO(zeitraum.von).getTime() - rasterStart) / tag;
  const bisTag = (parseISO(zeitraum.bis).getTime() - rasterStart) / tag + 1;
  // Am Rasterrand abschneiden, damit der Balken nicht herausläuft.
  const links = Math.max(0, vonTag);
  const rechts = Math.min(gesamtTage, bisTag);
  if (rechts <= links) return null;
  return {
    links: (links / gesamtTage) * 100,
    breite: ((rechts - links) / gesamtTage) * 100,
  };
}

/**
 * Ordnet die Maßnahmen dem Raster zu: je Kanal und Woche die passenden
 * Einträge. Zugeordnet wird über den Wochen-Montag, nicht über die
 * KW-Nummer – sonst landen Einträge aus verschiedenen Jahren in derselben
 * Spalte.
 */
export function rasterDaten(
  tasks: Kampagne[],
  wochen: RoadmapWoche[],
): Map<string, Map<string, Kampagne[]>> {
  const bekannt = new Set(wochen.map((w) => w.start));
  const out = new Map<string, Map<string, Kampagne[]>>();
  for (const t of tasks) {
    if (!t.weekStart) continue;
    const montag = wochenStartSicher(t.weekStart);
    if (!montag || !bekannt.has(montag)) continue;
    const kanal = t.kanal.trim() || "Ohne Kanal";
    if (!out.has(kanal)) out.set(kanal, new Map());
    const proWoche = out.get(kanal)!;
    if (!proWoche.has(montag)) proWoche.set(montag, []);
    proWoche.get(montag)!.push(t);
  }
  return out;
}

function wochenStartSicher(iso: string): string | null {
  try {
    return format(startOfISOWeek(parseISO(iso)), "yyyy-MM-dd");
  } catch {
    return null;
  }
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
