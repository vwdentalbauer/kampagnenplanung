import { useCallback, useEffect, useState } from "react";
import type { Kampagne } from "../types";
import { repository } from "./repository";
import { supabase } from "../lib/supabase";

export function useKampagnen() {
  const [kampagnen, setKampagnen] = useState<Kampagne[]>([]);
  const [geladen, setGeladen] = useState(false);

  const neuLaden = useCallback(async () => {
    setKampagnen(await repository.alle());
    setGeladen(true);
  }, []);

  useEffect(() => {
    neuLaden();
  }, [neuLaden]);

  // Live-Updates: Änderungen anderer Nutzer sofort übernehmen.
  useEffect(() => {
    const sb = supabase;
    if (!sb) return;
    const ch = sb
      .channel("kampagne-realtime")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "kampagne" },
        () => neuLaden(),
      )
      .subscribe();
    return () => {
      sb.removeChannel(ch);
    };
  }, [neuLaden]);

  const speichern = useCallback(
    async (k: Kampagne) => {
      await repository.speichern(k);
      await neuLaden();
    },
    [neuLaden],
  );

  const speichernViele = useCallback(
    async (ks: Kampagne[]) => {
      await repository.speichernViele(ks);
      await neuLaden();
    },
    [neuLaden],
  );

  const loeschen = useCallback(
    async (id: string) => {
      await repository.loeschen(id);
      await neuLaden();
    },
    [neuLaden],
  );

  const loeschenViele = useCallback(
    async (ids: string[]) => {
      await repository.loeschenViele(ids);
      await neuLaden();
    },
    [neuLaden],
  );

  const ersetzeAlle = useCallback(
    async (ks: Kampagne[]) => {
      setKampagnen(await repository.ersetzeAlle(ks));
    },
    [],
  );

  return {
    kampagnen,
    geladen,
    speichern,
    speichernViele,
    loeschen,
    loeschenViele,
    ersetzeAlle,
  };
}

/** Eindeutige, sortierte Werte einer Spalte – für Filter-Dropdowns. */
export function eindeutigeWerte(
  kampagnen: Kampagne[],
  feld: keyof Kampagne,
): string[] {
  const set = new Set<string>();
  for (const k of kampagnen) {
    const v = k[feld];
    if (typeof v === "string" && v.trim()) set.add(v.trim());
  }
  return [...set].sort((a, b) => a.localeCompare(b, "de"));
}
