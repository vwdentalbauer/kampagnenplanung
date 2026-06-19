import { useCallback, useEffect, useState } from "react";
import type { Kampagne } from "../types";
import { repository } from "./repository";

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

  const zuruecksetzen = useCallback(async () => {
    setKampagnen(await repository.zuruecksetzen());
  }, []);

  return {
    kampagnen,
    geladen,
    speichern,
    speichernViele,
    loeschen,
    loeschenViele,
    zuruecksetzen,
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
