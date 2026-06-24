import { createClient, type SupabaseClient } from "@supabase/supabase-js";

/**
 * Zentraler Supabase-Client.
 *
 * Die Zugangsdaten kommen aus den Build-Variablen `VITE_SUPABASE_URL` und
 * `VITE_SUPABASE_ANON_KEY` (öffentlich-sicher – der Schutz erfolgt über Row
 * Level Security in Supabase). Fehlen sie, läuft die App im lokalen
 * `localStorage`-Modus weiter (siehe `data/repository.ts`).
 */
// Öffentliche Standard-Zugangsdaten (anon key ist by design im Frontend
// sichtbar – der Schutz erfolgt über Row Level Security). Per Build-Variable
// (z.B. GitHub-Secret) überschreibbar, etwa für ein anderes Projekt.
const STANDARD_URL = "https://bylcztqahqzsaeztqfov.supabase.co";
const STANDARD_ANON_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJ5bGN6dHFhaHF6c2FlenRxZm92Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODIzMDA4MzUsImV4cCI6MjA5Nzg3NjgzNX0.rPWsvrlvIXkePK_rVJRp2oLqfM9_m4hz6FgO-OvT4k4";

const url = import.meta.env.VITE_SUPABASE_URL?.trim() || STANDARD_URL;
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY?.trim() || STANDARD_ANON_KEY;

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
