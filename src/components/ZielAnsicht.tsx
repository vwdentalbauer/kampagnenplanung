import type { Kampagne, Status } from "../types";
import { STATUS_REIHENFOLGE, STATUS_LABELS, STATUS_STYLE } from "../constants";
import { KampagneZeile } from "./KampagneZeile";
import { kwAusDatum, formatDatum } from "../lib/date";

interface Props {
  kampagnen: Kampagne[];
  darfBearbeiten: boolean;
  onEdit: (k: Kampagne) => void;
}

interface Gruppe {
  name: string;
  tasks: Kampagne[];
}

/** Min-/Max-Werte (nicht leer) ermitteln. */
function spanne(werte: (string | null)[]): { von: string | null; bis: string | null } {
  const da = werte.filter((w): w is string => !!w).sort();
  return { von: da[0] ?? null, bis: da[da.length - 1] ?? null };
}

/**
 * „Nach Kampagne" – Epic-Übersicht:
 * Jede Kampagne (Oberbegriff) mit Gesamtzeitraum + zugehörigen Tasks,
 * plus eine eigene Gruppe für Einträge ohne Kampagne.
 */
export function ZielAnsicht({ kampagnen, darfBearbeiten, onEdit }: Props) {
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

  // Kampagnen chronologisch nach frühestem Start sortieren.
  const gruppen: Gruppe[] = [...map.entries()].map(([name, tasks]) => ({ name, tasks }));
  gruppen.sort((a, b) => {
    const sa = spanne(a.tasks.map((t) => t.weekStart)).von ?? "9999";
    const sb = spanne(b.tasks.map((t) => t.weekStart)).von ?? "9999";
    return sa.localeCompare(sb);
  });

  const heute = new Date().toISOString().slice(0, 10);

  const card = (titel: string, tasks: Kampagne[], istKampagne: boolean) => {
    const start = spanne(tasks.map((t) => t.weekStart)).von;
    const ende = spanne(tasks.map((t) => t.endDatum ?? t.weekStart)).bis;
    const kwVon = kwAusDatum(start);
    const kwBis = kwAusDatum(ende);
    const zaehler: Record<Status, number> = { geplant: 0, in_arbeit: 0, erledigt: 0, abgesagt: 0 };
    tasks.forEach((t) => zaehler[t.status]++);
    const fortschritt = Math.round((zaehler.erledigt / tasks.length) * 100);
    const laeuft = istKampagne && !!start && !!ende && start <= heute && ende >= heute;

    const tasksSortiert = [...tasks].sort((a, b) =>
      (a.weekStart ?? "9999").localeCompare(b.weekStart ?? "9999"),
    );

    return (
      <section
        key={titel}
        className={`rounded-lg border bg-white ${
          istKampagne ? "border-marke/30" : "border-dashed border-slate-300"
        }`}
      >
        <header className={`border-b px-4 py-3 ${istKampagne ? "border-marke/20" : "border-slate-200"}`}>
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h3 className="flex items-center gap-2 font-semibold text-slate-800">
              {istKampagne ? (
                <span className="rounded bg-marke px-2 py-0.5 text-xs font-medium text-white">Kampagne</span>
              ) : (
                <span className="rounded bg-slate-200 px-2 py-0.5 text-xs font-medium text-slate-600">
                  Einzel
                </span>
              )}
              {titel}
              {laeuft && (
                <span className="rounded bg-marke-light/20 px-1.5 py-0.5 text-xs font-medium text-marke">
                  läuft
                </span>
              )}
            </h3>
            <span className="text-xs text-slate-400">
              {tasks.length} {tasks.length === 1 ? "Eintrag" : "Einträge"} · {zaehler.erledigt}/
              {tasks.length} erledigt
            </span>
          </div>

          {istKampagne && start && (
            <div className="mt-1 text-xs text-slate-500">
              Gesamtzeitraum: {kwVon ? `KW ${kwVon}` : ""}
              {kwBis && kwBis !== kwVon ? `–${kwBis}` : ""} · {formatDatum(start)}
              {ende && ende !== start ? ` – ${formatDatum(ende)}` : ""}
            </div>
          )}

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
            <KampagneZeile key={k.id} k={k} darfBearbeiten={darfBearbeiten} onEdit={onEdit} zeigeKw />
          ))}
        </div>
      </section>
    );
  };

  return (
    <div className="space-y-4">
      {gruppen.map((g) => card(g.name, g.tasks, true))}
      {ohne.length > 0 && card("Ohne Kampagne", ohne, false)}
      {kampagnen.length === 0 && (
        <p className="py-10 text-center text-slate-400">Keine Kampagnen für diese Filter.</p>
      )}
    </div>
  );
}
