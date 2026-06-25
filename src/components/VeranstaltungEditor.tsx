import { useState } from "react";
import { EVENT_TYPEN } from "../constants";
import type { SubEvent, Veranstaltung } from "../data/useVeranstaltungen";

interface Props {
  veranstaltung: Veranstaltung | null; // null = neu
  orte: string[];
  onSave: (v: Veranstaltung, vorherigeKategorie?: string) => void;
  onDelete?: (kategorie: string) => void;
  onClose: () => void;
}

function leer(): Veranstaltung {
  return { kategorie: "", typ: "", subs: [] };
}

function neueSub(): SubEvent {
  return {
    id: `s${Date.now()}${Math.random().toString(36).slice(2, 6)}`,
    name: "",
    ort: "",
    start: null,
    ende: null,
  };
}

export function VeranstaltungEditor({ veranstaltung, orte, onSave, onDelete, onClose }: Props) {
  const [form, setForm] = useState<Veranstaltung>(veranstaltung ?? leer());
  const [versucht, setVersucht] = useState(false);
  const vorher = veranstaltung?.kategorie;

  const label = "block text-sm font-medium text-slate-600 mb-1";
  const input =
    "w-full rounded border border-slate-300 px-2 py-1.5 text-sm focus:border-marke focus:outline-none focus:ring-1 focus:ring-marke";

  const setSub = (id: string, teil: Partial<SubEvent>) =>
    setForm((f) => ({ ...f, subs: f.subs.map((s) => (s.id === id ? { ...s, ...teil } : s)) }));
  // Neuen Ort/Termin oben einfügen, damit er sofort sichtbar ist.
  const addSub = () => setForm((f) => ({ ...f, subs: [neueSub(), ...f.subs] }));
  const delSub = (id: string) => setForm((f) => ({ ...f, subs: f.subs.filter((s) => s.id !== id) }));

  const speichern = () => {
    if (!form.kategorie.trim()) {
      setVersucht(true);
      return;
    }
    // Beim Speichern zeitlich sortieren (ohne Datum ans Ende).
    const subs = [...form.subs].sort((a, b) =>
      (a.start || "9999").localeCompare(b.start || "9999"),
    );
    onSave({ ...form, kategorie: form.kategorie.trim(), subs }, vorher);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/40 p-4">
      <div className="my-8 w-full max-w-2xl rounded-lg bg-white shadow-xl">
        <div className="flex items-center justify-between border-b px-5 py-3">
          <h2 className="text-lg font-semibold">
            {veranstaltung ? "Veranstaltung bearbeiten" : "Neue Veranstaltung"}
          </h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-700">
            ✕
          </button>
        </div>

        <div className="space-y-4 p-5">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={label}>
                Veranstaltung / Kategorie <span className="text-rose-500">*</span>
              </label>
              <input
                className={`${input} ${versucht && !form.kategorie.trim() ? "border-rose-400" : ""}`}
                placeholder="z.B. Infotage Fachdental, IDS, Zahnärztetag"
                value={form.kategorie}
                onChange={(e) => setForm((f) => ({ ...f, kategorie: e.target.value }))}
              />
            </div>
            <div>
              <label className={label}>Typ (allgemein)</label>
              <select
                className={input}
                value={form.typ}
                onChange={(e) => setForm((f) => ({ ...f, typ: e.target.value }))}
              >
                <option value="">– wählen –</option>
                {EVENT_TYPEN.map((t) => (
                  <option key={t}>{t}</option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <div className="mb-1 flex items-center justify-between">
              <span className="text-sm font-medium text-slate-600">
                Sub-Veranstaltungen (Ort &amp; Datum)
              </span>
              <button
                onClick={addSub}
                className="rounded border border-marke px-2 py-1 text-xs font-medium text-marke-dark hover:bg-marke/10"
              >
                + Ort/Termin
              </button>
            </div>

            {form.subs.length === 0 && (
              <p className="rounded border border-dashed border-slate-300 px-3 py-2 text-xs text-slate-400">
                Noch keine Sub-Veranstaltung. Eine Veranstaltung kann z.B. in mehreren Städten zu
                unterschiedlichen Terminen stattfinden – jeweils als eigener Ort/Termin.
              </p>
            )}

            <div className="space-y-2">
              {form.subs.map((s) => (
                <div key={s.id} className="flex flex-wrap items-end gap-2 rounded-lg border border-slate-200 p-2">
                  <div className="min-w-[140px] flex-1">
                    <label className="mb-0.5 block text-xs text-slate-500">Event-Name</label>
                    <input
                      className={input}
                      placeholder="z.B. Fachdental Südwest"
                      value={s.name}
                      onChange={(e) => setSub(s.id, { name: e.target.value })}
                    />
                  </div>
                  <div className="min-w-[120px] flex-1">
                    <label className="mb-0.5 block text-xs text-slate-500">Ort</label>
                    <input
                      className={input}
                      list="dl-ev-ort"
                      value={s.ort}
                      onChange={(e) => setSub(s.id, { ort: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="mb-0.5 block text-xs text-slate-500">von</label>
                    <input
                      type="date"
                      className={input}
                      value={s.start ?? ""}
                      onChange={(e) => setSub(s.id, { start: e.target.value || null })}
                    />
                  </div>
                  <div>
                    <label className="mb-0.5 block text-xs text-slate-500">bis</label>
                    <input
                      type="date"
                      className={input}
                      min={s.start ?? undefined}
                      value={s.ende ?? ""}
                      onChange={(e) => setSub(s.id, { ende: e.target.value || null })}
                    />
                  </div>
                  <button
                    onClick={() => delSub(s.id)}
                    title="Entfernen"
                    className="rounded p-1.5 text-slate-400 hover:bg-rose-50 hover:text-rose-500"
                  >
                    ✕
                  </button>
                </div>
              ))}
            </div>
            <datalist id="dl-ev-ort">
              {orte.map((o) => (
                <option key={o} value={o} />
              ))}
            </datalist>
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
