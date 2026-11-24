import { describe, it, expect } from "vitest";
import type { Kampagne } from "../types";
import {
  bandPosition,
  kanalFarben,
  monateAusWochen,
  rasterDaten,
  roadmapZeitraum,
  wocheImBand,
  wochenImZeitraum,
} from "./roadmap";

function k(ueberschreiben: Partial<Kampagne> = {}): Kampagne {
  return {
    id: "c1",
    land: "DE",
    quartal: "Q2",
    kw: 21,
    weekStart: "2026-05-18",
    endDatum: null,
    zielgruppe: "",
    kanal: "Social Media",
    subKanal: "",
    kampagne: "WM-Tippspiel",
    details: "Story: Ankündigung",
    ziel: "",
    kategorie: "",
    bereiche: [],
    pluline: false,
    wkz: false,
    veranstaltung: "",
    subEvent: "",
    verantwortung: "Ivana",
    owners: ["Ivana"],
    status: "geplant",
    ...ueberschreiben,
  };
}

describe("roadmapZeitraum", () => {
  it("umfasst Maßnahmen und gepflegten Gesamtzeitraum", () => {
    // Wie im Vorbild: Aktivitäten laufen der eigentlichen Aktion voraus.
    const tasks = [k({ weekStart: "2026-05-18" }), k({ weekStart: "2026-06-01" })];
    expect(roadmapZeitraum(tasks, "2026-06-25", "2026-07-19")).toEqual({
      von: "2026-05-18",
      bis: "2026-07-19",
    });
  });

  it("berücksichtigt Enddaten einzelner Maßnahmen", () => {
    const tasks = [k({ weekStart: "2026-06-01", endDatum: "2026-08-15" })];
    expect(roadmapZeitraum(tasks, null, null)).toEqual({
      von: "2026-06-01",
      bis: "2026-08-15",
    });
  });

  it("kommt ohne jede Datumsangabe zurecht", () => {
    expect(roadmapZeitraum([k({ weekStart: null })], null, null)).toBeNull();
    expect(roadmapZeitraum([], null, null)).toBeNull();
  });

  it("funktioniert auch ganz ohne Maßnahmen", () => {
    expect(roadmapZeitraum([], "2026-06-25", "2026-07-19")).toEqual({
      von: "2026-06-25",
      bis: "2026-07-19",
    });
  });
});

describe("wochenImZeitraum", () => {
  it("liefert die Wochen des Vorbilds (KW 21 bis 29)", () => {
    const wochen = wochenImZeitraum("2026-05-18", "2026-07-19");
    expect(wochen.map((w) => w.kw)).toEqual([21, 22, 23, 24, 25, 26, 27, 28, 29]);
    expect(wochen[0]).toEqual({ kw: 21, start: "2026-05-18", ende: "2026-05-24" });
    expect(wochen[8]).toEqual({ kw: 29, start: "2026-07-13", ende: "2026-07-19" });
  });

  it("beginnt immer beim Montag der ersten Woche", () => {
    // Donnerstag als Start -> Raster beginnt trotzdem am Montag.
    expect(wochenImZeitraum("2026-05-21", "2026-05-21")[0].start).toBe("2026-05-18");
  });

  it("liefert genau eine Woche, wenn Anfang und Ende in derselben liegen", () => {
    expect(wochenImZeitraum("2026-06-02", "2026-06-04")).toHaveLength(1);
  });

  it("zählt über den Jahreswechsel korrekt weiter", () => {
    const wochen = wochenImZeitraum("2026-12-21", "2027-01-10");
    expect(wochen.map((w) => w.kw)).toEqual([52, 53, 1]);
  });

  it("begrenzt unsinnig große Zeiträume", () => {
    expect(wochenImZeitraum("2020-01-01", "2030-01-01")).toHaveLength(80);
  });
});

describe("monateAusWochen", () => {
  it("fasst die Wochen zu Monatsspalten zusammen", () => {
    const monate = monateAusWochen(wochenImZeitraum("2026-05-18", "2026-07-19"));
    expect(monate).toEqual([
      { key: "2026-05", name: "Mai 2026", wochen: 2 },
      // KW 27 beginnt am 29.06. und zählt damit noch zum Juni.
      { key: "2026-06", name: "Juni 2026", wochen: 5 },
      { key: "2026-07", name: "Juli 2026", wochen: 2 },
    ]);
  });

  it("ordnet eine Woche dem Monat ihres Montags zu", () => {
    // Woche vom 29.06. bis 05.07. gehört zum Juni.
    const monate = monateAusWochen(wochenImZeitraum("2026-06-29", "2026-07-05"));
    expect(monate).toEqual([{ key: "2026-06", name: "Juni 2026", wochen: 1 }]);
  });

  it("deckt zusammen genau alle Wochen ab", () => {
    const wochen = wochenImZeitraum("2026-01-01", "2026-12-31");
    const summe = monateAusWochen(wochen).reduce((n, m) => n + m.wochen, 0);
    expect(summe).toBe(wochen.length);
  });

  it("liefert nichts bei leerem Raster", () => {
    expect(monateAusWochen([])).toEqual([]);
  });
});

