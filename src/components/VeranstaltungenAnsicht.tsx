import { useState } from "react";
import type { Kampagne } from "../types";
import { TabellenAnsicht } from "./TabellenAnsicht";
import { ChevronIcon, PencilIcon } from "./Icons";
import { formatDatum } from "../lib/date";
import type { EventMeta } from "../data/useVeranstaltungen";

interface Props {
  kampagnen: Kampagne[];
  darfBearbeiten: boolean;
  kanaele: string[];
  vorschlaege: { kanal: string[]; subKanal: string[]; kampagne: string[]; details: string[] };
  events: Record<string, EventMeta>;
  onEditEvent: (kategorie: string) => void;
  onEdit: (k: Kampagne) => void;
  onDelete: (id: string) => void;
  onUpdate: (k: Kampagne, patch: Partial<Kampagne>) => void;
  onBulkUpdate: (ids: string[], patch: Partial<Kampagne>) => void;
  onBulkDelete: (ids: string[]) => void;
}

export function VeranstaltungenAnsicht({
  kampagnen,
  darfBearbeiten,
  kanaele,
  vorschlaege,
  events,
  onEditEvent,
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

  // Alle Veranstaltungen: angelegte Events + bereits verknüpfte Namen.
  const namen = new Set<string>(Object.keys(events));
  kampagnen.forEach((k) => k.veranstaltung.trim() && namen.add(k.veranstaltung.trim()));

  const gruppen = [...namen].map((kategorie) => ({
    kategorie,
    meta: events[kategorie] as EventMeta | undefined,
    tasks: kampagnen.filter((k) => k.veranstaltung.trim() === kategorie),
  }));
  gruppen.sort((a, b) => (a.meta?.start || "9999").localeCompare(b.meta?.start || "9999"));

  if (gruppen.length === 0) {
    return (
      <p className="py-10 text-center text-slate-400">
        Noch keine Veranstaltungen. Lege oben über „+ Neue Veranstaltung" eine an.
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
        const m = g.meta;
        return (
          <section key={g.kategorie} className="overflow-hidden rounded-lg border border-marke/30 bg-white">
            <div className="flex items-center gap-2 px-3 py-3">
              <button
                onClick={() => toggle(g.kategorie)}
                className="flex min-w-0 flex-1 items-center gap-3 text-left"
              >
                <ChevronIcon className={`h-4 w-4 shrink-0 text-slate-400 ${istOffen ? "rotate-90" : ""}`} />
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="rounded bg-marke px-2 py-0.5 text-xs font-medium text-white">
                      Veranstaltung
                    </span>
                    <span className="font-semibold text-slate-800">{g.kategorie}</span>
                    {m?.typ && (
                      <span className="rounded bg-slate-100 px-1.5 py-0.5 text-xs text-slate-600">{m.typ}</span>
                    )}
                    {m?.start && (
                      <span className="text-xs text-slate-400">
                        📅 {formatDatum(m.start)}
                        {m.ende && m.ende !== m.start ? ` – ${formatDatum(m.ende)}` : ""}
                      </span>
                    )}
                    {m?.ort && <span className="text-xs text-slate-400">📍 {m.ort}</span>}
                    {!m && <span className="text-xs italic text-rose-400">Details fehlen</span>}
                  </div>
                </div>
                <span className="shrink-0 whitespace-nowrap text-xs text-slate-400">
                  {g.tasks.length} {g.tasks.length === 1 ? "Eintrag" : "Einträge"}
                </span>
              </button>
              {darfBearbeiten && (
                <button
                  onClick={() => onEditEvent(g.kategorie)}
                  title="Veranstaltung bearbeiten"
                  className="rounded p-1.5 text-slate-400 hover:bg-marke/10 hover:text-marke-dark"
                >
                  <PencilIcon />
                </button>
              )}
            </div>

            {istOffen && (
              <div className="border-t border-marke/20 p-2">
                {g.tasks.length === 0 ? (
                  <p className="px-2 py-3 text-sm text-slate-400">
                    Noch keine Einträge zu dieser Veranstaltung. Lege einen Eintrag an und hake „Event" an.
                  </p>
                ) : (
                  <TabellenAnsicht
                    kampagnen={g.tasks}
                    darfBearbeiten={darfBearbeiten}
                    kanaele={kanaele}
                    vorschlaege={vorschlaege}
                    onEdit={onEdit}
                    onDelete={onDelete}
                    onUpdate={onUpdate}
                    onBulkUpdate={onBulkUpdate}
                    onBulkDelete={onBulkDelete}
                    ausblenden={["kampagne"]}
                  />
                )}
              </div>
            )}
          </section>
        );
      })}
    </div>
  );
}
