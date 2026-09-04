import { describe, it, expect } from "vitest";
import {
  cutoffVorletzteWoche,
  kwAusDatum,
  quartalAusDatum,
  wochenStart,
  formatDatum,
  kwsImZeitraum,
  wochentagKurz,
} from "./date";

describe("kwAusDatum", () => {
  it("liefert die ISO-Kalenderwoche", () => {
    expect(kwAusDatum("2026-01-01")).toBe(1);
    expect(kwAusDatum("2026-09-04")).toBe(36);
    expect(kwAusDatum("2026-12-31")).toBe(53);
  });

  it("liefert null ohne Datum", () => {
    expect(kwAusDatum(null)).toBeNull();
    expect(kwAusDatum("")).toBeNull();
  });
});

describe("quartalAusDatum", () => {
  it("ordnet die Monate den Quartalen zu", () => {
    expect(quartalAusDatum("2026-01-15")).toBe("Q1");
    expect(quartalAusDatum("2026-03-31")).toBe("Q1");
    expect(quartalAusDatum("2026-04-01")).toBe("Q2");
    expect(quartalAusDatum("2026-07-01")).toBe("Q3");
    expect(quartalAusDatum("2026-10-01")).toBe("Q4");
    expect(quartalAusDatum("2026-12-31")).toBe("Q4");
  });

  it("liefert null ohne Datum", () => {
    expect(quartalAusDatum(null)).toBeNull();
  });
});

describe("wochenStart", () => {
  it("gibt den Montag der Woche zurück", () => {
    // 04.09.2026 ist ein Freitag
    expect(wochenStart("2026-09-04")).toBe("2026-08-31");
    // Ein Montag bleibt unverändert
    expect(wochenStart("2026-08-31")).toBe("2026-08-31");
    // Sonntag gehört noch zur Vorwoche (ISO)
    expect(wochenStart("2026-09-06")).toBe("2026-08-31");
  });
});

describe("cutoffVorletzteWoche", () => {
  it("liefert den Montag der Vorwoche", () => {
    // Bezugstag Freitag 04.09.2026 -> Montag dieser Woche ist der 31.08.,
    // eine Woche davor der 24.08.
    expect(cutoffVorletzteWoche(new Date("2026-09-04T12:00:00Z"))).toBe("2026-08-24");
  });
});

describe("formatDatum", () => {
  it("formatiert deutsch", () => {
    expect(formatDatum("2026-09-04")).toBe("04.09.2026");
  });

  it("zeigt einen Strich ohne Datum", () => {
    expect(formatDatum(null)).toBe("—");
  });
});

describe("kwsImZeitraum", () => {
  it("liefert nur die Startwoche ohne Enddatum", () => {
    expect(kwsImZeitraum("2026-09-04", null)).toEqual([36]);
  });

  it("liefert alle berührten Wochen", () => {
    expect(kwsImZeitraum("2026-09-04", "2026-09-20")).toEqual([36, 37, 38]);
  });

  it("liefert eine leere Liste ohne Start", () => {
    expect(kwsImZeitraum(null, "2026-09-20")).toEqual([]);
  });

  it("bricht bei unsinnig großen Zeiträumen ab (Sicherheitslimit)", () => {
    expect(kwsImZeitraum("2020-01-01", "2030-01-01")).toHaveLength(60);
  });
});

describe("wochentagKurz", () => {
  it("liefert den deutschen Kurz-Wochentag", () => {
    expect(wochentagKurz("2026-09-04")).toBe("Fr");
    expect(wochentagKurz("2026-08-31")).toBe("Mo");
  });

  it("liefert einen leeren String ohne Datum", () => {
    expect(wochentagKurz(null)).toBe("");
  });
});
