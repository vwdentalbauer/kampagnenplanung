# Kampagnenplanung 2026

Web-App als Ersatz für den Excel-Jahresplan „Jahresübersicht". Übersichtlich,
schwer kaputtzumachen, von mehreren Personen nutzbar – mit Lese-, Schreib- und
Adminrechten. Hosting über **GitHub Pages**, gemeinsame Datenbank &
Nutzerverwaltung über **Supabase**.

> **Aktueller Stand:** Phase 2 umgesetzt – gemeinsame **Supabase**-Datenbank,
> echte Anmeldung (Supabase Auth), drei Rollen (Lese-/Schreib-/Adminrechte),
> Live-Updates für alle, Bearbeitungs-Sperren, Änderungs-Historie mit Undo,
> tägliches Backup (7 Tage) und individuelle Tabellenansicht je Nutzer.
> Ohne hinterlegte Supabase-Zugangsdaten läuft die App weiterhin im lokalen
> Demo-Modus (`localStorage`). Einrichtung/Betrieb: siehe `docs/LIVEGANG.md`.

## Schnellstart

```bash
npm install
npm run dev      # lokal unter http://localhost:5173
npm run build    # Produktions-Build nach dist/
npm run pruefen  # Typprüfung + Tests (vor jedem Push)
```

## Tests

Die Kernlogik ist mit **Vitest** abgesichert – Filter, Datums-/Kalenderwochen-
Berechnung und die Anzeigenamen der Nutzer:

```bash
npm test         # einmalig durchlaufen
npm run test:watch
```

Die Tests laufen automatisch in GitHub Actions: bei jedem Push und Pull Request
(`tests.yml`) und **vor jedem Deploy** (`deploy.yml`). Schlägt ein Test fehl,
wird nichts veröffentlicht.

## Was die App heute kann

- **Drei Ansichten auf dieselben Daten:**
  - 📅 **Nach Woche** – gruppiert nach Kalenderwoche, für den wöchentlichen Jour fixe.
  - 🎯 **Nach Ziel** – gruppiert nach Ziel, mit Fortschrittsbalken (wie viel ist erledigt).
  - 📋 **Tabelle** – die klassische Listenansicht mit Inline-Statuswechsel.
- **Einfacher Status** (das, was in der Excel fehlte): `Geplant → In Arbeit → Erledigt`, plus `Abgesagt`.
- **Filter & Suche** über Quartal, Status, Kanal, Ziel und Verantwortliche.
- **Bearbeiten ohne kaputtzumachen:** strukturiertes Formular statt freier Excel-Zellen.
- **Rollen** (viewer / editor / admin) über echte Anmeldung; Nutzer- und
  Rechteverwaltung, User-Logs und Backups im **⚙ Administration**-Bereich (Admin).
- **Gemeinsames Arbeiten:** Änderungen erscheinen live bei allen; beim
  Bearbeiten wird ein Eintrag für andere kurzzeitig gesperrt.

## Architektur in Kürze

```
React + TypeScript + Vite + Tailwind   →  statischer Build  →  GitHub Pages
        │
        ├─ src/data/repository.ts   ← austauschbare Datenschicht
        │     • Supabase (gemeinsame DB)  – wenn Zugangsdaten gesetzt
        │     • LocalStorage (Demo)       – Fallback ohne Backend
        │
        └─ src/auth/AuthContext.tsx ← Supabase Auth + Rollen aus `profile`
```

Der Trick: **UI und Datenhaltung sind getrennt** – die Ansichten bleiben gleich,
egal ob Supabase- oder lokaler Modus.

Details: [`docs/ARCHITEKTUR.md`](docs/ARCHITEKTUR.md) ·
Umgesetztes Schema: [`docs/supabase-schema.sql`](docs/supabase-schema.sql) ·
Betrieb/Go-Live: [`docs/LIVEGANG.md`](docs/LIVEGANG.md)

## Dokumente

- [`docs/ARCHITEKTUR.md`](docs/ARCHITEKTUR.md) – technische Entscheidungen & Begründungen
- [`docs/RUECKFRAGEN.md`](docs/RUECKFRAGEN.md) – offene Fragen an dich/das Team
- [`docs/LIVEGANG.md`](docs/LIVEGANG.md) – To-do-Liste bis zum Go-Live
