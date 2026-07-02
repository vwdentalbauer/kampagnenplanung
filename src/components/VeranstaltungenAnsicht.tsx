import { useState } from "react";
import type { Kampagne } from "../types";
import { TabellenAnsicht } from "./TabellenAnsicht";
import { ChevronIcon, PencilIcon } from "./Icons";
import { formatDatum } from "../lib/date";
import type { EventMeta, SubEvent } from "../data/useVeranstaltungen";

interface Vorschlaege {
  kanal: string[];
  subKanal: string[];
  kampagne: string[];
  details: string[];
  verantwortliche: string[];
}

interface Props {
  kampagnen: Kampagne[];
  darfBearbeiten: boolean;
  kanaele: string[];
  vorschlaege: Vorschlaege;
  events: Record<string, EventMeta>;
  /** Zeitraum-Filter (KW/Datum) – für „Nach Datum". */
  imZeitraum: (start: string | null, ende: string | null) => boolean;
  /** Freitextsuche – matcht Kategorie, Typ, Event-Name und Ort. */
  suche: string;
  onEditEvent: (kategorie: string) => void;
  /** Neuen Eintrag direkt für eine Veranstaltung/Termin anlegen. */
  onNeuerEintrag: (kategorie: string, subId: string | null) => void;
  onEdit: (k: Kampagne) => void;
  onDelete: (id: string) => void;
  onUpdate: (k: Kampagne, patch: Partial<Kampagne>) => void;
  onBulkUpdate: (ids: string[], patch: Partial<Kampagne>) => void;
  onBulkDelete: (ids: string[]) => void;
}

type Modus = "datum" | "kategorie";

