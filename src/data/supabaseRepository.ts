import type { Kampagne, Status } from "../types";
import { client } from "../lib/supabase";
import type { KampagnenRepository } from "./repository";
import { seedDaten } from "./repository";

/** DB-Zeile (snake_case) wie in der Tabelle `kampagne`. */
interface Row {
  id: string;
  land: string;
  quartal: string;
  kw: number | null;
  week_start: string | null;
  end_datum: string | null;
  zielgruppe: string;
  kanal: string;
  sub_kanal: string;
  kampagne: string;
  details: string;
  ziel: string;
  kategorie: string;
  bereiche: string[];
  pluline: boolean;
  wkz: boolean;
  veranstaltung: string;
  sub_event: string;
  verantwortung: string;
  owners: string[];
  status: Status;
}

function vonRow(r: Row): Kampagne {
  return {
    id: r.id,
    land: r.land,
    quartal: r.quartal,
    kw: r.kw,
    weekStart: r.week_start,
    endDatum: r.end_datum,
    zielgruppe: r.zielgruppe,
    kanal: r.kanal,
    subKanal: r.sub_kanal,
    kampagne: r.kampagne,
    details: r.details,
    ziel: r.ziel,
    kategorie: r.kategorie,
    bereiche: r.bereiche ?? [],
    pluline: r.pluline,
    wkz: r.wkz,
    veranstaltung: r.veranstaltung,
    subEvent: r.sub_event,
    verantwortung: r.verantwortung,
    owners: r.owners ?? [],
    status: r.status,
  };
}

function zuRow(k: Kampagne): Row {
  return {
    id: k.id,
    land: k.land,
    quartal: k.quartal,
    kw: k.kw,
    week_start: k.weekStart,
    end_datum: k.endDatum,
    zielgruppe: k.zielgruppe,
    kanal: k.kanal,
    sub_kanal: k.subKanal,
    kampagne: k.kampagne,
    details: k.details,
    ziel: k.ziel,
    kategorie: k.kategorie,
    bereiche: k.bereiche ?? [],
    pluline: k.pluline,
    wkz: k.wkz,
    veranstaltung: k.veranstaltung,
    sub_event: k.subEvent,
    verantwortung: k.verantwortung,
    owners: k.owners ?? [],
    status: k.status,
  };
}

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
