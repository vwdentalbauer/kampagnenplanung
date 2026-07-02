import { useCallback, useMemo, useRef, useState, type ChangeEvent } from "react";
import { getISOWeek } from "date-fns";
import type { Kampagne, Status } from "./types";
import { useAuth } from "./auth/AuthContext";
import { useKampagnen, eindeutigeWerte } from "./data/useKampagnen";
import { useLocks } from "./data/useLock";
import { kwAusDatum, quartalAusDatum } from "./lib/date";
import { MANDANTEN, STATUS_LABELS, STATUS_REIHENFOLGE, STATUS_STYLE } from "./constants";
import { LEERER_FILTER, passt, facette, gibtLeere, subKanalListe, type Filter } from "./lib/filter";
import { useEpics } from "./data/useEpics";
import { useVeranstaltungen, type Veranstaltung } from "./data/useVeranstaltungen";
import { useBenachrichtigungen, type Benachrichtigung } from "./data/useBenachrichtigungen";
import { useNutzerListe } from "./data/useNutzerListe";
import { Benachrichtigungen } from "./components/Benachrichtigungen";
import { AdminPanel } from "./admin/AdminPanel";
import { PasswortAendern } from "./auth/PasswortAendern";
import { supabaseAktiv } from "./lib/supabase";
import { FilterBar } from "./components/FilterBar";
import { TabellenAnsicht } from "./components/TabellenAnsicht";
import { ZielAnsicht } from "./components/ZielAnsicht";
import { VeranstaltungenAnsicht } from "./components/VeranstaltungenAnsicht";
import { KampagneEditor } from "./components/KampagneEditor";
import { VeranstaltungEditor } from "./components/VeranstaltungEditor";
import { Logo } from "./components/Logo";

type Ansicht = "tabelle" | "ziel" | "event";

