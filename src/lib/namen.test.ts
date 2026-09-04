import { describe, it, expect } from "vitest";
import { anzeigeNamen } from "./namen";

describe("anzeigeNamen", () => {
  it("zeigt bei eindeutigen Vornamen nur den Vornamen", () => {
    const namen = anzeigeNamen([
      { id: "1", name: "Valeska Wiedemann" },
      { id: "2", name: "David Schmidt" },
    ]);
    expect(namen.map((n) => n.anzeige)).toEqual(["Valeska", "David"]);
  });

  it("hängt bei gleichem Vornamen den Initial des nächsten Namensteils an", () => {
    const namen = anzeigeNamen([
      { id: "1", name: "Nina Ehlers" },
      { id: "2", name: "Nina Rechmann" },
    ]);
    expect(namen.map((n) => n.anzeige)).toEqual(["Nina E.", "Nina R."]);
  });

  it("unterscheidet Vornamen unabhängig von Groß-/Kleinschreibung", () => {
    const namen = anzeigeNamen([
      { id: "1", name: "nina Ehlers" },
      { id: "2", name: "Nina Rechmann" },
    ]);
    expect(namen.map((n) => n.anzeige)).toEqual(["nina E.", "Nina R."]);
  });

  it("kommt mit einteiligen Namen zurecht", () => {
    const namen = anzeigeNamen([
      { id: "1", name: "Nina" },
      { id: "2", name: "Nina Rechmann" },
    ]);
    // Ohne zweiten Namensteil bleibt es beim reinen Vornamen.
    expect(namen.map((n) => n.anzeige)).toEqual(["Nina", "Nina R."]);
  });

  it("behält id und vollständigen Namen bei", () => {
    const namen = anzeigeNamen([{ id: "abc", name: "Valeska Wiedemann" }]);
    expect(namen[0]).toEqual({ id: "abc", name: "Valeska Wiedemann", anzeige: "Valeska" });
  });

  it("liefert bei leerer Eingabe eine leere Liste", () => {
    expect(anzeigeNamen([])).toEqual([]);
  });
});
