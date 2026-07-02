import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";

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

/** Liste der aktiven Nutzer (aus der Nutzerverwaltung) mit Anzeigenamen. */
export function useNutzerListe(): NutzerAnzeige[] {
  const [liste, setListe] = useState<NutzerAnzeige[]>([]);

  useEffect(() => {
    if (!supabase) return;
    let aktiv = true;
    supabase
      .from("profile")
      .select("id, name, aktiv")
      .then(({ data }) => {
        if (!aktiv) return;
        const roh = (data ?? [])
          .filter((p) => p.aktiv && (p.name ?? "").trim())
          .map((p) => ({ id: p.id as string, name: p.name as string }));
        setListe(
          anzeigeNamen(roh).sort((a, b) => a.anzeige.localeCompare(b.anzeige, "de")),
        );
      });
    return () => {
      aktiv = false;
    };
  }, []);

  return liste;
}
