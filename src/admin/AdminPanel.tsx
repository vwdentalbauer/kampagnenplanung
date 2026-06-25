import { Fragment, useCallback, useEffect, useState } from "react";
import { supabase } from "../lib/supabase";
import { ROLLEN_LABELS } from "../constants";
import type { Rolle, Kampagne } from "../types";
import { repository, normalisieren } from "../data/repository";

type Tab = "nutzer" | "logs" | "backups" | "lokal";

interface ProfilRow {
  id: string;
  email: string;
  name: string;
  rolle: Rolle;
  aktiv: boolean;
  created_at: string;
  last_sign_in_at?: string | null;
}

interface LogRow {
  id: number;
  ts: string;
  user_email: string | null;
  tabelle: string;
  datensatz_id: string | null;
  aktion: string;
  rueckgaengig_am: string | null;
  alt: Record<string, unknown> | null;
  neu: Record<string, unknown> | null;
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
            ["lokal", "📥 Lokale Daten"],
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
          {tab === "lokal" && <LokaleDaten />}
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
  const [passwort, setPasswort] = useState("");
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

  const passwortGenerieren = () => {
    const z = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789";
    const arr = crypto.getRandomValues(new Uint32Array(12));
    setPasswort(Array.from(arr, (n) => z[n % z.length]).join(""));
  };

