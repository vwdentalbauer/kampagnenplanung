/**
 * Positionierung der Inline-Dropdowns in der Tabelle (Kanal, Sub-Kanal,
 * Verantwortung).
 *
 * Die Dropdowns liegen `fixed` über der Seite, damit das `overflow-hidden` der
 * Tabellenzelle sie nicht abschneidet. Dadurch wandern sie beim Scrollen aber
 * nicht von selbst mit – die Position muss nachgeführt werden. Diese Logik
 * liegt hier getrennt, damit sie ohne Browser testbar ist.
 */

/** Höhe des Dropdowns: max-h-64 (256px) plus je 4px Innenabstand. */
export const DROPDOWN_HOEHE = 264;

/** Abstand zwischen Zelle und Dropdown. */
export const ABSTAND = 4;

/**
 * Platz, der nach unten frei sein muss, damit dort geöffnet wird –
 * Dropdown-Höhe plus Abstand plus etwas Luft zum Fensterrand.
 */
const NOETIGER_PLATZ = DROPDOWN_HOEHE + ABSTAND + 12;

/** Der Teil eines DOMRect, den die Positionierung braucht. */
export interface AnkerRechteck {
  top: number;
  bottom: number;
  left: number;
}

export interface Position {
  top: number;
  left: number;
}

/**
 * Wohin gehört das Dropdown zur angeklickten Zelle?
 *
 * Standard ist unterhalb. Reicht der Platz dort nicht und oberhalb schon,
 * klappt es nach oben auf – sonst stünde die Liste halb außerhalb des Fensters
 * und die unteren Einträge wären nicht erreichbar.
 */
export function dropdownPosition(anker: AnkerRechteck, fensterHoehe: number): Position {
  const platzUnten = fensterHoehe - anker.bottom;
  const nachOben = platzUnten < NOETIGER_PLATZ && anker.top > NOETIGER_PLATZ;
  return {
    top: nachOben ? anker.top - ABSTAND - DROPDOWN_HOEHE : anker.bottom + ABSTAND,
    left: anker.left,
  };
}

/**
 * Ist die zugehörige Zelle noch im Fenster zu sehen?
 *
 * Scrollt sie hinaus, schwebte das Dropdown ohne erkennbaren Bezug im Bild –
 * dann wird es geschlossen statt weiter mitgeführt.
 */
export function ankerSichtbar(anker: Pick<AnkerRechteck, "top" | "bottom">, fensterHoehe: number): boolean {
  return anker.bottom > 0 && anker.top < fensterHoehe;
}
