import type { Kampagne } from "../types";
import seed from "./seed.json";
import { supabaseAktiv } from "../lib/supabase";
import { SupabaseRepository } from "./supabaseRepository";

/**
 * Abstraktion über die Datenhaltung.
 *
 * - `SupabaseRepository`: gemeinsame Datenbank, Anmeldung, Rollen (Phase 2).
 * - `LocalStorageRepository`: lokaler Demo-Modus ohne Backend (Fallback, wenn
 *   keine Supabase-Zugangsdaten gesetzt sind). Beide haben dieselbe Signatur,
 *   die UI bleibt unverändert.
 */
export interface KampagnenRepository {
  alle(): Promise<Kampagne[]>;
  speichern(k: Kampagne): Promise<void>;
  /** Mehrere Kampagnen auf einmal speichern (Bulk-Bearbeitung). */
  speichernViele(ks: Kampagne[]): Promise<void>;
  loeschen(id: string): Promise<void>;
  /** Mehrere Kampagnen auf einmal löschen. */
  loeschenViele(ids: string[]): Promise<void>;
  /** Kompletten Datenbestand ersetzen (Excel-Import, nur Admin). */
  ersetzeAlle(ks: Kampagne[]): Promise<Kampagne[]>;
}

const STORAGE_KEY = "kampagnen.v1";

/** Erste Zeile eines Textes als Kurztitel (für das neue Feld „kampagne"). */
function ersteZeile(text: string): string {
  const z = (text ?? "").split("\n")[0].trim();
  return z.length > 80 ? z.slice(0, 80) + "…" : z;
}

/** Sorgt dafür, dass jeder Datensatz alle Felder hat (Migration/Bereinigung). */
export function normalisieren(daten: Kampagne[]): Kampagne[] {
  const leerWerte = ["none", "keine", "n/a", "na", "-", "–", "kein", "ohne"];
  return daten.map((k) => {
    const basis = (k.kampagne ?? ersteZeile(k.details)).trim();
    const kampagne = leerWerte.includes(basis.toLowerCase()) ? "" : basis;
    return {
      ...k,
      land: k.land ?? "DE",
      kampagne,
      endDatum: k.endDatum ?? null,
      subKanal: k.subKanal ?? "",
      veranstaltung: k.veranstaltung ?? "",
      subEvent: k.subEvent ?? "",
      // „Events" ist keine Sparte mehr -> aus bestehenden Daten entfernen.
      bereiche: (k.bereiche ?? []).filter((b) => b !== "Events"),
      pluline: k.pluline ?? false,
      wkz: k.wkz ?? false,
      // Kategorie umbenannt: „Hero Kampagne" -> „WKZ".
      kategorie: k.kategorie === "Hero Kampagne" ? "WKZ" : k.kategorie,
    };
  });
}

/** Initialdaten (echte Excel-Daten) – Quelle für das erste Befüllen. */
export function seedDaten(): Kampagne[] {
  return normalisieren(seed as unknown as Kampagne[]);
}

export class LocalStorageRepository implements KampagnenRepository {
  private load(): Kampagne[] {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      const data = seedDaten();
      this.save(data);
      return data;
    }
    try {
      return normalisieren(JSON.parse(raw) as Kampagne[]);
    } catch {
      return seedDaten();
    }
  }

  private save(data: Kampagne[]) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  }

  async alle(): Promise<Kampagne[]> {
    return this.load();
  }

  async speichern(k: Kampagne): Promise<void> {
    const data = this.load();
    const idx = data.findIndex((d) => d.id === k.id);
    if (idx >= 0) data[idx] = k;
    else data.unshift(k);
    this.save(data);
  }

  async speichernViele(ks: Kampagne[]): Promise<void> {
    const data = this.load();
    for (const k of ks) {
      const idx = data.findIndex((d) => d.id === k.id);
      if (idx >= 0) data[idx] = k;
      else data.unshift(k);
    }
    this.save(data);
  }

  async loeschen(id: string): Promise<void> {
    this.save(this.load().filter((d) => d.id !== id));
  }

  async loeschenViele(ids: string[]): Promise<void> {
    const set = new Set(ids);
    this.save(this.load().filter((d) => !set.has(d.id)));
  }

  async ersetzeAlle(ks: Kampagne[]): Promise<Kampagne[]> {
    const data = normalisieren(ks);
    this.save(data);
    return data;
  }
}

// Zentrale Instanz: Supabase, wenn konfiguriert – sonst lokaler Demo-Modus.
export const repository: KampagnenRepository = supabaseAktiv
  ? new SupabaseRepository()
  : new LocalStorageRepository();
