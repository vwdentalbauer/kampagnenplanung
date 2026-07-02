import { useEffect, useRef, useState } from "react";

interface Props {
  options: string[];
  selected: string[];
  onChange: (vals: string[]) => void;
  placeholder?: string;
}

/**
 * Inline-Zelle für die Personen-Auswahl (z.B. „Verantwortung"). Sieht aus wie
 * eine normale Tabellenzelle (Klartext) und öffnet beim Klick ein Dropdown mit
 * den auswählbaren Nutzern (Mehrfachauswahl mit Suche).
 *
 * Das Dropdown wird `fixed` positioniert, damit es nicht vom `overflow-hidden`
 * der Tabellenzelle abgeschnitten wird.
 */
export function PersonenCell({ options, selected, onChange, placeholder = "—" }: Props) {
  const [offen, setOffen] = useState(false);
  const [suche, setSuche] = useState("");
  const [pos, setPos] = useState<{ top: number; left: number } | null>(null);
  const btnRef = useRef<HTMLButtonElement>(null);
  const popRef = useRef<HTMLDivElement>(null);

  const oeffnen = () => {
    const r = btnRef.current?.getBoundingClientRect();
    if (r) {
      // Nach unten öffnen; wenn wenig Platz, nach oben.
      const platzUnten = window.innerHeight - r.bottom;
      const top = platzUnten < 280 && r.top > 280 ? r.top - 4 - 264 : r.bottom + 4;
      setPos({ top, left: r.left });
    }
    setSuche("");
    setOffen(true);
  };

  useEffect(() => {
    if (!offen) return;
    const klick = (e: MouseEvent) => {
      const t = e.target as Node;
      if (
        !popRef.current?.contains(t) &&
        !btnRef.current?.contains(t)
      )
        setOffen(false);
    };
    const schliessen = () => setOffen(false);
    document.addEventListener("mousedown", klick);
    // Beim Scrollen schließen (fixes Dropdown würde sonst „hängen bleiben").
    window.addEventListener("scroll", schliessen, true);
    window.addEventListener("resize", schliessen);
    return () => {
      document.removeEventListener("mousedown", klick);
      window.removeEventListener("scroll", schliessen, true);
      window.removeEventListener("resize", schliessen);
    };
  }, [offen]);

  const toggle = (v: string) =>
    onChange(selected.includes(v) ? selected.filter((x) => x !== v) : [...selected, v]);

  const q = suche.trim().toLowerCase();
  const sichtbar = q ? options.filter((o) => o.toLowerCase().includes(q)) : options;

  return (
    <>
      <button
        ref={btnRef}
        type="button"
        onClick={() => (offen ? setOffen(false) : oeffnen())}
        title="Verantwortliche wählen"
        className="w-full truncate rounded border border-transparent bg-transparent px-1.5 py-1 text-left text-sm text-slate-600 hover:border-slate-200 focus:border-marke focus:bg-white focus:outline-none"
      >
        {selected.length ? (
          selected.join(", ")
        ) : (
          <span className="text-slate-400">{placeholder}</span>
        )}
      </button>

      {offen && pos && (
        <div
          ref={popRef}
          style={{ position: "fixed", top: pos.top, left: pos.left, width: 224 }}
          className="z-50 max-h-64 overflow-auto rounded-lg border border-slate-200 bg-white py-1 shadow-xl"
        >
          <input
            autoFocus
            value={suche}
            onChange={(e) => setSuche(e.target.value)}
            placeholder="Suchen…"
            className="mx-2 mb-1 w-[calc(100%-1rem)] rounded border border-slate-200 px-2 py-1 text-xs focus:border-marke focus:outline-none"
          />
          {sichtbar.length === 0 && (
            <p className="px-3 py-2 text-xs text-slate-400">Keine Treffer.</p>
          )}
          {sichtbar.map((o) => (
            <button
              key={o}
              type="button"
              onClick={() => toggle(o)}
              className="flex w-full items-center gap-2 px-3 py-1.5 text-left text-sm hover:bg-slate-50"
            >
              <input
                type="checkbox"
                readOnly
                checked={selected.includes(o)}
                className="accent-marke"
              />
              <span className="truncate">{o}</span>
            </button>
          ))}
        </div>
      )}
    </>
  );
}
