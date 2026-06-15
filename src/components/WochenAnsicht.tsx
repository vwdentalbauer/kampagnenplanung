import type { Kampagne } from "../types";
import { KampagneZeile } from "./KampagneZeile";

interface Props {
  kampagnen: Kampagne[];
  darfBearbeiten: boolean;
  onEdit: (k: Kampagne) => void;
}

/** Gruppiert nach Kalenderwoche – für den wöchentlichen Jour fixe. */
export function WochenAnsicht({ kampagnen, darfBearbeiten, onEdit }: Props) {
  const gruppen = new Map<number, Kampagne[]>();
  const ohneKw: Kampagne[] = [];
  for (const k of kampagnen) {
    if (k.kw == null) ohneKw.push(k);
    else {
      if (!gruppen.has(k.kw)) gruppen.set(k.kw, []);
      gruppen.get(k.kw)!.push(k);
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
                <KampagneZeile key={k.id} k={k} darfBearbeiten={darfBearbeiten} onEdit={onEdit} />
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
