import { useCallback, useEffect, useRef, useState } from "react";
import { supabase } from "../lib/supabase";

export interface LockInfo {
  userId: string;
  userName: string;
  lockedAt: string;
}

interface LockRow {
  entity_type: string;
  entity_id: string;
  user_id: string;
  user_name: string;
  locked_at: string;
}

// Sperren älter als 5 Minuten gelten als abgelaufen (siehe RLS-Policy).
const STALE_MS = 5 * 60 * 1000;
const HEARTBEAT_MS = 60 * 1000;

function schluessel(typ: string, id: string) {
  return `${typ}:${id}`;
}

function istFrisch(r: LockRow): boolean {
  return Date.now() - new Date(r.locked_at).getTime() < STALE_MS;
}

/**
 * Verwaltet die Bearbeitungs-Sperren. Liefert die aktuell aktiven (frischen)
 * Sperren und Funktionen zum Sperren/Freigeben einer Entität.
 *
 * Verhalten: Beim Öffnen eines Editors wird `sperren` aufgerufen. Existiert
 * bereits eine frische Sperre eines anderen Nutzers, schlägt das fehl
 * (read-only). Eigene oder abgelaufene Sperren werden übernommen. Ein
 * Heartbeat hält die eigene Sperre frisch.
 */
export function useLocks(userId: string | null, userName: string) {
  const [locks, setLocks] = useState<Record<string, LockInfo>>({});
  const heartbeats = useRef<Map<string, ReturnType<typeof setInterval>>>(new Map());

  const neuLaden = useCallback(async () => {
    if (!supabase) return;
    const { data } = await supabase.from("bearbeitung_lock").select("*");
    const map: Record<string, LockInfo> = {};
    for (const r of (data ?? []) as LockRow[]) {
      if (!istFrisch(r)) continue;
      map[schluessel(r.entity_type, r.entity_id)] = {
        userId: r.user_id,
        userName: r.user_name,
        lockedAt: r.locked_at,
      };
    }
    setLocks(map);
  }, []);

  useEffect(() => {
    const sb = supabase;
    if (!sb) return;
    neuLaden();
    const ch = sb
      .channel("lock-realtime")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "bearbeitung_lock" },
        () => neuLaden(),
      )
      .subscribe();
    // Abgelaufene Sperren regelmäßig ausblenden.
    const tick = setInterval(neuLaden, 30 * 1000);
    return () => {
      sb.removeChannel(ch);
      clearInterval(tick);
    };
  }, [neuLaden]);

  /** Versucht zu sperren. Gibt true zurück, wenn die Sperre uns gehört. */
  const sperren = useCallback(
    async (typ: string, id: string): Promise<boolean> => {
      if (!supabase || !userId) return true;
      const { data } = await supabase
        .from("bearbeitung_lock")
        .select("*")
        .match({ entity_type: typ, entity_id: id })
        .maybeSingle();
      const vorhanden = data as LockRow | null;

      if (vorhanden && istFrisch(vorhanden) && vorhanden.user_id !== userId) {
        await neuLaden();
        return false; // fremd gesperrt
      }
      if (vorhanden && vorhanden.user_id !== userId) {
        // abgelaufene Fremdsperre übernehmen
        await supabase
          .from("bearbeitung_lock")
          .delete()
          .match({ entity_type: typ, entity_id: id });
      }
      const { error } = await supabase.from("bearbeitung_lock").upsert(
        {
          entity_type: typ,
          entity_id: id,
          user_id: userId,
          user_name: userName,
          locked_at: new Date().toISOString(),
        },
        { onConflict: "entity_type,entity_id" },
      );
      if (error) {
        await neuLaden();
        return false;
      }

      // Heartbeat starten
      const k = schluessel(typ, id);
      if (!heartbeats.current.has(k)) {
        const iv = setInterval(async () => {
          await supabase!
            .from("bearbeitung_lock")
            .update({ locked_at: new Date().toISOString() })
            .match({ entity_type: typ, entity_id: id, user_id: userId });
        }, HEARTBEAT_MS);
        heartbeats.current.set(k, iv);
      }
      await neuLaden();
      return true;
    },
    [userId, userName, neuLaden],
  );

  const freigeben = useCallback(
    async (typ: string, id: string) => {
      const k = schluessel(typ, id);
      const iv = heartbeats.current.get(k);
      if (iv) {
        clearInterval(iv);
        heartbeats.current.delete(k);
      }
      if (!supabase || !userId) return;
      await supabase
        .from("bearbeitung_lock")
        .delete()
        .match({ entity_type: typ, entity_id: id, user_id: userId });
      await neuLaden();
    },
    [userId, neuLaden],
  );

  // Beim Verlassen alle Heartbeats stoppen.
  useEffect(() => {
    const hb = heartbeats.current;
    return () => {
      hb.forEach((iv) => clearInterval(iv));
      hb.clear();
    };
  }, []);

  return { locks, sperren, freigeben };
}
