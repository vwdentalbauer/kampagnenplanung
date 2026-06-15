# Kampagnenplanung 2026

Web-App als Ersatz für den Excel-Jahresplan „Jahresübersicht". Übersichtlich,
schwer kaputtzumachen, von mehreren Personen nutzbar – mit Lese-, Schreib- und
Adminrechten. Hosting über **GitHub Pages**, gemeinsame Datenbank &
Nutzerverwaltung später über **Supabase**.

> **Aktueller Stand:** Lauffähige Version mit den echten Daten aus der Excel
> (182 Maßnahmen). Die Daten liegen vorerst lokal im Browser (`localStorage`),
> damit man die App sofort ausprobieren kann, ohne Backend. Der Wechsel auf
> Supabase ist vorbereitet und in der Architektur abgekoppelt.

## Schnellstart

```bash
npm install
npm run dev      # lokal unter http://localhost:5173
npm run build    # Produktions-Build nach dist/
```

## Was die App heute kann

- **Drei Ansichten auf dieselben Daten:**
  - 📅 **Nach Woche** – gruppiert nach Kalenderwoche, für den wöchentlichen Jour fixe.
  - 🎯 **Nach Ziel** – gruppiert nach Ziel, mit Fortschrittsbalken (wie viel ist erledigt).
  - 📋 **Tabelle** – die klassische Listenansicht mit Inline-Statuswechsel.
- **Einfacher Status** (das, was in der Excel fehlte): `Geplant → In Arbeit → Erledigt`, plus `Abgesagt`.
- **Filter & Suche** über Quartal, Status, Kanal, Ziel und Verantwortliche.
- **Bearbeiten ohne kaputtzumachen:** strukturiertes Formular statt freier Excel-Zellen.
- **Rollen** (viewer / editor / admin) sind bereits implementiert – aktuell über
  einen Umschalter oben rechts zum Ausprobieren, später über echte Anmeldung.

## Architektur in Kürze

```
React + TypeScript + Vite + Tailwind   →  statischer Build  →  GitHub Pages
        │
        ├─ src/data/repository.ts   ← austauschbare Datenschicht
        │     • heute:  LocalStorageRepository (Browser)
        │     • später: SupabaseRepository (gleiche Schnittstelle)
        │
        └─ src/auth/AuthContext.tsx ← Rollenmodell
              • heute:  Mock-Nutzer mit Rollen-Umschalter
              • später: Supabase Auth + Nutzerfreigabe
```

Der Trick: **UI und Datenhaltung sind getrennt.** Wenn Supabase kommt, tauschen
wir nur `repository.ts` und `AuthContext.tsx` aus – die Ansichten bleiben gleich.

Details: [`docs/ARCHITEKTUR.md`](docs/ARCHITEKTUR.md) ·
Datenbank-Entwurf: [`docs/supabase-schema.sql`](docs/supabase-schema.sql)

## Dokumente

- [`docs/ARCHITEKTUR.md`](docs/ARCHITEKTUR.md) – technische Entscheidungen & Begründungen
- [`docs/RUECKFRAGEN.md`](docs/RUECKFRAGEN.md) – offene Fragen an dich/das Team
- [`docs/LIVEGANG.md`](docs/LIVEGANG.md) – To-do-Liste bis zum Go-Live
