import type { Kampagne, Status } from "../types";
import { aktuelleSitzungUserId } from "./session";

/**
 * Umsetzung zwischen App-Feldern (camelCase) und Datenbankspalten
 * (snake_case) der Tabelle `kampagne`.
 *
 * Bewusst ohne Supabase-Import, damit die Zuordnung eigenständig testbar ist –
 * ein vertippter Spaltenname verliert hier sonst still Daten, ohne dass ein
 * Fehler sichtbar wird.
 */

/** DB-Zeile (snake_case) wie in der Tabelle `kampagne`. */
export interface Row {
  id: string;
  land: string;
  quartal: string;
  kw: number | null;
  week_start: string | null;
  end_datum: string | null;
  zielgruppe: string;
  kanal: string;
  sub_kanal: string;
  kampagne: string;
  details: string;
  ziel: string;
  kategorie: string;
  bereiche: string[];
  pluline: boolean;
  wkz: boolean;
  veranstaltung: string;
  sub_event: string;
  verantwortung: string;
  owners: string[];
  status: Status;
  // Wer/wann zuletzt geändert hat – Basis für Benachrichtigungen.
  updated_at?: string;
  updated_by?: string | null;
}

export function vonRow(r: Row): Kampagne {
  return {
    id: r.id,
    land: r.land,
    quartal: r.quartal,
    kw: r.kw,
    weekStart: r.week_start,
    endDatum: r.end_datum,
    zielgruppe: r.zielgruppe,
    kanal: r.kanal,
    subKanal: r.sub_kanal,
    kampagne: r.kampagne,
    details: r.details,
    ziel: r.ziel,
    kategorie: r.kategorie,
    bereiche: r.bereiche ?? [],
    pluline: r.pluline,
    wkz: r.wkz,
    veranstaltung: r.veranstaltung,
    subEvent: r.sub_event,
    verantwortung: r.verantwortung,
    owners: r.owners ?? [],
    status: r.status,
  };
}

export function zuRow(k: Kampagne): Row {
  return {
    id: k.id,
    land: k.land,
    quartal: k.quartal,
    kw: k.kw,
    week_start: k.weekStart,
    end_datum: k.endDatum,
    zielgruppe: k.zielgruppe,
    kanal: k.kanal,
    sub_kanal: k.subKanal,
    kampagne: k.kampagne,
    details: k.details,
    ziel: k.ziel,
    kategorie: k.kategorie,
    bereiche: k.bereiche ?? [],
    pluline: k.pluline,
    wkz: k.wkz,
    veranstaltung: k.veranstaltung,
    sub_event: k.subEvent,
    verantwortung: k.verantwortung,
    owners: k.owners ?? [],
    status: k.status,
    // Bei jeder Mutation aktualisieren, damit andere Nutzer informiert werden.
    updated_at: new Date().toISOString(),
    updated_by: aktuelleSitzungUserId(),
  };
}
