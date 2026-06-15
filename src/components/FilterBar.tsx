import type { Status } from "../types";
import { STATUS_LABELS, STATUS_REIHENFOLGE } from "../constants";

export interface Filter {
  suche: string;
  quartal: string;
  status: Status | "";
  kanal: string;
  ziel: string;
  owner: string;
}

export const LEERER_FILTER: Filter = {
  suche: "",
  quartal: "",
  status: "",
  kanal: "",
  ziel: "",
  owner: "",
};

interface Props {
  filter: Filter;
  setFilter: (f: Filter) => void;
  kanaele: string[];
  ziele: string[];
  owners: string[];
  quartale: string[];
}

export function FilterBar({ filter, setFilter, kanaele, ziele, owners, quartale }: Props) {
  const sel =
    "rounded border border-slate-300 bg-white px-2 py-1.5 text-sm focus:border-marke focus:outline-none";
  const upd = (teil: Partial<Filter>) => setFilter({ ...filter, ...teil });
  const aktiv = JSON.stringify(filter) !== JSON.stringify(LEERER_FILTER);

  return (
    <div className="flex flex-wrap items-center gap-2">
      <input
        className={`${sel} min-w-48 flex-1`}
        placeholder="Suche in Details, Ziel, Kanal…"
        value={filter.suche}
        onChange={(e) => upd({ suche: e.target.value })}
      />
      <select className={sel} value={filter.quartal} onChange={(e) => upd({ quartal: e.target.value })}>
        <option value="">Alle Quartale</option>
        {quartale.map((q) => (
          <option key={q}>{q}</option>
        ))}
      </select>
      <select
        className={sel}
        value={filter.status}
        onChange={(e) => upd({ status: e.target.value as Status | "" })}
      >
        <option value="">Alle Status</option>
        {STATUS_REIHENFOLGE.map((s) => (
          <option key={s} value={s}>
            {STATUS_LABELS[s]}
          </option>
        ))}
      </select>
      <select className={sel} value={filter.kanal} onChange={(e) => upd({ kanal: e.target.value })}>
        <option value="">Alle Kanäle</option>
        {kanaele.map((k) => (
          <option key={k}>{k}</option>
        ))}
      </select>
      <select className={sel} value={filter.ziel} onChange={(e) => upd({ ziel: e.target.value })}>
        <option value="">Alle Ziele</option>
        {ziele.map((z) => (
          <option key={z}>{z}</option>
        ))}
      </select>
      <select className={sel} value={filter.owner} onChange={(e) => upd({ owner: e.target.value })}>
        <option value="">Alle Verantwortlichen</option>
        {owners.map((o) => (
          <option key={o}>{o}</option>
        ))}
      </select>
      {aktiv && (
        <button
          onClick={() => setFilter(LEERER_FILTER)}
          className="rounded border border-slate-300 px-3 py-1.5 text-sm text-slate-600 hover:bg-slate-100"
        >
          Filter zurücksetzen
        </button>
      )}
    </div>
  );
}
