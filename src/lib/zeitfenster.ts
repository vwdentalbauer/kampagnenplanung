import { endOfISOWeek, format, setISOWeek, startOfISOWeek } from "date-fns";
import type { Filter } from "./filter";
import type { Zeitraum } from "./roadmap";

/**
 * Macht aus der Zeitraum-Leiste (Jahr, Quartal, Kalenderwoche, Datum) einen
 * konkreten Zeitraum.
 *
 * Hintergrund: Die Roadmap leitete ihre Zeitachse bisher allein aus den
 * Maßnahmen und dem gepflegten Gesamtzeitraum ab. Wer oben „KW 40 bis 53"
 * einstellte, sah unten trotzdem ein breiteres Raster – der gepflegte
 * Zeitraum reichte darüber hinaus. Mit diesem Fenster zeigt die Roadmap
 * genau den Ausschnitt, den man oben gewählt hat.
 *
 * Sind mehrere Angaben gesetzt, gilt ihre Schnittmenge – genauso filtert
 * `passt()` die Einträge.
 */

const iso = (d: Date) => format(d, "yyyy-MM-dd");

/** Erster und letzter Tag eines Quartals („Q1"–„Q4") im angegebenen Jahr. */
function quartalsGrenzen(quartal: string, jahr: number): Zeitraum | null {
  const n = Number(quartal.replace(/\D/g, ""));
  if (!n || n < 1 || n > 4) return null;
  const ersterMonat = (n - 1) * 3;
  const von = new Date(jahr, ersterMonat, 1);
  const bis = new Date(jahr, ersterMonat + 3, 0); // Tag 0 = letzter des Vormonats
  return { von: iso(von), bis: iso(bis) };
}

/** Montag bzw. Sonntag einer Kalenderwoche im angegebenen Jahr. */
function wochenGrenze(kw: number, jahr: number, ende: boolean): string | null {
  if (!Number.isFinite(kw) || kw < 1 || kw > 53) return null;
  try {
    const d = setISOWeek(new Date(jahr, 5, 15), kw);
    return iso(ende ? endOfISOWeek(d) : startOfISOWeek(d));
  } catch {
    return null;
  }
}

/** Schnittmenge zweier Zeiträume; null, wenn sie sich nicht überlappen. */
function schnitt(a: Zeitraum | null, b: Zeitraum | null): Zeitraum | null {
  if (!a) return b;
  if (!b) return a;
  const von = a.von > b.von ? a.von : b.von;
  const bis = a.bis < b.bis ? a.bis : b.bis;
  return von <= bis ? { von, bis } : null;
}

/**
 * Zeitfenster der Zeitraum-Leiste. `bezugsJahr` wird für Quartal- und
 * KW-Angaben gebraucht, wenn kein Jahr gewählt ist – sinnvollerweise das
 * Jahr der angezeigten Daten.
 *
 * Rückgabe `null` heißt: kein Zeitraum eingegrenzt, die Ansicht richtet sich
 * weiter nach den Daten.
 */
export function filterZeitraum(filter: Filter, bezugsJahr: number): Zeitraum | null {
  let fenster: Zeitraum | null = null;

  // Jahr(e) – begrenzen zugleich den Bezug für Quartal und Kalenderwoche.
  const jahre = filter.jahre.map(Number).filter((j) => Number.isFinite(j) && j > 1900);
  if (jahre.length) {
    const von = Math.min(...jahre);
    const bis = Math.max(...jahre);
    fenster = schnitt(fenster, { von: `${von}-01-01`, bis: `${bis}-12-31` });
  }
  const jahr = jahre.length ? Math.min(...jahre) : bezugsJahr;

  // Quartale
  if (filter.quartale.length) {
    const grenzen = filter.quartale
      .map((q) => quartalsGrenzen(q, jahr))
      .filter((z): z is Zeitraum => !!z);
    if (grenzen.length) {
      fenster = schnitt(fenster, {
        von: grenzen.map((g) => g.von).sort()[0],
        bis: grenzen.map((g) => g.bis).sort().reverse()[0],
      });
    }
  }

  // Kalenderwochen – jede Seite für sich, damit auch „ab KW 40" funktioniert.
  const kwVon = filter.kwVon ? wochenGrenze(Number(filter.kwVon), jahr, false) : null;
  const kwBis = filter.kwBis ? wochenGrenze(Number(filter.kwBis), jahr, true) : null;
  if (kwVon || kwBis) {
    fenster = schnitt(fenster, {
      von: kwVon ?? fenster?.von ?? `${jahr}-01-01`,
      bis: kwBis ?? fenster?.bis ?? `${jahr}-12-31`,
    });
  }

  // Konkrete Daten haben Vorrang vor allem Abgeleiteten.
  if (filter.datumVon || filter.datumBis) {
    fenster = schnitt(fenster, {
      von: filter.datumVon || fenster?.von || `${jahr}-01-01`,
      bis: filter.datumBis || fenster?.bis || `${jahr}-12-31`,
    });
  }

  // Unsinnige Eingaben (z.B. „bis" vor „von") lieber ignorieren als ein
  // leeres Raster zeigen.
  if (fenster && fenster.von > fenster.bis) return null;
  return fenster;
}

/** Jahr, auf das sich KW- und Quartalsangaben beziehen sollen. */
export function bezugsJahrAus(daten: (string | null)[], heute = new Date()): number {
  const erstes = daten.filter((d): d is string => !!d).sort()[0];
  if (erstes) {
    const j = Number(erstes.slice(0, 4));
    if (Number.isFinite(j) && j > 1900) return j;
  }
  return heute.getFullYear();
}

/** Begrenzt einen Zeitraum auf ein Fenster; ohne Fenster bleibt er wie er ist. */
export function begrenzeAuf(zeitraum: Zeitraum | null, fenster: Zeitraum | null): Zeitraum | null {
  return schnitt(zeitraum, fenster);
}
