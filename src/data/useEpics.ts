import { useState } from "react";

export interface EpicMeta {
  start: string | null;
  ende: string | null;
}

const KEY = "kampagnen.epics.v1";

function load(): Record<string, EpicMeta> {
  try {
    return JSON.parse(localStorage.getItem(KEY) ?? "{}") as Record<string, EpicMeta>;
  } catch {
    return {};
  }
}

/**
 * Verwaltet den (optionalen) expliziten Gesamtzeitraum je Kampagne.
 * Schlüssel = Kampagnenname. Liegt getrennt von den Einträgen.
 */
export function useEpics() {
  const [epics, setEpics] = useState<Record<string, EpicMeta>>(load);

  const setZeitraum = (name: string, start: string | null, ende: string | null) => {
    setEpics((prev) => {
      const next = { ...prev, [name]: { start, ende } };
      localStorage.setItem(KEY, JSON.stringify(next));
      return next;
    });
  };

  return { epics, setZeitraum };
}
