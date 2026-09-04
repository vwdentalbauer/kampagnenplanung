import { describe, it, expect } from "vitest";
import type { Kampagne } from "../types";
import {
  LEER,
  LEERER_FILTER,
  type Filter,
  passt,
  facette,
  gibtLeere,
  jahreUeberlappen,
  subKanalListe,
  aktiveAnzahl,
  aktiveAnzahlEvent,
  ohneEventFilter,
} from "./filter";

/** Baut eine Kampagne mit sinnvollen Grundwerten; nur Abweichungen angeben. */
function k(ueberschreiben: Partial<Kampagne> = {}): Kampagne {
  return {
    id: "k1",
    land: "DE",
    quartal: "Q3",
    kw: 36,
    weekStart: "2026-08-31",
    endDatum: null,
    zielgruppe: "",
    kanal: "PR",
    subKanal: "",
    kampagne: "Testkampagne",
    details: "",
    ziel: "",
    kategorie: "",
    bereiche: [],
    pluline: false,
    wkz: false,
    veranstaltung: "",
    subEvent: "",
    verantwortung: "",
    owners: [],
    status: "geplant",
    ...ueberschreiben,
  };
}

/** Filter mit nur den angegebenen Kriterien. */
function f(ueberschreiben: Partial<Filter> = {}): Filter {
  return { ...LEERER_FILTER, ...ueberschreiben };
}

describe("passt – leerer Filter", () => {
  it("lässt jeden Eintrag durch", () => {
    expect(passt(k(), f())).toBe(true);
    expect(passt(k({ kanal: "", kampagne: "", status: "abgesagt" }), f())).toBe(true);
  });
});

describe("passt – Suche", () => {
  it("durchsucht Kampagne, Details, Kanal und Verantwortung", () => {
    const eintrag = k({
      kampagne: "Frühjahrsaktion",
      details: "Mailing an Bestandskunden",
      kanal: "PR",
      verantwortung: "Valeska",
    });
    expect(passt(eintrag, f({ suche: "frühjahr" }))).toBe(true);
    expect(passt(eintrag, f({ suche: "bestandskunden" }))).toBe(true);
    expect(passt(eintrag, f({ suche: "pr" }))).toBe(true);
    expect(passt(eintrag, f({ suche: "valeska" }))).toBe(true);
    expect(passt(eintrag, f({ suche: "gibtesnicht" }))).toBe(false);
  });

  it("ignoriert Groß-/Kleinschreibung", () => {
    expect(passt(k({ kampagne: "Herbstmesse" }), f({ suche: "HERBST" }))).toBe(true);
  });
});

describe("passt – Auswahlfilter", () => {
  it("filtert nach Status und Quartal", () => {
    expect(passt(k({ status: "erledigt" }), f({ status: ["erledigt"] }))).toBe(true);
    expect(passt(k({ status: "geplant" }), f({ status: ["erledigt"] }))).toBe(false);
    expect(passt(k({ quartal: "Q3" }), f({ quartale: ["Q3", "Q4"] }))).toBe(true);
    expect(passt(k({ quartal: "Q1" }), f({ quartale: ["Q3"] }))).toBe(false);
  });

  it("findet über den LEER-Sentinel gezielt leere Felder", () => {
    expect(passt(k({ kanal: "" }), f({ kanaele: [LEER] }))).toBe(true);
    expect(passt(k({ kanal: "PR" }), f({ kanaele: [LEER] }))).toBe(false);
    expect(passt(k({ owners: [] }), f({ owners: [LEER] }))).toBe(true);
    expect(passt(k({ owners: ["Valeska"] }), f({ owners: [LEER] }))).toBe(false);
    expect(passt(k({ bereiche: [] }), f({ sparten: [LEER] }))).toBe(true);
  });

  it("trifft bei Mehrfachwerten, wenn mindestens einer passt", () => {
    expect(passt(k({ owners: ["David", "Valeska"] }), f({ owners: ["Valeska"] }))).toBe(true);
    expect(passt(k({ bereiche: ["Brand", "MIZ"] }), f({ sparten: ["MIZ"] }))).toBe(true);
    expect(passt(k({ subKanal: "LinkedIn / Instagram" }), f({ subKanaele: ["Instagram"] }))).toBe(
      true,
    );
  });

  it("filtert nach PLULINE und WKZ nur, wenn aktiviert", () => {
    expect(passt(k({ pluline: false }), f({ pluline: true }))).toBe(false);
    expect(passt(k({ pluline: true }), f({ pluline: true }))).toBe(true);
    expect(passt(k({ wkz: false }), f({ wkz: false }))).toBe(true);
  });
});

