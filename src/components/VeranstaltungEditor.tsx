import { useState } from "react";
import { EVENT_TYPEN } from "../constants";
import type { SubEvent, Veranstaltung } from "../data/useVeranstaltungen";

interface Props {
  veranstaltung: Veranstaltung | null; // null = neu
  orte: string[];
  /** Bereits angelegte Veranstaltungs-Kategorien (Dropdown/Prüfung). */
  kategorien: string[];
  /** Bereits verwendete Niederlassungen (Vorschläge). */
  niederlassungen: string[];
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
    angemeldet: false,
    ansprechpartner: "",
    niederlassung: "",
    kommentar: "",
  };
}

/** Heutiges Datum als ISO-String (lokal). */
function heuteISO(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(
    d.getDate(),
  ).padStart(2, "0")}`;
}

export function VeranstaltungEditor({
  veranstaltung,
  orte,
  kategorien,
  niederlassungen,
  onSave,
  onDelete,
  onClose,
}: Props) {
  const [form, setForm] = useState<Veranstaltung>(veranstaltung ?? leer());
  const [versucht, setVersucht] = useState(false);
  const [subSuche, setSubSuche] = useState("");
  // Vergangene Termine standardmäßig ausblenden (übersichtlicher bei vielen).
  const [vergangeneAus, setVergangeneAus] = useState(true);
  const vorher = veranstaltung?.kategorie;
  const heute = heuteISO();
  const istVergangen = (s: SubEvent) => {
    const e = s.ende ?? s.start;
    return !!e && e < heute;
  };

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

  // Für die Übersicht bei vielen Terminen: Suche über Name/Ort/Niederlassung/Ansprechpartner.
  const q = subSuche.trim().toLowerCase();
  const anzahlVergangen = form.subs.filter(istVergangen).length;
  const sichtbareSubs = form.subs
    .filter((s) => !vergangeneAus || !istVergangen(s))
    .filter(
      (s) =>
        !q ||
        [s.name, s.ort, s.niederlassung, s.ansprechpartner, s.kommentar].some((x) =>
          (x ?? "").toLowerCase().includes(q),
        ),
    );

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/40 p-4">
      <div className="my-8 w-full max-w-3xl rounded-lg bg-white shadow-xl">
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
                list="dl-ev-kat"
                placeholder="Klicken für vorhandene – oder neue eingeben…"
                value={form.kategorie}
                onChange={(e) => setForm((f) => ({ ...f, kategorie: e.target.value }))}
              />
              <datalist id="dl-ev-kat">
                {kategorien.map((k) => (
                  <option key={k} value={k} />
                ))}
              </datalist>
              {/* Hinweis, wenn die eingegebene Kategorie schon existiert. */}
              {!veranstaltung &&
                form.kategorie.trim() &&
                kategorien.some(
                  (k) => k.toLowerCase() === form.kategorie.trim().toLowerCase(),
                ) && (
                  <p className="mt-0.5 text-xs text-amber-600">
                    Diese Veranstaltung existiert bereits – Speichern ergänzt/überschreibt sie.
                  </p>
                )}
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
            <div className="mb-1 flex items-center justify-between gap-2">
              <span className="text-sm font-medium text-slate-600">
                Termine / Orte
                {form.subs.length > 0 && (
                  <span className="ml-1 text-xs font-normal text-slate-400">
                    ({q || (vergangeneAus && anzahlVergangen > 0)
                      ? `${sichtbareSubs.length} von ${form.subs.length}`
                      : form.subs.length})
                  </span>
                )}
              </span>
              <button
                onClick={addSub}
                className="shrink-0 rounded border border-marke px-2 py-1 text-xs font-medium text-marke-dark hover:bg-marke/10"
              >
                + Termin/Ort
              </button>
            </div>

            {/* Suche & Filter – hilft, wenn viele Termine gepflegt sind (z.B. Zahnärztetag). */}
            {form.subs.length > 3 && (
              <div className="mb-2 flex flex-wrap items-center gap-2">
                <input
                  className={`${input} flex-1`}
                  placeholder="🔍 Termine durchsuchen (Name, Ort, Niederlassung, Ansprechpartner, Kommentar)…"
                  value={subSuche}
                  onChange={(e) => setSubSuche(e.target.value)}
                />
                <label
                  className="flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded border border-slate-300 px-2 py-1.5 text-sm text-slate-600"
                  title="Termine, deren Datum in der Vergangenheit liegt, ausblenden"
                >
                  <input
                    type="checkbox"
                    className="accent-marke"
                    checked={vergangeneAus}
                    onChange={(e) => setVergangeneAus(e.target.checked)}
                  />
                  Vergangene ausblenden
                  {anzahlVergangen > 0 && (
                    <span className="text-xs text-slate-400">({anzahlVergangen})</span>
                  )}
                </label>
              </div>
            )}

            {form.subs.length === 0 && (
              <p className="rounded border border-dashed border-slate-300 px-3 py-2 text-xs text-slate-400">
                Noch kein Termin. Eine Veranstaltung kann z.B. in mehreren Städten zu
                unterschiedlichen Terminen stattfinden – jeweils als eigener Termin/Ort.
              </p>
            )}

            {/* Scroll-Container, damit die Übersicht bei vielen Terminen erhalten bleibt. */}
            <div className="max-h-[46vh] space-y-2 overflow-y-auto pr-1">
              {sichtbareSubs.map((s) => (
                <div key={s.id} className="rounded-lg border border-slate-200 p-2">
                  {/* Zeile 1: Name, Ort, von, bis, löschen */}
                  <div className="flex flex-wrap items-end gap-2">
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

                  {/* Zeile 2: angemeldet, Ansprechpartner, Niederlassung (alle optional) */}
                  <div className="mt-2 flex flex-wrap items-end gap-2 border-t border-slate-100 pt-2">
                    <label className="flex items-center gap-1.5 whitespace-nowrap pb-1.5 text-sm text-slate-600">
                      <input
                        type="checkbox"
                        className="accent-marke"
                        checked={!!s.angemeldet}
                        onChange={(e) => setSub(s.id, { angemeldet: e.target.checked })}
                      />
                      angemeldet
                    </label>
                    <div className="min-w-[140px] flex-1">
                      <label className="mb-0.5 block text-xs text-slate-500">
                        Verantwortlicher / Ansprechpartner
                      </label>
                      <input
                        className={input}
                        value={s.ansprechpartner ?? ""}
                        onChange={(e) => setSub(s.id, { ansprechpartner: e.target.value })}
                      />
                    </div>
                    <div className="min-w-[140px] flex-1">
                      <label className="mb-0.5 block text-xs text-slate-500">
                        Zuständige Niederlassung
                      </label>
                      <input
                        className={input}
                        list="dl-ev-niederlassung"
                        value={s.niederlassung ?? ""}
                        onChange={(e) => setSub(s.id, { niederlassung: e.target.value })}
                      />
                    </div>
                  </div>

                  {/* Zeile 3: freies Kommentarfeld zum konkreten Termin/Ort */}
                  <div className="mt-2">
                    <label className="mb-0.5 block text-xs text-slate-500">Kommentar</label>
                    <textarea
                      rows={2}
                      className={`${input} resize-y`}
                      placeholder="Notizen zu diesem Termin/Ort…"
                      value={s.kommentar ?? ""}
                      onChange={(e) => setSub(s.id, { kommentar: e.target.value })}
                    />
                  </div>
                </div>
              ))}
              {sichtbareSubs.length === 0 && form.subs.length > 0 && (
                <p className="px-1 py-3 text-center text-xs text-slate-400">
                  {q
                    ? "Kein Termin passt zur Suche."
                    : `Alle Termine liegen in der Vergangenheit – „Vergangene ausblenden" deaktivieren, um sie zu sehen.`}
                </p>
              )}
            </div>
            <datalist id="dl-ev-ort">
              {orte.map((o) => (
                <option key={o} value={o} />
              ))}
            </datalist>
            <datalist id="dl-ev-niederlassung">
              {niederlassungen.map((n) => (
                <option key={n} value={n} />
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
