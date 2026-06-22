import type { Kampagne } from "../types";
import { KampagneZeile } from "./KampagneZeile";
import { kwsImZeitraum } from "../lib/date";

interface Props {
  kampagnen: Kampagne[];
  darfBearbeiten: boolean;
  onEdit: (k: Kampagne) => void;
}

/** Gruppiert nach Kalenderwoche – für den wöchentlichen Jour fixe.
 *  Laufende Kampagnen (mit Enddatum) erscheinen in JEDER Woche ihres Zeitraums. */
export function WochenAnsicht({ kampagnen, darfBearbeiten, onEdit }: Props) {
  const gruppen = new Map<number, Kampagne[]>();
  const ohneKw: Kampagne[] = [];
  for (const k of kampagnen) {
    let weeks: number[];
    if (k.endDatum) weeks = [...new Set(kwsImZeitraum(k.weekStart, k.endDatum))];
    else if (k.kw != null) weeks = [k.kw];
    else weeks = [];

    if (weeks.length === 0) {
      ohneKw.push(k);
      continue;
    }
    for (const w of weeks) {
      if (!gruppen.has(w)) gruppen.set(w, []);
      gruppen.get(w)!.push(k);
    }
  }
  const kws = [...gruppen.keys()].sort((a, b) => a - b);

  return (
    <div className="space-y-4">
      {kws.map((kw) => {
        const liste = gruppen.get(kw)!;
        return (
          <section key={kw} className="rounded-lg border border-slate-200 bg-slate-50">
            <header className="flex items-center justify-between border-b border-slate-200 px-4 py-2">
              <h3 className="font-semibold">
                KW {kw}{" "}
                <span className="font-normal text-slate-400">· {liste[0]?.quartal}</span>
              </h3>
              <span className="text-xs text-slate-400">{liste.length} Maßnahmen</span>
            </header>
            <div className="space-y-2 p-3">
              {liste.map((k) => (
                <KampagneZeile
                  key={`${k.id}-${kw}`}
                  k={k}
                  darfBearbeiten={darfBearbeiten}
                  onEdit={onEdit}
                />
              ))}
            </div>
          </section>
        );
      })}
      {ohneKw.length > 0 && (
        <section className="rounded-lg border border-dashed border-slate-300 bg-white p-3">
          <h3 className="mb-2 font-semibold text-slate-500">Ohne Kalenderwoche</h3>
          <div className="space-y-2">
            {ohneKw.map((k) => (
              <KampagneZeile key={k.id} k={k} darfBearbeiten={darfBearbeiten} onEdit={onEdit} />
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
