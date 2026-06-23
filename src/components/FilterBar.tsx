import type { Status } from "../types";
import { STATUS_LABELS } from "../constants";
import { aktiveAnzahl, LEERER_FILTER, type Filter } from "../lib/filter";
import { MultiSelect } from "./MultiSelect";

interface Props {
  filter: Filter;
  setFilter: (f: Filter) => void;
  // Verfügbare (von den übrigen Filtern abhängige) Werte:
  quartale: string[];
  status: Status[];
  kanaele: string[];
  subKanaele: string[];
  owners: string[];
  kampagnen: string[];
  aktuelleKw: number;
  // „(leer)"-Option nur zeigen, wenn es auch leere Felder gibt
  leerKanaele: boolean;
  leerSubKanaele: boolean;
  leerOwners: boolean;
  leerKampagnen: boolean;
}

export function FilterBar({
  filter,
  setFilter,
  quartale,
  status,
  kanaele,
  subKanaele,
  owners,
  kampagnen,
  aktuelleKw,
  leerKanaele,
  leerSubKanaele,
  leerOwners,
  leerKampagnen,
}: Props) {
  const sel =
    "rounded border px-2 py-1.5 text-sm focus:border-marke focus:outline-none";
  const upd = (teil: Partial<Filter>) => setFilter({ ...filter, ...teil });
  const anzahl = aktiveAnzahl(filter);

  const dieseWoche = () =>
    upd({ kwVon: String(aktuelleKw), kwBis: String(aktuelleKw), datumVon: "", datumBis: "" });

  return (
    <div className="space-y-2">
      {/* Zeile 1: Suche & Kategorien (umbricht bei Bedarf in zwei Zeilen) */}
      <div className="flex flex-wrap items-center gap-2">
        <input
          className={`${sel} w-56 border-slate-300 bg-white`}
          placeholder="Suche…"
          value={filter.suche}
          onChange={(e) => upd({ suche: e.target.value })}
        />
        <MultiSelect
          label="Kampagnen"
          options={kampagnen}
          selected={filter.kampagnen}
          onChange={(v) => upd({ kampagnen: v })}
          withEmpty={leerKampagnen}
          suchbar
        />
        <MultiSelect
          label="Status"
          options={status}
          selected={filter.status}
          onChange={(v) => upd({ status: v as Status[] })}
          anzeige={(s) => STATUS_LABELS[s as Status]}
        />
        <MultiSelect
          label="Kanäle"
          options={kanaele}
          selected={filter.kanaele}
          onChange={(v) => upd({ kanaele: v })}
          withEmpty={leerKanaele}
          suchbar
        />
        <MultiSelect
          label="Sub-Kanäle"
          options={subKanaele}
          selected={filter.subKanaele}
          onChange={(v) => upd({ subKanaele: v })}
          withEmpty={leerSubKanaele}
          suchbar
        />
        <MultiSelect
          label="Verantwortliche"
          options={owners}
          selected={filter.owners}
          onChange={(v) => upd({ owners: v })}
          withEmpty={leerOwners}
          suchbar
        />

        <button
          onClick={() => upd({ pluline: !filter.pluline })}
          title="Nur PLULINE-Einträge"
          className={`rounded border px-2 py-1.5 text-sm font-medium ${
            filter.pluline
              ? "border-[#00a2d3] bg-[#00a2d3] text-white"
              : "border-slate-300 bg-white text-[#00a2d3]"
          }`}
        >
          PLU°LINE
        </button>
        <button
          onClick={() => upd({ wkz: !filter.wkz })}
          title="Nur WKZ-Einträge"
          className={`rounded border px-2 py-1.5 text-sm font-medium ${
            filter.wkz
              ? "border-slate-700 bg-slate-700 text-white"
              : "border-slate-300 bg-white text-slate-700"
          }`}
        >
          WKZ
        </button>

        {anzahl > 0 && (
          <button
            onClick={() => setFilter(LEERER_FILTER)}
            className="flex items-center gap-1 rounded border border-rose-300 bg-rose-50 px-3 py-1.5 text-sm font-medium text-rose-600 hover:bg-rose-100"
          >
            ✕ Filter löschen ({anzahl})
          </button>
        )}
      </div>

      {/* Zeile 2: Zeitraum (inkl. Quartal & „Diese Woche") */}
      <div className="flex flex-wrap items-center gap-2 rounded-lg bg-slate-100 px-3 py-2">
        <span className="text-xs font-medium uppercase tracking-wide text-slate-500">Zeitraum</span>

        <MultiSelect
          label="Quartale"
          options={quartale}
          selected={filter.quartale}
          onChange={(v) => upd({ quartale: v })}
        />

        <button
          onClick={dieseWoche}
          className="rounded border border-marke bg-marke/10 px-3 py-1.5 text-sm font-medium text-marke-dark hover:bg-marke/20"
        >
          Diese Woche (KW {aktuelleKw})
        </button>

        <span className="text-slate-300">|</span>
        <label className="flex items-center gap-1 text-sm text-slate-600">
          KW
          <input
            type="number"
            min={1}
            max={53}
            placeholder="von"
            className={`${sel} w-20 border-slate-300 bg-white`}
            value={filter.kwVon}
            onChange={(e) => upd({ kwVon: e.target.value })}
          />
          –
          <input
            type="number"
            min={1}
            max={53}
            placeholder="bis"
            className={`${sel} w-20 border-slate-300 bg-white`}
            value={filter.kwBis}
            onChange={(e) => upd({ kwBis: e.target.value })}
          />
        </label>
        <span className="text-slate-300">|</span>
        <label className="flex items-center gap-1 text-sm text-slate-600">
          Datum
          <input
            type="date"
            className={`${sel} border-slate-300 bg-white`}
            value={filter.datumVon}
            onChange={(e) => upd({ datumVon: e.target.value })}
          />
          –
          <input
            type="date"
            className={`${sel} border-slate-300 bg-white`}
            value={filter.datumBis}
            onChange={(e) => upd({ datumBis: e.target.value })}
          />
        </label>
      </div>
    </div>
  );
}
