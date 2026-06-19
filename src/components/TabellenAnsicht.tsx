import { useEffect, useMemo, useRef, useState } from "react";
import type { Kampagne, Status } from "../types";
import { STATUS_LABELS, STATUS_REIHENFOLGE } from "../constants";
import { StatusBadge } from "./StatusBadge";
import { EditableCell } from "./EditableCell";
import { KampagneCell } from "./KampagneCell";
import { BulkBar } from "./BulkBar";
import { PencilIcon, TrashIcon, GripIcon } from "./Icons";

interface Props {
  kampagnen: Kampagne[];
  darfBearbeiten: boolean;
  kanaele: string[];
  onEdit: (k: Kampagne) => void;
  onDelete: (id: string) => void;
  onUpdate: (k: Kampagne, patch: Partial<Kampagne>) => void;
  onBulkUpdate: (ids: string[], patch: Partial<Kampagne>) => void;
  onBulkDelete: (ids: string[]) => void;
}

// Verschiebbare Spalten. „Kampagne" steht standardmäßig direkt hinter „Datum".
type SpaltenKey =
  | "kw"
  | "datum"
  | "kampagne"
  | "kanal"
  | "ziel"
  | "bereiche"
  | "verantwortung"
  | "status";

const SPALTEN: Record<SpaltenKey, { label: string; breite: number }> = {
  kw: { label: "KW", breite: 70 },
  datum: { label: "Datum", breite: 118 },
  kampagne: { label: "Kampagne", breite: 340 },
  kanal: { label: "Kanal", breite: 130 },
  ziel: { label: "Ziel", breite: 200 },
  bereiche: { label: "Bereiche", breite: 140 },
  verantwortung: { label: "Verantwortung", breite: 160 },
  status: { label: "Status", breite: 120 },
};

const STANDARD_REIHENFOLGE: SpaltenKey[] = [
  "kw",
  "datum",
  "kampagne",
  "kanal",
  "ziel",
  "bereiche",
  "verantwortung",
  "status",
];

const SPALTEN_KEY = "kampagnen.spalten.v1";

function ladeReihenfolge(): SpaltenKey[] {
  try {
    const raw = localStorage.getItem(SPALTEN_KEY);
    if (!raw) return STANDARD_REIHENFOLGE;
    const gespeichert = JSON.parse(raw) as SpaltenKey[];
    // Nur bekannte Spalten behalten, fehlende hinten anhängen (robust gegen Updates).
    const gueltig = gespeichert.filter((k) => k in SPALTEN);
    const fehlend = STANDARD_REIHENFOLGE.filter((k) => !gueltig.includes(k));
    return [...gueltig, ...fehlend];
  } catch {
    return STANDARD_REIHENFOLGE;
  }
}

