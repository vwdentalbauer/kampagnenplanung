import { useEffect, useRef, useState } from "react";
import { LEER } from "../lib/filter";

interface Props {
  label: string; // z.B. "Kanäle"
  options: string[]; // verfügbare Werte (abhängige Facette)
  selected: string[];
  onChange: (vals: string[]) => void;
  withEmpty?: boolean; // zusätzliche Option „(leer)"
  suchbar?: boolean; // Suchfeld im Dropdown (für lange Listen)
  anzeige?: (v: string) => string; // Label-Umwandlung (z.B. Status)
}

export function MultiSelect({
  label,
  options,
  selected,
  onChange,
  withEmpty,
  suchbar,
  anzeige,
}: Props) {
  const [offen, setOffen] = useState(false);
  const [suche, setSuche] = useState("");
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!offen) return;
    const klick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOffen(false);
    };
    document.addEventListener("mousedown", klick);
    return () => document.removeEventListener("mousedown", klick);
  }, [offen]);

  const aktiv = selected.length > 0;
  const toggle = (v: string) =>
    onChange(selected.includes(v) ? selected.filter((x) => x !== v) : [...selected, v]);

  const labelText = (v: string) => (v === LEER ? "(leer)" : anzeige ? anzeige(v) : v);
  const zusammenfassung = !aktiv
    ? label
    : selected.length === 1
      ? labelText(selected[0])
      : `${label}: ${selected.length}`;

  const basis: string[] = withEmpty ? [LEER, ...options] : options;
  const q = suche.trim().toLowerCase();
  const alle = q ? basis.filter((v) => labelText(v).toLowerCase().includes(q)) : basis;

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOffen((o) => !o)}
        className={`flex items-center gap-1 rounded border px-2 py-1.5 text-sm ${
          aktiv
            ? "border-marke bg-marke/10 font-medium text-marke-dark"
            : "border-slate-300 bg-white text-slate-600"
        }`}
      >
        <span className="max-w-[160px] truncate">{zusammenfassung}</span>
        <span className="text-[10px] text-slate-400">▾</span>
      </button>

      {offen && (
        <div className="absolute left-0 top-full z-50 mt-1 max-h-72 w-max min-w-[15rem] max-w-[28rem] overflow-auto rounded-lg border border-slate-200 bg-white p-1 shadow-xl">
          {suchbar && (
            <input
              autoFocus
              value={suche}
              onChange={(e) => setSuche(e.target.value)}
              placeholder={label}
              className="mb-1 w-full rounded border border-slate-200 px-2 py-1 text-sm text-slate-600 placeholder:text-slate-400 focus:border-marke focus:outline-none"
            />
          )}
          <div className="flex items-center justify-between px-2 py-1 text-xs text-slate-400">
            <span>{label}</span>
            {aktiv && (
              <button onClick={() => onChange([])} className="text-marke-dark hover:underline">
                Leeren
              </button>
            )}
          </div>
          {alle.length === 0 && <p className="px-2 py-2 text-xs text-slate-400">Keine Treffer</p>}
          {alle.map((v) => (
            <label
              key={v}
              className="flex cursor-pointer items-start gap-2 rounded px-2 py-1 text-sm hover:bg-slate-50"
            >
              <input
                type="checkbox"
                checked={selected.includes(v)}
                onChange={() => toggle(v)}
                className="mt-0.5 accent-marke"
              />
              <span className="whitespace-normal break-words">{labelText(v)}</span>
            </label>
          ))}
        </div>
      )}
    </div>
  );
}