export function VeranstaltungenAnsicht(props: Props) {
  const { kampagnen, darfBearbeiten, kanaele, vorschlaege, events, imZeitraum, suche, onEditEvent, onNeuerEintrag } =
    props;

  // Freitextsuche (Ort, Event-Name, Kategorie, Typ).
  const q = suche.trim().toLowerCase();
  const treffer = (text: string | null | undefined) =>
    !q || (text ?? "").toLowerCase().includes(q);
  const subTrifft = (s: SubEvent) => treffer(s.name) || treffer(s.ort);
  const katTrifft = (kat: string) => treffer(kat) || treffer(events[kat]?.typ);

  // Kleiner „+ Eintrag"-Button (nur für Bearbeiter).
  const plusEintrag = (kat: string, subId: string | null) =>
    darfBearbeiten ? (
      <button
        onClick={(e) => {
          e.stopPropagation();
          onNeuerEintrag(kat, subId);
        }}
        title="Eintrag zu diesem Termin anlegen"
        className="shrink-0 rounded border border-marke px-2 py-0.5 text-xs font-medium text-marke-dark hover:bg-marke/10"
      >
        + Eintrag
      </button>
    ) : null;
  const [modus, setModus] = useState<Modus>("datum");
  const [offen, setOffen] = useState<Set<string>>(new Set());
  const toggle = (k: string) =>
    setOffen((s) => {
      const n = new Set(s);
      n.has(k) ? n.delete(k) : n.add(k);
      return n;
    });

  // Alle Kategorien: angelegte Events + bereits verknüpfte Namen.
  const kategorien = new Set<string>(Object.keys(events));
  kampagnen.forEach((k) => k.veranstaltung.trim() && kategorien.add(k.veranstaltung.trim()));

  const eintraegeFuer = (kat: string, subId: string | null) =>
    kampagnen.filter(
      (k) =>
        k.veranstaltung.trim() === kat &&
        (subId ? k.subEvent === subId : !k.subEvent),
    );

  const tabelle = (tasks: Kampagne[]) => (
    <TabellenAnsicht
      kampagnen={tasks}
      darfBearbeiten={darfBearbeiten}
      kanaele={kanaele}
      vorschlaege={vorschlaege}
      onEdit={props.onEdit}
      onDelete={props.onDelete}
      onUpdate={props.onUpdate}
      onBulkUpdate={props.onBulkUpdate}
      onBulkDelete={props.onBulkDelete}
      ausblenden={["kampagne"]}
    />
  );

  const subLabel = (s: { name?: string; ort: string; start: string | null; ende: string | null }) =>
    `${s.name ? `${s.name} – ` : ""}${s.ort || "ohne Ort"}${s.start ? ` · ${formatDatum(s.start)}` : ""}${
      s.ende && s.ende !== s.start ? `–${formatDatum(s.ende)}` : ""
    }`;

  if (kategorien.size === 0) {
    return (
      <p className="py-10 text-center text-slate-400">
        Noch keine Veranstaltungen. Lege oben über „+ Neue Veranstaltung" eine an.
      </p>
    );
  }

  // ---- Ansicht „Nach Datum": alle Sub-Veranstaltungen flach, nach Datum ----
  // Respektiert den aktiven KW-/Datums-Filter.
  const datumItems = [...kategorien]
    .flatMap((kat) =>
      (events[kat]?.subs ?? []).map((s) => ({ kat, typ: events[kat]?.typ ?? "", sub: s })),
    )
    .filter((i) => imZeitraum(i.sub.start, i.sub.ende))
    .filter((i) => katTrifft(i.kat) || subTrifft(i.sub));
  datumItems.sort((a, b) => (a.sub.start || "9999").localeCompare(b.sub.start || "9999"));

  const umschalter = (
    <div className="flex items-center gap-2">
      <div className="flex gap-1 rounded-lg border border-slate-200 bg-white p-1">
        {(["datum", "kategorie"] as Modus[]).map((m) => (
          <button
            key={m}
            onClick={() => setModus(m)}
            className={`rounded-md px-3 py-1 text-sm font-medium ${
              modus === m ? "bg-marke text-white" : "text-slate-600 hover:bg-slate-100"
            }`}
          >
            {m === "datum" ? "Nach Datum" : "Nach Kategorie"}
          </button>
        ))}
      </div>
      <div className="ml-auto flex gap-2 text-xs">
        <button
          onClick={() =>
            setOffen(
              new Set(
                modus === "datum"
                  ? datumItems.map((i) => `dat:${i.sub.id}`)
                  : [...kategorien].map((k) => `cat:${k}`),
              ),
            )
          }
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
    </div>
  );

  return (
    <div className="space-y-3">
      {umschalter}

      {modus === "datum" &&
        datumItems.map(({ kat, typ, sub }) => {
          const tasks = eintraegeFuer(kat, sub.id);
          const key = `dat:${sub.id}`;
          const istOffen = offen.has(key);
          return (
            <section key={key} className="overflow-hidden rounded-lg border border-marke/30 bg-white">
              <div className="flex items-center gap-2 px-3 py-3">
                <button
                  onClick={() => toggle(key)}
                  className="flex min-w-0 flex-1 items-center gap-3 text-left hover:opacity-80"
                >
                  <ChevronIcon className={`h-4 w-4 shrink-0 text-slate-400 ${istOffen ? "rotate-90" : ""}`} />
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      {sub.start && (
                        <span className="text-sm font-semibold text-marke-dark">
                          {formatDatum(sub.start)}
                          {sub.ende && sub.ende !== sub.start ? `–${formatDatum(sub.ende)}` : ""}
                        </span>
                      )}
                      <span className="font-medium text-slate-800">{kat}</span>
                      {sub.name && <span className="text-sm text-slate-600">{sub.name}</span>}
                      {sub.ort && <span className="text-xs text-slate-500">📍 {sub.ort}</span>}
                      {typ && <span className="rounded bg-slate-100 px-1.5 py-0.5 text-xs text-slate-600">{typ}</span>}
                    </div>
                  </div>
                  <span className="shrink-0 text-xs text-slate-400">{tasks.length} Einträge</span>
                </button>
                {plusEintrag(kat, sub.id)}
                {darfBearbeiten && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onEditEvent(kat);
                    }}
                    title="Veranstaltung bearbeiten"
                    className="shrink-0 rounded p-1.5 text-slate-400 hover:bg-marke/10 hover:text-marke-dark"
                  >
                    <PencilIcon />
                  </button>
                )}
              </div>
              {istOffen && (
                <div className="border-t border-marke/20 p-2">
                  {tasks.length === 0 ? (
                    <p className="px-2 py-3 text-sm text-slate-400">Noch keine Einträge.</p>
                  ) : (
                    tabelle(tasks)
                  )}
                </div>
              )}
            </section>
          );
        })}

      {modus === "datum" && datumItems.length === 0 && (
        <p className="py-6 text-center text-sm text-slate-400">
          Keine Sub-Veranstaltungen mit Datum. Lege bei einer Veranstaltung Orte/Termine an.
        </p>
      )}

      {/* ---- Ansicht „Nach Kategorie": 3 Stufen ---- */}
      {modus === "kategorie" &&
        [...kategorien]
          .sort((a, b) => a.localeCompare(b, "de"))
          // Suche: nur Kategorien zeigen, die selbst oder über einen Ort/Termin passen.
          .filter((kat) => katTrifft(kat) || (events[kat]?.subs ?? []).some(subTrifft))
          .map((kat) => {
            const meta = events[kat];
            const alleSubs = [...(meta?.subs ?? [])].sort((a, b) =>
              (a.start || "9999").localeCompare(b.start || "9999"),
            );
            // Trifft die Kategorie selbst, alle Termine zeigen; sonst nur passende.
            const subs = q && !katTrifft(kat) ? alleSubs.filter(subTrifft) : alleSubs;
            const ohneTermin = eintraegeFuer(kat, null);
            const catKey = `cat:${kat}`;
            const catOffen = offen.has(catKey);
            const anzahl =
              ohneTermin.length + subs.reduce((n, s) => n + eintraegeFuer(kat, s.id).length, 0);
            return (
              <section key={catKey} className="overflow-hidden rounded-lg border border-marke/30 bg-white">
                <div className="flex items-center gap-2 px-3 py-3">
                  <button onClick={() => toggle(catKey)} className="flex min-w-0 flex-1 items-center gap-3 text-left">
                    <ChevronIcon className={`h-4 w-4 shrink-0 text-slate-400 ${catOffen ? "rotate-90" : ""}`} />
                    <span className="rounded bg-marke px-2 py-0.5 text-xs font-medium text-white">Veranstaltung</span>
                    <span className="font-semibold text-slate-800">{kat}</span>
                    {meta?.typ && (
                      <span className="rounded bg-slate-100 px-1.5 py-0.5 text-xs text-slate-600">{meta.typ}</span>
                    )}
                    {!meta && <span className="text-xs italic text-rose-400">Details fehlen</span>}
                    <span className="ml-1 text-xs text-slate-400">
                      {subs.length} Orte/Termine · {anzahl} Einträge
                    </span>
                  </button>
                  {darfBearbeiten && (
                    <button
                      onClick={() => onEditEvent(kat)}
                      title="Veranstaltung bearbeiten"
                      className="rounded p-1.5 text-slate-400 hover:bg-marke/10 hover:text-marke-dark"
                    >
                      <PencilIcon />
                    </button>
                  )}
                </div>

                {catOffen && (
                  <div className="space-y-2 border-t border-marke/20 p-2">
                    {subs.map((s) => {
                      const subKey = `sub:${kat}:${s.id}`;
                      const subOffen = offen.has(subKey);
                      const tasks = eintraegeFuer(kat, s.id);
                      return (
                        <div key={s.id} className="rounded-lg border border-slate-200">
                          <div className="flex items-center gap-2 px-3 py-2">
                            <button
                              onClick={() => toggle(subKey)}
                              className="flex min-w-0 flex-1 items-center gap-2 text-left hover:opacity-80"
                            >
                              <ChevronIcon className={`h-3.5 w-3.5 shrink-0 text-slate-400 ${subOffen ? "rotate-90" : ""}`} />
                              <span className="truncate font-medium text-slate-700">{subLabel(s)}</span>
                              {s.angemeldet && (
                                <span className="shrink-0 rounded bg-emerald-100 px-1.5 py-0.5 text-[10px] font-medium text-emerald-700">
                                  ✓ angemeldet
                                </span>
                              )}
                              {s.niederlassung && (
                                <span className="shrink-0 rounded bg-slate-100 px-1.5 py-0.5 text-[10px] text-slate-600">
                                  📍 {s.niederlassung}
                                </span>
                              )}
                              <span className="ml-auto shrink-0 text-xs text-slate-400">{tasks.length} Einträge</span>
                            </button>
                            {plusEintrag(kat, s.id)}
                          </div>
                          {subOffen && (
                            <div className="border-t border-slate-100 p-2">
                              {tasks.length === 0 ? (
                                <p className="px-2 py-2 text-sm text-slate-400">Noch keine Einträge.</p>
                              ) : (
                                tabelle(tasks)
                              )}
                            </div>
                          )}
                        </div>
                      );
                    })}

                    <div className="rounded-lg border border-dashed border-slate-300 p-2">
                      <div className="mb-1 flex items-center justify-between px-1">
                        <p className="text-xs text-slate-500">Ohne Ort/Termin zugeordnet</p>
                        {plusEintrag(kat, null)}
                      </div>
                      {ohneTermin.length > 0 ? (
                        tabelle(ohneTermin)
                      ) : (
                        <p className="px-1 py-2 text-xs text-slate-400">Noch keine Einträge.</p>
                      )}
                    </div>
                  </div>
                )}
              </section>
            );
          })}

      {modus === "kategorie" &&
        q &&
        [...kategorien].filter((kat) => katTrifft(kat) || (events[kat]?.subs ?? []).some(subTrifft))
          .length === 0 && (
          <p className="py-6 text-center text-sm text-slate-400">
            Keine Veranstaltung gefunden für „{suche}".
          </p>
        )}
    </div>
  );
}
