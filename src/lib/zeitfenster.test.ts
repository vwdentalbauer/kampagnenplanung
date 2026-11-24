import { describe, it, expect } from "vitest";
import { LEERER_FILTER, type Filter } from "./filter";
import { begrenzeAuf, bezugsJahrAus, filterZeitraum } from "./zeitfenster";

const f = (ueberschreiben: Partial<Filter> = {}): Filter => ({
  ...LEERER_FILTER,
  ...ueberschreiben,
});

describe("filterZeitraum", () => {
  it("liefert nichts, wenn kein Zeitraum eingegrenzt ist", () => {
    expect(filterZeitraum(f(), 2026)).toBeNull();
  });

  it("macht aus Kalenderwochen einen Zeitraum", () => {
    // Der Fall aus dem Gespräch: „Q4 zeigen heißt KW 40 bis 53".
    const z = filterZeitraum(f({ kwVon: "40", kwBis: "53" }), 2026)!;
    expect(z.von).toBe("2026-09-28"); // Montag der KW 40
    expect(z.bis).toBe("2027-01-03"); // Sonntag der KW 53
  });

  it("versteht eine offene KW-Angabe", () => {
    const abKw40 = filterZeitraum(f({ kwVon: "40" }), 2026)!;
    expect(abKw40.von).toBe("2026-09-28");
    expect(abKw40.bis).toBe("2026-12-31");

    const bisKw10 = filterZeitraum(f({ kwBis: "10" }), 2026)!;
    expect(bisKw10.von).toBe("2026-01-01");
    expect(bisKw10.bis).toBe("2026-03-08");
  });

  it("macht aus Quartalen einen Zeitraum", () => {
    expect(filterZeitraum(f({ quartale: ["Q4"] }), 2026)).toEqual({
      von: "2026-10-01",
      bis: "2026-12-31",
    });
    // Mehrere Quartale spannen von der frühesten bis zur spätesten Grenze.
    expect(filterZeitraum(f({ quartale: ["Q2", "Q4"] }), 2026)).toEqual({
      von: "2026-04-01",
      bis: "2026-12-31",
    });
  });

  it("macht aus Jahren einen Zeitraum", () => {
    expect(filterZeitraum(f({ jahre: ["2026"] }), 2026)).toEqual({
      von: "2026-01-01",
      bis: "2026-12-31",
    });
    expect(filterZeitraum(f({ jahre: ["2026", "2027"] }), 2026)).toEqual({
      von: "2026-01-01",
      bis: "2027-12-31",
    });
  });

  it("nimmt konkrete Datumsangaben unverändert", () => {
    expect(filterZeitraum(f({ datumVon: "2026-03-15", datumBis: "2026-04-20" }), 2026)).toEqual({
      von: "2026-03-15",
      bis: "2026-04-20",
    });
  });

  it("bildet die Schnittmenge mehrerer Angaben", () => {
    // Jahr 2026 und Q4 -> nur das vierte Quartal 2026.
    expect(filterZeitraum(f({ jahre: ["2026"], quartale: ["Q4"] }), 2020)).toEqual({
      von: "2026-10-01",
      bis: "2026-12-31",
    });
    // Q4 zusätzlich auf einen Datumsbereich eingeengt.
    expect(
      filterZeitraum(f({ quartale: ["Q4"], datumVon: "2026-11-01", datumBis: "2026-11-30" }), 2026),
    ).toEqual({ von: "2026-11-01", bis: "2026-11-30" });
  });

  it("bezieht Quartal und KW auf das gewählte Jahr, nicht auf das Bezugsjahr", () => {
    expect(filterZeitraum(f({ jahre: ["2027"], quartale: ["Q1"] }), 2026)).toEqual({
      von: "2027-01-01",
      bis: "2027-03-31",
    });
  });

  it("ignoriert widersprüchliche Eingaben statt ein leeres Raster zu erzeugen", () => {
    // „bis" liegt vor „von" – daraus lässt sich kein sinnvolles Fenster bauen.
    expect(filterZeitraum(f({ datumVon: "2026-06-01", datumBis: "2026-01-01" }), 2026)).toBeNull();
    // Q1 2026 und ein Datumsbereich im Dezember überlappen sich nicht.
    expect(
      filterZeitraum(f({ quartale: ["Q1"], datumVon: "2026-12-01", datumBis: "2026-12-31" }), 2026),
    ).toBeNull();
  });

  it("übergeht unsinnige Werte", () => {
    expect(filterZeitraum(f({ kwVon: "0" }), 2026)).toBeNull();
    expect(filterZeitraum(f({ kwVon: "99" }), 2026)).toBeNull();
    expect(filterZeitraum(f({ jahre: ["keine Zahl"] }), 2026)).toBeNull();
  });
});

describe("bezugsJahrAus", () => {
  it("nimmt das Jahr des frühesten Datums", () => {
    expect(bezugsJahrAus(["2027-03-01", "2026-05-18", null])).toBe(2026);
  });

  it("fällt ohne Daten auf das laufende Jahr zurück", () => {
    expect(bezugsJahrAus([null, null], new Date("2026-11-24T00:00:00Z"))).toBe(2026);
    expect(bezugsJahrAus([], new Date("2026-11-24T00:00:00Z"))).toBe(2026);
  });
});

describe("begrenzeAuf", () => {
  const daten = { von: "2026-05-18", bis: "2026-12-20" };

  it("schneidet den Datenzeitraum auf das Fenster zu", () => {
    expect(begrenzeAuf(daten, { von: "2026-09-28", bis: "2026-11-01" })).toEqual({
      von: "2026-09-28",
      bis: "2026-11-01",
    });
  });

  it("lässt den Zeitraum ohne Fenster unverändert", () => {
    expect(begrenzeAuf(daten, null)).toEqual(daten);
  });

  it("liefert das Fenster, wenn keine Daten da sind", () => {
    const fenster = { von: "2026-01-01", bis: "2026-03-31" };
    expect(begrenzeAuf(null, fenster)).toEqual(fenster);
  });

  it("liefert nichts, wenn sich beide nicht überlappen", () => {
    expect(begrenzeAuf(daten, { von: "2025-01-01", bis: "2025-02-01" })).toBeNull();
  });
});
