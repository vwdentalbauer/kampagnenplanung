import type { Kampagne } from "../types";
import { client } from "../lib/supabase";
// Zuordnung App-Felder <-> DB-Spalten liegt in lib/kampagneRow.ts (ohne
// Supabase-Import), damit sie eigenständig testbar bleibt.
import { type Row, vonRow, zuRow } from "../lib/kampagneRow";
import type { KampagnenRepository } from "./repository";
import { seedDaten } from "./repository";

// Verhindert, dass das First-Run-Seeding mehrfach pro Session versucht wird.
let seedVersucht = false;

export class SupabaseRepository implements KampagnenRepository {
  async alle(): Promise<Kampagne[]> {
    const { data, error } = await client()
      .from("kampagne")
      .select("*");
    if (error) throw error;
    let rows = (data ?? []) as Row[];

    // Erststart: leere Datenbank einmalig mit den echten Excel-Daten füllen.
    // Schlägt für Nutzer ohne Schreibrechte still fehl (RLS) -> bleibt leer.
    if (rows.length === 0 && !seedVersucht) {
      seedVersucht = true;
      const seed = seedDaten().map(zuRow);
      const { error: seedErr } = await client()
        .from("kampagne")
        .upsert(seed, { onConflict: "id", ignoreDuplicates: true });
      if (!seedErr) {
        const { data: data2 } = await client().from("kampagne").select("*");
        rows = (data2 ?? []) as Row[];
      }
    }
    return rows.map(vonRow);
  }

  async speichern(k: Kampagne): Promise<void> {
    const { error } = await client().from("kampagne").upsert(zuRow(k));
    if (error) throw error;
  }

  async speichernViele(ks: Kampagne[]): Promise<void> {
    if (!ks.length) return;
    const { error } = await client().from("kampagne").upsert(ks.map(zuRow));
    if (error) throw error;
  }

  async loeschen(id: string): Promise<void> {
    const { error } = await client().from("kampagne").delete().eq("id", id);
    if (error) throw error;
  }

  async loeschenViele(ids: string[]): Promise<void> {
    if (!ids.length) return;
    const { error } = await client().from("kampagne").delete().in("id", ids);
    if (error) throw error;
  }

  async ersetzeAlle(ks: Kampagne[]): Promise<Kampagne[]> {
    // Excel-Import (nur Admin): kompletten Bestand ersetzen.
    const c = client();
    const { error: delErr } = await c
      .from("kampagne")
      .delete()
      .not("id", "is", null);
    if (delErr) throw delErr;
    if (ks.length) {
      const { error } = await c.from("kampagne").insert(ks.map(zuRow));
      if (error) throw error;
    }
    return ks;
  }
}
