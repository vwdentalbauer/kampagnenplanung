import { useCallback, useEffect, useState } from "react";
import { supabase, supabaseAktiv } from "../lib/supabase";

export interface SubEvent {
  id: string;
  name: string;
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
      out[kat] = { typ: m.typ ?? "", subs: m.subs.map((s) => ({ ...s, name: s.name ?? "" })) };
    } else {
      const sub: SubEvent[] =
        m.ort || m.start
          ? [{ id: `s${Date.now()}_${kat}`, name: "", ort: m.ort ?? "", start: m.start ?? null, ende: m.ende ?? null }]
          : [];
      out[kat] = { typ: m.typ ?? "", subs: sub };
    }
  }
  return out;
}

function ladeLokal(): ProLand {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) return JSON.parse(raw) as ProLand;
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

interface VRow {
  id: string;
  land: string;
  kategorie: string;
  typ: string;
  subs: SubEvent[];
}

/**
 * Veranstaltungen je Mandant (Land). Schlüssel: land -> kategorie -> EventMeta.
 * Supabase, wenn konfiguriert – sonst localStorage.
 */
export function useVeranstaltungen() {
  const [alle, setAlle] = useState<ProLand>(() => (supabaseAktiv ? {} : ladeLokal()));

  const neuLaden = useCallback(async () => {
    if (!supabase) return;
    const { data } = await supabase.from("veranstaltung").select("*");
    const proLand: ProLand = {};
    for (const r of (data ?? []) as VRow[]) {
      (proLand[r.land] ??= {})[r.kategorie] = { typ: r.typ ?? "", subs: r.subs ?? [] };
    }
    setAlle(proLand);
  }, []);

  useEffect(() => {
    const sb = supabase;
    if (!sb) return;
    neuLaden();
    const ch = sb
      .channel("veranstaltung-realtime")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "veranstaltung" },
        () => neuLaden(),
      )
      .subscribe();
    return () => {
      sb.removeChannel(ch);
    };
  }, [neuLaden]);

  const speichern = useCallback(
    async (land: string, v: Veranstaltung, vorherigeKategorie?: string) => {
      if (supabase) {
        if (vorherigeKategorie && vorherigeKategorie !== v.kategorie) {
          await supabase
            .from("veranstaltung")
            .delete()
            .match({ land, kategorie: vorherigeKategorie });
        }
        await supabase
          .from("veranstaltung")
          .upsert(
            { land, kategorie: v.kategorie, typ: v.typ, subs: v.subs },
            { onConflict: "land,kategorie" },
          );
        await neuLaden();
        return;
      }
      // lokaler Modus
      setAlle((prev) => {
        const landMap = { ...(prev[land] ?? {}) };
        if (vorherigeKategorie && vorherigeKategorie !== v.kategorie)
          delete landMap[vorherigeKategorie];
        landMap[v.kategorie] = { typ: v.typ, subs: v.subs };
        const next = { ...prev, [land]: landMap };
        localStorage.setItem(KEY, JSON.stringify(next));
        return next;
      });
    },
    [neuLaden],
  );

  const loeschen = useCallback(
    async (land: string, kategorie: string) => {
      if (supabase) {
        await supabase.from("veranstaltung").delete().match({ land, kategorie });
        await neuLaden();
        return;
      }
      setAlle((prev) => {
        const landMap = { ...(prev[land] ?? {}) };
        delete landMap[kategorie];
        const next = { ...prev, [land]: landMap };
        localStorage.setItem(KEY, JSON.stringify(next));
        return next;
      });
    },
    [neuLaden],
  );

  return { alle, speichern, loeschen };
}
