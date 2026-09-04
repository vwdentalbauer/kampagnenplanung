import { describe, it, expect } from "vitest";
import type { Kampagne } from "../types";
import { vonRow, zuRow, type Row } from "./kampagneRow";

/**
 * Jedes Feld bewusst mit einem *anderen* Wert belegt. Würde die Zuordnung zwei
 * Felder verwechseln oder eines vergessen, fällt das beim Rückweg auf – bei
 * gleichen Werten überall würde ein solcher Fehler unbemerkt durchgehen.
 */
const vollstaendig: Kampagne = {
  id: "c123",
  land: "DK",
  quartal: "Q2",
  kw: 17,
  weekStart: "2026-04-20",
  endDatum: "2026-05-04",
  zielgruppe: "Zahnarztpraxen",
  kanal: "PR",
  subKanal: "LinkedIn / Instagram",
  kampagne: "Frühjahrsaktion",
  details: "Mailing an Bestandskunden",
  ziel: "Neukunden",
  kategorie: "Hero Kampagne",
  bereiche: ["Brand", "MIZ"],
  pluline: true,
  wkz: false,
  veranstaltung: "IDS",
  subEvent: "s1_koeln",
  verantwortung: "Valeska / David",
  owners: ["Valeska", "David"],
  status: "in_arbeit",
};

describe("zuRow / vonRow", () => {
  it("überträgt alle Felder unverändert hin und zurück", () => {
    const zurueck = vonRow(zuRow(vollstaendig));
    expect(zurueck).toEqual(vollstaendig);
  });

  it("benennt die Spalten in snake_case um", () => {
    const row = zuRow(vollstaendig);
    expect(row.week_start).toBe("2026-04-20");
    expect(row.end_datum).toBe("2026-05-04");
    expect(row.sub_kanal).toBe("LinkedIn / Instagram");
    expect(row.sub_event).toBe("s1_koeln");
  });

  it("deckt jedes Feld der Kampagne ab", () => {
    // Schutz gegen ein neu ergänztes Feld, das in der Zuordnung vergessen wird:
    // vonRow(zuRow(x)) muss exakt dieselben Schlüssel liefern wie das Original.
    const zurueck = vonRow(zuRow(vollstaendig));
    expect(Object.keys(zurueck).sort()).toEqual(Object.keys(vollstaendig).sort());
  });

  it("setzt updated_at bei jeder Mutation", () => {
    const row = zuRow(vollstaendig);
    expect(row.updated_at).toBeTruthy();
    // Muss ein gültiger Zeitstempel sein, sonst weist die DB ihn ab.
    expect(Number.isNaN(Date.parse(row.updated_at!))).toBe(false);
  });

  it("verträgt fehlende Listen aus der Datenbank", () => {
    // Ältere Zeilen können bereiche/owners als null liefern – das darf die App
    // nicht zum Absturz bringen, sondern muss zu leeren Listen werden.
    const luecken = {
      ...zuRow(vollstaendig),
      bereiche: null,
      owners: null,
    } as unknown as Row;
    const k = vonRow(luecken);
    expect(k.bereiche).toEqual([]);
    expect(k.owners).toEqual([]);
  });

  it("behält null-Werte bei Datumsfeldern", () => {
    const ohneDatum: Kampagne = { ...vollstaendig, weekStart: null, endDatum: null, kw: null };
    const row = zuRow(ohneDatum);
    expect(row.week_start).toBeNull();
    expect(row.end_datum).toBeNull();
    expect(row.kw).toBeNull();
    expect(vonRow(row)).toEqual(ohneDatum);
  });
});
