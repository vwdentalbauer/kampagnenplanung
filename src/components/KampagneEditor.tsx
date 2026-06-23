import { useState } from "react";
import type { Kampagne } from "../types";
import {
  BEREICHE,
  KATEGORIEN,
  QUARTALE,
  STATUS_LABELS,
  STATUS_REIHENFOLGE,
} from "../constants";
import { kwAusDatum, quartalAusDatum, formatDatum } from "../lib/date";
import type { Veranstaltung } from "../data/useVeranstaltungen";

interface Props {
  kampagne: Kampagne | null; // null = neue Kampagne
  kanaele: string[];
  subKanaele: string[];
  kampagnen: string[]; // vorhandene Kampagnen-Namen (Vorschläge)
  verantwortliche: string[];
  veranstaltungen: Veranstaltung[]; // angelegte Events zur Auswahl
  onNeueVeranstaltung: () => void; // „+ neue Veranstaltung" aus dem Eintrag heraus
  onSave: (k: Kampagne) => void;
  onClose: () => void;
}

function leereKampagne(): Kampagne {
  return {
    id: `c${Date.now()}`,
    quartal: "Q1",
    kw: null,
    weekStart: null,
    endDatum: null,
    zielgruppe: "Alle",
    kanal: "",
    subKanal: "",
    kampagne: "",
    details: "",
    ziel: "",
    kategorie: "db Kampagnen",
    bereiche: [],
    pluline: false,
    wkz: false,
    veranstaltung: "",
    subEvent: "",
    verantwortung: "",
    owners: [],
    status: "geplant",
  };
}

