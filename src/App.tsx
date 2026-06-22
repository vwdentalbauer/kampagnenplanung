import { useMemo, useRef, useState, type ChangeEvent } from "react";
import { getISOWeek } from "date-fns";
import type { Kampagne, Status, Rolle } from "./types";
import { useAuth } from "./auth/AuthContext";
import { useKampagnen, eindeutigeWerte } from "./data/useKampagnen";
import { kwAusDatum, quartalAusDatum } from "./lib/date";
import { ROLLEN_LABELS, STATUS_LABELS, STATUS_REIHENFOLGE, STATUS_STYLE } from "./constants";
import { LEERER_FILTER, passt, facette, type Filter } from "./lib/filter";
import { FilterBar } from "./components/FilterBar";
import { TabellenAnsicht } from "./components/TabellenAnsicht";
import { WochenAnsicht } from "./components/WochenAnsicht";
import { ZielAnsicht } from "./components/ZielAnsicht";
import { KampagneEditor } from "./components/KampagneEditor";
import { Logo } from "./components/Logo";

type Ansicht = "tabelle" | "woche" | "ziel";

export default function App() {
  const { nutzer, setRolle, darfBearbeiten, istAdmin, abmelden } = useAuth();
  const {
    kampagnen,
    geladen,
    speichern,
    speichernViele,
    loeschen,
    loeschenViele,
    ersetzeAlle,
    zuruecksetzen,
  } = useKampagnen();

  const [ansicht, setAnsicht] = useState<Ansicht>("tabelle");
  const [filter, setFilter] = useState<Filter>(LEERER_FILTER);
  const [editor, setEditor] = useState<{ offen: boolean; kampagne: Kampagne | null }>({
    offen: false,
    kampagne: null,
  });
  const fileRef = useRef<HTMLInputElement>(null);

  const aktuelleKw = getISOWeek(new Date());
  const gefiltert = useMemo(() => kampagnen.filter((k) => passt(k, filter)), [kampagnen, filter]);

  // Von den übrigen Filtern abhängige Auswahlwerte (Faceted Search).
  const facetten = useMemo(
    () => ({
      quartale: facette(kampagnen, filter, "quartale"),
      status: facette(kampagnen, filter, "status") as Status[],
      kanaele: facette(kampagnen, filter, "kanaele"),
      owners: facette(kampagnen, filter, "owners"),
      kampagnen: facette(kampagnen, filter, "kampagne"),
      ziele: facette(kampagnen, filter, "ziel"),
    }),
    [kampagnen, filter],
  );

  // Vollständige Wertelisten (für die Eingabe-Dropdowns im Editor).
  const alleKanaele = useMemo(() => eindeutigeWerte(kampagnen, "kanal"), [kampagnen]);
  const alleKampagnen = useMemo(() => eindeutigeWerte(kampagnen, "kampagne"), [kampagnen]);
  const alleOwners = useMemo(() => {
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

  // Wendet einen Patch an und pflegt abgeleitete Felder (KW, Quartal, owners) mit.
  const mitPatch = (k: Kampagne, patch: Partial<Kampagne>): Kampagne => {
    const next = { ...k, ...patch };
    if (patch.weekStart !== undefined) {
      next.kw = kwAusDatum(next.weekStart) ?? next.kw;
      next.quartal = quartalAusDatum(next.weekStart) ?? next.quartal;
    }
    if (patch.verantwortung !== undefined) {
      next.owners = patch.verantwortung
        .split(/[/,]/)
        .map((o) => o.trim())
        .filter(Boolean);
    }
    return next;
  };

  // Inline-Änderung aus der Tabelle.
  const onUpdate = (k: Kampagne, patch: Partial<Kampagne>) => speichern(mitPatch(k, patch));

  // Mehrfachbearbeitung: Patch auf alle ausgewählten Kampagnen anwenden.
  const onBulkUpdate = (ids: string[], patch: Partial<Kampagne>) => {
    const idSet = new Set(ids);
    const updates = kampagnen.filter((k) => idSet.has(k.id)).map((k) => mitPatch(k, patch));
    if (updates.length) speichernViele(updates);
  };

  const onBulkDelete = (ids: string[]) => {
    if (ids.length) loeschenViele(ids);
  };

  // Excel-Export (xlsx wird nur bei Bedarf nachgeladen).
  const onExport = async () => {
    const { exportExcel } = await import("./lib/excel");
    exportExcel(kampagnen);
  };

  // Excel-Import (ersetzt den Bestand).
  const onImport = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const { importExcel } = await import("./lib/excel");
      const ks = await importExcel(file);
      if (!ks.length) {
        alert("Keine Daten in der Datei gefunden.");
      } else if (
        confirm(`${ks.length} Einträge importieren?\nDer aktuelle Bestand wird ersetzt.`)
      ) {
        await ersetzeAlle(ks);
      }
    } catch (err) {
      alert("Import fehlgeschlagen: " + (err as Error).message);
    } finally {
      e.target.value = "";
    }
  };

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
        <div className="flex items-center gap-3">
          <Logo className="h-11 w-auto" />
          <div>
            <h1 className="text-2xl font-bold text-marke">Kampagnenplanung 2026</h1>
            <p className="text-sm text-slate-500">
              {kampagnen.length} Maßnahmen · Ersatz für den Excel-Jahresplan
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3 text-sm">
          <span className="text-slate-500">{nutzer.name}</span>
          {istAdmin && (
            <label className="flex items-center gap-2 rounded-md border border-slate-200 bg-white px-2 py-1">
              <span className="text-slate-400 text-xs">Rolle</span>
              <select
                value={nutzer.rolle}
                onChange={(e) => setRolle(e.target.value as Rolle)}
                className="bg-transparent text-sm font-medium focus:outline-none"
              >
                {(Object.keys(ROLLEN_LABELS) as Rolle[]).map((r) => (
                  <option key={r} value={r}>
                    {ROLLEN_LABELS[r]}
                  </option>
                ))}
              </select>
            </label>
          )}
          <button
            onClick={abmelden}
            className="rounded-md border border-slate-200 bg-white px-3 py-1 text-sm text-slate-500 hover:bg-slate-50"
          >
            Abmelden
          </button>
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
          {tab("tabelle", "📋 Tabelle")}
          {tab("woche", "📅 Nach Woche")}
          {tab("ziel", "📣 Nach Kampagne")}
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={onExport}
            title="Alle Einträge als Excel im Originalformat exportieren"
            className="rounded border border-slate-300 px-3 py-1.5 text-sm text-slate-600 hover:bg-slate-100"
          >
            ⬇ Excel-Export
          </button>
          {istAdmin && (
            <>
              <button
                onClick={() => fileRef.current?.click()}
                title="Excel-Datei importieren (ersetzt den Bestand)"
                className="rounded border border-slate-300 px-3 py-1.5 text-sm text-slate-600 hover:bg-slate-100"
              >
                ⬆ Excel-Import
              </button>
              <input
                ref={fileRef}
                type="file"
                accept=".xlsx,.xls"
                className="hidden"
                onChange={onImport}
              />
              <button
                onClick={() => {
                  if (confirm("Alle lokalen Änderungen verwerfen und Originaldaten laden?"))
                    zuruecksetzen();
                }}
                className="rounded border border-slate-300 px-3 py-1.5 text-sm text-slate-500 hover:bg-slate-100"
              >
                Daten zurücksetzen
              </button>
            </>
          )}
          {darfBearbeiten && (
            <button
              onClick={() => setEditor({ offen: true, kampagne: null })}
              className="rounded-md bg-marke px-4 py-1.5 text-sm font-medium text-white hover:bg-marke-dark"
            >
              + Neuer Eintrag
            </button>
          )}
        </div>
      </div>

      <div className="mb-4">
        <FilterBar
          filter={filter}
          setFilter={setFilter}
          quartale={facetten.quartale}
          status={facetten.status}
          kanaele={facetten.kanaele}
          owners={facetten.owners}
          kampagnen={facetten.kampagnen}
          ziele={facetten.ziele}
          aktuelleKw={aktuelleKw}
        />
      </div>

      {!geladen ? (
        <p className="py-10 text-center text-slate-400">Lädt…</p>
      ) : ansicht === "tabelle" ? (
        <TabellenAnsicht
          kampagnen={gefiltert}
          darfBearbeiten={darfBearbeiten}
          kanaele={eindeutigeWerte(kampagnen, "kanal")}
          onEdit={(k) => setEditor({ offen: true, kampagne: k })}
          onDelete={onDelete}
          onUpdate={onUpdate}
          onBulkUpdate={onBulkUpdate}
          onBulkDelete={onBulkDelete}
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
          kanaele={alleKanaele}
          kampagnen={alleKampagnen}
          verantwortliche={alleOwners}
          onSave={onSave}
          onClose={() => setEditor({ offen: false, kampagne: null })}
        />
      )}

      <footer className="mt-10 border-t border-slate-200 pt-4 text-center text-xs text-slate-400">
        Demo-Stand · Daten liegen lokal im Browser · Nutzerverwaltung &amp; gemeinsame
        Datenbank folgen über Supabase
        <div className="mt-1 text-slate-300">Version vom {__BUILD_TIME__}</div>
      </footer>
    </div>
  );
}
