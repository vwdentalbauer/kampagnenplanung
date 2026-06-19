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

// Verschiebbare Spalten. „Kampagne" und „Details" stehen hinter „Datum".
type SpaltenKey =
  | "kw"
  | "datum"
  | "kampagne"
  | "details"
  | "kanal"
  | "bereiche"
  | "verantwortung"
  | "status";

// breite = null bedeutet flexibel (füllt den verbleibenden Platz → responsiv).
const SPALTEN: Record<SpaltenKey, { label: string; breite: number | null }> = {
  kw: { label: "KW", breite: 60 },
  datum: { label: "Datum", breite: 110 },
  kampagne: { label: "Kampagne", breite: 190 },
  details: { label: "Details", breite: null },
  kanal: { label: "Kanal", breite: 120 },
  bereiche: { label: "Bereiche", breite: 130 },
  verantwortung: { label: "Verantwortung", breite: 150 },
  status: { label: "Status", breite: 112 },
};

const STANDARD_REIHENFOLGE: SpaltenKey[] = [
  "kw",
  "datum",
  "kampagne",
  "details",
  "kanal",
  "bereiche",
  "verantwortung",
  "status",
];

const SPALTEN_KEY = "kampagnen.spalten.v2";

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

type SortRichtung = "asc" | "desc";
interface SortZustand {
  key: SpaltenKey | null;
  dir: SortRichtung;
}

// Vergleichswert je Spalte (Zahl oder String) für die Sortierung.
function sortWert(key: SpaltenKey, k: Kampagne): number | string {
  switch (key) {
    case "kw":
      return k.kw ?? Number.POSITIVE_INFINITY;
    case "datum":
      return k.weekStart ?? "";
    case "status":
      return STATUS_REIHENFOLGE.indexOf(k.status);
    case "bereiche":
      return k.bereiche.join(", ");
    case "kampagne":
      return k.kampagne;
    case "details":
      return k.details;
    case "kanal":
      return k.kanal;
    case "verantwortung":
      return k.verantwortung;
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
  const [sort, setSort] = useState<SortZustand>({ key: null, dir: "asc" });
  const selectAllRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    localStorage.setItem(SPALTEN_KEY, JSON.stringify(reihenfolge));
  }, [reihenfolge]);

  // Vorlagen für die Details-Spalte (eindeutige, nicht-leere Texte).
  const vorlagen = useMemo(() => {
    const set = new Set<string>();
    kampagnen.forEach((k) => k.details.trim() && set.add(k.details.trim()));
    return [...set].sort((a, b) => a.localeCompare(b, "de"));
  }, [kampagnen]);

  // Sortierte Liste für die Anzeige.
  const sortiert = useMemo(() => {
    if (!sort.key) return kampagnen;
    const key = sort.key;
    const faktor = sort.dir === "asc" ? 1 : -1;
    return [...kampagnen].sort((a, b) => {
      const av = sortWert(key, a);
      const bv = sortWert(key, b);
      let cmp: number;
      if (typeof av === "number" && typeof bv === "number") cmp = av - bv;
      else cmp = String(av).localeCompare(String(bv), "de");
      return cmp * faktor;
    });
  }, [kampagnen, sort]);

  const sortBy = (key: SpaltenKey) =>
    setSort((s) => (s.key === key ? { key, dir: s.dir === "asc" ? "desc" : "asc" } : { key, dir: "asc" }));

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
        return darfBearbeiten ? (
          <EditableCell value={k.kampagne} onCommit={(v) => onUpdate(k, { kampagne: v })} />
        ) : (
          <span className="px-1.5 font-medium">{k.kampagne}</span>
        );
      case "details":
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
        {/* table-fixed + w-full: Spalten füllen exakt die Breite (responsiv).
            min-w sorgt dafür, dass es auf sehr schmalen Screens scrollbar bleibt. */}
        <table className="w-full min-w-[860px] table-fixed border-collapse text-sm">
          <colgroup>
            <col style={{ width: 36 }} />
            {reihenfolge.map((key) => {
              const b = SPALTEN[key].breite;
              return <col key={key} style={b ? { width: b } : undefined} />;
            })}
            {darfBearbeiten && <col style={{ width: 72 }} />}
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
              {reihenfolge.map((key) => {
                const aktiv = sort.key === key;
                return (
                  <th
                    key={key}
                    onDragOver={(e) => e.preventDefault()}
                    onDrop={() => onDrop(key)}
                    className={`px-2 py-2 ${dragKey === key ? "opacity-40" : ""}`}
                  >
                    <div className="flex items-center gap-1">
                      {/* Drag-Griff zum Verschieben */}
                      <span
                        draggable
                        onDragStart={() => setDragKey(key)}
                        onDragEnd={() => setDragKey(null)}
                        title="Spalte verschieben"
                        className="cursor-grab text-slate-300 hover:text-slate-500"
                      >
                        <GripIcon className="h-3.5 w-3.5" />
                      </span>
                      {/* Klick = Sortieren */}
                      <button
                        onClick={() => sortBy(key)}
                        title="Auf-/absteigend sortieren"
                        className="flex items-center gap-0.5 uppercase tracking-wide hover:text-slate-700"
                      >
                        {SPALTEN[key].label}
                        <span className={`text-[10px] ${aktiv ? "text-marke-dark" : "text-slate-300"}`}>
                          {aktiv ? (sort.dir === "asc" ? "▲" : "▼") : "↕"}
                        </span>
                      </button>
                    </div>
                  </th>
                );
              })}
              {darfBearbeiten && <th className="px-3 py-2"></th>}
            </tr>
          </thead>

          <tbody>
            {sortiert.map((k) => {
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
                    <td key={key} className="overflow-hidden px-2 py-1">
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