export function KampagneEditor({
  kampagne,
  kanaele,
  subKanaele,
  kampagnen,
  verantwortliche,
  veranstaltungen,
  onNeueVeranstaltung,
  onSave,
  onClose,
}: Props) {
  const [form, setForm] = useState<Kampagne>(kampagne ?? leereKampagne());
  const [versucht, setVersucht] = useState(false);
  const [eventAn, setEventAn] = useState<boolean>(() => !!(kampagne?.veranstaltung));
  const gewaehltesEvent = veranstaltungen.find((v) => v.kategorie === form.veranstaltung);

  const set = <K extends keyof Kampagne>(feld: K, wert: Kampagne[K]) =>
    setForm((f) => ({ ...f, [feld]: wert }));

  const datumGeaendert = (iso: string) => {
    setForm((f) => ({
      ...f,
      weekStart: iso || null,
      kw: kwAusDatum(iso) ?? f.kw,
      quartal: quartalAusDatum(iso) ?? f.quartal,
    }));
  };

  // Pflichtfelder: Details/Maßnahme, Startdatum. Kampagne ist optional
  // (leer = keiner Kampagne zugeordnet / Einzel-Task).
  const fehltDetails = !form.details.trim();
  const fehltDatum = !form.weekStart;
  const unvollstaendig = fehltDetails || fehltDatum;

  const speichern = () => {
    if (unvollstaendig) {
      setVersucht(true);
      return;
    }
    const owners = form.verantwortung
      .split(/[/,]/)
      .map((o) => o.trim())
      .filter(Boolean);
    onSave({ ...form, owners });
  };

  const label = "block text-sm font-medium text-slate-600 mb-1";
  const input =
    "w-full rounded border border-slate-300 px-2 py-1.5 text-sm focus:border-marke focus:outline-none focus:ring-1 focus:ring-marke";
  const fehlerInput = "border-rose-400 ring-1 ring-rose-300";
  const stern = <span className="text-rose-500">*</span>;

  return (
    // Hintergrund schließt NICHT mehr (verhindert versehentliches Schließen
    // ohne Speichern). Schließen nur über ✕ oder Abbrechen.
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/40 p-4">
      <div className="my-8 w-full max-w-2xl rounded-lg bg-white shadow-xl">
        <div className="flex items-center justify-between border-b px-5 py-3">
          <h2 className="text-lg font-semibold">
            {kampagne ? "Eintrag bearbeiten" : "Neuer Eintrag"}
          </h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-700">
            ✕
          </button>
        </div>

        <div className="grid grid-cols-2 gap-4 p-5">
          <div className="col-span-2">
            <label className={label}>
              Kampagne <span className="font-normal text-slate-400">(optional – leer = keiner Kampagne zugeordnet)</span>
            </label>
            <input
              className={input}
              list="dl-kampagne"
              placeholder="Kampagne wählen, neu eingeben oder leer lassen…"
              value={form.kampagne}
              onChange={(e) => set("kampagne", e.target.value)}
            />
            <datalist id="dl-kampagne">
              {kampagnen.map((k) => (
                <option key={k} value={k} />
              ))}
            </datalist>
          </div>

          <div className="col-span-2">
            <label className={label}>Details / Maßnahme {stern}</label>
            <textarea
              className={`${input} ${versucht && fehltDetails ? fehlerInput : ""}`}
              rows={3}
              value={form.details}
              onChange={(e) => set("details", e.target.value)}
            />
          </div>

          <div>
            <label className={label}>Startdatum {stern}</label>
            <input
              type="date"
              className={`${input} ${versucht && fehltDatum ? fehlerInput : ""}`}
              value={form.weekStart ?? ""}
              onChange={(e) => datumGeaendert(e.target.value)}
            />
          </div>
          <div>
            <label className={label}>Enddatum (nur bei laufenden Kampagnen)</label>
            <input
              type="date"
              className={input}
              value={form.endDatum ?? ""}
              min={form.weekStart ?? undefined}
              onChange={(e) => set("endDatum", e.target.value || null)}
            />
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className={label}>Quartal</label>
              <select
                className={input}
                value={form.quartal}
                onChange={(e) => set("quartal", e.target.value)}
              >
                {QUARTALE.map((q) => (
                  <option key={q}>{q}</option>
                ))}
              </select>
            </div>
            <div>
              <label className={label}>KW</label>
              <input
                type="number"
                className={input}
                value={form.kw ?? ""}
                onChange={(e) => set("kw", e.target.value ? Number(e.target.value) : null)}
              />
            </div>
          </div>
          <div className="hidden sm:block" />

          <div>
            <label className={label}>Kanal</label>
            <input
              className={input}
              list="dl-kanal"
              value={form.kanal}
              onChange={(e) => set("kanal", e.target.value)}
            />
            <datalist id="dl-kanal">
              {kanaele.map((k) => (
                <option key={k} value={k} />
              ))}
            </datalist>
          </div>
          <div>
            <label className={label}>Sub-Kanal (mehrere mit / trennen)</label>
            <input
              className={input}
              list="dl-subkanal"
              placeholder="optional, z.B. LinkedIn / Instagram"
              value={form.subKanal}
              onChange={(e) => set("subKanal", e.target.value)}
            />
            <datalist id="dl-subkanal">
              {subKanaele.map((s) => (
                <option key={s} value={s} />
              ))}
            </datalist>
          </div>
          <div>
            <label className={label}>Kategorie (db 4+1)</label>
            <select
              className={input}
              value={form.kategorie}
              onChange={(e) => set("kategorie", e.target.value)}
            >
              {KATEGORIEN.map((k) => (
                <option key={k}>{k}</option>
              ))}
            </select>
          </div>

          <div>
            <label className={label}>Status</label>
            <select
              className={input}
              value={form.status}
              onChange={(e) => set("status", e.target.value as Kampagne["status"])}
            >
              {STATUS_REIHENFOLGE.map((s) => (
                <option key={s} value={s}>
                  {STATUS_LABELS[s]}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className={label}>Verantwortung (mit / oder , trennen)</label>
            <input
              className={input}
              list="dl-verantwortung"
              value={form.verantwortung}
              onChange={(e) => set("verantwortung", e.target.value)}
            />
            <datalist id="dl-verantwortung">
              {verantwortliche.map((v) => (
                <option key={v} value={v} />
              ))}
            </datalist>
          </div>

          <div className="col-span-2">
            <label className={label}>Sparten/ Bereich</label>
            <div className="flex flex-wrap gap-2">
              {BEREICHE.map((b) => {
                const aktiv = form.bereiche.includes(b);
                return (
                  <button
                    key={b}
                    type="button"
                    onClick={() =>
                      set(
                        "bereiche",
                        aktiv ? form.bereiche.filter((x) => x !== b) : [...form.bereiche, b],
                      )
                    }
                    className={`rounded-full border px-3 py-1 text-xs ${
                      aktiv ? "border-marke bg-marke text-white" : "border-slate-300 text-slate-600"
                    }`}
                  >
                    {b}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="col-span-2 flex flex-wrap gap-4">
            <label className="flex items-center gap-2 text-sm font-medium text-slate-700">
              <input
                type="checkbox"
                className="accent-[#00a2d3]"
                checked={form.pluline}
                onChange={(e) => set("pluline", e.target.checked)}
              />
              PLU°LINE (Eigenmarke)
            </label>
            <label className="flex items-center gap-2 text-sm font-medium text-slate-700">
              <input
                type="checkbox"
                className="accent-slate-700"
                checked={form.wkz}
                onChange={(e) => set("wkz", e.target.checked)}
              />
              WKZ
            </label>
          </div>

          {/* Veranstaltung (Event) verknüpfen */}
          <div className="col-span-2 rounded-lg border border-marke/30 bg-marke/5 p-3">
            <label className="flex items-center gap-2 text-sm font-medium text-slate-700">
              <input
                type="checkbox"
                className="accent-marke"
                checked={eventAn}
                onChange={(e) => {
                  setEventAn(e.target.checked);
                  if (!e.target.checked) setForm((f) => ({ ...f, veranstaltung: "", subEvent: "" }));
                }}
              />
              Event – gehört zu einer Veranstaltung
            </label>

            {eventAn && (
              <div className="mt-2 space-y-2">
                {veranstaltungen.length === 0 ? (
                  <p className="text-xs text-slate-500">
                    Noch keine Veranstaltung angelegt.{" "}
                    <button
                      type="button"
                      onClick={onNeueVeranstaltung}
                      className="font-medium text-marke-dark hover:underline"
                    >
                      + Neue Veranstaltung anlegen
                    </button>
                  </p>
                ) : (
                  <>
                    <div className="flex items-center gap-2">
                      <select
                        className={input}
                        value={form.veranstaltung}
                        onChange={(e) =>
                          setForm((f) => ({ ...f, veranstaltung: e.target.value, subEvent: "" }))
                        }
                      >
                        <option value="">– Veranstaltung wählen –</option>
                        {veranstaltungen.map((v) => (
                          <option key={v.kategorie} value={v.kategorie}>
                            {v.kategorie}
                          </option>
                        ))}
                      </select>
                      <button
                        type="button"
                        onClick={onNeueVeranstaltung}
                        className="whitespace-nowrap rounded border border-slate-300 bg-white px-2 py-1.5 text-xs text-slate-600 hover:bg-slate-50"
                      >
                        + Neu
                      </button>
                    </div>

                    {gewaehltesEvent && (
                      <select
                        className={input}
                        value={form.subEvent}
                        onChange={(e) => set("subEvent", e.target.value)}
                      >
                        <option value="">– Ort/Termin wählen (optional) –</option>
                        {gewaehltesEvent.subs.map((s) => (
                          <option key={s.id} value={s.id}>
                            {s.ort || "ohne Ort"}
                            {s.start ? ` · ${formatDatum(s.start)}` : ""}
                            {s.ende && s.ende !== s.start ? `–${formatDatum(s.ende)}` : ""}
                          </option>
                        ))}
                      </select>
                    )}
                    {gewaehltesEvent && gewaehltesEvent.typ && (
                      <p className="text-xs text-slate-500">Typ: {gewaehltesEvent.typ}</p>
                    )}
                  </>
                )}
              </div>
            )}
          </div>
        </div>

        <div className="flex items-center justify-between gap-2 border-t px-5 py-3">
          <span className="text-xs text-slate-400">
            {versucht && unvollstaendig ? (
              <span className="text-rose-500">Bitte Details und Startdatum ausfüllen.</span>
            ) : (
              <>{stern} Pflichtfeld</>
            )}
          </span>
          <div className="flex gap-2">
            <button
              onClick={onClose}
              className="rounded border border-slate-300 px-4 py-1.5 text-sm hover:bg-slate-50"
            >
              Abbrechen
            </button>
            <button
              onClick={speichern}
              className="rounded bg-marke px-4 py-1.5 text-sm font-medium text-white hover:bg-marke-dark"
            >
              Speichern
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
