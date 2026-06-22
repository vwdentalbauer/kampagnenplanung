import { useState } from "react";
import { EVENT_TYPEN } from "../constants";
import type { Veranstaltung } from "../data/useVeranstaltungen";

interface Props {
  veranstaltung: Veranstaltung | null; // null = neu
  orte: string[];
  onSave: (v: Veranstaltung, vorherigeKategorie?: string) => void;
  onDelete?: (kategorie: string) => void;
  onClose: () => void;
}

function leer(): Veranstaltung {
  return { kategorie: "", typ: "", ort: "", start: null, ende: null };
}

export function VeranstaltungEditor({ veranstaltung, orte, onSave, onDelete, onClose }: Props) {
  const [form, setForm] = useState<Veranstaltung>(veranstaltung ?? leer());
  const [versucht, setVersucht] = useState(false);
  const vorher = veranstaltung?.kategorie;

  const set = <K extends keyof Veranstaltung>(f: K, v: Veranstaltung[K]) =>
    setForm((s) => ({ ...s, [f]: v }));

  const label = "block text-sm font-medium text-slate-600 mb-1";
  const input =
    "w-full rounded border border-slate-300 px-2 py-1.5 text-sm focus:border-marke focus:outline-none focus:ring-1 focus:ring-marke";

  const speichern = () => {
    if (!form.kategorie.trim()) {
      setVersucht(true);
      return;
    }
    onSave({ ...form, kategorie: form.kategorie.trim() }, vorher);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/40 p-4">
      <div className="my-8 w-full max-w-lg rounded-lg bg-white shadow-xl">
        <div className="flex items-center justify-between border-b px-5 py-3">
          <h2 className="text-lg font-semibold">
            {veranstaltung ? "Veranstaltung bearbeiten" : "Neue Veranstaltung"}
          </h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-700">
            ✕
          </button>
        </div>

        <div className="grid grid-cols-2 gap-4 p-5">
          <div className="col-span-2">
            <label className={label}>
              Kategorie / Name <span className="text-rose-500">*</span>
            </label>
            <input
              className={`${input} ${versucht && !form.kategorie.trim() ? "border-rose-400" : ""}`}
              placeholder="z.B. Infotage Fachdental München, IDS, Zahnärztetag"
              value={form.kategorie}
              onChange={(e) => set("kategorie", e.target.value)}
            />
          </div>
          <div>
            <label className={label}>Typ</label>
            <select className={input} value={form.typ} onChange={(e) => set("typ", e.target.value)}>
              <option value="">– wählen –</option>
              {EVENT_TYPEN.map((t) => (
                <option key={t}>{t}</option>
              ))}
            </select>
          </div>
          <div>
            <label className={label}>Ort</label>
            <input
              className={input}
              list="dl-ev-ort"
              value={form.ort}
              onChange={(e) => set("ort", e.target.value)}
            />
            <datalist id="dl-ev-ort">
              {orte.map((o) => (
                <option key={o} value={o} />
              ))}
            </datalist>
          </div>
          <div className="col-span-2">
            <label className={label}>Veranstaltungsdatum (von – bis)</label>
            <div className="flex items-center gap-1">
              <input
                type="date"
                className={input}
                value={form.start ?? ""}
                onChange={(e) => set("start", e.target.value || null)}
              />
              <span className="text-slate-400">–</span>
              <input
                type="date"
                className={input}
                min={form.start ?? undefined}
                value={form.ende ?? ""}
                onChange={(e) => set("ende", e.target.value || null)}
              />
            </div>
            <p className="mt-0.5 text-xs text-slate-400">„bis" nur bei mehrtägigen Events</p>
          </div>
        </div>

        <div className="flex items-center justify-between gap-2 border-t px-5 py-3">
          {veranstaltung && onDelete ? (
            <button
              onClick={() => {
                if (confirm(`Veranstaltung „${veranstaltung.kategorie}" löschen?`)) {
                  onDelete(veranstaltung.kategorie);
                  onClose();
                }
              }}
              className="text-sm text-rose-500 hover:underline"
            >
              Löschen
            </button>
          ) : (
            <span />
          )}
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
