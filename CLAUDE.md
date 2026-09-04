# Hinweise für Claude

Kurzanleitung für die Arbeit an diesem Repository.

## Vor jedem Push prüfen

**Pflicht bei jeder inhaltlichen Änderung** – erst prüfen, dann committen:

```bash
npm run pruefen     # Typprüfung (tsc) + Tests (vitest)
```

Bei größeren Änderungen zusätzlich den Produktions-Build testen:

```bash
npm run build
```

Nur mit grünem Ergebnis pushen. Schlägt etwas fehl, erst die Ursache beheben –
**niemals** einen Test überspringen, deaktivieren oder anpassen, damit er grün
wird. Ein fehlgeschlagener Test ist ein Befund, kein Hindernis.

## Tests

- Framework: **Vitest**, Tests liegen als `*.test.ts` neben dem Code.
- Getestet wird die reine Logik ohne Browser/DOM:
  - `src/lib/filter.test.ts` – `passt()`, Facetten, Zeit-/Jahresfilter
  - `src/lib/date.test.ts` – Kalenderwoche, Quartal, Wochenstart, Zeiträume
  - `src/lib/namen.test.ts` – Anzeigenamen der Nutzer
  - `src/lib/kampagneRow.test.ts` – Zuordnung App-Felder <-> DB-Spalten
  - `src/lib/excel.test.ts` – Excel-Rundlauf (Export → Import ohne Verlust)
- Einzeln laufen lassen: `npx vitest run src/lib/filter.test.ts`
- Während der Entwicklung: `npm run test:watch`

**Bei Änderungen an der Logik gehören passende Tests dazu.** Besonders
`src/lib/filter.ts` ist kritisch – dort hängen alle Ansichten dran.

### Tests dürfen keinen Supabase-Client hochziehen

`src/lib/supabase.ts` erzeugt den Client **beim Import** (es sind Standard-
Zugangsdaten hinterlegt, `supabaseAktiv` ist also immer wahr). Ein Test, der
direkt oder indirekt dieses Modul importiert, baut damit eine echte Verbindung
auf und schlägt je nach Node-Version fehl.

Deshalb: zu testende Logik gehört in ein Modul **ohne** Supabase-Import.
`src/lib/namen.ts` ist genau aus diesem Grund von `data/useNutzerListe.ts`
getrennt – letzteres reicht die Funktion nur weiter. Fällt eine Funktion aus
einer Datei mit Supabase-Import zum Testen an, zuerst herauslösen.

## Deploy

**Zum Veröffentlichen den Skill `deploy` nutzen** (`.claude/skills/deploy/`) –
er führt durch Prüfung, Push, CI-Überwachung und die Verifikation, dass die
Live-Seite den neuen Stand ausliefert.

- Es gibt **keinen `main`-Branch**. Produktiv-Branch ist
  **`claude/great-noether-bhev0p`**.
- Jeder Push dorthin startet `.github/workflows/deploy.yml`: Typprüfung →
  Tests → Build → Veröffentlichung auf GitHub Pages.
  Schlägt eine Prüfung fehl, wird **nicht** deployt.
- Live: https://vwdentalbauer.github.io/kampagnenplanung/
- Auf allen anderen Branches und bei Pull Requests läuft
  `.github/workflows/tests.yml` (Typprüfung + Tests).
- Deploy ohne Code-Änderung: Actions → „Deploy auf GitHub Pages" → Run workflow.

## Architektur in Kürze

React + TypeScript + Vite + Tailwind, statischer Build auf GitHub Pages.

- `src/data/repository.ts` – austauschbare Datenschicht: Supabase (gemeinsame
  DB, wenn Zugangsdaten gesetzt) oder `localStorage` (Demo-Fallback).
- `src/auth/AuthContext.tsx` – Supabase Auth, Rollen aus der Tabelle `profile`
  (`viewer` / `editor` / `admin`).
- `src/lib/filter.ts` – zentrale Filterlogik für alle Ansichten.
- Datenbankschema: `docs/supabase-schema.sql` (dokumentiert den Live-Stand –
  Änderungen dort **nicht** nachträglich einpflegen, sondern als neue
  Migration in Supabase anwenden).

## Daten vs. Code

Kampagnen-Einträge liegen in **Supabase**, nicht im Repository. Sie lassen sich
nicht per Code-Änderung anlegen – dafür die App selbst oder den Supabase
SQL-Editor nutzen. Der `seed.json` unter `src/data/` ist nur der Demo-Fallback
ohne Backend.

## Sprache

Code-Kommentare, Commit-Nachrichten und UI-Texte sind **deutsch**. Bitte
beibehalten.
