import type { Kampagne, Status } from "../types";
import { STATUS_LABELS, STATUS_REIHENFOLGE } from "../constants";
import { StatusBadge } from "./StatusBadge";
import { formatDatum } from "../lib/date";

interface Props {
  kampagnen: Kampagne[];
  darfBearbeiten: boolean;
  onEdit: (k: Kampagne) => void;
  onDelete: (id: string) => void;
  onStatus: (k: Kampagne, s: Status) => void;
}

export function TabellenAnsicht({ kampagnen, darfBearbeiten, onEdit, onDelete, onStatus }: Props) {
  return (
    <div className="overflow-x-auto rounded-lg border border-slate-200 bg-white">
      <table className="w-full border-collapse text-sm">
        <thead className="bg-slate-100 text-left text-xs uppercase tracking-wide text-slate-500">
          <tr>
            <th className="px-3 py-2">KW</th>
            <th className="px-3 py-2">Datum</th>
            <th className="px-3 py-2">Kanal</th>
            <th className="px-3 py-2">Details</th>
            <th className="px-3 py-2">Ziel</th>
            <th className="px-3 py-2">Bereiche</th>
            <th className="px-3 py-2">Verantwortung</th>
            <th className="px-3 py-2">Status</th>
            {darfBearbeiten && <th className="px-3 py-2"></th>}
          </tr>
        </thead>
        <tbody>
          {kampagnen.map((k) => (
            <tr key={k.id} className="border-t border-slate-100 align-top hover:bg-slate-50">
              <td className="whitespace-nowrap px-3 py-2 font-medium">
                {k.kw ? `KW ${k.kw}` : "—"}
                <div className="text-xs text-slate-400">{k.quartal}</div>
              </td>
              <td className="whitespace-nowrap px-3 py-2 text-slate-500">{formatDatum(k.weekStart)}</td>
              <td className="px-3 py-2">{k.kanal}</td>
              <td className="max-w-md px-3 py-2 whitespace-pre-line">{k.details}</td>
              <td className="px-3 py-2 text-slate-600">{k.ziel}</td>
              <td className="px-3 py-2">
                <div className="flex flex-wrap gap-1">
                  {k.bereiche.map((b) => (
                    <span key={b} className="rounded bg-slate-100 px-1.5 py-0.5 text-xs text-slate-600">
                      {b}
                    </span>
                  ))}
                </div>
              </td>
              <td className="px-3 py-2 text-slate-600">{k.verantwortung}</td>
              <td className="px-3 py-2">
                {darfBearbeiten ? (
                  <select
                    value={k.status}
                    onChange={(e) => onStatus(k, e.target.value as Status)}
                    className="rounded border border-slate-300 px-1.5 py-1 text-xs"
                  >
                    {STATUS_REIHENFOLGE.map((s) => (
                      <option key={s} value={s}>
                        {STATUS_LABELS[s]}
                      </option>
                    ))}
                  </select>
                ) : (
                  <StatusBadge status={k.status} />
                )}
              </td>
              {darfBearbeiten && (
                <td className="whitespace-nowrap px-3 py-2 text-right">
                  <button onClick={() => onEdit(k)} className="text-marke-dark hover:underline">
                    Bearbeiten
                  </button>
                  <button
                    onClick={() => onDelete(k.id)}
                    className="ml-3 text-rose-500 hover:underline"
                  >
                    Löschen
                  </button>
                </td>
              )}
            </tr>
          ))}
          {kampagnen.length === 0 && (
            <tr>
              <td colSpan={9} className="px-3 py-10 text-center text-slate-400">
                Keine Kampagnen für diese Filter.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
