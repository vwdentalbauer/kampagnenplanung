/**
 * Anzeigenamen der Nutzer – reine Logik, bewusst ohne Supabase-Import.
 *
 * Liegt getrennt von `data/useNutzerListe.ts`, weil dort beim Laden des Moduls
 * der Supabase-Client erzeugt wird. So bleibt diese Logik überall nutzbar und
 * testbar, ohne eine Verbindung aufzubauen.
 */

export interface NutzerAnzeige {
  id: string;
  name: string;
  /** Anzeigename: Vorname, bei Gleichheit + Initial des nächsten Wortes. */
  anzeige: string;
}

const vorname = (n: string) => n.trim().split(/\s+/)[0] || n.trim();

const zweitInitial = (n: string) => {
  const teile = n.trim().split(/\s+/);
  return teile[1]?.[0] ?? "";
};

/**
 * Baut Anzeigenamen: immer der Vorname. Kommt ein Vorname mehrfach vor, wird
 * der Anfangsbuchstabe des nächsten Namensteils angehängt
 * (z.B. „Nina Ehlers" -> „Nina E.", „Nina Rechmann" -> „Nina R.").
 */
export function anzeigeNamen(nutzer: { id: string; name: string }[]): NutzerAnzeige[] {
  const anzahl = new Map<string, number>();
  nutzer.forEach((u) => {
    const v = vorname(u.name).toLowerCase();
    anzahl.set(v, (anzahl.get(v) ?? 0) + 1);
  });
  return nutzer.map((u) => {
    const v = vorname(u.name);
    const mehrfach = (anzahl.get(v.toLowerCase()) ?? 0) > 1;
    const initial = zweitInitial(u.name);
    const anzeige = mehrfach && initial ? `${v} ${initial.toUpperCase()}.` : v;
    return { id: u.id, name: u.name, anzeige };
  });
}
