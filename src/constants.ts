import type { Status, Rolle } from "./types";

/** Einfacher Status-Workflow – bewusst kurz gehalten. */
export const STATUS_LABELS: Record<Status, string> = {
  geplant: "Geplant",
  in_arbeit: "In Arbeit",
  erledigt: "Erledigt",
  abgesagt: "On Hold",
};

export const STATUS_REIHENFOLGE: Status[] = [
  "geplant",
  "in_arbeit",
  "erledigt",
  "abgesagt",
];

/** Tailwind-Klassen je Status (Badge) – an dental bauer CI angelehnt. */
export const STATUS_STYLE: Record<Status, string> = {
  geplant: "bg-[#E6E8EA] text-[#4A4C4F] border-[#C9CED1]",
  in_arbeit: "bg-[#FDEFA8] text-[#806c10] border-[#ecd877]",
  erledigt: "bg-[#B1D9CF] text-[#1f5147] border-[#8fc7ba]",
  abgesagt: "bg-[#B4B1D9] text-[#3c3768] border-[#9b97c9]",
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
  "WKZ",
  "Handelsmarketing",
  "Abverkauf/ Aktionen",
  "CI",
] as const;

export const QUARTALE = ["Q1", "Q2", "Q3", "Q4"] as const;

/** Vorschläge für Sub-Kanäle (z.B. zu „Social Media"). Freitext bleibt möglich. */
export const SUBKANAL_VORSCHLAEGE = [
  "LinkedIn",
  "Instagram",
  "Facebook",
  "WhatsApp",
  "YouTube",
  "TikTok",
  "Google Ads",
  "Meta Ads",
];
