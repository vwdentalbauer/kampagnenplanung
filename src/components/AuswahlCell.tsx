import { useEffect, useRef, useState } from "react";

interface Props {
  options: string[];
  selected: string[];
  onChange: (vals: string[]) => void;
  /** Mehrfachauswahl (Checkboxen) statt Einzelauswahl. Default: true. */
  multi?: boolean;
  /** Freie Eingabe zulassen (Wert per Enter übernehmen). Default: false. */
  freitext?: boolean;
  placeholder?: string;
  titel?: string;
}

/**
 * Inline-Zelle mit Dropdown-Auswahl (z.B. „Kanal", „Sub-Kanal",
 * „Verantwortung"). Sieht aus wie eine normale Tabellenzelle (Klartext) und
 * öffnet beim Klick ein Dropdown mit allen möglichen Werten.
 *
 * - `multi`: Mehrfachauswahl über Checkboxen (Werte werden mit „ / " verbunden).
 * - `freitext`: erlaubt zusätzlich eigene Eingaben (Enter übernimmt).
 *
 * Das Dropdown wird `fixed` positioniert, damit es nicht vom `overflow-hidden`
 * der Tabellenzelle abgeschnitten wird.
 */
export function AuswahlCell({
  options,
  selected,
  onChange,
  multi = true,
  freitext = false,
  placeholder = "—",
  titel = "Auswählen",
}: Props) {
  const [offen, setOffen] = useState(false);
  const [suche, setSuche] = useState("");
  const [pos, setPos] = useState<{ top: number; left: number } | null>(null);
  const btnRef = useRef<HTMLButtonElement>(null);
  const popRef = useRef<HTMLDivElement>(null);

  const oeffnen = () => {
    const r = btnRef.current?.getBoundingClientRect();
    if (r) {
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
      if (!popRef.current?.contains(t) && !btnRef.current?.contains(t)) setOffen(false);
    };
    const schliessen = () => setOffen(false);
    document.addEventListener("mousedown", klick);
    window.addEventListener("scroll", schliessen, true);
    window.addEventListener("resize", schliessen);
    return () => {
      document.removeEventListener("mousedown", klick);
      window.removeEventListener("scroll", schliessen, true);
      window.removeEventListener("resize", schliessen);
    };
  }, [offen]);

  const waehleEinzel = (v: string) => {
    onChange([v]);
    setOffen(false);
  };
  const toggleMehr = (v: string) =>
    onChange(selected.includes(v) ? selected.filter((x) => x !== v) : [...selected, v]);

  // Freitext per Enter übernehmen.
  const uebernehmen = () => {
    const v = suche.trim();
    if (!v) return;
    if (multi) {
      if (!selected.includes(v)) onChange([...selected, v]);
      setSuche("");
    } else {
      waehleEinzel(v);
    }
  };

  const q = suche.trim().toLowerCase();
  const sichtbar = q ? options.filter((o) => o.toLowerCase().includes(q)) : options;
  // Exakte Freitext-Eingabe, die (noch) nicht in der Liste steht.
  const zeigeNeu = freitext && q && !options.some((o) => o.toLowerCase() === q);

  return (
    <>
      <button
        ref={btnRef}
        type="button"
        onClick={() => (offen ? setOffen(false) : oeffnen())}
        title={titel}
        className="w-full truncate rounded border border-transparent bg-transparent px-1.5 py-1 text-left text-sm text-slate-600 hover:border-slate-200 focus:border-marke focus:bg-white focus:outline-none"
      >
        {selected.length ? (
          selected.join(" / ")
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
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                uebernehmen();
              }
            }}
            placeholder={freitext ? "Suchen oder neu…" : "Suchen…"}
            className="mx-2 mb-1 w-[calc(100%-1rem)] rounded border border-slate-200 px-2 py-1 text-xs focus:border-marke focus:outline-none"
          />
          {zeigeNeu && (
            <button
              type="button"
              onClick={uebernehmen}
              className="flex w-full items-center gap-2 px-3 py-1.5 text-left text-sm text-marke-dark hover:bg-marke/10"
            >
              <span className="text-xs">＋</span>
              <span className="truncate">„{suche.trim()}" übernehmen</span>
            </button>
          )}
          {!multi && selected.length > 0 && (
            <button
              type="button"
              onClick={() => waehleEinzel("")}
              className="flex w-full items-center gap-2 px-3 py-1.5 text-left text-sm text-slate-400 hover:bg-slate-50"
            >
              <span className="text-xs">✕</span>
              <span>leeren</span>
            </button>
          )}
          {sichtbar.length === 0 && !zeigeNeu && (
            <p className="px-3 py-2 text-xs text-slate-400">Keine Treffer.</p>
          )}
          {sichtbar.map((o) => (
            <button
              key={o}
              type="button"
              onClick={() => (multi ? toggleMehr(o) : waehleEinzel(o))}
              className="flex w-full items-center gap-2 px-3 py-1.5 text-left text-sm hover:bg-slate-50"
            >
              {multi ? (
                <input type="checkbox" readOnly checked={selected.includes(o)} className="accent-marke" />
              ) : (
                <span className={`text-marke ${selected.includes(o) ? "" : "opacity-0"}`}>✓</span>
              )}
              <span className="truncate">{o}</span>
            </button>
          ))}
        </div>
      )}
    </>
  );
}
