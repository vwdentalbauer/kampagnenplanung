import { describe, it, expect } from "vitest";
import type { Kampagne } from "../types";
import {
  bandPosition,
  kanalFarben,
  kopfgruppen,
  monateImZeitraum,
  spalteImBand,
  spaltenImZeitraum,
  spaltenKey,
  roadmapZeitraum,
  vereinige,
  wochenImZeitraum,
  zuordnen,
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

describe("vereinige", () => {
  it("spannt die Achse über mehrere Kampagnen", () => {
    expect(
      vereinige([
        { von: "2026-05-18", bis: "2026-07-19" },
        { von: "2026-03-02", bis: "2026-04-10" },
      ]),
    ).toEqual({ von: "2026-03-02", bis: "2026-07-19" });
  });

  it("übergeht Kampagnen ohne Termine", () => {
    expect(vereinige([null, { von: "2026-05-18", bis: "2026-06-01" }, null])).toEqual({
      von: "2026-05-18",
      bis: "2026-06-01",
    });
  });

  it("liefert nichts, wenn keine Kampagne Termine hat", () => {
    expect(vereinige([null, null])).toBeNull();
    expect(vereinige([])).toBeNull();
  });
});

describe("wochenImZeitraum", () => {
  it("liefert die Wochen des Vorbilds (KW 21 bis 29)", () => {
    const wochen = wochenImZeitraum("2026-05-18", "2026-07-19");
    expect(wochen.map((w) => w.titel)).toEqual([
      "KW 21",
      "KW 22",
      "KW 23",
      "KW 24",
      "KW 25",
      "KW 26",
      "KW 27",
      "KW 28",
      "KW 29",
    ]);
    expect(wochen[0]).toEqual({
      key: "2026-05-18",
      titel: "KW 21",
      unter: "18.05.–24.05.",
      start: "2026-05-18",
      ende: "2026-05-24",
    });
  });

  it("beginnt immer beim Montag der ersten Woche", () => {
    expect(wochenImZeitraum("2026-05-21", "2026-05-21")[0].start).toBe("2026-05-18");
  });

  it("liefert genau eine Woche, wenn Anfang und Ende in derselben liegen", () => {
    expect(wochenImZeitraum("2026-06-02", "2026-06-04")).toHaveLength(1);
  });

  it("zählt über den Jahreswechsel korrekt weiter", () => {
    const wochen = wochenImZeitraum("2026-12-21", "2027-01-10");
    expect(wochen.map((w) => w.titel)).toEqual(["KW 52", "KW 53", "KW 1"]);
  });

  it("begrenzt unsinnig große Zeiträume", () => {
    expect(wochenImZeitraum("2020-01-01", "2030-01-01")).toHaveLength(80);
  });
});

describe("monateImZeitraum", () => {
  it("liefert je Monat eine Spalte", () => {
    const monate = monateImZeitraum("2026-05-18", "2026-07-19");
    expect(monate.map((m) => m.titel)).toEqual(["Mai", "Juni", "Juli"]);
    expect(monate[0]).toEqual({
      key: "2026-05",
      titel: "Mai",
      unter: "2026",
      start: "2026-05-01",
      ende: "2026-05-31",
    });
  });

  it("beginnt immer am Monatsersten und endet am Monatsletzten", () => {
    const [februar] = monateImZeitraum("2028-02-10", "2028-02-20");
    // 2028 ist ein Schaltjahr.
    expect(februar.start).toBe("2028-02-01");
    expect(februar.ende).toBe("2028-02-29");
  });

  it("läuft über den Jahreswechsel", () => {
    const monate = monateImZeitraum("2026-11-15", "2027-01-05");
    expect(monate.map((m) => `${m.titel} ${m.unter}`)).toEqual([
      "November 2026",
      "Dezember 2026",
      "Januar 2027",
    ]);
  });

  it("begrenzt unsinnig große Zeiträume", () => {
    expect(monateImZeitraum("2020-01-01", "2030-01-01")).toHaveLength(36);
  });
});

describe("spaltenImZeitraum", () => {
  it("wählt das angeforderte Raster", () => {
    expect(spaltenImZeitraum("woche", "2026-05-18", "2026-06-14")).toHaveLength(4);
    expect(spaltenImZeitraum("monat", "2026-05-18", "2026-06-14")).toHaveLength(2);
  });

  it("verdichtet ein ganzes Jahr auf zwölf Spalten", () => {
    // Genau der Fall, der im Wochenraster unübersichtlich wird.
    expect(spaltenImZeitraum("monat", "2026-01-01", "2026-12-31")).toHaveLength(12);
    expect(spaltenImZeitraum("woche", "2026-01-01", "2026-12-31").length).toBeGreaterThan(50);
  });
});

describe("kopfgruppen", () => {
  it("fasst Wochenspalten zu Monaten zusammen", () => {
    const wochen = wochenImZeitraum("2026-05-18", "2026-07-19");
    expect(kopfgruppen("woche", wochen)).toEqual([
      { key: "2026-05", name: "Mai 2026", spalten: 2 },
      // KW 27 beginnt am 29.06. und zählt damit noch zum Juni.
      { key: "2026-06", name: "Juni 2026", spalten: 5 },
      { key: "2026-07", name: "Juli 2026", spalten: 2 },
    ]);
  });

  it("fasst Monatsspalten zu Jahren zusammen", () => {
    const monate = monateImZeitraum("2026-11-15", "2027-02-05");
    expect(kopfgruppen("monat", monate)).toEqual([
      { key: "2026", name: "2026", spalten: 2 },
      { key: "2027", name: "2027", spalten: 2 },
    ]);
  });

  it("deckt zusammen genau alle Spalten ab", () => {
    for (const raster of ["woche", "monat"] as const) {
      const sp = spaltenImZeitraum(raster, "2026-01-01", "2026-12-31");
      const summe = kopfgruppen(raster, sp).reduce((n, g) => n + g.spalten, 0);
      expect(summe, raster).toBe(sp.length);
    }
  });

  it("liefert nichts bei leerem Raster", () => {
    expect(kopfgruppen("woche", [])).toEqual([]);
  });
});

describe("spalteImBand", () => {
  const wochen = wochenImZeitraum("2026-05-18", "2026-07-19");
  const band = { von: "2026-06-25", bis: "2026-07-19" };

  it("markiert die Spalten des Gesamtzeitraums", () => {
    // KW 26 reicht vom 22.06. bis 28.06. – überschneidet sich.
    expect(spalteImBand(wochen.find((w) => w.titel === "KW 26")!, band)).toBe(true);
    expect(spalteImBand(wochen.find((w) => w.titel === "KW 29")!, band)).toBe(true);
  });

  it("lässt Spalten davor und danach frei", () => {
    expect(spalteImBand(wochen.find((w) => w.titel === "KW 25")!, band)).toBe(false);
    expect(spalteImBand(wochen.find((w) => w.titel === "KW 21")!, band)).toBe(false);
  });

  it("funktioniert auch bei Monatsspalten", () => {
    const monate = monateImZeitraum("2026-05-01", "2026-08-31");
    expect(spalteImBand(monate[0], band)).toBe(false); // Mai
    expect(spalteImBand(monate[1], band)).toBe(true); // Juni
    expect(spalteImBand(monate[3], band)).toBe(false); // August
  });

  it("markiert nichts ohne Zeitraum", () => {
    expect(spalteImBand(wochen[0], null)).toBe(false);
  });
});

describe("bandPosition", () => {
  const wochen = wochenImZeitraum("2026-05-18", "2026-07-19");

  it("setzt den Balken auf den richtigen Ausschnitt", () => {
    const pos = bandPosition({ von: "2026-06-25", bis: "2026-07-19" }, wochen)!;
    // 9 Wochen; Start am 25.06. liegt 3 Tage in Spalte 6 (Index 5).
    expect(pos.links).toBeCloseTo(((5 + 3 / 7) / 9) * 100, 5);
    expect(pos.breite).toBeCloseTo(((9 - (5 + 3 / 7)) / 9) * 100, 5);
  });

  it("rechnet bei Monatsspalten in Spaltenanteilen, nicht in Tagen", () => {
    // Monate sind unterschiedlich lang, die Spalten aber gleich breit.
    // Ein ganzer Monat muss deshalb genau eine Spaltenbreite einnehmen.
    const monate = monateImZeitraum("2026-01-01", "2026-04-30");
    const pos = bandPosition({ von: "2026-02-01", bis: "2026-02-28" }, monate)!;
    expect(pos.links).toBeCloseTo(25, 5);
    expect(pos.breite).toBeCloseTo(25, 5);
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

describe("spaltenKey", () => {
  it("bildet ein Datum auf die passende Spalte ab", () => {
    // Mittwoch -> Montag derselben Woche.
    expect(spaltenKey("woche", "2026-06-03")).toBe("2026-06-01");
    expect(spaltenKey("monat", "2026-06-03")).toBe("2026-06");
  });
});

describe("zuordnen", () => {
  const wochen = wochenImZeitraum("2026-05-18", "2026-06-14");

  it("sortiert die Maßnahmen nach Kanal und Spalte", () => {
    const raster = zuordnen(
      [
        k({ id: "a", kanal: "Social Media", weekStart: "2026-06-01" }),
        k({ id: "b", kanal: "Social Media", weekStart: "2026-06-01" }),
        k({ id: "c", kanal: "Newsletter", weekStart: "2026-06-01" }),
        k({ id: "d", kanal: "Social Media", weekStart: "2026-05-18" }),
      ],
      "woche",
      wochen,
    );
    expect(raster.get("Social Media")!.get("2026-06-01")).toHaveLength(2);
    expect(raster.get("Social Media")!.get("2026-05-18")).toHaveLength(1);
    expect(raster.get("Newsletter")!.get("2026-06-01")).toHaveLength(1);
  });

  it("ordnet über den Wochen-Montag zu, nicht über ein Datum mitten in der Woche", () => {
    const raster = zuordnen([k({ weekStart: "2026-06-03" })], "woche", wochen);
    expect(raster.get("Social Media")!.get("2026-06-01")).toHaveLength(1);
  });

  it("bündelt im Monatsraster die Wochen eines Monats", () => {
    const monate = monateImZeitraum("2026-05-01", "2026-06-30");
    const raster = zuordnen(
      [
        k({ id: "a", weekStart: "2026-06-01" }),
        k({ id: "b", weekStart: "2026-06-08" }),
        k({ id: "c", weekStart: "2026-05-18" }),
      ],
      "monat",
      monate,
    );
    expect(raster.get("Social Media")!.get("2026-06")).toHaveLength(2);
    expect(raster.get("Social Media")!.get("2026-05")).toHaveLength(1);
  });

  it("fasst Maßnahmen ohne Kanal zusammen", () => {
    const raster = zuordnen([k({ kanal: "  " })], "woche", wochen);
    expect(raster.get("Ohne Kanal")!.get("2026-05-18")).toHaveLength(1);
  });

  it("lässt Maßnahmen außerhalb des Rasters weg", () => {
    const raster = zuordnen(
      [k({ weekStart: "2027-01-04" }), k({ weekStart: null })],
      "woche",
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
    expect(kanalFarben(["PR", "PR", "Newsletter"]).size).toBe(2);
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
