import { useState } from "react";
import type { Kampagne, Status } from "../types";
import { STATUS_REIHENFOLGE, STATUS_LABELS, STATUS_STYLE } from "../constants";
import { TabellenAnsicht } from "./TabellenAnsicht";
import { ChevronIcon } from "./Icons";
import { kwAusDatum, formatDatum } from "../lib/date";
import type { EpicMeta } from "../data/useEpics";

interface Props {
  kampagnen: Kampagne[];
  darfBearbeiten: boolean;
  kanaele: string[];
  vorschlaege: { kanal: string[]; subKanal: string[]; kampagne: string[]; details: string[] };
  epics: Record<string, EpicMeta>;
  onZeitraum: (name: string, start: string | null, ende: string | null) => void;
  onEdit: (k: Kampagne) => void;
  onDelete: (id: string) => void;
  onUpdate: (k: Kampagne, patch: Partial<Kampagne>) => void;
  onBulkUpdate: (ids: string[], patch: Partial<Kampagne>) => void;
  onBulkDelete: (ids: string[]) => void;
}

interface Gruppe {
  name: string;
  tasks: Kampagne[];
}

type Modus = "laufend" | "abgeschlossen" | "alle";

function spanne(werte: (string | null)[]): { von: string | null; bis: string | null } {
  const da = werte.filter((w): w is string => !!w).sort();
  return { von: da[0] ?? null, bis: da[da.length - 1] ?? null };
}

const heute = new Date().toISOString().slice(0, 10);

