import { useCallback, useEffect, useState } from "react";
import { supabase } from "../lib/supabase";
import { ladePref, speicherePref } from "./userPrefs";

/** Eine Benachrichtigung über eine Änderung anderer Nutzer. */
export interface Benachrichtigung {
  key: string;
  art: "kampagne" | "veranstaltung";
  /** Kampagnen-ID (für „Eintrag öffnen"). */
  refId: string;
  land: string;
  /** Veranstaltungs-Kategorie (nur bei art === "veranstaltung"). */
  kategorie?: string;
  titel: string;
  autor: string;
  /** Zeitpunkt der Änderung (ISO). */
  ts: string;
  gelesen: boolean;
}

const PREF_GESEHEN = "notif.gesehen";
const MAX_TAGE = 30;
const MAX_ANZAHL = 50;

interface KRow {
  id: string;
  land: string;
  kampagne: string;
  details: string;
  owners: string[] | null;
  updated_at: string | null;
  updated_by: string | null;
}
interface VRow {
  id: string;
  land: string;
  kategorie: string;
  updated_at: string | null;
  updated_by: string | null;
}

/** Namens-Tokens (>= 3 Zeichen) für den unscharfen Abgleich Owner ↔ Nutzer. */
function tokens(s: string): string[] {
  return (s || "")
    .toLowerCase()
    .split(/[^a-zäöüß0-9]+/i)
    .filter((t) => t.length >= 3);
}

/** Gehört der Eintrag (über seine Owner) dem aktuellen Nutzer? */
function gehoertMir(owners: string[] | null, meineTokens: Set<string>): boolean {
  if (!owners || !meineTokens.size) return false;
  return owners.some((o) => tokens(o).some((t) => meineTokens.has(t)));
}

/**
 * Benachrichtigungen für den angemeldeten Nutzer:
 *  - Änderungen an Einträgen, die ihm zugewiesen sind (Owner), durch andere
 *  - neue/geänderte Veranstaltungen (für alle relevant) durch andere
 *
 * „Gelesen" wird über einen Zeitstempel je Nutzer (user_pref) abgebildet.
 * Nur Änderungen mit gesetztem `updated_by` (= seit Einführung dieser Funktion)
 * erzeugen Benachrichtigungen – so gibt es keine Flut aus Altbeständen.
 */
export function useBenachrichtigungen(userId: string | null, name: string) {
  const [liste, setListe] = useState<Benachrichtigung[]>([]);

  const laden = useCallback(async () => {
    if (!supabase || !userId) return;

    // „Gelesen bis": beim allerersten Mal = jetzt (kein historischer Schwall).
    let seit = await ladePref<string>(PREF_GESEHEN);
    if (!seit) {
      seit = new Date().toISOString();
      await speicherePref(PREF_GESEHEN, seit);
    }

    const grenze = new Date(Date.now() - MAX_TAGE * 86400000).toISOString();
    const meineTokens = new Set(tokens(name));

    // „Von wem" – Namens-Map (best effort; bei fehlender Leseberechtigung leer).
    const autorName = new Map<string, string>();
    const { data: profile } = await supabase.from("profile").select("id, name, email");
    for (const p of (profile ?? []) as { id: string; name: string; email: string }[]) {
      autorName.set(p.id, p.name || p.email);
    }
    const wer = (uid: string | null) => (uid && autorName.get(uid)) || "jemandem";

    const items: Benachrichtigung[] = [];

    // Kampagnen, die mir zugewiesen sind und von anderen geändert wurden.
    const { data: kamp } = await supabase
      .from("kampagne")
      .select("id, land, kampagne, details, owners, updated_at, updated_by")
      .gt("updated_at", grenze);
    for (const k of (kamp ?? []) as KRow[]) {
      if (!k.updated_at || !k.updated_by || k.updated_by === userId) continue;
      if (!gehoertMir(k.owners, meineTokens)) continue;
      items.push({
        key: `k:${k.id}:${k.updated_at}`,
        art: "kampagne",
        refId: k.id,
        land: k.land,
        titel: k.kampagne || k.details || "Eintrag",
        autor: wer(k.updated_by),
        ts: k.updated_at,
        gelesen: k.updated_at <= seit,
      });
    }

    // Veranstaltungen (für alle relevant), von anderen angelegt/geändert.
    const { data: ver } = await supabase
      .from("veranstaltung")
      .select("id, land, kategorie, updated_at, updated_by")
      .gt("updated_at", grenze);
    for (const v of (ver ?? []) as VRow[]) {
      if (!v.updated_at || !v.updated_by || v.updated_by === userId) continue;
      items.push({
        key: `v:${v.id}:${v.updated_at}`,
        art: "veranstaltung",
        refId: v.id,
        land: v.land,
        kategorie: v.kategorie,
        titel: v.kategorie,
        autor: wer(v.updated_by),
        ts: v.updated_at,
        gelesen: v.updated_at <= seit,
      });
    }

    items.sort((a, b) => b.ts.localeCompare(a.ts));
    setListe(items.slice(0, MAX_ANZAHL));
  }, [userId, name]);

  useEffect(() => {
    laden();
  }, [laden]);

  // Live: bei Datenbank-Änderungen neu berechnen.
  useEffect(() => {
    const sb = supabase;
    if (!sb || !userId) return;
    const ch = sb
      .channel("benachrichtigung-realtime")
      .on("postgres_changes", { event: "*", schema: "public", table: "kampagne" }, () => laden())
      .on("postgres_changes", { event: "*", schema: "public", table: "veranstaltung" }, () => laden())
      .subscribe();
    return () => {
      sb.removeChannel(ch);
    };
  }, [laden, userId]);

  const alsGelesenMarkieren = useCallback(async () => {
    const jetzt = new Date().toISOString();
    await speicherePref(PREF_GESEHEN, jetzt);
    setListe((l) => l.map((b) => ({ ...b, gelesen: true })));
  }, []);

  const ungelesen = liste.filter((b) => !b.gelesen).length;

  return { liste, ungelesen, alsGelesenMarkieren, neuLaden: laden };
}
