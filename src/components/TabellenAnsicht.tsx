import type { Kampagne, Status } from "../types";
import { STATUS_LABELS, STATUS_REIHENFOLGE } from "../constants";
import { StatusBadge } from "./StatusBadge";
import { EditableCell } from "./EditableCell";
import { PencilIcon, TrashIcon } from "./Icons";

interface Props {
  kampagnen: Kampagne[];
  darfBearbeiten: boolean;
  onEdit: (k: Kampagne) => void;
  onDelete: (id: string) => void;
  onUpdate: (k: Kampagne, patch: Partial<Kampagne>) => void;
}

export function TabellenAnsicht({ kampagnen, darfBearbeiten, onEdit, onDelete, onUpdate }: Props) {
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
            {darfBearbeiten && <th className="w-16 px-3 py-2"></th>}
          </tr>
        </thead>
        <tbody>
          {kampagnen.map((k) => (
            <tr key={k.id} className="border-t border-slate-100 align-top hover:bg-slate-50/60">
              {/* KW */}
              <td className="whitespace-nowrap px-2 py-1 font-medium">
                {darfBearbeiten ? (
                  <EditableCell
                    type="number"
                    value={k.kw?.toString() ?? ""}
                    onCommit={(v) => onUpdate(k, { kw: v ? Number(v) : null })}
                    className="w-14"
                  />
                ) : (
                  <span className="px-1.5">{k.kw ? `KW ${k.kw}` : "—"}</span>
                )}
                <div className="px-1.5 text-xs text-slate-400">{k.quartal}</div>
              </td>

              {/* Datum */}
              <td className="whitespace-nowrap px-2 py-1 text-slate-500">
                {darfBearbeiten ? (
                  <EditableCell
                    type="date"
                    value={k.weekStart ?? ""}
                    onCommit={(v) => onUpdate(k, { weekStart: v || null })}
                  />
                ) : (
                  <span className="px-1.5">{k.weekStart ?? "—"}</span>
                )}
              </td>

              {/* Kanal */}
              <td className="px-2 py-1">
                {darfBearbeiten ? (
                  <EditableCell value={k.kanal} onCommit={(v) => onUpdate(k, { kanal: v })} />
                ) : (
                  <span className="px-1.5">{k.kanal}</span>
                )}
              </td>

              {/* Details */}
              <td className="max-w-md px-2 py-1">
                {darfBearbeiten ? (
                  <EditableCell
                    multiline
                    value={k.details}
                    onCommit={(v) => onUpdate(k, { details: v })}
                  />
                ) : (
                  <span className="whitespace-pre-line px-1.5">{k.details}</span>
                )}
              </td>

              {/* Ziel */}
              <td className="px-2 py-1 text-slate-600">
                {darfBearbeiten ? (
                  <EditableCell value={k.ziel} onCommit={(v) => onUpdate(k, { ziel: v })} />
                ) : (
                  <span className="px-1.5">{k.ziel}</span>
                )}
              </td>

              {/* Bereiche – Bearbeitung über das Stift-Icon (Mehrfachauswahl) */}
              <td className="px-3 py-2">
                <div className="flex flex-wrap gap-1">
                  {k.bereiche.map((b) => (
                    <span key={b} className="rounded bg-slate-100 px-1.5 py-0.5 text-xs text-slate-600">
                      {b}
                    </span>
                  ))}
                </div>
              </td>

              {/* Verantwortung */}
              <td className="px-2 py-1 text-slate-600">
                {darfBearbeiten ? (
                  <EditableCell
                    value={k.verantwortung}
                    onCommit={(v) => onUpdate(k, { verantwortung: v })}
                  />
                ) : (
                  <span className="px-1.5">{k.verantwortung}</span>
                )}
              </td>

              {/* Status */}
              <td className="px-3 py-2">
                {darfBearbeiten ? (
                  <select
                    value={k.status}
                    onChange={(e) => onUpdate(k, { status: e.target.value as Status })}
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

              {/* Aktionen als Icons */}
              {darfBearbeiten && (
                <td className="whitespace-nowrap px-3 py-2">
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => onEdit(k)}
                      title="Bearbeiten (alle Felder, inkl. Bereiche)"
                      className="rounded p-1.5 text-slate-400 hover:bg-marke/10 hover:text-marke-dark"
                    >
                      <PencilIcon />
                    </button>
                    <button
                      onClick={() => onDelete(k.id)}
                      title="Löschen"
                      className="rounded p-1.5 text-slate-400 hover:bg-rose-50 hover:text-rose-500"
                    >
                      <TrashIcon />
                    </button>
                  </div>
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
