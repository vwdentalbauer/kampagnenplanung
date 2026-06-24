import { useCallback, useEffect, useState } from "react";
import { supabase } from "../lib/supabase";
import { ROLLEN_LABELS } from "../constants";
import type { Rolle } from "../types";

type Tab = "nutzer" | "logs" | "backups";

interface ProfilRow {
  id: string;
  email: string;
  name: string;
  rolle: Rolle;
  aktiv: boolean;
  created_at: string;
}

interface LogRow {
  id: number;
  ts: string;
  user_email: string | null;
  tabelle: string;
  datensatz_id: string | null;
  aktion: string;
  rueckgaengig_am: string | null;
}

interface SnapRow {
  id: number;
  datum: string;
  erstellt_at: string;
  anzahl_kampagnen: number;
  anzahl_veranstaltungen: number;
  anzahl_epics: number;
}

async function adminAktion(body: Record<string, unknown>) {
  const { data, error } = await supabase!.functions.invoke("admin-users", { body });
  if (error) {
    // Fehlertext aus der Function-Antwort herausziehen
    const ctx = (error as { context?: Response }).context;
    let msg = error.message;
    try {
      if (ctx) msg = (await ctx.json()).error ?? msg;
    } catch (_) { /* ignore */ }
    throw new Error(msg);
  }
  if (data?.error) throw new Error(data.error);
  return data;
}

