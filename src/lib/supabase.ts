import { createClient, type SupabaseClient } from "@supabase/supabase-js";

/**
 * Zentraler Supabase-Client.
 *
 * Die Zugangsdaten kommen aus den Build-Variablen `VITE_SUPABASE_URL` und
 * `VITE_SUPABASE_ANON_KEY` (öffentlich-sicher – der Schutz erfolgt über Row
 * Level Security in Supabase). Fehlen sie, läuft die App im lokalen
 * `localStorage`-Modus weiter (siehe `data/repository.ts`).
 */
const url = import.meta.env.VITE_SUPABASE_URL?.trim();
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY?.trim();

/** true, wenn die App gegen Supabase läuft (sonst lokaler Demo-Modus). */
export const supabaseAktiv = Boolean(url && anonKey);

export const supabase: SupabaseClient | null = supabaseAktiv
  ? createClient(url!, anonKey!, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
      },
    })
  : null;

/** Hilfsfunktion: Client garantiert vorhanden (sonst Fehler). */
export function client(): SupabaseClient {
  if (!supabase) {
    throw new Error(
      "Supabase ist nicht konfiguriert (VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY fehlen).",
    );
  }
  return supabase;
}