export function ZielAnsicht({
  kampagnen,
  darfBearbeiten,
  kanaele,
  vorschlaege,
  epics,
  onZeitraum,
  onEdit,
  onDelete,
  onUpdate,
  onBulkUpdate,
  onBulkDelete,
}: Props) {
  const [modus, setModus] = useState<Modus>("laufend");
  const [offen, setOffen] = useState<Set<string>>(new Set());

  const toggle = (name: string) =>
    setOffen((s) => {
      const n = new Set(s);
      n.has(name) ? n.delete(name) : n.add(name);
      return n;
    });

  const map = new Map<string, Kampagne[]>();
  const ohne: Kampagne[] = [];
  for (const k of kampagnen) {
    const name = k.kampagne.trim();
    if (!name) {
      ohne.push(k);
      continue;
    }
    if (!map.has(name)) map.set(name, []);
    map.get(name)!.push(k);
  }

  // Pro Kampagne: Gesamtzeitraum (explizit oder abgeleitet) + abgeschlossen?
  const alle: (Gruppe & { start: string | null; ende: string | null; abgeschlossen: boolean })[] = [
    ...map.entries(),
  ].map(([name, tasks]) => {
    const meta = epics[name];
    const start = meta?.start ?? spanne(tasks.map((t) => t.weekStart)).von;
    const ende = meta?.ende ?? spanne(tasks.map((t) => t.endDatum ?? t.weekStart)).bis;
    return { name, tasks, start, ende, abgeschlossen: !!ende && ende < heute };
  });
  alle.sort((a, b) => (a.start ?? "9999").localeCompare(b.start ?? "9999"));

  const sichtbar = alle.filter((g) =>
    modus === "alle" ? true : modus === "abgeschlossen" ? g.abgeschlossen : !g.abgeschlossen,
  );

  const dateCls =
    "rounded border border-slate-300 px-1.5 py-0.5 text-xs focus:border-marke focus:outline-none";

  const tabelle = (tasks: Kampagne[]) => (
    <TabellenAnsicht
      kampagnen={tasks}
      darfBearbeiten={darfBearbeiten}
      kanaele={kanaele}
      vorschlaege={vorschlaege}
      onEdit={onEdit}
      onDelete={onDelete}
      onUpdate={onUpdate}
      onBulkUpdate={onBulkUpdate}
      onBulkDelete={onBulkDelete}
      ausblenden={["kampagne"]}
    />
  );

  const tab = (m: Modus, label: string, n: number) => (
    <button
      onClick={() => setModus(m)}
      className={`rounded-md px-3 py-1 text-sm font-medium ${
        modus === m ? "bg-marke text-white" : "text-slate-600 hover:bg-slate-100"
      }`}
    >
      {label} <span className="opacity-70">({n})</span>
    </button>
  );

  const laufendN = alle.filter((g) => !g.abgeschlossen).length;
  const fertigN = alle.filter((g) => g.abgeschlossen).length;

  const karte = (g: (typeof sichtbar)[number]) => {
    const meta = epics[g.name];
    const derivedStart = spanne(g.tasks.map((t) => t.weekStart)).von;
    const derivedEnde = spanne(g.tasks.map((t) => t.endDatum ?? t.weekStart)).bis;
    const kwVon = kwAusDatum(g.start);
    const kwBis = kwAusDatum(g.ende);
    const istOffen = offen.has(g.name);

    const zaehler: Record<Status, number> = {
      geplant: 0,
      in_arbeit: 0,
      erledigt: 0,
      abgesagt: 0,
      storniert: 0,
    };
    g.tasks.forEach((t) => zaehler[t.status]++);
    // „Storniert/Verworfen" zählt wie „Erledigt" als abgeschlossen.
    const fertig = zaehler.erledigt + zaehler.storniert;
    const fortschritt = Math.round((fertig / g.tasks.length) * 100);

    return (
      <section key={g.name} className="overflow-hidden rounded-lg border border-marke/30 bg-white">
        <button
          onClick={() => toggle(g.name)}
          className="flex w-full items-center gap-3 px-3 py-3 text-left hover:bg-marke/5"
        >
          <ChevronIcon className={`h-4 w-4 shrink-0 text-slate-400 ${istOffen ? "rotate-90" : ""}`} />
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-semibold text-slate-800">{g.name}</span>
              {g.abgeschlossen ? (
                <span className="rounded bg-slate-200 px-1.5 py-0.5 text-xs font-medium text-slate-600">
                  abgeschlossen
                </span>
              ) : (
                <span className="rounded bg-marke-light/20 px-1.5 py-0.5 text-xs font-medium text-marke">
                  laufend
                </span>
              )}
              {g.start && (
                <span className="text-xs text-slate-400">
                  {kwVon ? `KW ${kwVon}${kwBis && kwBis !== kwVon ? `–${kwBis}` : ""} · ` : ""}
                  {formatDatum(g.start)}
                  {g.ende && g.ende !== g.start ? ` – ${formatDatum(g.ende)}` : ""}
                </span>
              )}
            </div>
          </div>
          <div className="flex shrink-0 items-center gap-3">
            <div className="hidden h-1.5 w-24 overflow-hidden rounded-full bg-slate-100 sm:block">
              <div className="h-full bg-marke" style={{ width: `${fortschritt}%` }} />
            </div>
            <span className="whitespace-nowrap text-xs text-slate-400">
              {fertig}/{g.tasks.length}
            </span>
          </div>
        </button>

        {istOffen && (
          <div className="border-t border-marke/20 p-2">
            <div className="mb-2 flex flex-wrap items-center gap-2 px-1 text-xs text-slate-500">
              <span className="font-medium uppercase tracking-wide text-slate-400">Gesamtzeitraum</span>
              {darfBearbeiten ? (
                <>
                  <input
                    type="date"
                    className={dateCls}
                    value={meta?.start ?? derivedStart ?? ""}
                    onChange={(e) =>
                      onZeitraum(g.name, e.target.value || null, meta?.ende ?? derivedEnde ?? null)
                    }
                  />
                  <span>–</span>
                  <input
                    type="date"
                    className={dateCls}
                    value={meta?.ende ?? derivedEnde ?? ""}
                    onChange={(e) =>
                      onZeitraum(g.name, meta?.start ?? derivedStart ?? null, e.target.value || null)
                    }
                  />
                  {!meta && <span className="italic text-slate-300">automatisch</span>}
                </>
              ) : (
                <span>
                  {g.start ? formatDatum(g.start) : "—"}
                  {g.ende && g.ende !== g.start ? ` – ${formatDatum(g.ende)}` : ""}
                </span>
              )}
              <span className="ml-2 flex flex-wrap gap-1">
                {STATUS_REIHENFOLGE.filter((s) => zaehler[s] > 0).map((s) => (
                  <span key={s} className={`rounded-full border px-2 py-0.5 ${STATUS_STYLE[s]}`}>
                    {zaehler[s]}× {STATUS_LABELS[s]}
                  </span>
                ))}
              </span>
            </div>
            {tabelle(g.tasks)}
          </div>
        )}
      </section>
    );
  };

  return (
    <div className="space-y-3">
      {/* Umschalter laufend / abgeschlossen / alle */}
      <div className="flex flex-wrap items-center gap-2">
        <div className="flex gap-1 rounded-lg border border-slate-200 bg-white p-1">
          {tab("laufend", "Laufend", laufendN)}
          {tab("abgeschlossen", "Abgeschlossen", fertigN)}
          {tab("alle", "Alle", alle.length)}
        </div>
        {sichtbar.length > 1 && (
          <div className="ml-auto flex gap-2 text-xs">
            <button
              onClick={() => setOffen(new Set(sichtbar.map((g) => g.name)))}
              className="rounded border border-slate-300 px-2 py-1 text-slate-500 hover:bg-slate-50"
            >
              Alle ausklappen
            </button>
            <button
              onClick={() => setOffen(new Set())}
              className="rounded border border-slate-300 px-2 py-1 text-slate-500 hover:bg-slate-50"
            >
              Alle einklappen
            </button>
          </div>
        )}
      </div>

      {sichtbar.map(karte)}

      {/* „Ohne Kampagne" nur in laufend/alle */}
      {ohne.length > 0 && modus !== "abgeschlossen" && (
        <section className="overflow-hidden rounded-lg border border-dashed border-slate-300 bg-white">
          <button
            onClick={() => toggle("__ohne__")}
            className="flex w-full items-center gap-3 px-3 py-3 text-left hover:bg-slate-50"
          >
            <ChevronIcon
              className={`h-4 w-4 shrink-0 text-slate-400 ${offen.has("__ohne__") ? "rotate-90" : ""}`}
            />
            <span className="flex-1 font-semibold text-slate-700">Ohne Kampagne</span>
            <span className="text-xs text-slate-400">{ohne.length} Einträge</span>
          </button>
          {offen.has("__ohne__") && <div className="border-t border-slate-200 p-2">{tabelle(ohne)}</div>}
        </section>
      )}

      {sichtbar.length === 0 && ohne.length === 0 && (
        <p className="py-10 text-center text-slate-400">Keine Kampagnen für diese Auswahl.</p>
      )}
    </div>
  );
}
