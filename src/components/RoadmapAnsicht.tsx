import { useMemo, useState } from "react";
import type { Kampagne } from "../types";
import { STATUS_LABELS, STATUS_STYLE, ABGESCHLOSSEN } from "../constants";
import { formatDatum, wochentagKurz } from "../lib/date";
import {
  bandPosition,
  kanalFarben,
  monateAusWochen,
  rasterDaten,
  roadmapZeitraum,
  wocheImBand,
  wochenImZeitraum,
  type RoadmapWoche,
} from "../lib/roadmap";

interface Props {
  /** Name der Kampagne (Überschrift). */
  name: string;
  tasks: Kampagne[];
  /** Gepflegter Gesamtzeitraum der Kampagne. */
  start: string | null;
  ende: string | null;
  onEdit: (k: Kampagne) => void;
}

const LANE_BREITE = 150;
const SPALTEN_BREITE = 92;

/** Kurzform „18.05." für die Wochenköpfe. */
const kurz = (iso: string) => formatDatum(iso).slice(0, 6);

/**
 * Roadmap einer Kampagne: Swimlanes nach Kanal, Spalten nach Kalenderwoche,
 * darunter die Monate mit den einzelnen Maßnahmen.
 */
export function RoadmapAnsicht({ name, tasks, start, ende, onEdit }: Props) {
  const [ausgeblendet, setAusgeblendet] = useState<Set<string>>(new Set());
  const [monat, setMonat] = useState<string>("alle");

  const zeitraum = useMemo(() => roadmapZeitraum(tasks, start, ende), [tasks, start, ende]);
  const band = useMemo(
    () => (start && ende ? { von: start, bis: ende } : null),
    [start, ende],
  );
  const wochen = useMemo(
    () => (zeitraum ? wochenImZeitraum(zeitraum.von, zeitraum.bis) : []),
    [zeitraum],
  );
  const monate = useMemo(() => monateAusWochen(wochen), [wochen]);

  const alleKanaele = useMemo(
    () => [...new Set(tasks.map((t) => t.kanal.trim() || "Ohne Kanal"))],
    [tasks],
  );
  const farben = useMemo(() => kanalFarben(alleKanaele), [alleKanaele]);

  const sichtbar = useMemo(
    () => tasks.filter((t) => !ausgeblendet.has(t.kanal.trim() || "Ohne Kanal")),
    [tasks, ausgeblendet],
  );
  const raster = useMemo(() => rasterDaten(sichtbar, wochen), [sichtbar, wochen]);
  const bandPos = useMemo(() => bandPosition(band, wochen), [band, wochen]);

  const kanaeleImRaster = useMemo(
    () =>
      [...new Set(alleKanaele)]
        .filter((k) => !ausgeblendet.has(k))
        .sort((a, b) => a.localeCompare(b, "de")),
    [alleKanaele, ausgeblendet],
  );

  if (!zeitraum || wochen.length === 0) {
    return (
      <p className="py-10 text-center text-slate-400">
        Für „{name}" sind keine Termine hinterlegt – ohne Datum lässt sich keine Roadmap zeigen.
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

  const spalten = `${LANE_BREITE}px repeat(${wochen.length}, minmax(${SPALTEN_BREITE}px, 1fr))`;
  const mindestBreite = LANE_BREITE + wochen.length * SPALTEN_BREITE;

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
        const titel = e.details.split("\n")[0].trim() || e.kampagne || "Ohne Titel";
        return `${e.weekStart ? formatDatum(e.weekStart) : "—"} ${titel}${
          e.verantwortung ? ` (${e.verantwortung})` : ""
        }`;
      })
      .join("\n");

  const massnahme = (e: Kampagne) => {
    const kanal = e.kanal.trim() || "Ohne Kanal";
    const titel = e.details.split("\n")[0].trim() || e.kampagne || "Ohne Titel";
    return (
      <button
        key={e.id}
        onClick={() => onEdit(e)}
        style={{ borderLeftColor: farben.get(kanal) }}
        className="mb-1.5 w-full rounded-lg border border-slate-200 border-l-4 bg-white px-2.5 py-2 text-left hover:bg-slate-50"
      >
        <div className="text-[13.5px] font-semibold text-slate-800">{titel}</div>
        <div className="mt-1 flex flex-wrap items-center gap-x-2.5 gap-y-1 text-xs text-slate-500">
          <span>
            {wochentagKurz(e.weekStart)} {e.weekStart ? formatDatum(e.weekStart) : "—"}
          </span>
          <span className="font-semibold" style={{ color: farben.get(kanal) }}>
            {kanal}
            {e.subKanal ? ` · ${e.subKanal}` : ""}
          </span>
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

  const monatsKarte = (m: (typeof monate)[number]) => {
    const monatsWochen = wochen.filter((w) => w.start.startsWith(m.key));
    const drin = sichtbar.filter((t) =>
      monatsWochen.some((w) => rasterHat(raster, t, w)),
    );
    const proKanal = kanaeleImRaster
      .map((k) => [k, drin.filter((t) => (t.kanal.trim() || "Ohne Kanal") === k).length] as const)
      .filter(([, n]) => n > 0);

    return (
      <div
        key={m.key}
        className="flex flex-col overflow-hidden rounded-xl border border-slate-200 bg-white"
      >
        <div className="bg-marke px-4 py-3.5 text-white">
          <h3 className="text-lg font-semibold">{m.name}</h3>
          <div className="mt-0.5 text-xs opacity-80">
            {drin.length} {drin.length === 1 ? "Maßnahme" : "Maßnahmen"}
          </div>
          <div className="text-xs opacity-80">
            {proKanal.map(([k, n]) => `${n}× ${k}`).join(" · ") || "keine Maßnahmen"}
          </div>
        </div>
        {/* Verteilungsbalken nach Kanal */}
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
          {monatsWochen.map((w) => {
            const drinWoche = sichtbar.filter((t) => rasterHat(raster, t, w));
            return (
              <div key={w.start} className="mt-2.5">
                <div className="mb-2 flex items-baseline justify-between border-b border-slate-200 pb-1 text-xs text-slate-500">
                  <span>
                    <b className="text-[13px] text-slate-700">KW {w.kw}</b> · {kurz(w.start)}–
                    {kurz(w.ende)}
                  </span>
                  {wocheImBand(w, band) && (
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

  const sichtbareMonate = monat === "alle" ? monate : monate.filter((m) => m.key === monat);

  return (
    <div className="space-y-4">
      {/* Kennzahlen */}
      <div className="flex flex-wrap gap-2.5">
        {kennzahl(String(sichtbar.length), sichtbar.length === 1 ? "Maßnahme" : "Maßnahmen")}
        {kennzahl(String(kanaeleImRaster.length), "Kanäle")}
        {kennzahl(String(verantwortliche.size), "Verantwortliche")}
        {kennzahl(`${fertig}/${sichtbar.length}`, "erledigt")}
      </div>

      {/* Kanal-Filter */}
      <div className="flex flex-wrap items-center gap-2">
        <span className="mr-1 text-xs uppercase tracking-wider text-slate-400">Kanal</span>
        {[...alleKanaele].sort((a, b) => a.localeCompare(b, "de")).map((k) => {
          const aus = ausgeblendet.has(k);
          const anzahl = tasks.filter((t) => (t.kanal.trim() || "Ohne Kanal") === k).length;
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
        <h2 className="text-base font-semibold text-slate-800">Roadmap-Übersicht</h2>
        <p className="mb-3.5 text-xs text-slate-500">
          Swimlanes nach Kanal, Spalten nach Kalenderwoche. Zahl = Anzahl Maßnahmen (beim
          Darüberfahren erscheinen die Titel).
          {band && " Gelb markiert den Gesamtzeitraum der Kampagne."}
        </p>
        <div className="overflow-x-auto">
          <div className="grid" style={{ gridTemplateColumns: spalten, minWidth: mindestBreite }}>
            {/* Monatskopf */}
            <div className="border-b-2 border-marke px-2 py-1.5" />
            {monate.map((m) => (
              <div
                key={m.key}
                style={{ gridColumn: `span ${m.wochen}` }}
                className="border-b-2 border-marke px-2 py-1.5 text-xs font-semibold uppercase tracking-wider text-marke"
              >
                {m.name}
              </div>
            ))}

            {/* Wochenkopf */}
            <div className="border-b border-slate-200 px-2 py-1.5" />
            {wochen.map((w) => (
              <div
                key={w.start}
                className="border-b border-l border-slate-200 px-2 py-1.5 text-xs text-slate-500"
              >
                <b className="block text-[13px] text-slate-700">KW {w.kw}</b>
                {kurz(w.start)}–{kurz(w.ende)}
              </div>
            ))}

            {/* Zeitraum-Balken */}
            {bandPos && (
              <>
                <div className="flex items-center border-b border-slate-200 px-2 py-1.5 text-xs text-slate-500">
                  Zeitraum
                </div>
                <div
                  className="relative h-[30px] border-b border-slate-200"
                  style={{ gridColumn: `2 / span ${wochen.length}` }}
                >
                  <div
                    className="absolute top-[5px] flex h-5 items-center whitespace-nowrap rounded border border-[#ecd877] bg-ci-human px-2 text-xs font-semibold text-[#806c10]"
                    style={{ left: `${bandPos.links}%`, width: `${bandPos.breite}%` }}
                  >
                    {formatDatum(band!.von)} – {formatDatum(band!.bis)}
                  </div>
                </div>
              </>
            )}

            {/* Spuren */}
            {kanaeleImRaster.map((kanal) => (
              <Spur
                key={kanal}
                kanal={kanal}
                farbe={farben.get(kanal)!}
                wochen={wochen}
                band={band}
                proWoche={raster.get(kanal)}
                tooltip={tooltip}
              />
            ))}
          </div>
        </div>
      </section>

      {/* Monatsumschalter */}
      {monate.length > 1 && (
        <div className="flex w-max gap-1 rounded-lg bg-slate-100 p-1">
          <button
            onClick={() => setMonat("alle")}
            className={`rounded-md px-3.5 py-1.5 text-sm font-medium ${
              monat === "alle" ? "bg-white text-slate-800 shadow-sm" : "text-slate-600"
            }`}
          >
            Alle Monate
          </button>
          {monate.map((m) => (
            <button
              key={m.key}
              onClick={() => setMonat(m.key)}
              className={`rounded-md px-3.5 py-1.5 text-sm font-medium ${
                monat === m.key ? "bg-white text-slate-800 shadow-sm" : "text-slate-600"
              }`}
            >
              {m.name.replace(/ \d{4}$/, "")}
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

/** Gehört die Maßnahme laut Raster in diese Woche? */
function rasterHat(
  raster: Map<string, Map<string, Kampagne[]>>,
  t: Kampagne,
  w: RoadmapWoche,
): boolean {
  const kanal = t.kanal.trim() || "Ohne Kanal";
  return !!raster.get(kanal)?.get(w.start)?.some((x) => x.id === t.id);
}

function Spur({
  kanal,
  farbe,
  wochen,
  band,
  proWoche,
  tooltip,
}: {
  kanal: string;
  farbe: string;
  wochen: RoadmapWoche[];
  band: { von: string; bis: string } | null;
  proWoche?: Map<string, Kampagne[]>;
  tooltip: (e: Kampagne[]) => string;
}) {
  return (
    <>
      <div className="flex items-center gap-2 border-b border-slate-200 px-2 py-2.5 text-sm font-medium text-slate-700">
        <i className="h-2.5 w-2.5 shrink-0 rounded-sm" style={{ background: farbe }} aria-hidden />
        <span className="truncate" title={kanal}>
          {kanal}
        </span>
      </div>
      {wochen.map((w) => {
        const eintraege = proWoche?.get(w.start) ?? [];
        return (
          <div
            key={w.start}
            className={`flex min-h-[42px] flex-wrap content-start gap-1 border-b border-l border-slate-200 p-1.5 ${
              wocheImBand(w, band) ? "bg-ci-human/50" : ""
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
