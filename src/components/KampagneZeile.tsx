import type { Kampagne } from "../types";
import { StatusBadge } from "./StatusBadge";
import { formatDatum } from "../lib/date";

interface Props {
  k: Kampagne;
  darfBearbeiten: boolean;
  onEdit: (k: Kampagne) => void;
  zeigeKw?: boolean;
  /** Kampagnenname ausblenden (z.B. im Kampagnen-Reiter, dort redundant). */
  kampagneAusblenden?: boolean;
}

/** Kompakte Kampagnen-Zeile für Wochen- und Kampagnenansicht. */
export function KampagneZeile({ k, darfBearbeiten, onEdit, zeigeKw, kampagneAusblenden }: Props) {
  const laufend = !!k.endDatum;
  return (
    <div
      className={`flex items-start gap-3 rounded border bg-white px-3 py-2 ${
        laufend ? "border-l-4 border-l-marke-light border-y-slate-100 border-r-slate-100" : "border-slate-100"
      }`}
    >
      <div className="flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <span className="rounded bg-marke/15 px-1.5 py-0.5 text-xs font-medium text-marke-dark">
            {k.kanal || "—"}
          </span>
          {zeigeKw && k.kw && <span className="text-xs text-slate-400">KW {k.kw}</span>}
          {laufend && (
            <span className="rounded bg-marke-light/20 px-1.5 py-0.5 text-xs font-medium text-marke">
              läuft bis {formatDatum(k.endDatum)}
            </span>
          )}
          <StatusBadge status={k.status} />
        </div>
        {k.kampagne && !kampagneAusblenden && (
          <p className="mt-1 text-sm font-semibold text-slate-700">{k.kampagne}</p>
        )}
        <p className="mt-0.5 whitespace-pre-line text-sm">{k.details}</p>
        <div className="mt-1 text-xs text-slate-400">
          {k.verantwortung && <>👤 {k.verantwortung}</>}
        </div>
      </div>
      {darfBearbeiten && (
        <button onClick={() => onEdit(k)} className="text-xs text-marke-dark hover:underline">
          Bearbeiten
        </button>
      )}
    </div>
  );
}
