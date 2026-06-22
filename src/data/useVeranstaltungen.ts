import { useState } from "react";

export interface EventMeta {
  typ: string;
  ort: string;
  start: string | null;
  ende: string | null;
}

export interface Veranstaltung extends EventMeta {
  kategorie: string;
}

const KEY = "kampagnen.veranstaltungen.v1";

function load(): Record<string, EventMeta> {
  try {
    return JSON.parse(localStorage.getItem(KEY) ?? "{}") as Record<string, EventMeta>;
  } catch {
    return {};
  }
}

/**
 * Verwaltet die Veranstaltungen (Events) als eigene Objekte.
 * Schlüssel = Kategorie/Name; Einträge verlinken darauf über `veranstaltung`.
 */
export function useVeranstaltungen() {
  const [events, setEvents] = useState<Record<string, EventMeta>>(load);

  const speichern = (v: Veranstaltung, vorherigeKategorie?: string) => {
    setEvents((prev) => {
      const next = { ...prev };
      // Umbenennung: alten Schlüssel entfernen.
      if (vorherigeKategorie && vorherigeKategorie !== v.kategorie) delete next[vorherigeKategorie];
      next[v.kategorie] = { typ: v.typ, ort: v.ort, start: v.start, ende: v.ende };
      localStorage.setItem(KEY, JSON.stringify(next));
      return next;
    });
  };

  const loeschen = (kategorie: string) => {
    setEvents((prev) => {
      const next = { ...prev };
      delete next[kategorie];
      localStorage.setItem(KEY, JSON.stringify(next));
      return next;
    });
  };

  return { events, speichern, loeschen };
}
