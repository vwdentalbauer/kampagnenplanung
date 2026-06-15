import { useMemo, useState } from "react";
import type { Kampagne, Status, Rolle } from "./types";
import { useAuth } from "./auth/AuthContext";
import { useKampagnen, eindeutigeWerte } from "./data/useKampagnen";
import { ROLLEN_LABELS, STATUS_LABELS, STATUS_REIHENFOLGE, STATUS_STYLE } from "./constants";
import { FilterBar, LEERER_FILTER, type Filter } from "./components/FilterBar";
import { TabellenAnsicht } from "./components/TabellenAnsicht";
import { WochenAnsicht } from "./components/WochenAnsicht";
import { ZielAnsicht } from "./components/ZielAnsicht";
import { KampagneEditor } from "./components/KampagneEditor";

type Ansicht = "tabelle" | "woche" | "ziel";

export default function App() {
  const { nutzer, setRolle, darfBearbeiten, istAdmin } = useAuth();
  const { kampagnen, geladen, speichern, loeschen, zuruecksetzen } = useKampagnen();

  const [ansicht, setAnsicht] = useState<Ansicht>("woche");
  const [filter, setFilter] = useState<Filter>(LEERER_FILTER);
  const [editor, setEditor] = useState<{ offen: boolean; kampagne: Kampagne | null }>({
    offen: false,
    kampagne: null,
  });

  const gefiltert = useMemo(() => {
    const s = filter.suche.toLowerCase();
    return kampagnen.filter((k) => {
      if (filter.quartal && k.quartal !== filter.quartal) return false;
      if (filter.status && k.status !== filter.status) return false;
      if (filter.kanal && k.kanal !== filter.kanal) return false;
      if (filter.ziel && k.ziel !== filter.ziel) return false;
      if (filter.owner && !k.owners.includes(filter.owner)) return false;
      if (s && !`${k.details} ${k.ziel} ${k.kanal} ${k.verantwortung}`.toLowerCase().includes(s))
        return false;
      return true;
    });
  }, [kampagnen, filter]);

  const owners = useMemo(() => {
    const set = new Set<string>();
    kampagnen.forEach((k) => k.owners.forEach((o) => set.add(o)));
    return [...set].sort((a, b) => a.localeCompare(b, "de"));
  }, [kampagnen]);

  const statusZaehler = useMemo(() => {
    const z: Record<Status, number> = { geplant: 0, in_arbeit: 0, erledigt: 0, abgesagt: 0 };
    gefiltert.forEach((k) => z[k.status]++);
    return z;
  }, [gefiltert]);

  const onSave = (k: Kampagne) => {
    speichern(k);
    setEditor({ offen: false, kampagne: null });
  };
  const onDelete = (id: string) => {
    if (confirm("Kampagne wirklich löschen?")) loeschen(id);
  };
  const onStatus = (k: Kampagne, status: Status) => speichern({ ...k, status });

  const tab = (id: Ansicht, label: string) => (
    <button
      onClick={() => setAnsicht(id)}
      className={`rounded-md px-3 py-1.5 text-sm font-medium ${
        ansicht === id ? "bg-marke text-white" : "text-slate-600 hover:bg-slate-100"
      }`}
    >
      {label}
    </button>
  );

  return (
    <div className="mx-auto max-w-7xl p-4 sm:p-6">
      <header className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">Kampagnenplanung 2026</h1>
          <p className="text-sm text-slate-500">
            {kampagnen.length} Maßnahmen · Ersatz für den Excel-Jahresplan
          </p>
        </div>
        <div className="flex items-center gap-3 text-sm">
          {/* Rollen-Umschalter (Demo). Später: echte Anmeldung via Supabase. */}
          <label className="flex items-center gap-2 rounded-md border border-slate-200 bg-white px-2 py-1">
            <span className="text-slate-400">Rolle</span>
            <select
              value={nutzer.rolle}
              onChange={(e) => setRolle(e.target.value as Rolle)}
              className="bg-transparent font-medium focus:outline-none"
            >
              {(Object.keys(ROLLEN_LABELS) as Rolle[]).map((r) => (
                <option key={r} value={r}>
                  {ROLLEN_LABELS[r]}
                </option>
              ))}
            </select>
          </label>
        </div>
      </header>

      {/* KPI-Leiste */}
      <div className="mb-4 flex flex-wrap gap-2">
        {STATUS_REIHENFOLGE.map((s) => (
          <div
            key={s}
            className={`rounded-lg border px-3 py-2 text-sm ${STATUS_STYLE[s]}`}
          >
            <span className="text-lg font-bold">{statusZaehler[s]}</span>{" "}
            {STATUS_LABELS[s]}
          </div>
        ))}
      </div>

      {/* Steuerleiste */}
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex gap-1 rounded-lg border border-slate-200 bg-white p-1">
          {tab("woche", "📅 Nach Woche")}
          {tab("ziel", "🎯 Nach Ziel")}
          {tab("tabelle", "📋 Tabelle")}
        </div>
        <div className="flex items-center gap-2">
          {istAdmin && (
            <button
              onClick={() => {
                if (confirm("Alle lokalen Änderungen verwerfen und Originaldaten laden?"))
                  zuruecksetzen();
              }}
              className="rounded border border-slate-300 px-3 py-1.5 text-sm text-slate-500 hover:bg-slate-100"
            >
              Daten zurücksetzen
            </button>
          )}
          {darfBearbeiten && (
            <button
              onClick={() => setEditor({ offen: true, kampagne: null })}
              className="rounded-md bg-marke px-4 py-1.5 text-sm font-medium text-white hover:bg-marke-dark"
            >
              + Neue Kampagne
            </button>
          )}
        </div>
      </div>

      <div className="mb-4">
        <FilterBar
          filter={filter}
          setFilter={setFilter}
          kanaele={eindeutigeWerte(kampagnen, "kanal")}
          ziele={eindeutigeWerte(kampagnen, "ziel")}
          owners={owners}
          quartale={eindeutigeWerte(kampagnen, "quartal")}
        />
      </div>

      {!geladen ? (
        <p className="py-10 text-center text-slate-400">Lädt…</p>
      ) : ansicht === "tabelle" ? (
        <TabellenAnsicht
          kampagnen={gefiltert}
          darfBearbeiten={darfBearbeiten}
          onEdit={(k) => setEditor({ offen: true, kampagne: k })}
          onDelete={onDelete}
          onStatus={onStatus}
        />
      ) : ansicht === "woche" ? (
        <WochenAnsicht
          kampagnen={gefiltert}
          darfBearbeiten={darfBearbeiten}
          onEdit={(k) => setEditor({ offen: true, kampagne: k })}
        />
      ) : (
        <ZielAnsicht
          kampagnen={gefiltert}
          darfBearbeiten={darfBearbeiten}
          onEdit={(k) => setEditor({ offen: true, kampagne: k })}
        />
      )}

      {editor.offen && (
        <KampagneEditor
          kampagne={editor.kampagne}
          onSave={onSave}
          onClose={() => setEditor({ offen: false, kampagne: null })}
        />
      )}

      <footer className="mt-10 border-t border-slate-200 pt-4 text-center text-xs text-slate-400">
        Demo-Stand · Daten liegen lokal im Browser · Nutzerverwaltung &amp; gemeinsame
        Datenbank folgen über Supabase
      </footer>
    </div>
  );
}
