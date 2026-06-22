import * as XLSX from "xlsx";
import { addDays, format, parseISO } from "date-fns";
import type { Kampagne, Status } from "../types";
import { STATUS_LABELS } from "../constants";
import { BEREICHE } from "../constants";

const SHEET = "Jahresübersicht";

// Spaltenreihenfolge wie in der Original-Excel, plus Status & Kampagne am Ende.
const KOPF = [
  "Quartal",
  "Start KW",
  "MO",
  "DI",
  "MI",
  "DO",
  "FR",
  "SA",
  "SO",
  "Zeitraum/ Startdatum",
  "Enddatum",
  "Zielgruppe",
  "Kanal",
  "Sub-Kanal",
  "Details",
  "Ziel",
  "„db 4+1“",
  ...BEREICHE,
  "Veranstaltung",
  "Event-Typ",
  "Veranstaltungsdatum",
  "Veranstaltungsort",
  "Verantwortung",
  "Status",
  "Kampagne",
] as const;

function iso(d: string | null): string {
  return d ?? "";
}

function wochentage(weekStart: string | null): Record<string, string> {
  const tage = ["MO", "DI", "MI", "DO", "FR", "SA", "SO"];
  const out: Record<string, string> = {};
  if (!weekStart) {
    tage.forEach((t) => (out[t] = ""));
    return out;
  }
  const mo = parseISO(weekStart);
  tage.forEach((t, i) => (out[t] = format(addDays(mo, i), "yyyy-MM-dd")));
  return out;
}

/** Exportiert alle Kampagnen als Excel-Datei (Download). */
export function exportExcel(kampagnen: Kampagne[]) {
  const zeilen = kampagnen.map((k) => {
    const tage = wochentage(k.weekStart);
    const bereiche: Record<string, string> = {};
    BEREICHE.forEach((b) => (bereiche[b] = k.bereiche.includes(b) ? "x" : ""));
    return {
      Quartal: k.quartal,
      "Start KW": k.kw ? `KW ${k.kw}` : "",
      ...tage,
      "Zeitraum/ Startdatum": iso(k.weekStart),
      Enddatum: iso(k.endDatum),
      Zielgruppe: k.zielgruppe,
      Kanal: k.kanal,
      "Sub-Kanal": k.subKanal,
      Details: k.details,
      Ziel: k.ziel,
      "„db 4+1“": k.kategorie,
      ...bereiche,
      Veranstaltung: k.veranstaltung,
      "Event-Typ": k.eventTyp,
      Veranstaltungsdatum: iso(k.eventDatum),
      Veranstaltungsort: k.eventOrt,
      Verantwortung: k.verantwortung,
      Status: STATUS_LABELS[k.status],
      Kampagne: k.kampagne,
    };
  });

  const ws = XLSX.utils.json_to_sheet(zeilen, { header: KOPF as unknown as string[] });
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, SHEET);
  const datum = format(new Date(), "yyyy-MM-dd");
  XLSX.writeFile(wb, `Kampagnenplan_${datum}.xlsx`);
}

// --- Import -------------------------------------------------------------

function normal(s: string): string {
  return s
    .toLowerCase()
    .replace(/[​ ]/g, "")
    .replace(/[^a-z0-9]/g, "");
}

const STATUS_VON_LABEL: Record<string, Status> = Object.fromEntries(
  (Object.keys(STATUS_LABELS) as Status[]).map((s) => [normal(STATUS_LABELS[s]), s]),
) as Record<string, Status>;

function zuIso(v: unknown): string | null {
  if (!v) return null;
  if (v instanceof Date) return format(v, "yyyy-MM-dd");
  const s = String(v).trim();
  // bereits ISO?
  if (/^\d{4}-\d{2}-\d{2}/.test(s)) return s.slice(0, 10);
  return null;
}

/** Liest eine Excel-Datei und gibt Kampagnen zurück. */
export async function importExcel(file: File): Promise<Kampagne[]> {
  const buf = await file.arrayBuffer();
  const wb = XLSX.read(buf, { cellDates: true });
  const ws = wb.Sheets[SHEET] ?? wb.Sheets[wb.SheetNames[0]];
  if (!ws) return [];
  const matrix = XLSX.utils.sheet_to_json<unknown[]>(ws, { header: 1, blankrows: false });
  if (matrix.length < 2) return [];

  const kopf = (matrix[0] as unknown[]).map((c) => normal(String(c ?? "")));
  const idx = (name: string) => kopf.indexOf(normal(name));

  const cQuartal = idx("Quartal");
  const cKw = idx("Start KW");
  const cMo = idx("MO");
  const cStart = idx("Zeitraum/ Startdatum");
  const cEnde = idx("Enddatum");
  const cZg = idx("Zielgruppe");
  const cKanal = idx("Kanal");
  const cSubKanal = idx("Sub-Kanal");
  const cDetails = idx("Details");
  const cZiel = idx("Ziel");
  const cKat = idx("„db 4+1“");
  const cVer = idx("Verantwortung");
  const cStatus = idx("Status");
  const cKampagne = idx("Kampagne");
  const cVeranstaltung = idx("Veranstaltung");
  const cEventTyp = idx("Event-Typ");
  const cEventDatum = idx("Veranstaltungsdatum");
  const cEventOrt = idx("Veranstaltungsort");
  const bereichIdx = BEREICHE.map((b) => idx(b));

  const get = (row: unknown[], i: number): string =>
    i >= 0 && row[i] != null ? String(row[i]).trim() : "";

  const ergebnis: Kampagne[] = [];
  for (let r = 1; r < matrix.length; r++) {
    const row = matrix[r] as unknown[];
    const details = get(row, cDetails);
    const kanal = get(row, cKanal);
    if (!details && !kanal) continue; // Leerzeile

    const weekStart = zuIso(cStart >= 0 ? row[cStart] : null) ?? zuIso(cMo >= 0 ? row[cMo] : null);
    const kwRaw = get(row, cKw);
    const kwMatch = kwRaw.match(/(\d+)/);
    const verant = get(row, cVer);
    const owners = verant
      .split(/[/,]/)
      .map((o) => o.trim())
      .filter(Boolean);
    const bereiche = BEREICHE.filter((_, i) => get(row, bereichIdx[i]).toLowerCase() === "x");
    const statusLabel = normal(get(row, cStatus));
    const kampagne = get(row, cKampagne) || details.split("\n")[0].trim();

    ergebnis.push({
      id: `imp${Date.now()}_${r}`,
      quartal: get(row, cQuartal),
      kw: kwMatch ? Number(kwMatch[1]) : null,
      weekStart,
      endDatum: zuIso(cEnde >= 0 ? row[cEnde] : null),
      zielgruppe: get(row, cZg) || "Alle",
      kanal,
      subKanal: get(row, cSubKanal),
      kampagne,
      details,
      ziel: get(row, cZiel),
      kategorie: get(row, cKat),
      bereiche,
      veranstaltung: get(row, cVeranstaltung),
      eventTyp: get(row, cEventTyp),
      eventDatum: zuIso(cEventDatum >= 0 ? row[cEventDatum] : null),
      eventOrt: get(row, cEventOrt),
      verantwortung: verant,
      owners,
      status: STATUS_VON_LABEL[statusLabel] ?? "geplant",
    });
  }
  return ergebnis;
}
