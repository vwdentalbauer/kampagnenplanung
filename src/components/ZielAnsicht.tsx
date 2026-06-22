import type { Kampagne, Status } from "../types";
import { STATUS_REIHENFOLGE, STATUS_LABELS, STATUS_STYLE } from "../constants";
import { KampagneZeile } from "./KampagneZeile";
import { kwAusDatum, formatDatum } from "../lib/date";
import type { EpicMeta } from "../data/useEpics";

interface Props {
  kampagnen: Kampagne[];
  darfBearbeiten: boolean;
  epics: Record<string, EpicMeta>;
  onZeitraum: (name: string, start: string | null, ende: string | null) => void;
  onEdit: (k: Kampagne) => void;
}

interface Gruppe {
  name: string;
  tasks: Kampagne[];
}

function spanne(werte: (string | null)[]): { von: string | null; bis: string | null } {
  const da = werte.filter((w): w is string => !!w).sort();
  return { von: da[0] ?? null, bis: da[da.length - 1] ?? null };
}

/**
 * „Kampagne" – Epic-Übersicht: jede Kampagne mit (einstellbarem) Gesamtzeitraum
 * + Sub-Tasks als Zeilen, plus eine Gruppe für Einträge ohne Kampagne.
 */
export function ZielAnsicht({ kampagnen, darfBearbeiten, epics, onZeitraum, onEdit }: Props) {
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

  const gruppen: Gruppe[] = [...map.entries()].map(([name, tasks]) => ({ name, tasks }));
  gruppen.sort((a, b) => {
    const sa = (epics[a.name]?.start ?? spanne(a.tasks.map((t) => t.weekStart)).von) ?? "9999";
    const sb = (epics[b.name]?.start ?? spanne(b.tasks.map((t) => t.weekStart)).von) ?? "9999";
    return sa.localeCompare(sb);
  });

  const heute = new Date().toISOString().slice(0, 10);
  const dateCls =
    "rounded border border-slate-300 px-1.5 py-0.5 text-xs focus:border-marke focus:outline-none";

  const kampagnenKarte = (g: Gruppe) => {
    const meta = epics[g.name];
    const derivedStart = spanne(g.tasks.map((t) => t.weekStart)).von;
    const derivedEnde = spanne(g.tasks.map((t) => t.endDatum ?? t.weekStart)).bis;
    const start = meta?.start ?? derivedStart;
    const ende = meta?.ende ?? derivedEnde;
    const kwVon = kwAusDatum(start);
    const kwBis = kwAusDatum(ende);
    const laeuft = !!start && !!ende && start <= heute && ende >= heute;

    const zaehler: Record<Status, number> = { geplant: 0, in_arbeit: 0, erledigt: 0, abgesagt: 0 };
    g.tasks.forEach((t) => zaehler[t.status]++);
    const fortschritt = Math.round((zaehler.erledigt / g.tasks.length) * 100);
    const tasksSortiert = [...g.tasks].sort((a, b) =>
      (a.weekStart ?? "9999").localeCompare(b.weekStart ?? "9999"),
    );

    return (
      <section key={g.name} className="rounded-lg border border-marke/30 bg-white">
        <header className="border-b border-marke/20 px-4 py-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h3 className="flex items-center gap-2 font-semibold text-slate-800">
              <span className="rounded bg-marke px-2 py-0.5 text-xs font-medium text-white">Kampagne</span>
              {g.name}
              {laeuft && (
                <span className="rounded bg-marke-light/20 px-1.5 py-0.5 text-xs font-medium text-marke">
                  läuft
                </span>
              )}
            </h3>
            <span className="text-xs text-slate-400">
              {g.tasks.length} {g.tasks.length === 1 ? "Eintrag" : "Einträge"} · {zaehler.erledigt}/
              {g.tasks.length} erledigt
            </span>
          </div>

          {/* Gesamtzeitraum: anzeigen + (für Bearbeiter) einstellbar */}
          <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-slate-500">
            <span className="font-medium uppercase tracking-wide text-slate-400">Gesamtzeitraum</span>
            {darfBearbeiten ? (
              <>
                <input
                  type="date"
                  className={dateCls}
                  value={meta?.start ?? derivedStart ?? ""}
                  onChange={(e) => onZeitraum(g.name, e.target.value || null, meta?.ende ?? derivedEnde ?? null)}
                />
                <span>–</span>
                <input
                  type="date"
                  className={dateCls}
                  value={meta?.ende ?? derivedEnde ?? ""}
                  onChange={(e) => onZeitraum(g.name, meta?.start ?? derivedStart ?? null, e.target.value || null)}
                />
                {kwVon && (
                  <span className="text-slate-400">
                    (KW {kwVon}
                    {kwBis && kwBis !== kwVon ? `–${kwBis}` : ""})
                  </span>
                )}
                {!meta && <span className="italic text-slate-300">automatisch</span>}
              </>
            ) : (
              start && (
                <span>
                  {formatDatum(start)}
                  {ende && ende !== start ? ` – ${formatDatum(ende)}` : ""}
                  {kwVon ? ` · KW ${kwVon}${kwBis && kwBis !== kwVon ? `–${kwBis}` : ""}` : ""}
                </span>
              )
            )}
          </div>

          <div className="mt-2 h-2 overflow-hidden rounded-full bg-slate-100">
            <div className="h-full bg-marke" style={{ width: `${fortschritt}%` }} />
          </div>
          <div className="mt-2 flex flex-wrap gap-2">
            {STATUS_REIHENFOLGE.filter((s) => zaehler[s] > 0).map((s) => (
              <span key={s} className={`rounded-full border px-2 py-0.5 text-xs ${STATUS_STYLE[s]}`}>
                {zaehler[s]}× {STATUS_LABELS[s]}
              </span>
            ))}
          </div>
        </header>

        <div className="space-y-2 p-3">
          {tasksSortiert.map((k) => (
            <KampagneZeile
              key={k.id}
              k={k}
              darfBearbeiten={darfBearbeiten}
              onEdit={onEdit}
              zeigeKw
              kampagneAusblenden
            />
          ))}
        </div>
      </section>
    );
  };

  return (
    <div className="space-y-4">
      {gruppen.map(kampagnenKarte)}

      {ohne.length > 0 && (
        <section className="rounded-lg border border-dashed border-slate-300 bg-white">
          <header className="flex items-center justify-between border-b border-slate-200 px-4 py-3">
            <h3 className="flex items-center gap-2 font-semibold text-slate-700">
              <span className="rounded bg-slate-200 px-2 py-0.5 text-xs font-medium text-slate-600">
                Einzel
              </span>
              Ohne Kampagne
            </h3>
            <span className="text-xs text-slate-400">{ohne.length} Einträge</span>
          </header>
          <div className="space-y-2 p-3">
            {[...ohne]
              .sort((a, b) => (a.weekStart ?? "9999").localeCompare(b.weekStart ?? "9999"))
              .map((k) => (
                <KampagneZeile key={k.id} k={k} darfBearbeiten={darfBearbeiten} onEdit={onEdit} zeigeKw />
              ))}
          </div>
        </section>
      )}

      {kampagnen.length === 0 && (
        <p className="py-10 text-center text-slate-400">Keine Kampagnen für diese Filter.</p>
      )}
    </div>
  );
}