export function TabellenAnsicht({
  kampagnen,
  darfBearbeiten,
  kanaele,
  onEdit,
  onDelete,
  onUpdate,
  onBulkUpdate,
  onBulkDelete,
}: Props) {
  const [reihenfolge, setReihenfolge] = useState<SpaltenKey[]>(ladeReihenfolge);
  const [auswahl, setAuswahl] = useState<Set<string>>(new Set());
  const [dragKey, setDragKey] = useState<SpaltenKey | null>(null);
  const selectAllRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    localStorage.setItem(SPALTEN_KEY, JSON.stringify(reihenfolge));
  }, [reihenfolge]);

  // Vorlagen für die Kampagne-Spalte (eindeutige, nicht-leere Texte).
  const vorlagen = useMemo(() => {
    const set = new Set<string>();
    kampagnen.forEach((k) => k.details.trim() && set.add(k.details.trim()));
    return [...set].sort((a, b) => a.localeCompare(b, "de"));
  }, [kampagnen]);

  const sichtbareIds = kampagnen.map((k) => k.id);
  const ausgewaehlteSichtbar = sichtbareIds.filter((id) => auswahl.has(id));
  const alleGewaehlt = sichtbareIds.length > 0 && ausgewaehlteSichtbar.length === sichtbareIds.length;
  const einigeGewaehlt = ausgewaehlteSichtbar.length > 0 && !alleGewaehlt;

  useEffect(() => {
    if (selectAllRef.current) selectAllRef.current.indeterminate = einigeGewaehlt;
  }, [einigeGewaehlt]);

  const toggle = (id: string) => {
    setAuswahl((s) => {
      const n = new Set(s);
      n.has(id) ? n.delete(id) : n.add(id);
      return n;
    });
  };
  const toggleAlle = () => {
    setAuswahl(alleGewaehlt ? new Set() : new Set(sichtbareIds));
  };
  const auswahlAufheben = () => setAuswahl(new Set());

  const bulkApply = (patch: Partial<Kampagne>) => {
    onBulkUpdate([...ausgewaehlteSichtbar], patch);
  };
  const bulkDelete = () => {
    if (confirm(`${ausgewaehlteSichtbar.length} Kampagne(n) wirklich löschen?`)) {
      onBulkDelete([...ausgewaehlteSichtbar]);
      auswahlAufheben();
    }
  };

  // Drag & Drop der Spaltenköpfe
  const onDrop = (ziel: SpaltenKey) => {
    if (!dragKey || dragKey === ziel) return;
    setReihenfolge((r) => {
      const ohne = r.filter((k) => k !== dragKey);
      const idx = ohne.indexOf(ziel);
      ohne.splice(idx, 0, dragKey);
      return ohne;
    });
    setDragKey(null);
  };

  const zelle = (key: SpaltenKey, k: Kampagne) => {
    switch (key) {
      case "kw":
        return (
          <>
            {darfBearbeiten ? (
              <EditableCell
                type="number"
                value={k.kw?.toString() ?? ""}
                onCommit={(v) => onUpdate(k, { kw: v ? Number(v) : null })}
                className="w-12"
              />
            ) : (
              <span className="px-1.5">{k.kw ? `KW ${k.kw}` : "—"}</span>
            )}
            <div className="px-1.5 text-xs text-slate-400">{k.quartal}</div>
          </>
        );
      case "datum":
        return darfBearbeiten ? (
          <EditableCell
            type="date"
            value={k.weekStart ?? ""}
            onCommit={(v) => onUpdate(k, { weekStart: v || null })}
          />
        ) : (
          <span className="px-1.5 text-slate-500">{k.weekStart ?? "—"}</span>
        );
      case "kampagne":
        return (
          <KampagneCell
            value={k.details}
            vorlagen={vorlagen}
            editierbar={darfBearbeiten}
            onCommit={(v) => onUpdate(k, { details: v })}
          />
        );
      case "kanal":
        return darfBearbeiten ? (
          <EditableCell value={k.kanal} onCommit={(v) => onUpdate(k, { kanal: v })} />
        ) : (
          <span className="px-1.5">{k.kanal}</span>
        );
      case "ziel":
        return darfBearbeiten ? (
          <EditableCell value={k.ziel} onCommit={(v) => onUpdate(k, { ziel: v })} />
        ) : (
          <span className="px-1.5 text-slate-600">{k.ziel}</span>
        );
      case "bereiche":
        return (
          <div className="flex flex-wrap gap-1 px-1.5">
            {k.bereiche.map((b) => (
              <span key={b} className="rounded bg-slate-100 px-1.5 py-0.5 text-xs text-slate-600">
                {b}
              </span>
            ))}
          </div>
        );
      case "verantwortung":
        return darfBearbeiten ? (
          <EditableCell value={k.verantwortung} onCommit={(v) => onUpdate(k, { verantwortung: v })} />
        ) : (
          <span className="px-1.5 text-slate-600">{k.verantwortung}</span>
        );
      case "status":
        return darfBearbeiten ? (
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
        );
    }
  };

  const spaltenAnzahl = reihenfolge.length + 1 + (darfBearbeiten ? 1 : 0);

  return (
    <div>
      {darfBearbeiten && ausgewaehlteSichtbar.length > 0 && (
        <BulkBar
          anzahl={ausgewaehlteSichtbar.length}
          kanaele={kanaele}
          onApply={bulkApply}
          onDelete={bulkDelete}
          onClear={auswahlAufheben}
        />
      )}

      <div className="overflow-x-auto rounded-lg border border-slate-200 bg-white">
        <table className="w-full table-fixed border-collapse text-sm">
          <colgroup>
            <col style={{ width: 40 }} />
            {reihenfolge.map((key) => (
              <col key={key} style={{ width: SPALTEN[key].breite }} />
            ))}
            {darfBearbeiten && <col style={{ width: 80 }} />}
          </colgroup>

          <thead className="bg-slate-100 text-left text-xs uppercase tracking-wide text-slate-500">
            <tr>
              <th className="px-2 py-2">
                <input
                  ref={selectAllRef}
                  type="checkbox"
                  checked={alleGewaehlt}
                  onChange={toggleAlle}
                  className="cursor-pointer accent-marke"
                  title="Alle auswählen"
                />
              </th>
              {reihenfolge.map((key) => (
                <th
                  key={key}
                  draggable
                  onDragStart={() => setDragKey(key)}
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={() => onDrop(key)}
                  className={`group cursor-move select-none px-3 py-2 ${
                    dragKey === key ? "opacity-40" : ""
                  }`}
                  title="Zum Verschieben ziehen"
                >
                  <span className="flex items-center gap-1">
                    <GripIcon className="h-3.5 w-3.5 text-slate-300 group-hover:text-slate-400" />
                    {SPALTEN[key].label}
                  </span>
                </th>
              ))}
              {darfBearbeiten && <th className="px-3 py-2"></th>}
            </tr>
          </thead>

          <tbody>
            {kampagnen.map((k) => {
              const gewaehlt = auswahl.has(k.id);
              return (
                <tr
                  key={k.id}
                  className={`border-t border-slate-100 align-top ${
                    gewaehlt ? "bg-marke/5" : "hover:bg-slate-50/60"
                  }`}
                >
                  <td className="px-2 py-2">
                    <input
                      type="checkbox"
                      checked={gewaehlt}
                      onChange={() => toggle(k.id)}
                      className="cursor-pointer accent-marke"
                    />
                  </td>
                  {reihenfolge.map((key) => (
                    <td key={key} className="px-2 py-1">
                      {zelle(key, k)}
                    </td>
                  ))}
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
              );
            })}
            {kampagnen.length === 0 && (
              <tr>
                <td colSpan={spaltenAnzahl} className="px-3 py-10 text-center text-slate-400">
                  Keine Kampagnen für diese Filter.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
