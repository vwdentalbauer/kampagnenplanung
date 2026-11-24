import { describe, it, expect } from "vitest";
import type { Kampagne, Status } from "../types";
import { istAbgeschlossen } from "./kampagneGruppe";

/** Maßnahme mit Status; das Datum liegt bewusst in der Vergangenheit. */
function k(status: Status, weekStart = "2026-10-05"): Kampagne {
  return {
    id: `c-${status}-${weekStart}`,
    land: "DE",
    quartal: "Q4",
    kw: 41,
    weekStart,
    endDatum: null,
    zielgruppe: "",
    kanal: "PR",
    subKanal: "",
    kampagne: "Laufende Reaktivierungskampagne",
    details: "Maßnahme",
    ziel: "",
    kategorie: "",
    bereiche: [],
    pluline: false,
    wkz: false,
    veranstaltung: "",
    subEvent: "",
    verantwortung: "",
    owners: [],
    status,
  };
}

describe("istAbgeschlossen", () => {
  it("gilt erst, wenn jede Maßnahme erledigt oder storniert ist", () => {
    expect(istAbgeschlossen([k("erledigt"), k("storniert")])).toBe(true);
    expect(istAbgeschlossen([k("erledigt")])).toBe(true);
  });

  it("hält eine Kampagne mit Maßnahmen in Arbeit offen", () => {
    // Der gemeldete Fall: Start KW 40, Termine in der Vergangenheit, aber die
    // Arbeit läuft noch – die Kampagne muss unter „Laufend" sichtbar bleiben.
    expect(istAbgeschlossen([k("erledigt"), k("in_arbeit")])).toBe(false);
  });

  it("hält eine Kampagne mit geplanten Maßnahmen offen", () => {
    expect(istAbgeschlossen([k("erledigt"), k("geplant")])).toBe(false);
  });

  it("zählt On Hold nicht als abgeschlossen", () => {
    // Eine zurückgestellte Maßnahme ist nicht erledigt – sie kommt zurück.
    expect(istAbgeschlossen([k("abgesagt")])).toBe(false);
  });

  it("entscheidet unabhängig vom Datum", () => {
    const lange_her = [k("in_arbeit", "2020-01-06")];
    expect(istAbgeschlossen(lange_her)).toBe(false);
    const zukunft = [k("erledigt", "2030-01-07")];
    expect(istAbgeschlossen(zukunft)).toBe(true);
  });

  it("gilt bei einer Kampagne ohne Maßnahmen nicht als abgeschlossen", () => {
    expect(istAbgeschlossen([])).toBe(false);
  });
});
