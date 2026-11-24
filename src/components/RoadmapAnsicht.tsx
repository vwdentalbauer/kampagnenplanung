import { useMemo, useState } from "react";
import type { Kampagne } from "../types";
import { STATUS_LABELS, STATUS_STYLE, ABGESCHLOSSEN } from "../constants";
import { formatDatum, wochentagKurz } from "../lib/date";
import {
  bandPosition,
  kanalFarben,
  kanalVon,
  kopfgruppen,
  roadmapZeitraum,
  spalteImBand,
  spaltenImZeitraum,
  spaltenKey,
  vereinige,
  zuordnen,
  type Spalte,
  type Zeitraster,
  type Zeitraum,
} from "../lib/roadmap";

/** Eine Kampagne, wie die Roadmap sie braucht. */
export interface RoadmapKampagne {
  name: string;
  tasks: Kampagne[];
  /** Gepflegter Gesamtzeitraum; ohne Pflege null (dann kein Balken). */
  start: string | null;
  ende: string | null;
}

interface Props {
  kampagnen: RoadmapKampagne[];
  /**
   * Zeitfenster aus der Zeitraum-Leiste. Ist eines gesetzt, zeigt die Achse
   * genau diesen Ausschnitt – sonst richtet sie sich nach den Maßnahmen.
   */
  fenster?: Zeitraum | null;
  onEdit: (k: Kampagne) => void;
}

const LANE_BREITE = 170;
const SPALTEN_BREITE = 92;

/** „18.05." – Kurzform für die Monatskarten. */
const kurz = (iso: string) => formatDatum(iso).slice(0, 6);

/**
 * Roadmap: Swimlanes nach Kanal, Spalten nach Kalenderwoche oder Monat.
 * Mehrere Kampagnen werden untereinander gruppiert auf derselben Zeitachse
 * gezeigt – so lassen sich Überschneidungen erkennen.
 */
