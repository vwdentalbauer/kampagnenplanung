import { useState } from "react";
import type { Kampagne } from "../types";
import { TabellenAnsicht } from "./TabellenAnsicht";
import { ChevronIcon } from "./Icons";
import { formatDatum } from "../lib/date";

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

function erster(werte: string[]): string {
  return werte.find((w) => w.trim()) ?? "";
}

/**
 * Reiter „Veranstaltungen": zeigt alle Einträge mit Sparte „Events",
 * gruppiert nach Kategorie. Pro Kategorie Typ/Ort/Veranstaltungsdatum,
 * darunter die Bewerbungs-Einträge (deren Datum = Bewerbungszeitpunkt).
 */
export function VeranstaltungenAnsicht({
  kampagnen,
  darfBearbeiten,
  kanaele,
  onEdit,
  onDelete,
  onUpdate,
  onBulkUpdate,
  onBulkDelete,
}: Props) {
  const [offen, setOffen] = useState<Set<string>>(new Set());
  const toggle = (name: string) =>
    setOffen((s) => {
      const n = new Set(s);
      n.has(name) ? n.delete(name) : n.add(name);
      return n;
    });

  const events = kampagnen.filter((k) => k.bereiche.includes("Events"));
  const map = new Map<string, Kampagne[]>();
  for (const k of events) {
    const kat = k.veranstaltung.trim() || "Ohne Kategorie";
    if (!map.has(kat)) map.set(kat, []);
    map.get(kat)!.push(k);
  }

  const gruppen = [...map.entries()].map(([kategorie, tasks]) => {
    const datum = erster(tasks.map((t) => t.eventDatum ?? ""));
    const datumBis = erster(tasks.map((t) => t.eventDatumBis ?? ""));
    const typ = erster(tasks.map((t) => t.eventTyp));
    const ort = erster(tasks.map((t) => t.eventOrt));
    return { kategorie, tasks, datum, datumBis, typ, ort };
  });
  gruppen.sort((a, b) => (a.datum || "9999").localeCompare(b.datum || "9999"));

  if (events.length === 0) {
    return (
      <p className="py-10 text-center text-slate-400">
        Noch keine Veranstaltungen. Markiere einen Eintrag mit der Sparte „Events", um Typ, Ort und
        Veranstaltungsdatum zu hinterlegen.
      </p>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex justify-end gap-2 text-xs">
        <button
          onClick={() => setOffen(new Set(gruppen.map((g) => g.kategorie)))}
          className="rounded border border-slate-300 px-2 py-1 text-slate-500 hover:bg-slate-50"
        >
          Alle ausklappen
        </button>
        <button
          onClick={() => setOffen(new Set())}
          className="rounded border border-slate-300 px-2 py-1 text-slate-500 hover:bg-slate-50"
        >
          Alle einklappen
        </button>
      </div>

      {gruppen.map((g) => {
        const istOffen = offen.has(g.kategorie);
        return (
          <section key={g.kategorie} className="overflow-hidden rounded-lg border border-marke/30 bg-white">
            <button
              onClick={() => toggle(g.kategorie)}
              className="flex w-full items-center gap-3 px-3 py-3 text-left hover:bg-marke/5"
            >
              <ChevronIcon className={`h-4 w-4 shrink-0 text-slate-400 ${istOffen ? "rotate-90" : ""}`} />
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="rounded bg-marke px-2 py-0.5 text-xs font-medium text-white">
                    Veranstaltung
                  </span>
                  <span className="font-semibold text-slate-800">{g.kategorie}</span>
                  {g.typ && (
                    <span className="rounded bg-slate-100 px-1.5 py-0.5 text-xs text-slate-600">
                      {g.typ}
                    </span>
                  )}
                  {g.datum && (
                    <span className="text-xs text-slate-400">
                      📅 {formatDatum(g.datum)}
                      {g.datumBis && g.datumBis !== g.datum ? ` – ${formatDatum(g.datumBis)}` : ""}
                    </span>
                  )}
                  {g.ort && <span className="text-xs text-slate-400">📍 {g.ort}</span>}
                </div>
              </div>
              <span className="shrink-0 whitespace-nowrap text-xs text-slate-400">
                {g.tasks.length} {g.tasks.length === 1 ? "Eintrag" : "Einträge"}
              </span>
            </button>

            {istOffen && (
              <div className="border-t border-marke/20 p-2">
                <TabellenAnsicht
                  kampagnen={g.tasks}
                  darfBearbeiten={darfBearbeiten}
                  kanaele={kanaele}
                  onEdit={onEdit}
                  onDelete={onDelete}
                  onUpdate={onUpdate}
                  onBulkUpdate={onBulkUpdate}
                  onBulkDelete={onBulkDelete}
                  ausblenden={["kampagne"]}
                />
              </div>
            )}
          </section>
        );
      })}
    </div>
  );
}
