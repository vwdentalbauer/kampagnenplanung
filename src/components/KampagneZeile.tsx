import type { Kampagne } from "../types";
import { StatusBadge } from "./StatusBadge";

interface Props {
  k: Kampagne;
  darfBearbeiten: boolean;
  onEdit: (k: Kampagne) => void;
  zeigeKw?: boolean;
}

/** Kompakte Kampagnen-Zeile für Wochen- und Zielansicht. */
export function KampagneZeile({ k, darfBearbeiten, onEdit, zeigeKw }: Props) {
  return (
    <div className="flex items-start gap-3 rounded border border-slate-100 bg-white px-3 py-2">
      <div className="flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <span className="rounded bg-marke/15 px-1.5 py-0.5 text-xs font-medium text-marke-dark">
            {k.kanal || "—"}
          </span>
          {zeigeKw && k.kw && (
            <span className="text-xs text-slate-400">KW {k.kw}</span>
          )}
          <StatusBadge status={k.status} />
        </div>
        <p className="mt-1 whitespace-pre-line text-sm">{k.details}</p>
        <div className="mt-1 text-xs text-slate-400">
          {k.verantwortung && <>👤 {k.verantwortung} · </>}
          {k.zielgruppe}
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
