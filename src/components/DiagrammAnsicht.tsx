import { useCallback, useEffect, useRef, useState } from "react";
import type { Kampagne } from "../types";
import { ladePref, speicherePref } from "../data/userPrefs";

const PREF_KEY = "diagramm.text";

const VORLAGEN: Record<string, string> = {
  Flussdiagramm: `flowchart TD
  A[Idee] --> B{Freigabe?}
  B -- ja --> C[Umsetzung]
  B -- nein --> A
  C --> D[Veröffentlichung]`,
  Gantt: `gantt
  title Beispiel-Zeitplan
  dateFormat YYYY-MM-DD
  axisFormat %d.%m
  section Phase 1
  Konzept      :2026-01-05, 10d
  Umsetzung    :2026-01-15, 15d`,
  Sequenz: `sequenceDiagram
  participant Marketing
  participant Agentur
  Marketing->>Agentur: Briefing
  Agentur-->>Marketing: Entwurf
  Marketing->>Agentur: Freigabe`,
  Mindmap: `mindmap
  root((Kampagne))
    Ziele
      Reichweite
      Leads
    Kanäle
      Social
      SEA
    Team`,
};

/** Mermaid-tauglichen Text bereinigen (Doppelpunkte/Umbrüche stören Tasks). */
function sauber(s: string): string {
  return (s || "").replace(/[:#\n;]/g, " ").replace(/\s+/g, " ").trim() || "—";
}

/** Erzeugt ein Gantt-Diagramm aus den (gefilterten) Kampagnen. */
function ganttAusKampagnen(kampagnen: Kampagne[]): string {
  const mitDatum = kampagnen.filter((k) => k.weekStart);
  if (!mitDatum.length) {
    return "gantt\n  title Keine Kampagnen mit Datum im aktuellen Filter";
  }
  // Nach Ziel gruppieren (Fallback: Kategorie/„Ohne Ziel").
  const gruppen = new Map<string, Kampagne[]>();
  for (const k of mitDatum) {
    const g = (k.ziel || k.kategorie || "Ohne Ziel").trim();
    (gruppen.get(g) ?? gruppen.set(g, []).get(g)!).push(k);
  }
  const zeilen = [
    "gantt",
    "  title Kampagnen-Zeitplan",
    "  dateFormat YYYY-MM-DD",
    "  axisFormat %d.%m",
  ];
  for (const [gruppe, ks] of gruppen) {
    zeilen.push(`  section ${sauber(gruppe)}`);
    for (const k of ks) {
      const name = sauber(k.kampagne || k.details || "Eintrag").slice(0, 40);
      const start = k.weekStart!;
      const ende = k.endDatum && k.endDatum >= start ? k.endDatum : null;
      const status =
        k.status === "erledigt" ? "done, " : k.status === "in_arbeit" ? "active, " : "";
      zeilen.push(`  ${name} :${status}${start}, ${ende ?? "1d"}`);
    }
  }
  return zeilen.join("\n");
}

interface Props {
  kampagnen: Kampagne[];
  darfBearbeiten: boolean;
}

export function DiagrammAnsicht({ kampagnen, darfBearbeiten }: Props) {
  const [code, setCode] = useState<string>(VORLAGEN.Flussdiagramm);
  const [fehler, setFehler] = useState<string | null>(null);
  const [svg, setSvg] = useState<string>("");
  const geladen = useRef(false);

  // Gespeicherten Stand des Nutzers laden.
  useEffect(() => {
    let aktiv = true;
    (async () => {
      const gespeichert = await ladePref<string>(PREF_KEY);
      if (aktiv && gespeichert) setCode(gespeichert);
      geladen.current = true;
    })();
    return () => {
      aktiv = false;
    };
  }, []);

  // Live rendern (Mermaid nur bei Bedarf nachladen).
  useEffect(() => {
    let aktiv = true;
    (async () => {
      try {
        const mermaid = (await import("mermaid")).default;
        mermaid.initialize({ startOnLoad: false, securityLevel: "loose", theme: "default" });
        const id = "mmd-" + Math.random().toString(36).slice(2);
        const { svg } = await mermaid.render(id, code || "");
        if (aktiv) {
          setSvg(svg);
          setFehler(null);
        }
      } catch (e) {
        if (aktiv) setFehler((e as Error).message || "Diagramm konnte nicht gezeichnet werden.");
      }
    })();
    return () => {
      aktiv = false;
    };
  }, [code]);

  // Änderungen pro Nutzer speichern (entprellt).
  useEffect(() => {
    if (!geladen.current) return;
    const t = setTimeout(() => speicherePref(PREF_KEY, code), 800);
    return () => clearTimeout(t);
  }, [code]);

  const exportSvg = useCallback(() => {
    const blob = new Blob([svg], { type: "image/svg+xml" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "diagramm.svg";
    a.click();
    URL.revokeObjectURL(url);
  }, [svg]);

  return (
    <div>
      <div className="mb-3 flex flex-wrap items-center gap-2">
        <span className="text-xs font-medium text-slate-500">Vorlage:</span>
        {Object.keys(VORLAGEN).map((name) => (
          <button
            key={name}
            onClick={() => setCode(VORLAGEN[name])}
            disabled={!darfBearbeiten}
            className="rounded-md border border-slate-200 bg-white px-2 py-1 text-xs text-slate-600 hover:bg-slate-50 disabled:opacity-50"
          >
            {name}
          </button>
        ))}
        <button
          onClick={() => setCode(ganttAusKampagnen(kampagnen))}
          disabled={!darfBearbeiten}
          className="rounded-md border border-marke px-2 py-1 text-xs font-medium text-marke-dark hover:bg-marke/10 disabled:opacity-50"
        >
          📅 Gantt aus Kampagnen
        </button>
        <button
          onClick={exportSvg}
          disabled={!svg}
          className="ml-auto rounded-md border border-slate-200 bg-white px-2 py-1 text-xs text-slate-600 hover:bg-slate-50 disabled:opacity-50"
        >
          ⬇ SVG
        </button>
      </div>

      <div className="grid gap-3 lg:grid-cols-2">
        <div>
          <label className="mb-1 block text-xs font-medium text-slate-500">
            Mermaid-Code {darfBearbeiten ? "" : "(nur Ansicht)"}
          </label>
          <textarea
            value={code}
            onChange={(e) => setCode(e.target.value)}
            readOnly={!darfBearbeiten}
            spellCheck={false}
            className="h-[60vh] w-full rounded-lg border border-slate-300 p-3 font-mono text-xs focus:border-marke focus:outline-none focus:ring-1 focus:ring-marke"
          />
          <p className="mt-1 text-xs text-slate-400">
            Syntax-Hilfe: <a className="underline" href="https://mermaid.js.org/intro/" target="_blank" rel="noreferrer">mermaid.js.org</a>.
            Änderungen werden automatisch für dich gespeichert.
          </p>
        </div>

        <div>
          <label className="mb-1 block text-xs font-medium text-slate-500">Vorschau</label>
          <div className="h-[60vh] overflow-auto rounded-lg border border-slate-200 bg-white p-3">
            {fehler ? (
              <p className="rounded bg-rose-50 px-3 py-2 text-sm text-rose-600">
                {fehler}
              </p>
            ) : (
              <div dangerouslySetInnerHTML={{ __html: svg }} />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