describe("passt – Zeitfilter", () => {
  it("berücksichtigt laufende Kampagnen über ihren gesamten Zeitraum", () => {
    // Start KW 30, Ende KW 40 – muss bei einem Filter „ab KW 36" sichtbar bleiben.
    const laufend = k({ kw: 30, weekStart: "2026-07-20", endDatum: "2026-10-02" });
    expect(passt(laufend, f({ kwVon: "36" }))).toBe(true);
    // Ohne Enddatum zählt nur die Startwoche.
    expect(passt(k({ kw: 30, weekStart: "2026-07-20" }), f({ kwVon: "36" }))).toBe(false);
  });

  it("grenzt über kwBis nach oben ab", () => {
    expect(passt(k({ kw: 36 }), f({ kwBis: "36" }))).toBe(true);
    expect(passt(k({ kw: 37 }), f({ kwBis: "36" }))).toBe(false);
  });

  it("filtert nach Datumsbereich", () => {
    const eintrag = k({ weekStart: "2026-08-31", endDatum: "2026-09-10" });
    expect(passt(eintrag, f({ datumVon: "2026-09-05" }))).toBe(true);
    expect(passt(eintrag, f({ datumVon: "2026-09-15" }))).toBe(false);
    expect(passt(eintrag, f({ datumBis: "2026-09-01" }))).toBe(true);
    expect(passt(eintrag, f({ datumBis: "2026-08-01" }))).toBe(false);
  });

  it("filtert nach Jahr", () => {
    expect(passt(k({ weekStart: "2026-08-31" }), f({ jahre: ["2026"] }))).toBe(true);
    expect(passt(k({ weekStart: "2026-08-31" }), f({ jahre: ["2025"] }))).toBe(false);
    // Jahresübergreifende Kampagne zählt in beiden Jahren.
    const uebergreifend = k({ weekStart: "2025-12-15", endDatum: "2026-01-15" });
    expect(passt(uebergreifend, f({ jahre: ["2025"] }))).toBe(true);
    expect(passt(uebergreifend, f({ jahre: ["2026"] }))).toBe(true);
  });
});

describe("passt – exclude (Facetten)", () => {
  it("lässt das ausgeschlossene Facet unberücksichtigt", () => {
    const eintrag = k({ kanal: "PR", status: "geplant" });
    // Ohne exclude greift der Kanal-Filter und schließt den Eintrag aus.
    expect(passt(eintrag, f({ kanaele: ["Social Media"] }))).toBe(false);
    // Mit exclude wird genau dieser Filter übersprungen.
    expect(passt(eintrag, f({ kanaele: ["Social Media"] }), "kanaele")).toBe(true);
    // Andere Filter greifen weiterhin.
    expect(
      passt(eintrag, f({ kanaele: ["Social Media"], status: ["erledigt"] }), "kanaele"),
    ).toBe(false);
  });
});

describe("jahreUeberlappen", () => {
  it("schränkt ohne Auswahl nicht ein", () => {
    expect(jahreUeberlappen(null, null, [])).toBe(true);
  });

  it("trifft ohne Startdatum nicht", () => {
    expect(jahreUeberlappen(null, null, ["2026"])).toBe(false);
  });
});

describe("subKanalListe", () => {
  it("trennt an Schrägstrich und Komma", () => {
    expect(subKanalListe("LinkedIn / Instagram")).toEqual(["LinkedIn", "Instagram"]);
    expect(subKanalListe("LinkedIn,Instagram")).toEqual(["LinkedIn", "Instagram"]);
  });

  it("liefert eine leere Liste bei leerem Text", () => {
    expect(subKanalListe("")).toEqual([]);
    expect(subKanalListe("  ")).toEqual([]);
  });
});

describe("facette", () => {
  const daten = [
    k({ id: "a", kanal: "PR", status: "geplant", quartal: "Q3" }),
    k({ id: "b", kanal: "Social Media", status: "erledigt", quartal: "Q4" }),
    k({ id: "c", kanal: "", status: "geplant", quartal: "Q3" }),
  ];

  it("liefert die vorhandenen Werte alphabetisch", () => {
    expect(facette(daten, f(), "kanaele")).toEqual(["PR", "Social Media"]);
  });

  it("hält den Status in der definierten Reihenfolge", () => {
    expect(facette(daten, f(), "status")).toEqual(["geplant", "erledigt"]);
  });

  it("berücksichtigt die übrigen Filter, nicht sich selbst", () => {
    // Der Kanal-Filter darf die Kanal-Auswahl nicht auf sich selbst reduzieren.
    expect(facette(daten, f({ kanaele: ["PR"] }), "kanaele")).toEqual(["PR", "Social Media"]);
    // Ein anderer Filter schränkt hingegen ein.
    expect(facette(daten, f({ status: ["erledigt"] }), "kanaele")).toEqual(["Social Media"]);
  });

  it("erkennt leere Werte", () => {
    expect(gibtLeere(daten, f(), "kanaele")).toBe(true);
    expect(gibtLeere(daten, f({ status: ["erledigt"] }), "kanaele")).toBe(false);
  });
});

describe("aktiveAnzahl", () => {
  it("zählt keine Kriterien beim leeren Filter", () => {
    expect(aktiveAnzahl(f())).toBe(0);
    expect(aktiveAnzahlEvent(f())).toBe(0);
  });

  it("zählt jedes gesetzte Kriterium einmal", () => {
    expect(aktiveAnzahl(f({ suche: "test", status: ["geplant"], pluline: true }))).toBe(3);
    // KW-Von und KW-Bis zählen zusammen als ein Kriterium.
    expect(aktiveAnzahl(f({ kwVon: "10", kwBis: "20" }))).toBe(1);
  });

  it("ignoriert reine Leerzeichen in der Suche", () => {
    expect(aktiveAnzahl(f({ suche: "   " }))).toBe(0);
  });
});

describe("ohneEventFilter", () => {
  it("setzt Event- und Zeitfilter zurück, behält Kampagnenfilter", () => {
    const voll = f({
      suche: "test",
      evKategorie: ["Messe"],
      evAngemeldet: true,
      jahre: ["2026"],
      kanaele: ["PR"],
      status: ["geplant"],
    });
    const bereinigt = ohneEventFilter(voll);
    expect(bereinigt.suche).toBe("");
    expect(bereinigt.evKategorie).toEqual([]);
    expect(bereinigt.evAngemeldet).toBe(false);
    expect(bereinigt.jahre).toEqual([]);
    // Kampagnenseitige Filter bleiben erhalten.
    expect(bereinigt.kanaele).toEqual(["PR"]);
    expect(bereinigt.status).toEqual(["geplant"]);
  });
});
