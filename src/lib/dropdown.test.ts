import { describe, it, expect } from "vitest";
import {
  ABSTAND,
  DROPDOWN_HOEHE,
  ankerSichtbar,
  dropdownPosition,
} from "./dropdown";

const FENSTER = 900;

/** Zelle an einer bestimmten Höhe im Fenster (Standardhöhe einer Tabellenzeile). */
function zelle(top: number, left = 320, hoehe = 28) {
  return { top, bottom: top + hoehe, left };
}

describe("dropdownPosition", () => {
  it("öffnet unterhalb der Zelle, wenn dort Platz ist", () => {
    const anker = zelle(100);
    expect(dropdownPosition(anker, FENSTER)).toEqual({
      top: anker.bottom + ABSTAND,
      left: anker.left,
    });
  });

  it("öffnet nach oben, wenn unten zu wenig Platz ist", () => {
    // Zelle weit unten: unterhalb bliebe nur ein schmaler Streifen.
    const anker = zelle(800);
    expect(dropdownPosition(anker, FENSTER)).toEqual({
      top: anker.top - ABSTAND - DROPDOWN_HOEHE,
      left: anker.left,
    });
  });

  it("bleibt unten, wenn oben ebenfalls kein Platz ist", () => {
    // Ganz oben und in einem niedrigen Fenster: nach oben ginge es nicht,
    // dort stünde die Liste außerhalb des Bildes.
    const anker = zelle(10);
    const pos = dropdownPosition(anker, 300);
    expect(pos.top).toBe(anker.bottom + ABSTAND);
  });

  it("übernimmt die linke Kante der Zelle", () => {
    expect(dropdownPosition(zelle(100, 512), FENSTER).left).toBe(512);
  });

  it("hält das Dropdown auch beim Aufklappen nach oben im Fenster", () => {
    const anker = zelle(800);
    const pos = dropdownPosition(anker, FENSTER);
    expect(pos.top).toBeGreaterThanOrEqual(0);
    expect(pos.top + DROPDOWN_HOEHE).toBeLessThanOrEqual(FENSTER);
  });
});

describe("ankerSichtbar", () => {
  it("erkennt eine sichtbare Zelle", () => {
    expect(ankerSichtbar(zelle(400), FENSTER)).toBe(true);
  });

  it("erkennt eine nach oben hinausgescrollte Zelle", () => {
    expect(ankerSichtbar({ top: -60, bottom: -32 }, FENSTER)).toBe(false);
  });

  it("erkennt eine nach unten hinausgescrollte Zelle", () => {
    expect(ankerSichtbar({ top: 960, bottom: 988 }, FENSTER)).toBe(false);
  });

  it("zählt eine nur teilweise sichtbare Zelle noch als sichtbar", () => {
    // Halb am oberen Rand …
    expect(ankerSichtbar({ top: -10, bottom: 18 }, FENSTER)).toBe(true);
    // … und halb am unteren.
    expect(ankerSichtbar({ top: 890, bottom: 918 }, FENSTER)).toBe(true);
  });
});
