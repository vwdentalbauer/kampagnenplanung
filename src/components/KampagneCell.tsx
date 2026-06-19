import { useEffect, useRef, useState } from "react";
import { ChevronIcon } from "./Icons";

interface Props {
  value: string;
  /** Bereits vorhandene Kampagnen-Texte zur Wiederverwendung. */
  vorlagen: string[];
  editierbar: boolean;
  onCommit: (neu: string) => void;
}

/**
 * Zelle für die Spalte „Kampagne" (vorher Details).
 * Kombiniert: kompakte einzeilige Vorschau zum Aufklappen + im aufgeklappten
 * Zustand ein Freitextfeld UND ein Dropdown zur Auswahl bestehender Texte.
 */
export function KampagneCell({ value, vorlagen, editierbar, onCommit }: Props) {
  const [offen, setOffen] = useState(false);
  const [wert, setWert] = useState(value);
  const ref = useRef<HTMLTextAreaElement>(null);

  useEffect(() => setWert(value), [value]);

  useEffect(() => {
    if (offen) ref.current?.focus();
  }, [offen]);

  const speichern = () => {
    if (wert !== value) onCommit(wert);
  };

  // Kompakte Vorschau (zugeklappt)
  if (!offen) {
    return (
      <button
        type="button"
        onClick={() => setOffen(true)}
        title={value}
        className="flex w-full items-start gap-1 px-1.5 py-1 text-left hover:text-marke-dark"
      >
        <ChevronIcon className="mt-0.5 h-3.5 w-3.5 shrink-0 text-slate-300" />
        <span className="line-clamp-1 flex-1">{value || <span className="text-slate-300">—</span>}</span>
      </button>
    );
  }

  // Aufgeklappt
  return (
    <div className="space-y-1 px-1 py-1">
      <button
        type="button"
        onClick={() => {
          speichern();
          setOffen(false);
        }}
        className="flex items-center gap-1 text-xs text-slate-400 hover:text-slate-600"
      >
        <ChevronIcon className="h-3.5 w-3.5 rotate-90" />
        Zuklappen
      </button>

      {editierbar ? (
        <>
          <select
            className="w-full rounded border border-slate-200 bg-slate-50 px-1.5 py-1 text-xs text-slate-500 focus:border-marke focus:outline-none"
            value=""
            onChange={(e) => {
              if (e.target.value) {
                setWert(e.target.value);
                onCommit(e.target.value);
              }
            }}
          >
            <option value="">Vorlage übernehmen…</option>
            {vorlagen.map((v) => (
              <option key={v} value={v}>
                {v.length > 70 ? v.slice(0, 70) + "…" : v}
              </option>
            ))}
          </select>
          <textarea
            ref={ref}
            rows={4}
            className="w-full resize-y whitespace-pre-line rounded border border-slate-300 px-1.5 py-1 text-sm focus:border-marke focus:outline-none focus:ring-1 focus:ring-marke"
            value={wert}
            onChange={(e) => setWert(e.target.value)}
            onBlur={speichern}
          />
        </>
      ) : (
        <p className="whitespace-pre-line px-0.5 text-sm">{value}</p>
      )}
    </div>
  );
}
