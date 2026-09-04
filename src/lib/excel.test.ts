import { describe, it, expect } from "vitest";
import * as XLSX from "xlsx";
import type { Kampagne } from "../types";
import { arbeitsmappe, importAusPuffer } from "./excel";

/** Schreibt die Mappe in einen Puffer und liest sie direkt wieder ein. */
function rundlauf(kampagnen: Kampagne[]): Kampagne[] {
  const puffer = XLSX.write(arbeitsmappe(kampagnen), {
    type: "array",
    bookType: "xlsx",
  }) as ArrayBuffer;
  return importAusPuffer(puffer);
}

function k(ueberschreiben: Partial<Kampagne> = {}): Kampagne {
  return {
    id: "c1",
    land: "DE",
    quartal: "Q3",
    kw: 36,
    weekStart: "2026-08-31",
    endDatum: null,
    zielgruppe: "Zahnarztpraxen",
    kanal: "PR",
    subKanal: "LinkedIn",
    kampagne: "Testkampagne",
    details: "Mailing an Bestandskunden",
    ziel: "Neukunden",
    kategorie: "Hero Kampagne",
    bereiche: ["Brand"],
    pluline: false,
    wkz: false,
    veranstaltung: "",
    subEvent: "",
    verantwortung: "Valeska",
    owners: ["Valeska"],
    status: "geplant",
    ...ueberschreiben,
  };
}

describe("Excel-Rundlauf (Export → Import)", () => {
  it("erhält alle inhaltlichen Felder", () => {
    const original = k();
    const [zurueck] = rundlauf([original]);

    // Die id wird beim Import neu vergeben (Excel führt keine ids), daher
    // gezielt die inhaltlichen Felder vergleichen.
    const { id: _weg, subEvent: _auchWeg, ...erwartet } = original;
    expect(zurueck).toMatchObject(erwartet);
  });

  it("überträgt mehrere Einträge in gleicher Reihenfolge", () => {
    const zurueck = rundlauf([
      k({ id: "a", kampagne: "Erste", details: "Detail A" }),
      k({ id: "b", kampagne: "Zweite", details: "Detail B" }),
      k({ id: "c", kampagne: "Dritte", details: "Detail C" }),
    ]);
    expect(zurueck).toHaveLength(3);
    expect(zurueck.map((x) => x.kampagne)).toEqual(["Erste", "Zweite", "Dritte"]);
  });

  it("erhält Datum, Kalenderwoche und Enddatum", () => {
    const [zurueck] = rundlauf([k({ kw: 36, weekStart: "2026-08-31", endDatum: "2026-09-15" })]);
    expect(zurueck.kw).toBe(36);
    expect(zurueck.weekStart).toBe("2026-08-31");
    expect(zurueck.endDatum).toBe("2026-09-15");
  });

  it("erhält die Ankreuz-Felder PLULINE und WKZ", () => {
    const [an] = rundlauf([k({ pluline: true, wkz: true })]);
    expect(an.pluline).toBe(true);
    expect(an.wkz).toBe(true);
    const [aus] = rundlauf([k({ pluline: false, wkz: false })]);
    expect(aus.pluline).toBe(false);
    expect(aus.wkz).toBe(false);
  });

  it("erhält die Sparten als Liste", () => {
    const [zurueck] = rundlauf([k({ bereiche: ["Brand", "MIZ"] })]);
    expect(zurueck.bereiche).toEqual(["Brand", "MIZ"]);
    const [leer] = rundlauf([k({ bereiche: [] })]);
    expect(leer.bereiche).toEqual([]);
  });

  it("erhält jeden Status über den deutschen Beschriftungstext", () => {
    // Exportiert wird die Beschriftung („In Arbeit"), importiert der interne
    // Wert – ein Bruch dieser Zuordnung würde alles auf „geplant" zurücksetzen.
    for (const status of ["geplant", "in_arbeit", "erledigt", "abgesagt", "storniert"] as const) {
      const [zurueck] = rundlauf([k({ status })]);
      expect(zurueck.status, `Status ${status}`).toBe(status);
    }
  });

  it("leitet die Verantwortlichen aus dem Freitext ab", () => {
    const [zurueck] = rundlauf([k({ verantwortung: "Valeska / David", owners: [] })]);
    expect(zurueck.verantwortung).toBe("Valeska / David");
    expect(zurueck.owners).toEqual(["Valeska", "David"]);
  });

  it("überspringt Zeilen ohne Details und Kanal", () => {
    const zurueck = rundlauf([k({ details: "", kanal: "" }), k({ details: "Echt", kanal: "PR" })]);
    expect(zurueck).toHaveLength(1);
    expect(zurueck[0].details).toBe("Echt");
  });

  it("setzt fehlende Zielgruppe auf „Alle“ und fehlendes Land auf DE", () => {
    const [zurueck] = rundlauf([k({ zielgruppe: "", land: "" })]);
    expect(zurueck.zielgruppe).toBe("Alle");
    expect(zurueck.land).toBe("DE");
  });

  it("liefert eine leere Liste bei einer Mappe ohne Einträge", () => {
    expect(rundlauf([])).toEqual([]);
  });
});