export default function App() {
  const { nutzer, userId, darfBearbeiten, istAdmin, abmelden } = useAuth();
  const {
    kampagnen,
    geladen,
    speichern,
    speichernViele,
    loeschen,
    loeschenViele,
    ersetzeAlle,
  } = useKampagnen();
  const { locks, sperren, freigeben } = useLocks(userId, nutzer.name);
  const benachr = useBenachrichtigungen(userId, nutzer.name);
  const nutzerListe = useNutzerListe();
  const { epics, setZeitraum } = useEpics();
  const {
    alle: alleEvents,
    speichern: speichernEvent,
    loeschen: loeschenEvent,
  } = useVeranstaltungen();

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
  const [editor, setEditor] = useState<{
    offen: boolean;
    kampagne: Kampagne | null;
    vorlage?: Partial<Kampagne>;
  }>({
    offen: false,
    kampagne: null,
  });
  const fileRef = useRef<HTMLInputElement>(null);
  const [mehrOffen, setMehrOffen] = useState(false);
  const [adminOffen, setAdminOffen] = useState(false);
  const [pwAendernOffen, setPwAendernOffen] = useState(false);

  // Name des Nutzers, der eine Kampagne sperrt (null = frei oder von uns selbst).
  const gesperrtVon = (id: string): string | null => {
    const l = locks[`kampagne:${id}`];
    return l && l.userId !== userId ? l.userName : null;
  };

  // Editor öffnen: bestehende Kampagne dabei für andere sperren.
  const oeffneEditor = async (k: Kampagne | null) => {
    if (k) await sperren("kampagne", k.id);
    setEditor({ offen: true, kampagne: k });
  };
  // Neuen Eintrag mit Vorbelegung öffnen (z.B. aus einer Veranstaltung heraus).
  const neuerEintragMitVorlage = (vorlage: Partial<Kampagne>) => {
    setEditor({ offen: true, kampagne: null, vorlage: { land: mandant, ...vorlage } });
  };
  const schliesseEditor = () => {
    if (editor.kampagne) freigeben("kampagne", editor.kampagne.id);
    setEditor({ offen: false, kampagne: null });
  };
  // Beim Duplizieren: Sperre des Originals freigeben, Editor als neuer Eintrag.
  const onDuplikatStart = () => {
    if (editor.kampagne) freigeben("kampagne", editor.kampagne.id);
    setEditor((e) => ({ ...e, kampagne: null }));
  };
  const [eventBand, setEventBand] = useState(true);
  const [mandant, setMandant] = useState<string>(
    () => localStorage.getItem("kampagnen.mandant.v1") ?? "DE",
  );
  const wechsleMandant = (code: string) => {
    setMandant(code);
    localStorage.setItem("kampagnen.mandant.v1", code);
  };

  // Benachrichtigung anklicken: zum betroffenen Datensatz springen.
  const oeffneBenachrichtigung = (b: Benachrichtigung) => {
    if (b.land) wechsleMandant(b.land);
    if (b.art === "kampagne") {
      const k = kampagnen.find((x) => x.id === b.refId);
      if (k) {
        setAnsicht("tabelle");
        oeffneEditor(k);
      }
    } else {
      setAnsicht("event");
      if (b.kategorie) setEventEditor({ offen: true, kategorie: b.kategorie });
    }
  };

  const aktuelleKw = getISOWeek(new Date());

  // Nur Einträge des aktuellen Mandanten (Land).
  const mandantKampagnen = useMemo(
    () => kampagnen.filter((k) => k.land === mandant),
    [kampagnen, mandant],
  );
  // Veranstaltungen des aktuellen Mandanten.
  const events = useMemo(() => alleEvents[mandant] ?? {}, [alleEvents, mandant]);

  const gefiltert = useMemo(
    () => mandantKampagnen.filter((k) => passt(k, filter)),
    [mandantKampagnen, filter],
  );

  // Von den übrigen Filtern abhängige Auswahlwerte (Faceted Search).
  const facetten = useMemo(
    () => ({
      quartale: facette(mandantKampagnen, filter, "quartale"),
      status: facette(mandantKampagnen, filter, "status") as Status[],
      kanaele: facette(mandantKampagnen, filter, "kanaele"),
      subkanaele: facette(mandantKampagnen, filter, "subkanaele"),
      owners: facette(mandantKampagnen, filter, "owners"),
      sparten: facette(mandantKampagnen, filter, "sparten"),
      kampagnen: facette(mandantKampagnen, filter, "kampagne"),
    }),
    [mandantKampagnen, filter],
  );

  // „(leer)"-Optionen nur, wenn es leere Felder gibt.
  const leer = useMemo(
    () => ({
      kanaele: gibtLeere(mandantKampagnen, filter, "kanaele"),
      subKanaele: gibtLeere(mandantKampagnen, filter, "subkanaele"),
      owners: gibtLeere(mandantKampagnen, filter, "owners"),
      sparten: gibtLeere(mandantKampagnen, filter, "sparten"),
      kampagnen: gibtLeere(mandantKampagnen, filter, "kampagne"),
    }),
    [mandantKampagnen, filter],
  );

  // Vollständige Wertelisten (für die Eingabe-Dropdowns im Editor) – mandantweit.
  const alleKanaele = useMemo(() => eindeutigeWerte(mandantKampagnen, "kanal"), [mandantKampagnen]);
  const alleSubKanaele = useMemo(() => {
    const set = new Set<string>();
    mandantKampagnen.forEach((k) => subKanalListe(k.subKanal).forEach((s) => set.add(s)));
    return [...set].sort((a, b) => a.localeCompare(b, "de"));
  }, [mandantKampagnen]);
  const alleKampagnen = useMemo(() => eindeutigeWerte(mandantKampagnen, "kampagne"), [mandantKampagnen]);
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
  // Bereits angelegte Veranstaltungs-Kategorien (für das Dropdown im Editor).
  const eventKategorien = useMemo(
    () => Object.keys(events).sort((a, b) => a.localeCompare(b, "de")),
    [events],
  );
  // Bereits verwendete Niederlassungen (Vorschläge im Sub-Editor).
  const niederlassungen = useMemo(() => {
    const set = new Set<string>();
    Object.values(events).forEach((m) =>
      m.subs.forEach((s) => s.niederlassung && set.add(s.niederlassung)),
    );
    return [...set].sort((a, b) => a.localeCompare(b, "de"));
  }, [events]);
  // Flache Liste aller Sub-Veranstaltungen (für die Tabelle).
  const subEvents = useMemo(
    () =>
      Object.entries(events)
        .flatMap(([kat, m]) => m.subs.map((s) => ({ kat, ...s })))
        .filter((s) => s.ort || s.start || s.name)
        .sort((a, b) => (a.start || "9999").localeCompare(b.start || "9999")),
    [events],
  );

  // Prüft, ob ein (Sub-)Event im aktuell gefilterten Zeitraum liegt.
  // Wird sowohl in der Tabelle als auch im Reiter „Veranstaltungen → Nach Datum"
  // genutzt, damit der KW-/Datums-Filter überall gleich wirkt.
  const eventImZeitraum = useCallback(
    (start: string | null, ende: string | null) => {
      const kwVon = filter.kwVon ? Number(filter.kwVon) : null;
      const kwBis = filter.kwBis ? Number(filter.kwBis) : null;
      const zeitAktiv = kwVon != null || kwBis != null || !!filter.datumVon || !!filter.datumBis;
      if (!zeitAktiv) return true;
      if (!start) return false; // ohne Datum nicht in einen Zeitraum einordbar
      const e = ende ?? start;
      const startKw = kwAusDatum(start);
      const endeKw = kwAusDatum(e) ?? startKw;
      if (kwVon != null && (endeKw == null || endeKw < kwVon)) return false;
      if (kwBis != null && (startKw == null || startKw > kwBis)) return false;
      if (filter.datumVon && e < filter.datumVon) return false;
      if (filter.datumBis && start > filter.datumBis) return false;
      return true;
    },
    [filter],
  );

  // In der Tabelle nur Events zeigen, die im aktiven Zeitraum liegen.
  const subEventsImZeitraum = useMemo(
    () => subEvents.filter((s) => eventImZeitraum(s.start, s.ende)),
    [subEvents, eventImZeitraum],
  );
  // Verantwortliche = Anzeigenamen der angelegten Nutzer (Nutzerverwaltung).
  const verantwortlicheNamen = useMemo(
    () => nutzerListe.map((n) => n.anzeige),
    [nutzerListe],
  );

  // Vollständige Vorschläge für die Inline-Bearbeitung – unabhängig vom Filter.
  const vorschlaege = useMemo(() => {
    const details = new Set<string>();
    mandantKampagnen.forEach((k) => k.details.trim() && details.add(k.details.trim()));
    return {
      kanal: alleKanaele,
      subKanal: alleSubKanaele,
      kampagne: alleKampagnen,
      details: [...details].sort((a, b) => a.localeCompare(b, "de")),
    };
  }, [mandantKampagnen, alleKanaele, alleSubKanaele, alleKampagnen]);

  const statusZaehler = useMemo(() => {
    const z: Record<Status, number> = {
      geplant: 0,
      in_arbeit: 0,
      erledigt: 0,
      abgesagt: 0,
      storniert: 0,
    };
    gefiltert.forEach((k) => z[k.status]++);
    return z;
  }, [gefiltert]);

  const onSave = (k: Kampagne, spiegelLaender: string[] = []) => {
    speichern(k);
    // Spiegeln: Kopien in anderen Mandanten anlegen.
    if (spiegelLaender.length) {
      const kopien = spiegelLaender.map((land, i) => ({
        ...k,
        id: `c${Date.now()}${i}`,
        land,
      }));
      speichernViele(kopien);
    }
    freigeben("kampagne", k.id);
    setEditor({ offen: false, kampagne: null });
  };
  const onDelete = (id: string) => {
    const von = gesperrtVon(id);
    if (von) {
      alert(`Wird gerade von ${von} bearbeitet und kann nicht gelöscht werden.`);
      return;
    }
    if (confirm("Kampagne wirklich löschen?")) loeschen(id);
  };

  // Veranstaltungen (Events) – immer im aktuellen Mandanten.
  const onSaveEvent = (v: Veranstaltung, vorher?: string) => {
    speichernEvent(mandant, v, vorher);
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
              {mandantKampagnen.length} Einträge ·{" "}
              {MANDANTEN.find((m) => m.code === mandant)?.label ?? mandant}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3 text-sm">
          {/* Mandanten-Umschalter: gut sichtbar, aber dezent */}
          <label className="flex items-center gap-1 rounded-md border border-marke/40 bg-marke/5 px-2 py-1">
            <span className="text-marke-dark">🌐</span>
            <select
              value={mandant}
              onChange={(e) => wechsleMandant(e.target.value)}
              className="bg-transparent text-sm font-medium text-marke-dark focus:outline-none"
            >
              {MANDANTEN.map((m) => (
                <option key={m.code} value={m.code}>
                  {m.label}
                </option>
              ))}
            </select>
          </label>
          <Benachrichtigungen
            liste={benachr.liste}
            ungelesen={benachr.ungelesen}
            alsGelesenMarkieren={benachr.alsGelesenMarkieren}
            onOeffnen={oeffneBenachrichtigung}
          />
          <span className="text-slate-500">{nutzer.name}</span>
          {istAdmin && (
            <button
              onClick={() => setAdminOffen(true)}
              className="rounded-md border border-marke/40 bg-marke/5 px-3 py-1 text-sm font-medium text-marke-dark hover:bg-marke/10"
            >
              ⚙ Administration
            </button>
          )}
          {supabaseAktiv && (
            <button
              onClick={() => setPwAendernOffen(true)}
              className="rounded-md border border-slate-200 bg-white px-3 py-1 text-sm text-slate-500 hover:bg-slate-50"
            >
              🔑 Passwort
            </button>
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
          {tab("ziel", "📣 Kampagne")}
          {tab("event", "🎟 Veranstaltungen")}
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
                    <button
                      onClick={() => {
                        setMehrOffen(false);
                        fileRef.current?.click();
                      }}
                      className="block w-full px-3 py-2 text-left text-slate-600 hover:bg-slate-50"
                    >
                      ⬆ Excel-Import (ersetzt Bestand)
                    </button>
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
              onClick={() => oeffneEditor(null)}
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
          sparten={facetten.sparten}
          kampagnen={facetten.kampagnen}
          aktuelleKw={aktuelleKw}
          leerKanaele={leer.kanaele}
          leerSubKanaele={leer.subKanaele}
          leerOwners={leer.owners}
          leerSparten={leer.sparten}
          leerKampagnen={leer.kampagnen}
        />
      </div>

      {!geladen ? (
        <p className="py-10 text-center text-slate-400">Lädt…</p>
      ) : ansicht === "tabelle" ? (
        <>
          {subEventsImZeitraum.length > 0 && (
            <div className="mb-2 flex justify-end">
              <button
                onClick={() => setEventBand((v) => !v)}
                title="Veranstaltungen in der Tabelle ein-/ausblenden"
                className={`rounded-md border px-3 py-1 text-xs font-medium ${
                  eventBand
                    ? "border-marke bg-marke/10 text-marke-dark"
                    : "border-slate-300 bg-white text-slate-500"
                }`}
              >
                🎟 Veranstaltungen {eventBand ? "ausblenden" : "einblenden"}
              </button>
            </div>
          )}
          <TabellenAnsicht
            kampagnen={gefiltert}
            darfBearbeiten={darfBearbeiten}
            gesperrtVon={gesperrtVon}
            kanaele={alleKanaele}
            vorschlaege={vorschlaege}
            eventZeilen={eventBand ? subEventsImZeitraum : []}
            onEventClick={() => setAnsicht("event")}
            onEdit={oeffneEditor}
            onDelete={onDelete}
            onUpdate={onUpdate}
            onBulkUpdate={onBulkUpdate}
            onBulkDelete={onBulkDelete}
          />
        </>
      ) : ansicht === "ziel" ? (
        <ZielAnsicht
          kampagnen={gefiltert}
          darfBearbeiten={darfBearbeiten}
          kanaele={alleKanaele}
          vorschlaege={vorschlaege}
          epics={epics}
          onZeitraum={setZeitraum}
          onEdit={oeffneEditor}
          onDelete={onDelete}
          onUpdate={onUpdate}
          onBulkUpdate={onBulkUpdate}
          onBulkDelete={onBulkDelete}
        />
      ) : (
        <VeranstaltungenAnsicht
          kampagnen={gefiltert}
          darfBearbeiten={darfBearbeiten}
          kanaele={alleKanaele}
          vorschlaege={vorschlaege}
          events={events}
          imZeitraum={eventImZeitraum}
          suche={filter.suche}
          onEditEvent={(kategorie) => setEventEditor({ offen: true, kategorie })}
          onNeuerEintrag={(kat, subId) =>
            neuerEintragMitVorlage({ veranstaltung: kat, subEvent: subId ?? "" })
          }
          onEdit={oeffneEditor}
          onDelete={onDelete}
          onUpdate={onUpdate}
          onBulkUpdate={onBulkUpdate}
          onBulkDelete={onBulkDelete}
        />
      )}

      {editor.offen && (
        <KampagneEditor
          kampagne={editor.kampagne}
          mandant={mandant}
          kanaele={alleKanaele}
          subKanaele={alleSubKanaele}
          kampagnen={alleKampagnen}
          verantwortliche={verantwortlicheNamen}
          veranstaltungen={veranstaltungenListe}
          onNeueVeranstaltung={(kategorie) =>
            setEventEditor({ offen: true, kategorie: kategorie ?? null })
          }
          onSave={onSave}
          onClose={schliesseEditor}
          gesperrtVon={editor.kampagne ? gesperrtVon(editor.kampagne.id) : null}
          vorlage={editor.vorlage}
          onDuplikatStart={onDuplikatStart}
        />
      )}

      {adminOffen && <AdminPanel onClose={() => setAdminOffen(false)} />}

      {pwAendernOffen && <PasswortAendern onClose={() => setPwAendernOffen(false)} />}

      {eventEditor.offen && (
        <VeranstaltungEditor
          veranstaltung={
            eventEditor.kategorie
              ? { kategorie: eventEditor.kategorie, ...events[eventEditor.kategorie] }
              : null
          }
          orte={eventOrte}
          kategorien={eventKategorien}
          niederlassungen={niederlassungen}
          onSave={onSaveEvent}
          onDelete={(kat) => loeschenEvent(mandant, kat)}
          onClose={() => setEventEditor({ offen: false, kategorie: null })}
        />
      )}

      <footer className="mt-10 border-t border-slate-200 pt-4 text-center text-xs text-slate-400">
        Gemeinsame Datenbank, Anmeldung &amp; Rollen über Supabase · Änderungen
        werden live für alle übernommen
        <div className="mt-1 text-slate-300">Version vom {__BUILD_TIME__}</div>
      </footer>
    </div>
  );
}
