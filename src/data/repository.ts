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
  loeschen(id: string): Promise<void>;
  zuruecksetzen(): Promise<Kampagne[]>;
}

const STORAGE_KEY = "kampagnen.v1";

export class LocalStorageRepository implements KampagnenRepository {
  private load(): Kampagne[] {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      const data = seed as unknown as Kampagne[];
      this.save(data);
      return data;
    }
    try {
      return JSON.parse(raw) as Kampagne[];
    } catch {
      return seed as unknown as Kampagne[];
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

  async loeschen(id: string): Promise<void> {
    this.save(this.load().filter((d) => d.id !== id));
  }

  async zuruecksetzen(): Promise<Kampagne[]> {
    const data = seed as unknown as Kampagne[];
    this.save(data);
    return data;
  }
}

// Zentrale Instanz – hier später durch SupabaseRepository ersetzen.
export const repository: KampagnenRepository = new LocalStorageRepository();
