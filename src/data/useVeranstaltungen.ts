import { useState } from "react";

export interface SubEvent {
  id: string;
  ort: string;
  start: string | null;
  ende: string | null;
}

export interface EventMeta {
  typ: string;
  subs: SubEvent[];
}

export interface Veranstaltung extends EventMeta {
  kategorie: string;
}

// Pro Land: { kategorie -> EventMeta }
type ProLand = Record<string, Record<string, EventMeta>>;

const KEY = "kampagnen.veranstaltungen.v3";
const ALT_V2 = "kampagnen.veranstaltungen.v2";
const ALT_V1 = "kampagnen.veranstaltungen.v1";

interface AltMeta {
  typ?: string;
  ort?: string;
  start?: string | null;
  ende?: string | null;
  subs?: SubEvent[];
}

function migriereFlach(roh: Record<string, AltMeta>): Record<string, EventMeta> {
  const out: Record<string, EventMeta> = {};
  for (const [kat, m] of Object.entries(roh)) {
    if (Array.isArray(m.subs)) {
      out[kat] = { typ: m.typ ?? "", subs: m.subs };
    } else {
      const sub: SubEvent[] =
        m.ort || m.start
          ? [{ id: `s${Date.now()}_${kat}`, ort: m.ort ?? "", start: m.start ?? null, ende: m.ende ?? null }]
          : [];
      out[kat] = { typ: m.typ ?? "", subs: sub };
    }
  }
  return out;
}

function load(): ProLand {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) return JSON.parse(raw) as ProLand;
    // Migration: bisherige (flache) Veranstaltungen gehören alle zu „DE".
    const v2 = localStorage.getItem(ALT_V2);
    const v1 = localStorage.getItem(ALT_V1);
    if (v2 || v1) {
      const flach = migriereFlach(JSON.parse((v2 ?? v1)!) as Record<string, AltMeta>);
      const proLand: ProLand = { DE: flach };
      localStorage.setItem(KEY, JSON.stringify(proLand));
      return proLand;
    }
    return {};
  } catch {
    return {};
  }
}

/**
 * Veranstaltungen je Mandant (Land). Schlüssel: land -> kategorie -> EventMeta.
 */
export function useVeranstaltungen() {
  const [alle, setAlle] = useState<ProLand>(load);

  const speichern = (land: string, v: Veranstaltung, vorherigeKategorie?: string) => {
    setAlle((prev) => {
      const landMap = { ...(prev[land] ?? {}) };
      if (vorherigeKategorie && vorherigeKategorie !== v.kategorie) delete landMap[vorherigeKategorie];
      landMap[v.kategorie] = { typ: v.typ, subs: v.subs };
      const next = { ...prev, [land]: landMap };
      localStorage.setItem(KEY, JSON.stringify(next));
      return next;
    });
  };

  const loeschen = (land: string, kategorie: string) => {
    setAlle((prev) => {
      const landMap = { ...(prev[land] ?? {}) };
      delete landMap[kategorie];
      const next = { ...prev, [land]: landMap };
      localStorage.setItem(KEY, JSON.stringify(next));
      return next;
    });
  };

  return { alle, speichern, loeschen };
}