  const einladen = async () => {
    setFehler(null);
    setHinweis(null);
    if (!email.trim()) return;
    if (passwort && passwort.length < 8) {
      setFehler("Das Start-Passwort muss mindestens 8 Zeichen haben.");
      return;
    }
    try {
      const d = await adminAktion({
        action: "invite",
        email,
        name,
        rolle,
        // Wenn ein Passwort gesetzt ist: Konto direkt anlegen (ohne E-Mail-Link).
        passwort: passwort || undefined,
        redirectTo: window.location.origin + window.location.pathname,
      });
      setHinweis(
        d.modus === "passwort"
          ? `Konto angelegt. Bitte Zugangsdaten weitergeben — E-Mail: ${email} · Passwort: ${passwort}`
          : "Einladung per E-Mail verschickt.",
      );
      setEmail("");
      setName("");
      setRolle("viewer");
      setPasswort("");
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

  const neuesPasswort = async (id: string, email: string) => {
    const z = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789";
    const arr = crypto.getRandomValues(new Uint32Array(12));
    const pw = Array.from(arr, (n) => z[n % z.length]).join("");
    if (!confirm(`Für ${email} ein neues Passwort erzeugen?`)) return;
    setFehler(null);
    setHinweis(null);
    try {
      await adminAktion({ action: "set_password", id, passwort: pw });
      setHinweis(`Neues Passwort für ${email}: ${pw}  (bitte weitergeben)`);
    } catch (e) {
      setFehler((e as Error).message);
    }
  };

  return (
    <div>
      {/* Einladen / Anlegen */}
      <div className="mb-4 rounded-lg border border-slate-200 bg-slate-50 p-3">
        <h3 className="mb-2 text-sm font-semibold text-slate-700">
          Neuen Nutzer anlegen
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
        </div>

        <div className="mt-2 flex flex-wrap items-end gap-2">
          <input
            type="text"
            placeholder="Start-Passwort (optional – ohne E-Mail-Einladung)"
            value={passwort}
            onChange={(e) => setPasswort(e.target.value)}
            className="flex-1 rounded-lg border border-slate-300 px-3 py-2 text-sm"
          />
          <button
            type="button"
            onClick={passwortGenerieren}
            title="Sicheres Passwort erzeugen"
            className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-600 hover:bg-slate-50"
          >
            🎲 Erzeugen
          </button>
          <button
            onClick={einladen}
            className="rounded-lg bg-marke px-4 py-2 text-sm font-medium text-white hover:bg-marke-dark"
          >
            {passwort ? "Konto anlegen" : "Per E-Mail einladen"}
          </button>
        </div>

        <p className="mt-2 text-xs text-slate-500">
          <strong>Mit Start-Passwort</strong> (empfohlen, sofort nutzbar): Konto
          wird direkt angelegt – E-Mail + Passwort der Person mitteilen, sie kann
          sich sofort anmelden. <strong>Ohne Passwort</strong>: Einladung per
          E-Mail (setzt korrekte „Site URL"/SMTP in Supabase voraus).
        </p>

        {hinweis && (
          <p className="mt-2 select-all rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-800">
            {hinweis}
          </p>
        )}
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
                  {(() => {
                    // Login-Info nur auswerten, wenn der Server sie liefert
                    // (Feld vorhanden). Sonst neutral „aktiv" zeigen.
                    const hatLoginInfo = "last_sign_in_at" in u;
                    const status = !u.aktiv
                      ? { label: "gesperrt", cls: "bg-slate-100 text-slate-500" }
                      : hatLoginInfo && !u.last_sign_in_at
                        ? { label: "eingeladen", cls: "bg-amber-50 text-amber-700" }
                        : { label: "aktiv", cls: "bg-emerald-50 text-emerald-700" };
                    return (
                      <button
                        onClick={() => aktivSchalten(u.id, !u.aktiv)}
                        title={
                          u.aktiv
                            ? (u.last_sign_in_at
                                ? "Hat sich angemeldet · Klick zum Sperren"
                                : "Eingeladen, noch nicht angemeldet · Klick zum Sperren")
                            : "Gesperrt · Klick zum Freischalten"
                        }
                        className={`rounded px-2 py-1 text-xs font-medium ${status.cls}`}
                      >
                        {status.label}
                      </button>
                    );
                  })()}
                </td>
                <td className="py-2 text-right">
                  <button
                    onClick={() => neuesPasswort(u.id, u.email)}
                    className="mr-1 rounded p-1.5 text-slate-400 hover:bg-marke/10 hover:text-marke-dark"
                    title="Neues Passwort erzeugen"
                  >
                    🔑
                  </button>
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
const FELD_LABELS: Record<string, string> = {
  land: "Land", quartal: "Quartal", kw: "KW", week_start: "Startdatum",
  end_datum: "Enddatum", zielgruppe: "Zielgruppe", kanal: "Kanal",
  sub_kanal: "Sub-Kanal", kampagne: "Kampagne", details: "Details", ziel: "Ziel",
  kategorie: "Kategorie", bereiche: "Sparten", pluline: "PLULINE", wkz: "WKZ",
  veranstaltung: "Veranstaltung", sub_event: "Sub-Event", verantwortung: "Verantwortung",
  owners: "Verantwortliche", status: "Status", typ: "Typ", subs: "Orte/Termine",
  name: "Name", start: "Start", ende: "Ende",
};
const IGNORE_FELDER = new Set(["updated_at", "updated_by", "id"]);

function fmtWert(v: unknown): string {
  if (v === null || v === undefined || v === "") return "—";
  if (Array.isArray(v)) return v.length ? v.join(", ") : "—";
  if (typeof v === "boolean") return v ? "ja" : "nein";
  if (typeof v === "object") return JSON.stringify(v);
  return String(v);
}

interface FeldDiff {
  feld: string;
  alt: unknown;
  neu: unknown;
}
function diffFelder(
  alt: Record<string, unknown> | null,
  neu: Record<string, unknown> | null,
): FeldDiff[] {
  const keys = new Set([...Object.keys(alt ?? {}), ...Object.keys(neu ?? {})]);
  const out: FeldDiff[] = [];
  for (const k of keys) {
    if (IGNORE_FELDER.has(k)) continue;
    const a = alt?.[k];
    const n = neu?.[k];
    if (JSON.stringify(a) !== JSON.stringify(n)) out.push({ feld: k, alt: a, neu: n });
  }
  return out;
}

function UserLogs() {
  const [logs, setLogs] = useState<LogRow[]>([]);
  const [offenIds, setOffenIds] = useState<Set<number>>(new Set());
  const [laedt, setLaedt] = useState(true);
  const [fehler, setFehler] = useState<string | null>(null);
  const [suche, setSuche] = useState("");
  const [aktionFilter, setAktionFilter] = useState("");

  const laden = useCallback(async () => {
    setLaedt(true);
    const { data, error } = await supabase!
      .from("audit_log")
      .select("id, ts, user_email, tabelle, datensatz_id, aktion, rueckgaengig_am, alt, neu")
      .order("ts", { ascending: false })
      .limit(2000);
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
  const TABELLE: Record<string, string> = {
    kampagne: "Kampagne",
    veranstaltung: "Veranstaltung",
    epic: "Zeitraum",
  };

  const gefiltert = logs.filter((l) => {
    if (aktionFilter && l.aktion !== aktionFilter) return false;
    if (!suche.trim()) return true;
    const q = suche.toLowerCase();
    return [
      l.user_email ?? "",
      TABELLE[l.tabelle] ?? l.tabelle,
      AKTION[l.aktion] ?? l.aktion,
      l.datensatz_id ?? "",
      new Date(l.ts).toLocaleString("de-DE"),
    ]
      .join(" ")
      .toLowerCase()
      .includes(q);
  });

  const exportieren = async () => {
    const XLSX = await import("xlsx");
    const zeilen = gefiltert.map((l) => ({
      Zeit: new Date(l.ts).toLocaleString("de-DE"),
      Nutzer: l.user_email ?? "",
      Aktion: AKTION[l.aktion] ?? l.aktion,
      Bereich: TABELLE[l.tabelle] ?? l.tabelle,
      Datensatz: l.datensatz_id ?? "",
      Zurückgenommen: l.rueckgaengig_am
        ? new Date(l.rueckgaengig_am).toLocaleString("de-DE")
        : "",
    }));
    const ws = XLSX.utils.json_to_sheet(zeilen);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "User-Logs");
    const datum = new Date().toISOString().slice(0, 10);
    XLSX.writeFile(wb, `User-Logs_${datum}.xlsx`);
  };

  return (
    <div>
      {/* Such-/Filterleiste */}
      <div className="mb-3 flex flex-wrap items-center gap-2">
        <input
          placeholder="Suchen (Nutzer, Bereich, Datensatz …)"
          value={suche}
          onChange={(e) => setSuche(e.target.value)}
          className="flex-1 rounded-lg border border-slate-300 px-3 py-2 text-sm"
        />
        <select
          value={aktionFilter}
          onChange={(e) => setAktionFilter(e.target.value)}
          className="rounded-lg border border-slate-300 px-2 py-2 text-sm"
        >
          <option value="">Alle Aktionen</option>
          <option value="insert">erstellt</option>
          <option value="update">geändert</option>
          <option value="delete">gelöscht</option>
        </select>
        <button
          onClick={exportieren}
          disabled={gefiltert.length === 0}
          className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-600 hover:bg-slate-50 disabled:opacity-50"
        >
          ⬇ Excel
        </button>
      </div>

      {fehler && (
        <p className="mb-3 rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-600">
          {fehler}
        </p>
      )}
      {laedt ? (
        <p className="py-6 text-center text-slate-400">Lädt…</p>
      ) : (
        <>
          <p className="mb-2 text-xs text-slate-400">
            {gefiltert.length} von {logs.length} Einträgen
          </p>
          <div className="max-h-[55vh] overflow-y-auto">
            <table className="w-full text-sm">
              <thead className="sticky top-0 bg-white text-left text-xs uppercase text-slate-500">
                <tr className="border-b border-slate-200">
                  <th className="py-2">Zeit</th>
                  <th className="py-2">Nutzer</th>
                  <th className="py-2">Aktion</th>
                  <th className="py-2">Datensatz</th>
                  <th className="py-2"></th>
                </tr>
              </thead>
              <tbody>
                {gefiltert.map((l) => {
                  const offen = offenIds.has(l.id);
                  const diff =
                    l.aktion === "update"
                      ? diffFelder(l.alt, l.neu)
                      : l.aktion === "insert"
                        ? diffFelder({}, l.neu)
                        : diffFelder(l.alt, {});
                  return (
                    <Fragment key={l.id}>
                      <tr className="border-b border-slate-100">
                        <td className="py-2 text-xs text-slate-500">
                          {new Date(l.ts).toLocaleString("de-DE")}
                        </td>
                        <td className="py-2 text-xs">{l.user_email ?? "—"}</td>
                        <td className="py-2">
                          <button
                            onClick={() =>
                              setOffenIds((s) => {
                                const n = new Set(s);
                                n.has(l.id) ? n.delete(l.id) : n.add(l.id);
                                return n;
                              })
                            }
                            className="text-left hover:text-marke-dark"
                            title="Details ein-/ausblenden"
                          >
                            <span className={`mr-1 inline-block text-[10px] text-slate-400 ${offen ? "rotate-90" : ""}`}>▶</span>
                            {AKTION[l.aktion] ?? l.aktion}{" "}
                            <span className="text-xs text-slate-400">
                              ({TABELLE[l.tabelle] ?? l.tabelle})
                            </span>
                          </button>
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
                      {offen && (
                        <tr className="border-b border-slate-100 bg-slate-50">
                          <td colSpan={5} className="px-3 py-2">
                            {diff.length === 0 ? (
                              <p className="text-xs text-slate-400">Keine Feldänderungen.</p>
                            ) : (
                              <table className="w-full text-xs">
                                <tbody>
                                  {diff.map((d) => (
                                    <tr key={d.feld}>
                                      <td className="w-40 py-0.5 pr-2 align-top font-medium text-slate-600">
                                        {FELD_LABELS[d.feld] ?? d.feld}
                                      </td>
                                      <td className="py-0.5">
                                        {l.aktion === "update" ? (
                                          <span>
                                            <span className="text-rose-600 line-through">
                                              {fmtWert(d.alt)}
                                            </span>{" "}
                                            <span className="text-slate-400">→</span>{" "}
                                            <span className="text-emerald-700">
                                              {fmtWert(d.neu)}
                                            </span>
                                          </span>
                                        ) : l.aktion === "insert" ? (
                                          <span className="text-emerald-700">{fmtWert(d.neu)}</span>
                                        ) : (
                                          <span className="text-slate-600">{fmtWert(d.alt)}</span>
                                        )}
                                      </td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            )}
                          </td>
                        </tr>
                      )}
                    </Fragment>
                  );
                })}
                {gefiltert.length === 0 && (
                  <tr>
                    <td colSpan={5} className="py-6 text-center text-slate-400">
                      Keine passenden Einträge.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </>
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

// --- Lokale Daten übernehmen ----------------------------------------------
// Einmalige Wiederherstellung: liest die im Browser (localStorage) noch
// vorhandenen Daten dieses Geräts und überträgt sie in die gemeinsame
// Supabase-Datenbank (Upsert). Gedacht für den Wechsel vom lokalen Modus
// auf das gemeinsame Backend.
interface SubEvent {
  id: string;
  name: string;
  ort: string;
  start: string | null;
  ende: string | null;
}
interface EventMeta {
  typ: string;
  subs: SubEvent[];
}
type ProLand = Record<string, Record<string, EventMeta>>;

function leseKampagnen(): Kampagne[] {
  try {
    const raw = localStorage.getItem("kampagnen.v1");
    if (!raw) return [];
    return normalisieren(JSON.parse(raw) as Kampagne[]);
  } catch {
    return [];
  }
}

function migriereFlach(roh: Record<string, any>): Record<string, EventMeta> {
  const out: Record<string, EventMeta> = {};
  for (const [kat, m] of Object.entries(roh)) {
    if (Array.isArray(m?.subs)) {
      out[kat] = { typ: m.typ ?? "", subs: m.subs.map((s: any) => ({ ...s, name: s.name ?? "" })) };
    } else {
      const sub: SubEvent[] =
        m?.ort || m?.start
          ? [{ id: `s${Date.now()}_${kat}`, name: "", ort: m.ort ?? "", start: m.start ?? null, ende: m.ende ?? null }]
          : [];
      out[kat] = { typ: m?.typ ?? "", subs: sub };
    }
  }
  return out;
}

function leseVeranstaltungen(): ProLand {
  try {
    const v3 = localStorage.getItem("kampagnen.veranstaltungen.v3");
    if (v3) return JSON.parse(v3) as ProLand;
    const alt = localStorage.getItem("kampagnen.veranstaltungen.v2") ??
      localStorage.getItem("kampagnen.veranstaltungen.v1");
    if (alt) return { DE: migriereFlach(JSON.parse(alt)) };
    return {};
  } catch {
    return {};
  }
}

function leseEpics(): Record<string, { start: string | null; ende: string | null }> {
  try {
    return JSON.parse(localStorage.getItem("kampagnen.epics.v1") ?? "{}");
  } catch {
    return {};
  }
}

function LokaleDaten() {
  const [kampagnen] = useState<Kampagne[]>(leseKampagnen);
  const [veranstaltungen] = useState<ProLand>(leseVeranstaltungen);
  const [epics] = useState(leseEpics);
  const [laeuft, setLaeuft] = useState(false);
  const [fehler, setFehler] = useState<string | null>(null);
  const [fertig, setFertig] = useState<string | null>(null);

  const anzVeranstaltungen = Object.values(veranstaltungen).reduce(
    (s, m) => s + Object.keys(m).length,
    0,
  );
  const anzEpics = Object.keys(epics).length;
  const nichts = kampagnen.length === 0 && anzVeranstaltungen === 0 && anzEpics === 0;

  const uebernehmen = async () => {
    if (
      !confirm(
        "Lokale Daten dieses Browsers in die gemeinsame Datenbank übernehmen?\n\n" +
          "Vorhandene Einträge mit gleicher ID/Schlüssel werden überschrieben " +
          "(deine lokale Version gewinnt). Neue Einträge werden ergänzt.",
      )
    )
      return;
    setLaeuft(true);
    setFehler(null);
    setFertig(null);
    try {
      // 1) Kampagnen (alle Länder)
      if (kampagnen.length) await repository.speichernViele(kampagnen);

      // 2) Veranstaltungen je Land/Kategorie
      for (const [land, kats] of Object.entries(veranstaltungen)) {
        for (const [kategorie, meta] of Object.entries(kats)) {
          const { error } = await supabase!
            .from("veranstaltung")
            .upsert(
              { land, kategorie, typ: meta.typ ?? "", subs: meta.subs ?? [] },
              { onConflict: "land,kategorie" },
            );
          if (error) throw error;
        }
      }

      // 3) Epics (Zeiträume)
      for (const [name, z] of Object.entries(epics)) {
        const { error } = await supabase!
          .from("epic")
          .upsert({ name, start: z.start, ende: z.ende }, { onConflict: "name" });
        if (error) throw error;
      }

      setFertig(
        `Übernommen: ${kampagnen.length} Kampagnen, ${anzVeranstaltungen} Veranstaltungen, ${anzEpics} Zeiträume. ` +
          "Bitte die Seite neu laden.",
      );
    } catch (e) {
      setFehler((e as Error).message);
    } finally {
      setLaeuft(false);
    }
  };

  return (
    <div>
      <p className="mb-3 text-sm text-slate-500">
        Überträgt die noch im <strong>localStorage dieses Browsers</strong>
        {" "}gespeicherten Daten in die gemeinsame Supabase-Datenbank. Dies hilft,
        wenn beim Umstieg auf das Backend Veranstaltungen oder eigene Änderungen
        fehlen. Am besten von dem Gerät ausführen, das den vollständigsten Stand
        hat. Mehrfaches Ausführen ist unkritisch (Upsert).
      </p>

      <div className="mb-4 rounded-lg border border-slate-200 bg-slate-50 p-3 text-sm">
        <div className="font-semibold text-slate-700">In diesem Browser gefunden:</div>
        <ul className="mt-1 space-y-0.5 text-slate-600">
          <li>📋 Kampagnen: <strong>{kampagnen.length}</strong></li>
          <li>🎟 Veranstaltungen: <strong>{anzVeranstaltungen}</strong></li>
          <li>🗓 Zeiträume (Epics): <strong>{anzEpics}</strong></li>
        </ul>
      </div>

      {nichts && (
        <p className="mb-3 rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-800">
          In diesem Browser wurden keine lokalen Daten gefunden. Versuche es ggf.
          auf einem anderen Gerät/Browser, auf dem zuletzt damit gearbeitet wurde.
        </p>
      )}
      {fehler && (
        <p className="mb-3 rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-600">{fehler}</p>
      )}
      {fertig && (
        <p className="mb-3 rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-700">{fertig}</p>
      )}

      <button
        onClick={uebernehmen}
        disabled={laeuft || nichts}
        className="rounded-lg bg-marke px-4 py-2 text-sm font-medium text-white hover:bg-marke-dark disabled:opacity-50"
      >
        {laeuft ? "Übernehme…" : "In Supabase übernehmen"}
      </button>
    </div>
  );
}
