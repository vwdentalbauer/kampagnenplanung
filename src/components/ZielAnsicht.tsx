import type { Kampagne, Status } from "../types";
import { STATUS_REIHENFOLGE, STATUS_LABELS, STATUS_STYLE } from "../constants";
import { KampagneZeile } from "./KampagneZeile";

interface Props {
  kampagnen: Kampagne[];
  darfBearbeiten: boolean;
  onEdit: (k: Kampagne) => void;
}

/** Gruppiert nach Ziel – für die strategische Auswertung „nach Ziel“. */
export function ZielAnsicht({ kampagnen, darfBearbeiten, onEdit }: Props) {
  const gruppen = new Map<string, Kampagne[]>();
  for (const k of kampagnen) {
    const z = k.ziel || "Ohne Ziel";
    if (!gruppen.has(z)) gruppen.set(z, []);
    gruppen.get(z)!.push(k);
  }
  const ziele = [...gruppen.keys()].sort((a, b) =>
    gruppen.get(b)!.length - gruppen.get(a)!.length,
  );

  return (
    <div className="space-y-4">
      {ziele.map((ziel) => {
        const liste = gruppen.get(ziel)!;
        const zaehler: Record<Status, number> = {
          geplant: 0,
          in_arbeit: 0,
          erledigt: 0,
          abgesagt: 0,
        };
        for (const k of liste) zaehler[k.status]++;
        const erledigt = zaehler.erledigt;
        const fortschritt = Math.round((erledigt / liste.length) * 100);

        return (
          <section key={ziel} className="rounded-lg border border-slate-200 bg-white">
            <header className="border-b border-slate-200 px-4 py-3">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold">{ziel}</h3>
                <span className="text-xs text-slate-400">
                  {erledigt}/{liste.length} erledigt
                </span>
              </div>
              <div className="mt-2 h-2 overflow-hidden rounded-full bg-slate-100">
                <div className="h-full bg-marke" style={{ width: `${fortschritt}%` }} />
              </div>
              <div className="mt-2 flex flex-wrap gap-2">
                {STATUS_REIHENFOLGE.filter((s) => zaehler[s] > 0).map((s) => (
                  <span
                    key={s}
                    className={`rounded-full border px-2 py-0.5 text-xs ${STATUS_STYLE[s]}`}
                  >
                    {zaehler[s]}× {STATUS_LABELS[s]}
                  </span>
                ))}
              </div>
            </header>
            <div className="space-y-2 p-3">
              {liste.map((k) => (
                <KampagneZeile
                  key={k.id}
                  k={k}
                  darfBearbeiten={darfBearbeiten}
                  onEdit={onEdit}
                  zeigeKw
                />
              ))}
            </div>
          </section>
        );
      })}
      {kampagnen.length === 0 && (
        <p className="py-10 text-center text-slate-400">Keine Kampagnen für diese Filter.</p>
      )}
    </div>
  );
}
