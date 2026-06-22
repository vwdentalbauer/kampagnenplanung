import type { Kampagne } from "../types";
import seed from "./seed.json";

/**
 * Abstraktion über die Datenhaltung.
 *
 * Aktuell: LocalStorageRepository (läuft offline im Browser, ideal für
 * GitHub Pages ohne Backend). Später: SupabaseRepository mit identischer
 * Signatur – die UI muss dafür nicht angepasst werden.
 */
export interface KampagnenRepository {
  alle(): Promise<Kampagne[]>;
  speichern(k: Kampagne): Promise<void>;
  /** Mehrere Kampagnen auf einmal speichern (Bulk-Bearbeitung). */
  speichernViele(ks: Kampagne[]): Promise<void>;
  loeschen(id: string): Promise<void>;
  /** Mehrere Kampagnen auf einmal löschen. */
  loeschenViele(ids: string[]): Promise<void>;
  /** Kompletten Datenbestand ersetzen (z.B. Excel-Import). */
  ersetzeAlle(ks: Kampagne[]): Promise<Kampagne[]>;
  zuruecksetzen(): Promise<Kampagne[]>;
}

const STORAGE_KEY = "kampagnen.v1";

/** Erste Zeile eines Textes als Kurztitel (für das neue Feld „kampagne"). */
function ersteZeile(text: string): string {
  const z = (text ?? "").split("\n")[0].trim();
  return z.length > 80 ? z.slice(0, 80) + "…" : z;
}

/** Sorgt dafür, dass jeder Datensatz das Feld „kampagne" hat (Migration). */
function normalisieren(daten: Kampagne[]): Kampagne[] {
  const leerWerte = ["none", "keine", "n/a", "na", "-", "–", "kein", "ohne"];
  return daten.map((k) => {
    const basis = (k.kampagne ?? ersteZeile(k.details)).trim();
    const kampagne = leerWerte.includes(basis.toLowerCase()) ? "" : basis;
    return {
      ...k,
      kampagne,
      endDatum: k.endDatum ?? null,
      subKanal: k.subKanal ?? "",
      veranstaltung: k.veranstaltung ?? "",
      // „Events" ist keine Sparte mehr -> aus bestehenden Daten entfernen.
      bereiche: (k.bereiche ?? []).filter((b) => b !== "Events"),
      // Kategorie umbenannt: „Hero Kampagne" -> „WKZ".
      kategorie: k.kategorie === "Hero Kampagne" ? "WKZ" : k.kategorie,
    };
  });
}

export class LocalStorageRepository implements KampagnenRepository {
  private load(): Kampagne[] {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      const data = normalisieren(seed as unknown as Kampagne[]);
      this.save(data);
      return data;
    }
    try {
      return normalisieren(JSON.parse(raw) as Kampagne[]);
    } catch {
      return normalisieren(seed as unknown as Kampagne[]);
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

  async zuruecksetzen(): Promise<Kampagne[]> {
    const data = normalisieren(seed as unknown as Kampagne[]);
    this.save(data);
    return data;
  }
}

// Zentrale Instanz – hier später durch SupabaseRepository ersetzen.
export const repository: KampagnenRepository = new LocalStorageRepository();
