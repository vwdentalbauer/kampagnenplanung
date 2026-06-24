import { supabase } from "../lib/supabase";

/**
 * Persönliche Einstellungen je Nutzer (z.B. individuelle Tabellenansicht).
 * Wird in Supabase (`user_pref`) gespeichert, sodass jeder Nutzer seine eigene
 * Ansicht hat – geräteübergreifend. Ohne Backend passiert nichts (localStorage
 * dient dann als alleiniger Speicher, siehe Aufrufer).
 */
export async function ladePref<T>(schluessel: string): Promise<T | null> {
  if (!supabase) return null;
  const { data: u } = await supabase.auth.getUser();
  if (!u.user) return null;
  const { data } = await supabase
    .from("user_pref")
    .select("wert")
    .eq("user_id", u.user.id)
    .eq("schluessel", schluessel)
    .maybeSingle();
  return (data?.wert as T) ?? null;
}

export async function speicherePref(schluessel: string, wert: unknown): Promise<void> {
  if (!supabase) return;
  const { data: u } = await supabase.auth.getUser();
  if (!u.user) return;
  await supabase
    .from("user_pref")
    .upsert(
      { user_id: u.user.id, schluessel, wert },
      { onConflict: "user_id,schluessel" },
    );
}