export function RoadmapAnsicht({ kampagnen, fenster = null, onEdit }: Props) {
  const [ausgeblendet, setAusgeblendet] = useState<Set<string>>(new Set());
  const [raster, setRaster] = useState<Zeitraster>("woche");
  const [monatsfilter, setMonatsfilter] = useState<string>("alle");

  const alleTasks = useMemo(() => kampagnen.flatMap((k) => k.tasks), [kampagnen]);

  // Gemeinsame Achse über alle gewählten Kampagnen. Das Zeitfenster aus der
  // Zeitraum-Leiste hat Vorrang: Wer oben „KW 40 bis 53" einstellt, soll
  // unten genau diese Spalten sehen – auch dort, wo keine Maßnahmen liegen.
  const zeitraum = useMemo(
    () =>
      fenster ??
      vereinige(kampagnen.map((k) => roadmapZeitraum(k.tasks, k.start, k.ende))),
    [fenster, kampagnen],
  );
  const spalten = useMemo(
    () => (zeitraum ? spaltenImZeitraum(raster, zeitraum.von, zeitraum.bis) : []),
    [raster, zeitraum],
  );
  const gruppen = useMemo(() => kopfgruppen(raster, spalten), [raster, spalten]);

  const alleKanaele = useMemo(() => [...new Set(alleTasks.map(kanalVon))], [alleTasks]);
  const farben = useMemo(() => kanalFarben(alleKanaele), [alleKanaele]);

  const sichtbar = useMemo(
    () => alleTasks.filter((t) => !ausgeblendet.has(kanalVon(t))),
    [alleTasks, ausgeblendet],
  );

  if (kampagnen.length === 0) {
    return <p className="py-10 text-center text-slate-400">Bitte eine Kampagne auswählen.</p>;
  }
  if (!zeitraum || spalten.length === 0) {
    return (
      <p className="py-10 text-center text-slate-400">
        Für diese Auswahl sind keine Termine hinterlegt – ohne Datum lässt sich keine Roadmap
        zeigen.
      </p>
    );
  }

  const umschalten = (kanal: string) =>
    setAusgeblendet((s) => {
      const n = new Set(s);
      n.has(kanal) ? n.delete(kanal) : n.add(kanal);
      // Alles ausgeblendet ergibt ein leeres Raster – dann lieber alles zeigen.
      return n.size === alleKanaele.length ? new Set() : n;
    });

  const verantwortliche = new Set(sichtbar.flatMap((t) => t.owners));
  const fertig = sichtbar.filter((t) => ABGESCHLOSSEN.includes(t.status)).length;
  const kanaeleSichtbar = alleKanaele.filter((k) => !ausgeblendet.has(k));

  const gridSpalten = `${LANE_BREITE}px repeat(${spalten.length}, minmax(${SPALTEN_BREITE}px, 1fr))`;
  const mindestBreite = LANE_BREITE + spalten.length * SPALTEN_BREITE;

  const kennzahl = (wert: string, text: string) => (
    <div className="min-w-[110px] rounded-lg border border-slate-200 bg-white px-3.5 py-2.5">
      <b className="block text-xl font-semibold text-slate-800">{wert}</b>
      <span className="text-xs text-slate-500">{text}</span>
    </div>
  );

  /** Tooltip einer Rasterzelle: je Maßnahme Datum, Titel und Verantwortliche. */
  const tooltip = (eintraege: Kampagne[]) =>
    eintraege
      .map((e) => {
        const t = titelVon(e);
        return `${e.weekStart ? formatDatum(e.weekStart) : "—"} ${t}${
          e.verantwortung ? ` (${e.verantwortung})` : ""
        }`;
      })
      .join("\n");

  const massnahme = (e: Kampagne) => {
    const kanal = kanalVon(e);
    return (
      <button
        key={e.id}
        onClick={() => onEdit(e)}
        style={{ borderLeftColor: farben.get(kanal) }}
        className="mb-1.5 w-full rounded-lg border border-slate-200 border-l-4 bg-white px-2.5 py-2 text-left hover:bg-slate-50"
      >
        <div className="text-[13.5px] font-semibold text-slate-800">{titelVon(e)}</div>
        <div className="mt-1 flex flex-wrap items-center gap-x-2.5 gap-y-1 text-xs text-slate-500">
          <span>
            {wochentagKurz(e.weekStart)} {e.weekStart ? formatDatum(e.weekStart) : "—"}
          </span>
          <span className="font-semibold" style={{ color: farben.get(kanal) }}>
            {kanal}
            {e.subKanal ? ` · ${e.subKanal}` : ""}
          </span>
          {kampagnen.length > 1 && e.kampagne && (
            <span className="rounded bg-slate-100 px-1.5 text-slate-600">{e.kampagne}</span>
          )}
          {e.verantwortung && <span>👤 {e.verantwortung}</span>}
          <span className={`rounded border px-1.5 ${STATUS_STYLE[e.status]}`}>
            {STATUS_LABELS[e.status]}
          </span>
          {e.bereiche.map((b) => (
            <span key={b}>{b}</span>
          ))}
        </div>
      </button>
    );
  };

  // Die Monatskarten bleiben immer monatsweise, unabhängig vom Rasterschalter.
  const monatsSpalten = zeitraum
    ? spaltenImZeitraum("monat", zeitraum.von, zeitraum.bis)
    : [];
  const sichtbareMonate =
    monatsfilter === "alle" ? monatsSpalten : monatsSpalten.filter((m) => m.key === monatsfilter);

  const monatsKarte = (m: Spalte) => {
    const drin = sichtbar.filter((t) => t.weekStart && spaltenKey("monat", t.weekStart) === m.key);
    const proKanal = kanaeleSichtbar
      .map((k) => [k, drin.filter((t) => kanalVon(t) === k).length] as const)
      .filter(([, n]) => n > 0);
    const wochen = spaltenImZeitraum("woche", m.start, m.ende).filter(
      (w) => w.start.slice(0, 7) === m.key,
    );

    return (
      <div
        key={m.key}
        className="flex flex-col overflow-hidden rounded-xl border border-slate-200 bg-white"
      >
        <div className="bg-marke px-4 py-3.5 text-white">
          <h3 className="text-lg font-semibold">
            {m.titel} {m.unter}
          </h3>
          <div className="mt-0.5 text-xs opacity-80">
            {drin.length} {drin.length === 1 ? "Maßnahme" : "Maßnahmen"}
          </div>
          <div className="text-xs opacity-80">
            {proKanal.map(([k, n]) => `${n}× ${k}`).join(" · ") || "keine Maßnahmen"}
          </div>
        </div>
        <div className="flex h-1.5">
          {proKanal.length ? (
            proKanal.map(([k, n]) => (
              <div key={k} style={{ flex: n, background: farben.get(k) }} title={`${k}: ${n}`} />
            ))
          ) : (
            <div className="flex-1 bg-slate-200" />
          )}
        </div>
        <div className="flex-1 px-3.5 pb-4 pt-3">
          {wochen.map((w) => {
            const drinWoche = sichtbar.filter(
              (t) => t.weekStart && spaltenKey("woche", t.weekStart) === w.key,
            );
            const imBand = kampagnen.some(
              (k) => k.start && k.ende && spalteImBand(w, { von: k.start, bis: k.ende }),
            );
            return (
              <div key={w.key} className="mt-2.5">
                <div className="mb-2 flex items-baseline justify-between border-b border-slate-200 pb-1 text-xs text-slate-500">
                  <span>
                    <b className="text-[13px] text-slate-700">{w.titel}</b> · {kurz(w.start)}–
                    {kurz(w.ende)}
                  </span>
                  {imBand && (
                    <span className="rounded bg-ci-human px-1.5 text-[11px] text-[#806c10]">
                      im Zeitraum
                    </span>
                  )}
                </div>
                {drinWoche.length ? (
                  drinWoche.map(massnahme)
                ) : (
                  <div className="mt-1.5 rounded-lg border border-dashed border-slate-200 px-3 py-2.5 text-[13px] text-slate-400">
                    Keine Maßnahmen in dieser Woche.
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-4">
      {/* Kennzahlen */}
      <div className="flex flex-wrap gap-2.5">
        {kennzahl(String(sichtbar.length), sichtbar.length === 1 ? "Maßnahme" : "Maßnahmen")}
        {kennzahl(String(kanaeleSichtbar.length), "Kanäle")}
        {kennzahl(String(verantwortliche.size), "Verantwortliche")}
        {kennzahl(`${fertig}/${sichtbar.length}`, "erledigt")}
      </div>

      {/* Kanal-Filter */}
      <div className="flex flex-wrap items-center gap-2">
        <span className="mr-1 text-xs uppercase tracking-wider text-slate-400">Kanal</span>
        {[...alleKanaele].sort((a, b) => a.localeCompare(b, "de")).map((k) => {
          const aus = ausgeblendet.has(k);
          const anzahl = alleTasks.filter((t) => kanalVon(t) === k).length;
          return (
            <button
              key={k}
              onClick={() => umschalten(k)}
              className={`inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-white px-2.5 py-1 text-[13px] hover:bg-slate-50 ${
                aus ? "opacity-40" : ""
              }`}
            >
              <i
                className="h-2.5 w-2.5 rounded-full"
                style={{ background: farben.get(k) }}
                aria-hidden
              />
              {k} <span className="text-slate-400">{anzahl}</span>
            </button>
          );
        })}
      </div>

      {/* Raster */}
      <section className="rounded-xl border border-slate-200 bg-white px-5 py-4">
        <div className="mb-3.5 flex flex-wrap items-start justify-between gap-3">
          <div>
            <h2 className="text-base font-semibold text-slate-800">Roadmap-Übersicht</h2>
            <p className="text-xs text-slate-500">
              Swimlanes nach Kanal, Spalten nach{" "}
              {raster === "monat" ? "Monat" : "Kalenderwoche"}. Zahl = Anzahl Maßnahmen (beim
              Darüberfahren erscheinen die Titel). Gelb markiert den Gesamtzeitraum, sofern einer
              gepflegt ist.
            </p>
          </div>
          {/* Wochen- oder Monatsraster: bei langen Zeiträumen wird die
              Wochenansicht sonst sehr breit und unübersichtlich. */}
          <div className="flex gap-1 rounded-lg bg-slate-100 p-1">
            {(
              [
                ["woche", "Wochen"],
                ["monat", "Monate"],
              ] as const
            ).map(([r, label]) => (
              <button
                key={r}
                onClick={() => setRaster(r)}
                className={`rounded-md px-3 py-1 text-sm font-medium ${
                  raster === r ? "bg-white text-slate-800 shadow-sm" : "text-slate-600"
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        <div className="overflow-x-auto">
          <div
            className="grid"
            style={{ gridTemplateColumns: gridSpalten, minWidth: mindestBreite }}
          >
            {/* Kopfgruppen: Monate über Wochen bzw. Jahre über Monaten.
                Die erste Spalte bleibt beim Scrollen nach rechts stehen,
                sonst verliert man bei vielen Wochen die Kanalnamen. */}
            <div className="sticky left-0 z-20 border-b-2 border-marke bg-white px-2 py-1.5" />
            {gruppen.map((g) => (
              <div
                key={g.key}
                style={{ gridColumn: `span ${g.spalten}` }}
                className="border-b-2 border-marke px-2 py-1.5 text-xs font-semibold uppercase tracking-wider text-marke"
              >
                {g.name}
              </div>
            ))}

            {/* Spaltenkopf */}
            <div className="sticky left-0 z-20 border-b border-slate-200 bg-white px-2 py-1.5" />
            {spalten.map((s) => (
              <div
                key={s.key}
                className="border-b border-l border-slate-200 px-2 py-1.5 text-xs text-slate-500"
              >
                <b className="block text-[13px] text-slate-700">{s.titel}</b>
                {s.unter}
              </div>
            ))}

            {/* Je Kampagne ein Block: Überschrift, Zeitraum-Balken, Kanal-Spuren */}
            {kampagnen.map((kamp) => (
              <KampagnenBlock
                key={kamp.name}
                kampagne={kamp}
                mehrere={kampagnen.length > 1}
                spalten={spalten}
                kanaele={kanaeleSichtbar}
                farben={farben}
                tasks={sichtbar.filter((t) => t.kampagne === kamp.name)}
                tooltip={tooltip}
              />
            ))}
          </div>
        </div>
      </section>

      {/* Monatsumschalter für die Karten */}
      {monatsSpalten.length > 1 && (
        <div className="flex w-max max-w-full flex-wrap gap-1 rounded-lg bg-slate-100 p-1">
          <button
            onClick={() => setMonatsfilter("alle")}
            className={`rounded-md px-3.5 py-1.5 text-sm font-medium ${
              monatsfilter === "alle" ? "bg-white text-slate-800 shadow-sm" : "text-slate-600"
            }`}
          >
            Alle Monate
          </button>
          {monatsSpalten.map((m) => (
            <button
              key={m.key}
              onClick={() => setMonatsfilter(m.key)}
              className={`rounded-md px-3.5 py-1.5 text-sm font-medium ${
                monatsfilter === m.key ? "bg-white text-slate-800 shadow-sm" : "text-slate-600"
              }`}
            >
              {m.titel}
            </button>
          ))}
        </div>
      )}

      {/* Monatskarten */}
      <div
        className={`grid gap-4 ${
          sichtbareMonate.length > 1 ? "md:grid-cols-2 xl:grid-cols-3" : "grid-cols-1"
        }`}
      >
        {sichtbareMonate.map(monatsKarte)}
      </div>
    </div>
  );
}

/** Erste Zeile der Details als Titel; sonst der Kampagnenname. */
function titelVon(e: Kampagne): string {
  return e.details.split("\n")[0].trim() || e.kampagne || "Ohne Titel";
}

/** Ein Kampagnen-Block im Raster: Überschrift, Zeitraum-Balken, Kanal-Spuren. */
function KampagnenBlock({
  kampagne,
  mehrere,
  spalten,
  kanaele,
  farben,
  tasks,
  tooltip,
}: {
  kampagne: RoadmapKampagne;
  mehrere: boolean;
  spalten: Spalte[];
  kanaele: string[];
  farben: Map<string, string>;
  tasks: Kampagne[];
  tooltip: (e: Kampagne[]) => string;
}) {
  const band: Zeitraum | null =
    kampagne.start && kampagne.ende ? { von: kampagne.start, bis: kampagne.ende } : null;
  const pos = bandPosition(band, spalten);
  const raster = zuordnen(tasks, spaltenRaster(spalten), spalten);
  // Nur Kanäle zeigen, in denen diese Kampagne auch etwas hat – sonst stehen
  // bei mehreren Kampagnen überall leere Spuren.
  const eigene = kanaele.filter((k) => raster.has(k));

  return (
    <>
      {mehrere && (
        <div
          style={{ gridColumn: `1 / span ${spalten.length + 1}` }}
          className="border-b border-slate-200 bg-slate-50 px-2 py-1.5 text-sm font-semibold text-marke"
        >
          <span className="sticky left-2 inline-block">{kampagne.name}</span>
        </div>
      )}

      {pos && (
        <>
          <div className="sticky left-0 z-20 flex items-center border-b border-slate-200 bg-white px-2 py-1.5 text-xs text-slate-500">
            Zeitraum
          </div>
          <div
            className="relative h-[30px] border-b border-slate-200"
            style={{ gridColumn: `2 / span ${spalten.length}` }}
          >
            <div
              className="absolute top-[5px] flex h-5 items-center overflow-hidden whitespace-nowrap rounded border border-[#ecd877] bg-ci-human px-2 text-xs font-semibold text-[#806c10]"
              style={{ left: `${pos.links}%`, width: `${pos.breite}%` }}
            >
              {formatDatum(band!.von)} – {formatDatum(band!.bis)}
            </div>
          </div>
        </>
      )}

      {eigene.length === 0 && (
        <>
          <div className="sticky left-0 z-20 border-b border-slate-200 bg-white px-2 py-2.5 text-sm text-slate-400">
            —
          </div>
          <div
            style={{ gridColumn: `2 / span ${spalten.length}` }}
            className="border-b border-l border-slate-200 px-2 py-2.5 text-xs text-slate-400"
          >
            Keine Maßnahmen in den eingeblendeten Kanälen.
          </div>
        </>
      )}

      {eigene.map((kanal) => (
        <Spur
          key={`${kampagne.name}-${kanal}`}
          kanal={kanal}
          farbe={farben.get(kanal)!}
          spalten={spalten}
          band={band}
          proSpalte={raster.get(kanal)}
          tooltip={tooltip}
        />
      ))}
    </>
  );
}

/** Aus den Spalten ablesen, welches Raster gerade aktiv ist. */
function spaltenRaster(spalten: Spalte[]): Zeitraster {
  return spalten[0]?.key.length === 7 ? "monat" : "woche";
}

function Spur({
  kanal,
  farbe,
  spalten,
  band,
  proSpalte,
  tooltip,
}: {
  kanal: string;
  farbe: string;
  spalten: Spalte[];
  band: Zeitraum | null;
  proSpalte?: Map<string, Kampagne[]>;
  tooltip: (e: Kampagne[]) => string;
}) {
  return (
    <>
      <div className="sticky left-0 z-20 flex items-center gap-2 border-b border-r border-slate-200 bg-white px-2 py-2.5 text-sm font-medium text-slate-700">
        <i className="h-2.5 w-2.5 shrink-0 rounded-sm" style={{ background: farbe }} aria-hidden />
        <span className="truncate" title={kanal}>
          {kanal}
        </span>
      </div>
      {spalten.map((s) => {
        const eintraege = proSpalte?.get(s.key) ?? [];
        return (
          <div
            key={s.key}
            className={`flex min-h-[42px] flex-wrap content-start gap-1 border-b border-l border-slate-200 p-1.5 ${
              spalteImBand(s, band) ? "bg-ci-human/50" : ""
            }`}
          >
            {eintraege.length > 0 && (
              <span
                title={tooltip(eintraege)}
                style={{ background: farbe }}
                className="inline-flex h-[22px] min-w-[22px] items-center justify-center rounded-md px-1.5 text-xs font-semibold text-white"
              >
                {eintraege.length}
              </span>
            )}
          </div>
        );
      })}
    </>
  );
}
