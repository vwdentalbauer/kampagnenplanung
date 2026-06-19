import { useState } from "react";
import type { Kampagne, Status } from "../types";
import { STATUS_LABELS, STATUS_REIHENFOLGE } from "../constants";
import { TrashIcon } from "./Icons";

interface Props {
  anzahl: number;
  kanaele: string[];
  onApply: (patch: Partial<Kampagne>) => void;
  onDelete: () => void;
  onClear: () => void;
}

/**
 * Aktionsleiste für die Mehrfachbearbeitung. Erscheint, sobald Zeilen per
 * Checkbox ausgewählt sind. Jede Änderung wird auf alle ausgewählten
 * Kampagnen angewendet.
 */
export function BulkBar({ anzahl, kanaele, onApply, onDelete, onClear }: Props) {
  const [datum, setDatum] = useState("");
  const [verant, setVerant] = useState("");

  const sel =
    "rounded border border-slate-300 bg-white px-2 py-1 text-sm focus:border-marke focus:outline-none";

  return (
    <div className="sticky top-0 z-10 mb-2 flex flex-wrap items-center gap-3 rounded-lg border border-marke bg-marke/10 px-3 py-2">
      <span className="text-sm font-semibold text-marke-dark">{anzahl} ausgewählt</span>

      {/* Status setzen */}
      <label className="flex items-center gap-1 text-sm text-slate-600">
        Status
        <select
          className={sel}
          defaultValue=""
          onChange={(e) => {
            if (e.target.value) {
              onApply({ status: e.target.value as Status });
              e.target.value = "";
            }
          }}
        >
          <option value="">setzen…</option>
          {STATUS_REIHENFOLGE.map((s) => (
            <option key={s} value={s}>
              {STATUS_LABELS[s]}
            </option>
          ))}
        </select>
      </label>

      {/* Kanal setzen */}
      <label className="flex items-center gap-1 text-sm text-slate-600">
        Kanal
        <select
          className={sel}
          defaultValue=""
          onChange={(e) => {
            if (e.target.value) {
              onApply({ kanal: e.target.value });
              e.target.value = "";
            }
          }}
        >
          <option value="">setzen…</option>
          {kanaele.map((k) => (
            <option key={k}>{k}</option>
          ))}
        </select>
      </label>

      {/* Datum setzen */}
      <label className="flex items-center gap-1 text-sm text-slate-600">
        Datum
        <input type="date" className={sel} value={datum} onChange={(e) => setDatum(e.target.value)} />
        <button
          disabled={!datum}
          onClick={() => {
            onApply({ weekStart: datum });
            setDatum("");
          }}
          className="rounded bg-marke px-2 py-1 text-xs font-medium text-white hover:bg-marke-dark disabled:opacity-40"
        >
          OK
        </button>
      </label>

      {/* Verantwortung setzen */}
      <label className="flex items-center gap-1 text-sm text-slate-600">
        Verantw.
        <input
          className={`${sel} w-32`}
          placeholder="Name(n)"
          value={verant}
          onChange={(e) => setVerant(e.target.value)}
        />
        <button
          disabled={!verant.trim()}
          onClick={() => {
            onApply({ verantwortung: verant.trim() });
            setVerant("");
          }}
          className="rounded bg-marke px-2 py-1 text-xs font-medium text-white hover:bg-marke-dark disabled:opacity-40"
        >
          OK
        </button>
      </label>

      <div className="ml-auto flex items-center gap-2">
        <button
          onClick={onDelete}
          className="flex items-center gap-1 rounded border border-rose-300 px-2 py-1 text-sm text-rose-600 hover:bg-rose-50"
        >
          <TrashIcon className="h-4 w-4" /> Löschen
        </button>
        <button
          onClick={onClear}
          className="rounded border border-slate-300 bg-white px-2 py-1 text-sm text-slate-500 hover:bg-slate-50"
        >
          Auswahl aufheben
        </button>
      </div>
    </div>
  );
}
