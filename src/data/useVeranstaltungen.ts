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

const KEY = "kampagnen.veranstaltungen.v2";
const ALT_KEY = "kampagnen.veranstaltungen.v1";

interface AltMeta {
  typ?: string;
  ort?: string;
  start?: string | null;
  ende?: string | null;
  subs?: SubEvent[];
}

function migriere(roh: Record<string, AltMeta>): Record<string, EventMeta> {
  const out: Record<string, EventMeta> = {};
  for (const [kat, m] of Object.entries(roh)) {
    if (Array.isArray(m.subs)) {
      out[kat] = { typ: m.typ ?? "", subs: m.subs };
    } else {
      // altes Format (eine Veranstaltung = ein Ort/Datum) -> eine Sub-Veranstaltung
      const sub: SubEvent[] =
        m.ort || m.start
          ? [{ id: `s${Date.now()}_${kat}`, ort: m.ort ?? "", start: m.start ?? null, ende: m.ende ?? null }]
          : [];
      out[kat] = { typ: m.typ ?? "", subs: sub };
    }
  }
  return out;
}

function load(): Record<string, EventMeta> {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) return JSON.parse(raw) as Record<string, EventMeta>;
    // Einmalige Migration aus v1
    const alt = localStorage.getItem(ALT_KEY);
    if (alt) {
      const migr = migriere(JSON.parse(alt) as Record<string, AltMeta>);
      localStorage.setItem(KEY, JSON.stringify(migr));
      return migr;
    }
    return {};
  } catch {
    return {};
  }
}

/**
 * Veranstaltungen als eigene Objekte mit Sub-Veranstaltungen (Ort/Datum).
 * Schlüssel = Kategorie/Name. Einträge verlinken über `veranstaltung` (Kategorie)
 * und `subEvent` (Sub-Veranstaltungs-ID).
 */
export function useVeranstaltungen() {
  const [events, setEvents] = useState<Record<string, EventMeta>>(load);

  const speichern = (v: Veranstaltung, vorherigeKategorie?: string) => {
    setEvents((prev) => {
      const next = { ...prev };
      if (vorherigeKategorie && vorherigeKategorie !== v.kategorie) delete next[vorherigeKategorie];
      next[v.kategorie] = { typ: v.typ, subs: v.subs };
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
