import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";
import { anzeigeNamen, type NutzerAnzeige } from "../lib/namen";

// Anzeigenamen-Logik liegt in `lib/namen.ts` (ohne Supabase-Import, damit sie
// eigenständig testbar bleibt) und wird hier für bestehende Importe mit
// weitergereicht.
export { anzeigeNamen };
export type { NutzerAnzeige };

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
