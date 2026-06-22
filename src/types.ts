// Zentrale Datentypen der Kampagnenplanung.
// Diese Typen bilden die Excel-Spalten ab – bereinigt und um einen
// echten Status erweitert (der in der Excel bisher fehlte).

export type Status = "geplant" | "in_arbeit" | "erledigt" | "abgesagt";

export type Rolle = "viewer" | "editor" | "admin";

/** Eine einzelne Kampagne / Maßnahme (= eine Zeile im Excel). */
export interface Kampagne {
  id: string;
  /** Quartal Q1–Q4 – wird aus weekStart abgeleitet, ist aber überschreibbar. */
  quartal: string;
  /** Kalenderwoche (1–53). */
  kw: number | null;
  /** Montag der Woche bzw. konkretes Startdatum (ISO yyyy-mm-dd). */
  weekStart: string | null;
  /** Optionales Enddatum für laufende Kampagnen (ISO). null = Einzeltermin. */
  endDatum: string | null;
  zielgruppe: string;
  kanal: string;
  /** Kurzer Kampagnen-Name/Titel (für die Übersicht). */
  kampagne: string;
  /** Ausführliche Beschreibung/Maßnahme (= Excel-Spalte M „Details"). */
  details: string;
  /** Übergeordnetes Ziel (für die Auswertung „nach Ziel“). */
  ziel: string;
  /** „db 4+1“-Kategorie: db Kampagnen / Hero Kampagne / Abverkauf / CI. */
  kategorie: string;
  /** Betroffene Marken/Bereiche (Brand, MIZ, EV, TS, Planung, Exi, DSO). */
  bereiche: string[];
  /** Verantwortung als Freitext (Originalwert aus Excel). */
  verantwortung: string;
  /** Verantwortliche als normalisierte Liste (aus verantwortung abgeleitet). */
  owners: string[];
  status: Status;
}

export interface Nutzer {
  email: string;
  name: string;
  rolle: Rolle;
}
