import { useEffect, useRef, useState } from "react";
import type { Benachrichtigung } from "../data/useBenachrichtigungen";

interface Props {
  liste: Benachrichtigung[];
  ungelesen: number;
  alsGelesenMarkieren: () => void;
  onOeffnen: (b: Benachrichtigung) => void;
}

/** Relative Zeitangabe („vor 3 Std.") aus einem ISO-Zeitstempel. */
function vorWieLange(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const min = Math.round(diff / 60000);
  if (min < 1) return "gerade eben";
  if (min < 60) return `vor ${min} Min.`;
  const std = Math.round(min / 60);
  if (std < 24) return `vor ${std} Std.`;
  const tage = Math.round(std / 24);
  if (tage === 1) return "gestern";
  if (tage < 7) return `vor ${tage} Tagen`;
  return new Date(iso).toLocaleDateString("de-DE");
}

export function Benachrichtigungen({ liste, ungelesen, alsGelesenMarkieren, onOeffnen }: Props) {
  const [offen, setOffen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  // Beim Öffnen automatisch als gelesen markieren (Badge verschwindet).
  useEffect(() => {
    if (offen && ungelesen > 0) {
      const t = setTimeout(() => alsGelesenMarkieren(), 1200);
      return () => clearTimeout(t);
    }
  }, [offen, ungelesen, alsGelesenMarkieren]);

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOffen((o) => !o)}
        title="Benachrichtigungen"
        className="relative rounded-md border border-slate-200 bg-white px-2.5 py-1 text-base text-slate-500 hover:bg-slate-50"
      >
        🔔
        {ungelesen > 0 && (
          <span className="absolute -right-1.5 -top-1.5 flex h-5 min-w-[1.25rem] items-center justify-center rounded-full bg-rose-500 px-1 text-xs font-bold text-white">
            {ungelesen > 9 ? "9+" : ungelesen}
          </span>
        )}
      </button>

      {offen && (
        <>
          <div className="fixed inset-0 z-30" onClick={() => setOffen(false)} />
          <div className="absolute right-0 z-40 mt-1 w-80 max-w-[90vw] overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xl">
            <div className="flex items-center justify-between border-b border-slate-100 px-3 py-2">
              <span className="text-sm font-semibold text-slate-700">Benachrichtigungen</span>
              {liste.some((b) => !b.gelesen) && (
                <button
                  onClick={alsGelesenMarkieren}
                  className="text-xs text-marke-dark hover:underline"
                >
                  Alle gelesen
                </button>
              )}
            </div>

            <div className="max-h-[60vh] overflow-auto">
              {liste.length === 0 ? (
                <p className="px-3 py-6 text-center text-sm text-slate-400">
                  Keine neuen Benachrichtigungen.
                </p>
              ) : (
                liste.map((b) => (
                  <button
                    key={b.key}
                    onClick={() => {
                      setOffen(false);
                      onOeffnen(b);
                    }}
                    className={`flex w-full items-start gap-2 border-b border-slate-50 px-3 py-2 text-left hover:bg-slate-50 ${
                      b.gelesen ? "opacity-60" : "bg-marke/5"
                    }`}
                  >
                    <span className="mt-0.5 text-base">
                      {b.art === "veranstaltung" ? "🎟" : "📣"}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-medium text-slate-700">
                        {b.titel}
                      </span>
                      <span className="block text-xs text-slate-500">
                        {b.art === "veranstaltung" ? "Veranstaltung" : "Eintrag"} ·{" "}
                        {b.land} · von {b.autor}
                      </span>
                      <span className="block text-xs text-slate-400">{vorWieLange(b.ts)}</span>
                    </span>
                    {!b.gelesen && (
                      <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-rose-500" />
                    )}
                  </button>
                ))
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
