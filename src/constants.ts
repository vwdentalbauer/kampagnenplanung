import type { Status, Rolle } from "./types";

/** Einfacher Status-Workflow – bewusst kurz gehalten. */
export const STATUS_LABELS: Record<Status, string> = {
  geplant: "Geplant",
  in_arbeit: "In Arbeit",
  erledigt: "Erledigt",
  abgesagt: "Abgesagt",
};

export const STATUS_REIHENFOLGE: Status[] = [
  "geplant",
  "in_arbeit",
  "erledigt",
  "abgesagt",
];

/** Tailwind-Klassen je Status (Badge). */
export const STATUS_STYLE: Record<Status, string> = {
  geplant: "bg-slate-100 text-slate-700 border-slate-300",
  in_arbeit: "bg-amber-100 text-amber-800 border-amber-300",
  erledigt: "bg-emerald-100 text-emerald-800 border-emerald-300",
  abgesagt: "bg-rose-100 text-rose-700 border-rose-300",
};

export const ROLLEN_LABELS: Record<Rolle, string> = {
  viewer: "Leserechte",
  editor: "Schreibrechte",
  admin: "Admin",
};

/** Die „db 4+1“-Marken/Bereiche aus der Excel (Spalten Brand–DSO). */
export const BEREICHE = [
  "Brand",
  "MIZ",
  "EV",
  "TS",
  "Planung",
  "Exi",
  "DSO",
] as const;

export const KATEGORIEN = [
  "db Kampagnen",
  "Hero Kampagne",
  "Abverkauf/ Aktionen",
  "CI",
] as const;

export const QUARTALE = ["Q1", "Q2", "Q3", "Q4"] as const;
