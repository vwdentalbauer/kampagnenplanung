import { useMemo, useRef, useState, type ChangeEvent } from "react";
import { getISOWeek } from "date-fns";
import type { Kampagne, Status, Rolle } from "./types";
import { useAuth } from "./auth/AuthContext";
import { useKampagnen, eindeutigeWerte } from "./data/useKampagnen";
import { kwAusDatum, quartalAusDatum } from "./lib/date";
import { ROLLEN_LABELS, STATUS_LABELS, STATUS_REIHENFOLGE, STATUS_STYLE } from "./constants";
import { LEERER_FILTER, passt, facette, gibtLeere, subKanalListe, type Filter } from "./lib/filter";
import { useEpics } from "./data/useEpics";
import { useVeranstaltungen, type Veranstaltung } from "./data/useVeranstaltungen";
import { FilterBar } from "./components/FilterBar";
import { TabellenAnsicht } from "./components/TabellenAnsicht";
import { ZielAnsicht } from "./components/ZielAnsicht";
import { VeranstaltungenAnsicht } from "./components/VeranstaltungenAnsicht";
import { KampagneEditor } from "./components/KampagneEditor";
import { VeranstaltungEditor } from "./components/VeranstaltungEditor";
import { Logo } from "./components/Logo";

type Ansicht = "tabelle" | "ziel" | "event";

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
  const { epics, setZeitraum } = useEpics();
  const { events, speichern: speichernEvent, loeschen: loeschenEvent } = useVeranstaltungen();

  const [ansicht, setAnsicht] = useState<Ansicht>("tabelle");
  const [eventEditor, setEventEditor] = useState<{ offen: boolean; kategorie: string | null }>({
    offen: false,
    kategorie: null,
  });
  // Beim Login standardmäßig „ab aktueller Woche" filtern (vergangene Wochen
  // ausgeblendet, wie ein Filter von dieser KW bis Jahresende).
  const [filter, setFilter] = useState<Filter>(() => ({
    ...LEERER_FILTER,
    kwVon: String(getISOWeek(new Date())),
  }));
  const [editor, setEditor] = useState<{ offen: boolean; kampagne: Kampagne | null }>({
    offen: false,
    kampagne: null,
  });
  const fileRef = useRef<HTMLInputElement>(null);
  const [mehrOffen, setMehrOffen] = useState(false);
  const [eventBand, setEventBand] = useState(true);

  const aktuelleKw = getISOWeek(new Date());
  const gefiltert = useMemo(() => kampagnen.filter((k) => passt(k, filter)), [kampagnen, filter]);

  // Von den übrigen Filtern abhängige Auswahlwerte (Faceted Search).
  const facetten = useMemo(
    () => ({
      quartale: facette(kampagnen, filter, "quartale"),
      status: facette(kampagnen, filter, "status") as Status[],
      kanaele: facette(kampagnen, filter, "kanaele"),
      subkanaele: facette(kampagnen, filter, "subkanaele"),
      owners: facette(kampagnen, filter, "owners"),
      kampagnen: facette(kampagnen, filter, "kampagne"),
    }),
    [kampagnen, filter],
  );

  // „(leer)"-Optionen nur, wenn es leere Felder gibt.
  const leer = useMemo(
    () => ({
      kanaele: gibtLeere(kampagnen, filter, "kanaele"),
      subKanaele: gibtLeere(kampagnen, filter, "subkanaele"),
      owners: gibtLeere(kampagnen, filter, "owners"),
      kampagnen: gibtLeere(kampagnen, filter, "kampagne"),
    }),
    [kampagnen, filter],
  );

  // Vollständige Wertelisten (für die Eingabe-Dropdowns im Editor).
  const alleKanaele = useMemo(() => eindeutigeWerte(kampagnen, "kanal"), [kampagnen]);
  const alleSubKanaele = useMemo(() => {
    const set = new Set<string>();
    kampagnen.forEach((k) => subKanalListe(k.subKanal).forEach((s) => set.add(s)));
    return [...set].sort((a, b) => a.localeCompare(b, "de"));
  }, [kampagnen]);
  const alleKampagnen = useMemo(() => eindeutigeWerte(kampagnen, "kampagne"), [kampagnen]);
  // Angelegte Veranstaltungen als Liste (für Auswahl im Eintrag + Editor).
  const veranstaltungenListe = useMemo<Veranstaltung[]>(
    () =>
      Object.entries(events)
        .map(([kategorie, m]) => ({ kategorie, ...m }))
        .sort((a, b) => a.kategorie.localeCompare(b.kategorie, "de")),
    [events],
  );
  const eventOrte = useMemo(() => {
    const set = new Set<string>();
    Object.values(events).forEach((m) => m.subs.forEach((s) => s.ort && set.add(s.ort)));
    return [...set].sort();
  }, [events]);
  // Flache Liste aller Sub-Veranstaltungen (für die Tabellen-Leiste).
  const subEvents = useMemo(
    () =>
      Object.entries(events)
        .flatMap(([kat, m]) => m.subs.map((s) => ({ kat, ...s })))
        .filter((s) => s.ort || s.start)
        .sort((a, b) => (a.start || "9999").localeCompare(b.start || "9999")),
    [events],
  );
  const alleOwners = useMemo(() => {
    const set = new Set<string>();
    kampagnen.forEach((k) => k.owners.forEach((o) => set.add(o)));
    return [...set].sort((a, b) => a.localeCompare(b, "de"));
  }, [kampagnen]);

  // Vollständige Vorschläge für die Inline-Bearbeitung – unabhängig vom Filter.
  const vorschlaege = useMemo(() => {
    const details = new Set<string>();
    kampagnen.forEach((k) => k.details.trim() && details.add(k.details.trim()));
    return {
      kanal: alleKanaele,
      subKanal: alleSubKanaele,
      kampagne: alleKampagnen,
      details: [...details].sort((a, b) => a.localeCompare(b, "de")),
    };
  }, [kampagnen, alleKanaele, alleSubKanaele, alleKampagnen]);

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

  // Veranstaltungen (Events)
  const onSaveEvent = (v: Veranstaltung, vorher?: string) => {
    speichernEvent(v, vorher);
    setEventEditor({ offen: false, kategorie: null });
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
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex gap-1 rounded-lg border border-slate-200 bg-white p-1">
            {tab("tabelle", "📋 Tabelle")}
            {tab("ziel", "📣 Kampagne")}
            {tab("event", "🎟 Veranstaltungen")}
          </div>
          <button
            onClick={() => setEventBand((v) => !v)}
            title="Veranstaltungen in der Tabelle ein-/ausblenden"
            className={`rounded-md border px-3 py-1.5 text-sm font-medium ${
              eventBand
                ? "border-marke bg-marke/10 text-marke-dark"
                : "border-slate-300 bg-white text-slate-500"
            }`}
          >
            🎟 Veranstaltungen {eventBand ? "ausblenden" : "einblenden"}
          </button>
        </div>
        <div className="flex items-center gap-2">
          {/* Dezentes „Mehr"-Menü: Excel & Daten */}
          <div className="relative">
            <button
              onClick={() => setMehrOffen((o) => !o)}
              title="Excel & Daten"
              className="rounded border border-slate-200 px-2 py-1.5 text-sm text-slate-400 hover:bg-slate-100 hover:text-slate-600"
            >
              ⋯
            </button>
            {mehrOffen && (
              <>
                <div className="fixed inset-0 z-10" onClick={() => setMehrOffen(false)} />
                <div className="absolute right-0 z-20 mt-1 w-56 rounded-lg border border-slate-200 bg-white py-1 text-sm shadow-lg">
                  <button
                    onClick={() => {
                      setMehrOffen(false);
                      onExport();
                    }}
                    className="block w-full px-3 py-2 text-left text-slate-600 hover:bg-slate-50"
                  >
                    ⬇ Excel-Export
                  </button>
                  {istAdmin && (
                    <>
                      <button
                        onClick={() => {
                          setMehrOffen(false);
                          fileRef.current?.click();
                        }}
                        className="block w-full px-3 py-2 text-left text-slate-600 hover:bg-slate-50"
                      >
                        ⬆ Excel-Import (ersetzt Bestand)
                      </button>
                      <button
                        onClick={() => {
                          setMehrOffen(false);
                          if (confirm("Alle lokalen Änderungen verwerfen und Originaldaten laden?"))
                            zuruecksetzen();
                        }}
                        className="block w-full px-3 py-2 text-left text-slate-500 hover:bg-slate-50"
                      >
                        Daten zurücksetzen
                      </button>
                    </>
                  )}
                </div>
              </>
            )}
          </div>
          <input
            ref={fileRef}
            type="file"
            accept=".xlsx,.xls"
            className="hidden"
            onChange={onImport}
          />
          {darfBearbeiten && (
            <button
              onClick={() => setEventEditor({ offen: true, kategorie: null })}
              className="rounded-md border border-marke px-3 py-1.5 text-sm font-medium text-marke-dark hover:bg-marke/10"
            >
              + Neue Veranstaltung
            </button>
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
          subKanaele={facetten.subkanaele}
          owners={facetten.owners}
          kampagnen={facetten.kampagnen}
          aktuelleKw={aktuelleKw}
          leerKanaele={leer.kanaele}
          leerSubKanaele={leer.subKanaele}
          leerOwners={leer.owners}
          leerKampagnen={leer.kampagnen}
        />
      </div>

      {!geladen ? (
        <p className="py-10 text-center text-slate-400">Lädt…</p>
      ) : ansicht === "tabelle" ? (
        <TabellenAnsicht
          kampagnen={gefiltert}
          darfBearbeiten={darfBearbeiten}
          kanaele={eindeutigeWerte(kampagnen, "kanal")}
          vorschlaege={vorschlaege}
          eventZeilen={eventBand ? subEvents : []}
          onEventClick={() => setAnsicht("event")}
          onEdit={(k) => setEditor({ offen: true, kampagne: k })}
          onDelete={onDelete}
          onUpdate={onUpdate}
          onBulkUpdate={onBulkUpdate}
          onBulkDelete={onBulkDelete}
        />
      ) : ansicht === "ziel" ? (
        <ZielAnsicht
          kampagnen={gefiltert}
          darfBearbeiten={darfBearbeiten}
          kanaele={eindeutigeWerte(kampagnen, "kanal")}
          vorschlaege={vorschlaege}
          epics={epics}
          onZeitraum={setZeitraum}
          onEdit={(k) => setEditor({ offen: true, kampagne: k })}
          onDelete={onDelete}
          onUpdate={onUpdate}
          onBulkUpdate={onBulkUpdate}
          onBulkDelete={onBulkDelete}
        />
      ) : (
        <VeranstaltungenAnsicht
          kampagnen={gefiltert}
          darfBearbeiten={darfBearbeiten}
          kanaele={eindeutigeWerte(kampagnen, "kanal")}
          vorschlaege={vorschlaege}
          events={events}
          onEditEvent={(kategorie) => setEventEditor({ offen: true, kategorie })}
          onEdit={(k) => setEditor({ offen: true, kampagne: k })}
          onDelete={onDelete}
          onUpdate={onUpdate}
          onBulkUpdate={onBulkUpdate}
          onBulkDelete={onBulkDelete}
        />
      )}

      {editor.offen && (
        <KampagneEditor
          kampagne={editor.kampagne}
          kanaele={alleKanaele}
          subKanaele={alleSubKanaele}
          kampagnen={alleKampagnen}
          verantwortliche={alleOwners}
          veranstaltungen={veranstaltungenListe}
          onNeueVeranstaltung={() => setEventEditor({ offen: true, kategorie: null })}
          onSave={onSave}
          onClose={() => setEditor({ offen: false, kampagne: null })}
        />
      )}

      {eventEditor.offen && (
        <VeranstaltungEditor
          veranstaltung={
            eventEditor.kategorie
              ? { kategorie: eventEditor.kategorie, ...events[eventEditor.kategorie] }
              : null
          }
          orte={eventOrte}
          onSave={onSaveEvent}
          onDelete={loeschenEvent}
          onClose={() => setEventEditor({ offen: false, kategorie: null })}
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