describe("wocheImBand", () => {
  const wochen = wochenImZeitraum("2026-05-18", "2026-07-19");
  const band = { von: "2026-06-25", bis: "2026-07-19" };

  it("markiert die Wochen des Gesamtzeitraums", () => {
    // KW 26 beginnt am 22.06. und reicht bis 28.06. – überschneidet sich.
    expect(wocheImBand(wochen.find((w) => w.kw === 26)!, band)).toBe(true);
    expect(wocheImBand(wochen.find((w) => w.kw === 29)!, band)).toBe(true);
  });

  it("lässt Wochen davor und danach frei", () => {
    expect(wocheImBand(wochen.find((w) => w.kw === 25)!, band)).toBe(false);
    expect(wocheImBand(wochen.find((w) => w.kw === 21)!, band)).toBe(false);
  });

  it("markiert nichts ohne Zeitraum", () => {
    expect(wocheImBand(wochen[0], null)).toBe(false);
  });
});

describe("bandPosition", () => {
  const wochen = wochenImZeitraum("2026-05-18", "2026-07-19");

  it("setzt den Balken auf den richtigen Ausschnitt", () => {
    const pos = bandPosition({ von: "2026-06-25", bis: "2026-07-19" }, wochen)!;
    // 9 Wochen = 63 Tage; Start am 25.06. ist Tag 38, Ende 19.07. ist Tag 63.
    expect(pos.links).toBeCloseTo((38 / 63) * 100, 5);
    expect(pos.breite).toBeCloseTo((25 / 63) * 100, 5);
  });

  it("bleibt innerhalb des Rasters", () => {
    const pos = bandPosition({ von: "2020-01-01", bis: "2030-01-01" }, wochen)!;
    expect(pos.links).toBe(0);
    expect(pos.breite).toBe(100);
  });

  it("liefert nichts, wenn der Zeitraum außerhalb liegt", () => {
    expect(bandPosition({ von: "2025-01-01", bis: "2025-02-01" }, wochen)).toBeNull();
  });

  it("liefert nichts ohne Zeitraum oder ohne Raster", () => {
    expect(bandPosition(null, wochen)).toBeNull();
    expect(bandPosition({ von: "2026-06-25", bis: "2026-07-19" }, [])).toBeNull();
  });
});

describe("rasterDaten", () => {
  const wochen = wochenImZeitraum("2026-05-18", "2026-06-14");

  it("sortiert die Maßnahmen nach Kanal und Woche", () => {
    const raster = rasterDaten(
      [
        k({ id: "a", kanal: "Social Media", weekStart: "2026-06-01" }),
        k({ id: "b", kanal: "Social Media", weekStart: "2026-06-01" }),
        k({ id: "c", kanal: "Newsletter", weekStart: "2026-06-01" }),
        k({ id: "d", kanal: "Social Media", weekStart: "2026-05-18" }),
      ],
      wochen,
    );
    expect(raster.get("Social Media")!.get("2026-06-01")).toHaveLength(2);
    expect(raster.get("Social Media")!.get("2026-05-18")).toHaveLength(1);
    expect(raster.get("Newsletter")!.get("2026-06-01")).toHaveLength(1);
  });

  it("ordnet über den Wochen-Montag zu, nicht über ein Datum mitten in der Woche", () => {
    const raster = rasterDaten([k({ weekStart: "2026-06-03" })], wochen);
    expect(raster.get("Social Media")!.get("2026-06-01")).toHaveLength(1);
  });

  it("fasst Maßnahmen ohne Kanal zusammen", () => {
    const raster = rasterDaten([k({ kanal: "  " })], wochen);
    expect(raster.get("Ohne Kanal")!.get("2026-05-18")).toHaveLength(1);
  });

  it("lässt Maßnahmen außerhalb des Rasters weg", () => {
    const raster = rasterDaten(
      [k({ weekStart: "2027-01-04" }), k({ weekStart: null })],
      wochen,
    );
    expect(raster.size).toBe(0);
  });
});

describe("kanalFarben", () => {
  it("gibt jedem Kanal eine eigene Farbe", () => {
    const farben = kanalFarben(["Social Media", "Newsletter", "PR", "Printanzeige"]);
    expect(new Set(farben.values()).size).toBe(4);
  });

  it("ist von der Reihenfolge der Eingabe unabhängig", () => {
    const a = kanalFarben(["Newsletter", "PR", "Social Media"]);
    const b = kanalFarben(["Social Media", "Newsletter", "PR"]);
    expect([...a.entries()].sort()).toEqual([...b.entries()].sort());
  });

  it("zählt doppelte Kanäle nur einmal", () => {
    const farben = kanalFarben(["PR", "PR", "Newsletter"]);
    expect(farben.size).toBe(2);
  });

  it("liefert gültige Farbwerte, auch bei leerem Namen", () => {
    for (const farbe of kanalFarben(["", "PR"]).values()) {
      expect(farbe).toMatch(/^#[0-9a-f]{6}$/);
    }
  });

  it("wiederholt die Palette bei sehr vielen Kanälen, ohne Lücken", () => {
    const viele = Array.from({ length: 14 }, (_, i) => `Kanal ${String(i).padStart(2, "0")}`);
    const farben = kanalFarben(viele);
    expect(farben.size).toBe(14);
    expect([...farben.values()].every((f) => /^#[0-9a-f]{6}$/.test(f))).toBe(true);
  });
});
