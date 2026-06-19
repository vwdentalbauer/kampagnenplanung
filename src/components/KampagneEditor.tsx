import { useState } from "react";
import type { Kampagne } from "../types";
import {
  BEREICHE,
  KATEGORIEN,
  QUARTALE,
  STATUS_LABELS,
  STATUS_REIHENFOLGE,
} from "../constants";
import { kwAusDatum, quartalAusDatum } from "../lib/date";

interface Props {
  kampagne: Kampagne | null; // null = neue Kampagne
  onSave: (k: Kampagne) => void;
  onClose: () => void;
}

function leereKampagne(): Kampagne {
  return {
    id: `c${Date.now()}`,
    quartal: "Q1",
    kw: null,
    weekStart: null,
    zielgruppe: "Alle",
    kanal: "",
    kampagne: "",
    details: "",
    ziel: "",
    kategorie: "db Kampagnen",
    bereiche: [],
    verantwortung: "",
    owners: [],
    status: "geplant",
  };
}

export function KampagneEditor({ kampagne, onSave, onClose }: Props) {
  const [form, setForm] = useState<Kampagne>(kampagne ?? leereKampagne());

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

  const speichern = () => {
    const owners = form.verantwortung
      .split(/[/,]/)
      .map((o) => o.trim())
      .filter(Boolean);
    onSave({ ...form, owners });
  };

  const label = "block text-sm font-medium text-slate-600 mb-1";
  const input =
    "w-full rounded border border-slate-300 px-2 py-1.5 text-sm focus:border-marke focus:outline-none focus:ring-1 focus:ring-marke";

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/40 p-4"
      onClick={onClose}
    >
      <div
        className="my-8 w-full max-w-2xl rounded-lg bg-white shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
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
            <label className={label}>Kampagne (Kurztitel)</label>
            <input
              className={input}
              value={form.kampagne}
              onChange={(e) => set("kampagne", e.target.value)}
            />
          </div>
          <div className="col-span-2">
            <label className={label}>Details / Maßnahme</label>
            <textarea
              className={input}
              rows={3}
              value={form.details}
              onChange={(e) => set("details", e.target.value)}
            />
          </div>

          <div>
            <label className={label}>Startdatum</label>
            <input
              type="date"
              className={input}
              value={form.weekStart ?? ""}
              onChange={(e) => datumGeaendert(e.target.value)}
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
                onChange={(e) =>
                  set("kw", e.target.value ? Number(e.target.value) : null)
                }
              />
            </div>
          </div>

          <div>
            <label className={label}>Kanal</label>
            <input
              className={input}
              value={form.kanal}
              onChange={(e) => set("kanal", e.target.value)}
            />
          </div>
          <div>
            <label className={label}>Zielgruppe</label>
            <input
              className={input}
              value={form.zielgruppe}
              onChange={(e) => set("zielgruppe", e.target.value)}
            />
          </div>

          <div className="col-span-2">
            <label className={label}>Ziel</label>
            <input
              className={input}
              value={form.ziel}
              onChange={(e) => set("ziel", e.target.value)}
            />
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

          <div className="col-span-2">
            <label className={label}>Bereiche / Marken</label>
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
                        aktiv
                          ? form.bereiche.filter((x) => x !== b)
                          : [...form.bereiche, b],
                      )
                    }
                    className={`rounded-full border px-3 py-1 text-xs ${
                      aktiv
                        ? "border-marke bg-marke text-white"
                        : "border-slate-300 text-slate-600"
                    }`}
                  >
                    {b}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="col-span-2">
            <label className={label}>Verantwortung (mit / oder , trennen)</label>
            <input
              className={input}
              value={form.verantwortung}
              onChange={(e) => set("verantwortung", e.target.value)}
            />
          </div>
        </div>

        <div className="flex justify-end gap-2 border-t px-5 py-3">
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
  );
}
