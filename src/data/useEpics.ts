import { useCallback, useEffect, useState } from "react";
import { supabase, supabaseAktiv } from "../lib/supabase";

export interface EpicMeta {
  start: string | null;
  ende: string | null;
}

const KEY = "kampagnen.epics.v1";

function ladeLokal(): Record<string, EpicMeta> {
  try {
    return JSON.parse(localStorage.getItem(KEY) ?? "{}") as Record<string, EpicMeta>;
  } catch {
    return {};
  }
}

interface ERow {
  name: string;
  start: string | null;
  ende: string | null;
}

/**
 * Verwaltet den (optionalen) expliziten Gesamtzeitraum je Kampagne.
 * Schlüssel = Kampagnenname. Supabase, wenn konfiguriert – sonst localStorage.
 */
export function useEpics() {
  const [epics, setEpics] = useState<Record<string, EpicMeta>>(() =>
    supabaseAktiv ? {} : ladeLokal(),
  );

  const neuLaden = useCallback(async () => {
    if (!supabase) return;
    const { data } = await supabase.from("epic").select("name, start, ende");
    const map: Record<string, EpicMeta> = {};
    for (const r of (data ?? []) as ERow[]) {
      map[r.name] = { start: r.start, ende: r.ende };
    }
    setEpics(map);
  }, []);

  useEffect(() => {
    const sb = supabase;
    if (!sb) return;
    neuLaden();
    const ch = sb
      .channel("epic-realtime")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "epic" },
        () => neuLaden(),
      )
      .subscribe();
    return () => {
      sb.removeChannel(ch);
    };
  }, [neuLaden]);

  const setZeitraum = useCallback(
    async (name: string, start: string | null, ende: string | null) => {
      if (supabase) {
        await supabase.from("epic").upsert({ name, start, ende }, { onConflict: "name" });
        await neuLaden();
        return;
      }
      setEpics((prev) => {
        const next = { ...prev, [name]: { start, ende } };
        localStorage.setItem(KEY, JSON.stringify(next));
        return next;
      });
    },
    [neuLaden],
  );

  return { epics, setZeitraum };
}