export function AdminPanel({ onClose }: { onClose: () => void }) {
  const [tab, setTab] = useState<Tab>("nutzer");

  return (
    <div className="fixed inset-0 z-40 flex items-start justify-center overflow-y-auto bg-black/40 p-4">
      <div className="my-8 w-full max-w-4xl rounded-2xl bg-white shadow-xl">
        <div className="flex items-center justify-between border-b border-slate-200 px-5 py-3">
          <h2 className="text-lg font-bold text-marke">Administration</h2>
          <button
            onClick={onClose}
            className="rounded-md border border-slate-200 px-3 py-1 text-sm text-slate-500 hover:bg-slate-50"
          >
            Schließen
          </button>
        </div>

        <div className="flex gap-1 border-b border-slate-200 px-5 pt-3">
          {([
            ["nutzer", "👥 Nutzerverwaltung"],
            ["logs", "📜 User-Logs"],
            ["backups", "💾 Backups"],
          ] as [Tab, string][]).map(([id, label]) => (
            <button
              key={id}
              onClick={() => setTab(id)}
              className={`rounded-t-md px-3 py-2 text-sm font-medium ${
                tab === id
                  ? "border-b-2 border-marke text-marke-dark"
                  : "text-slate-500 hover:text-slate-700"
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        <div className="p-5">
          {tab === "nutzer" && <Nutzerverwaltung />}
          {tab === "logs" && <UserLogs />}
          {tab === "backups" && <Backups />}
        </div>
      </div>
    </div>
  );
}

// --- Nutzerverwaltung -----------------------------------------------------
function Nutzerverwaltung() {
  const [users, setUsers] = useState<ProfilRow[]>([]);
  const [fehler, setFehler] = useState<string | null>(null);
  const [laedt, setLaedt] = useState(true);
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [rolle, setRolle] = useState<Rolle>("viewer");
  const [hinweis, setHinweis] = useState<string | null>(null);

  const laden = useCallback(async () => {
    setLaedt(true);
    try {
      const d = await adminAktion({ action: "list" });
      setUsers(d.users ?? []);
      setFehler(null);
    } catch (e) {
      setFehler((e as Error).message);
    } finally {
      setLaedt(false);
    }
  }, []);

  useEffect(() => {
    laden();
  }, [laden]);

  const einladen = async () => {
    setFehler(null);
    setHinweis(null);
    if (!email.trim()) return;
    try {
      const d = await adminAktion({
        action: "invite",
        email,
        name,
        rolle,
        redirectTo: window.location.origin + window.location.pathname,
      });
      setHinweis(
        d.modus === "passwort"
          ? "Nutzer angelegt (mit Initial-Passwort)."
          : "Einladung verschickt.",
      );
      setEmail("");
      setName("");
      setRolle("viewer");
      await laden();
    } catch (e) {
      setFehler((e as Error).message);
    }
  };

  const rolleAendern = async (id: string, neu: Rolle) => {
    try {
      await adminAktion({ action: "set_role", id, rolle: neu });
      await laden();
    } catch (e) {
      setFehler((e as Error).message);
    }
  };

  const aktivSchalten = async (id: string, aktiv: boolean) => {
    try {
      await adminAktion({ action: "set_aktiv", id, aktiv });
      await laden();
    } catch (e) {
      setFehler((e as Error).message);
    }
  };

  const loeschen = async (id: string, email: string) => {
    if (!confirm(`Nutzer ${email} wirklich löschen?`)) return;
    try {
      await adminAktion({ action: "delete", id });
      await laden();
    } catch (e) {
      setFehler((e as Error).message);
    }
  };

  return (
    <div>
      {/* Einladen */}
      <div className="mb-4 rounded-lg border border-slate-200 bg-slate-50 p-3">
        <h3 className="mb-2 text-sm font-semibold text-slate-700">
          Neuen Nutzer einladen
        </h3>
        <div className="flex flex-wrap items-end gap-2">
          <input
            type="email"
            placeholder="E-Mail"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="flex-1 rounded-lg border border-slate-300 px-3 py-2 text-sm"
          />
          <input
            placeholder="Name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="flex-1 rounded-lg border border-slate-300 px-3 py-2 text-sm"
          />
          <select
            value={rolle}
            onChange={(e) => setRolle(e.target.value as Rolle)}
            className="rounded-lg border border-slate-300 px-2 py-2 text-sm"
          >
            {(Object.keys(ROLLEN_LABELS) as Rolle[]).map((r) => (
              <option key={r} value={r}>
                {ROLLEN_LABELS[r]}
              </option>
            ))}
          </select>
          <button
            onClick={einladen}
            className="rounded-lg bg-marke px-4 py-2 text-sm font-medium text-white hover:bg-marke-dark"
          >
            Einladen
          </button>
        </div>
        {hinweis && <p className="mt-2 text-sm text-emerald-700">{hinweis}</p>}
      </div>

      {fehler && (
        <p className="mb-3 rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-600">
          {fehler}
        </p>
      )}

      {laedt ? (
        <p className="py-6 text-center text-slate-400">Lädt…</p>
      ) : (
        <table className="w-full text-sm">
          <thead className="text-left text-xs uppercase text-slate-500">
            <tr className="border-b border-slate-200">
              <th className="py-2">Name / E-Mail</th>
              <th className="py-2">Rolle</th>
              <th className="py-2">Status</th>
              <th className="py-2"></th>
            </tr>
          </thead>
          <tbody>
            {users.map((u) => (
              <tr key={u.id} className="border-b border-slate-100">
                <td className="py-2">
                  <div className="font-medium">{u.name || "—"}</div>
                  <div className="text-xs text-slate-400">{u.email}</div>
                </td>
                <td className="py-2">
                  <select
                    value={u.rolle}
                    onChange={(e) => rolleAendern(u.id, e.target.value as Rolle)}
                    className="rounded border border-slate-300 px-1.5 py-1 text-xs"
                  >
                    {(Object.keys(ROLLEN_LABELS) as Rolle[]).map((r) => (
                      <option key={r} value={r}>
                        {ROLLEN_LABELS[r]}
                      </option>
                    ))}
                  </select>
                </td>
                <td className="py-2">
                  <button
                    onClick={() => aktivSchalten(u.id, !u.aktiv)}
                    className={`rounded px-2 py-1 text-xs font-medium ${
                      u.aktiv
                        ? "bg-emerald-50 text-emerald-700"
                        : "bg-slate-100 text-slate-500"
                    }`}
                  >
                    {u.aktiv ? "aktiv" : "gesperrt"}
                  </button>
                </td>
                <td className="py-2 text-right">
                  <button
                    onClick={() => loeschen(u.id, u.email)}
                    className="rounded p-1.5 text-slate-400 hover:bg-rose-50 hover:text-rose-500"
                    title="Löschen"
                  >
                    🗑
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}

// --- User-Logs ------------------------------------------------------------
function UserLogs() {
  const [logs, setLogs] = useState<LogRow[]>([]);
  const [laedt, setLaedt] = useState(true);
  const [fehler, setFehler] = useState<string | null>(null);

  const laden = useCallback(async () => {
    setLaedt(true);
    const { data, error } = await supabase!
      .from("audit_log")
      .select("id, ts, user_email, tabelle, datensatz_id, aktion, rueckgaengig_am")
      .order("ts", { ascending: false })
      .limit(300);
    if (error) setFehler(error.message);
    else setLogs((data ?? []) as LogRow[]);
    setLaedt(false);
  }, []);

  useEffect(() => {
    laden();
  }, [laden]);

  const rueckgaengig = async (id: number) => {
    if (!confirm("Diese Änderung rückgängig machen?")) return;
    const { error } = await supabase!.rpc("aenderung_rueckgaengig", { log_id: id });
    if (error) setFehler(error.message);
    else await laden();
  };

  const AKTION: Record<string, string> = {
    insert: "erstellt",
    update: "geändert",
    delete: "gelöscht",
  };

  return (
    <div>
      {fehler && (
        <p className="mb-3 rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-600">
          {fehler}
        </p>
      )}
      {laedt ? (
        <p className="py-6 text-center text-slate-400">Lädt…</p>
      ) : (
        <table className="w-full text-sm">
          <thead className="text-left text-xs uppercase text-slate-500">
            <tr className="border-b border-slate-200">
              <th className="py-2">Zeit</th>
              <th className="py-2">Nutzer</th>
              <th className="py-2">Aktion</th>
              <th className="py-2">Datensatz</th>
              <th className="py-2"></th>
            </tr>
          </thead>
          <tbody>
            {logs.map((l) => (
              <tr key={l.id} className="border-b border-slate-100">
                <td className="py-2 text-xs text-slate-500">
                  {new Date(l.ts).toLocaleString("de-DE")}
                </td>
                <td className="py-2 text-xs">{l.user_email ?? "—"}</td>
                <td className="py-2">
                  {AKTION[l.aktion] ?? l.aktion}{" "}
                  <span className="text-xs text-slate-400">({l.tabelle})</span>
                </td>
                <td className="py-2 text-xs text-slate-400">{l.datensatz_id}</td>
                <td className="py-2 text-right">
                  {l.rueckgaengig_am ? (
                    <span className="text-xs text-slate-400">zurückgenommen</span>
                  ) : (
                    <button
                      onClick={() => rueckgaengig(l.id)}
                      className="rounded border border-slate-200 px-2 py-1 text-xs text-slate-600 hover:bg-slate-50"
                    >
                      Rückgängig
                    </button>
                  )}
                </td>
              </tr>
            ))}
            {logs.length === 0 && (
              <tr>
                <td colSpan={5} className="py-6 text-center text-slate-400">
                  Noch keine Einträge.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      )}
    </div>
  );
}

// --- Backups --------------------------------------------------------------
function Backups() {
  const [snaps, setSnaps] = useState<SnapRow[]>([]);
  const [laedt, setLaedt] = useState(true);
  const [fehler, setFehler] = useState<string | null>(null);
  const [hinweis, setHinweis] = useState<string | null>(null);

  const laden = useCallback(async () => {
    setLaedt(true);
    const { data, error } = await supabase!.rpc("snapshot_liste");
    if (error) setFehler(error.message);
    else setSnaps((data ?? []) as SnapRow[]);
    setLaedt(false);
  }, []);

  useEffect(() => {
    laden();
  }, [laden]);

  const wiederherstellen = async (datum: string) => {
    if (
      !confirm(
        `Den kompletten Datenstand vom ${datum} wiederherstellen?\n\nDer aktuelle Stand wird vorher automatisch gesichert.`,
      )
    )
      return;
    setHinweis(null);
    const { error } = await supabase!.rpc("snapshot_wiederherstellen", {
      p_datum: datum,
    });
    if (error) setFehler(error.message);
    else {
      setHinweis(`Stand vom ${datum} wiederhergestellt.`);
      await laden();
    }
  };

  return (
    <div>
      <p className="mb-3 text-sm text-slate-500">
        Täglich wird automatisch ein vollständiges Backup erstellt und 7 Tage
        aufbewahrt. Vor jeder Wiederherstellung wird der aktuelle Stand
        zusätzlich gesichert.
      </p>
      {fehler && (
        <p className="mb-3 rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-600">
          {fehler}
        </p>
      )}
      {hinweis && (
        <p className="mb-3 rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
          {hinweis}
        </p>
      )}
      {laedt ? (
        <p className="py-6 text-center text-slate-400">Lädt…</p>
      ) : (
        <table className="w-full text-sm">
          <thead className="text-left text-xs uppercase text-slate-500">
            <tr className="border-b border-slate-200">
              <th className="py-2">Datum</th>
              <th className="py-2">Erstellt</th>
              <th className="py-2">Inhalt</th>
              <th className="py-2"></th>
            </tr>
          </thead>
          <tbody>
            {snaps.map((s) => (
              <tr key={s.id} className="border-b border-slate-100">
                <td className="py-2 font-medium">{s.datum}</td>
                <td className="py-2 text-xs text-slate-500">
                  {new Date(s.erstellt_at).toLocaleString("de-DE")}
                </td>
                <td className="py-2 text-xs text-slate-500">
                  {s.anzahl_kampagnen} Kampagnen · {s.anzahl_veranstaltungen}{" "}
                  Veranstaltungen · {s.anzahl_epics} Epics
                </td>
                <td className="py-2 text-right">
                  <button
                    onClick={() => wiederherstellen(s.datum)}
                    className="rounded border border-slate-200 px-2 py-1 text-xs text-slate-600 hover:bg-slate-50"
                  >
                    Wiederherstellen
                  </button>
                </td>
              </tr>
            ))}
            {snaps.length === 0 && (
              <tr>
                <td colSpan={4} className="py-6 text-center text-slate-400">
                  Noch keine Backups vorhanden.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      )}
    </div>
  );
}
