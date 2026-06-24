// Edge Function: Nutzerverwaltung für Admins.
// Läuft mit Service-Role (nur serverseitig!) und prüft selbst, dass der
// Aufrufer ein aktiver Admin ist. Deploy via Supabase-MCP/CLI.
import { createClient } from "jsr:@supabase/supabase-js@2";

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...CORS, "Content-Type": "application/json" },
  });

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: CORS });

  const url = Deno.env.get("SUPABASE_URL")!;
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const admin = createClient(url, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  // 1) Aufrufer identifizieren (JWT aus Authorization-Header).
  const authHeader = req.headers.get("Authorization") ?? "";
  const token = authHeader.replace("Bearer ", "");
  const { data: userData, error: userErr } = await admin.auth.getUser(token);
  if (userErr || !userData.user) return json({ error: "Nicht angemeldet." }, 401);

  // 2) Admin-Rolle prüfen.
  const { data: profil } = await admin
    .from("profile")
    .select("rolle, aktiv")
    .eq("id", userData.user.id)
    .single();
  if (!profil || profil.rolle !== "admin" || !profil.aktiv) {
    return json({ error: "Nur Admins dürfen Nutzer verwalten." }, 403);
  }

  let body: Record<string, unknown> = {};
  try {
    body = await req.json();
  } catch (_) { /* leer */ }
  const action = String(body.action ?? "");

  try {
    if (action === "list") {
      const { data: profiles, error } = await admin
        .from("profile")
        .select("id, email, name, rolle, aktiv, created_at")
        .order("created_at", { ascending: true });
      if (error) throw error;
      return json({ users: profiles });
    }

    if (action === "invite") {
      const email = String(body.email ?? "").trim().toLowerCase();
      const name = String(body.name ?? "");
      const rolle = String(body.rolle ?? "viewer");
      const redirectTo = body.redirectTo ? String(body.redirectTo) : undefined;
      const passwort = body.passwort ? String(body.passwort) : undefined;
      if (!email) return json({ error: "E-Mail fehlt." }, 400);
      if (!["viewer", "editor", "admin"].includes(rolle))
        return json({ error: "Ungültige Rolle." }, 400);

      if (passwort) {
        // Fallback ohne E-Mail-Versand: Nutzer mit Initial-Passwort anlegen.
        const { data, error } = await admin.auth.admin.createUser({
          email,
          password: passwort,
          email_confirm: true,
          user_metadata: { name, rolle },
        });
        if (error) throw error;
        return json({ ok: true, user: data.user, modus: "passwort" });
      }

      const { data, error } = await admin.auth.admin.inviteUserByEmail(email, {
        data: { name, rolle },
        redirectTo,
      });
      if (error) throw error;
      return json({ ok: true, user: data.user, modus: "einladung" });
    }

    if (action === "set_role") {
      const id = String(body.id ?? "");
      const rolle = String(body.rolle ?? "");
      if (!["viewer", "editor", "admin"].includes(rolle))
        return json({ error: "Ungültige Rolle." }, 400);
      const { error } = await admin.from("profile").update({ rolle }).eq("id", id);
      if (error) throw error;
      await admin.auth.admin.updateUserById(id, { user_metadata: { rolle } });
      return json({ ok: true });
    }

    if (action === "set_aktiv") {
      const id = String(body.id ?? "");
      const aktiv = Boolean(body.aktiv);
      if (id === userData.user.id && !aktiv)
        return json({ error: "Sie können sich nicht selbst deaktivieren." }, 400);
      const { error } = await admin.from("profile").update({ aktiv }).eq("id", id);
      if (error) throw error;
      // Gesperrte Nutzer auch in Auth bannen (sofortiger Login-Stopp).
      await admin.auth.admin.updateUserById(id, {
        ban_duration: aktiv ? "none" : "876000h",
      });
      return json({ ok: true });
    }

    if (action === "delete") {
      const id = String(body.id ?? "");
      if (id === userData.user.id)
        return json({ error: "Sie können sich nicht selbst löschen." }, 400);
      const { error } = await admin.auth.admin.deleteUser(id);
      if (error) throw error;
      return json({ ok: true });
    }

    return json({ error: "Unbekannte Aktion." }, 400);
  } catch (e) {
    return json({ error: (e as Error).message }, 400);
  }
});
