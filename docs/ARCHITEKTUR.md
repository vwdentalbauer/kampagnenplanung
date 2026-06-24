# Architektur & Entscheidungen

Hier sind die getroffenen Entscheidungen mit Begründung. Alles ist so gewählt,
dass es **jetzt sofort läuft** und der **spätere Supabase-Schritt klein** bleibt.

## Getroffene Entscheidungen

| Thema | Entscheidung | Warum |
|---|---|---|
| **Hosting** | GitHub Pages (statisch) | Vom dir gewünscht, kostenlos, kein Server nötig. Automatischer Deploy via GitHub Actions bei jedem Push auf `main`. |
| **Tech-Stack** | React + TypeScript + Vite + Tailwind | Standard für wartbare Web-Apps, schneller Build, gute Tooling-Unterstützung. TypeScript verhindert viele Fehler vor dem Livegang. |
| **Datenhaltung jetzt** | `localStorage` im Browser | App ist sofort testbar – ganz ohne Backend. Jeder sieht zunächst seine eigene Kopie der echten Excel-Daten. |
| **Datenhaltung später** | Supabase (Postgres + Auth) | Von dir vorgegeben. Gemeinsame Datenbank, Echtzeit, Anmeldung und Rollen. |
| **Abkopplung** | Repository-Pattern (`KampagnenRepository`) | UI ruft nie direkt die Datenquelle auf. Wechsel auf Supabase = neue Klasse, keine UI-Änderung. |
| **Rollen** | viewer / editor / admin | Deckt Lese-, Schreib- und Adminrechte ab. Bereits in der UI wirksam (Buttons/Felder werden je Rolle ein-/ausgeblendet). |
| **Status** | Geplant → In Arbeit → Erledigt + Abgesagt | „Einfacher Status", der in der Excel fehlte. Bewusst kurz, damit ihn alle pflegen. |
| **Auswertung** | Ansichten „nach Woche" und „nach Ziel" | Genau die zwei Blickwinkel, die du genannt hast (wöchentliche Besprechung + Ziel-Analyse). |

## Was aus der Excel übernommen / bereinigt wurde

Die Excel-Spalten wurden 1:1 als Datenfelder übernommen, aber bereinigt:

- **Unsichtbare Zeichen entfernt** – in der Excel steckten z. B. `Alle` und
  `Alle␣` (mit unsichtbarem Zeichen) als zwei verschiedene Werte. Solche
  Dubletten waren eine Hauptursache für die Unübersichtlichkeit.
- **Wochentags-Spalten (MO–SO) weggelassen** – diese waren reine Datums-
  wiederholungen der Kalenderwoche und werden in der App aus dem Datum berechnet.
- **Verantwortung** wird zusätzlich in eine Liste einzelner Personen zerlegt
  (z. B. „Ivana/ Michaela" → `Ivana`, `Michaela`), damit man nach Person filtern kann.
- **Bereiche/Marken** (Brand, MIZ, EV, TS, Planung, Exi, DSO) wurden aus den
  „x"-Spalten zu Mehrfach-Tags zusammengefasst.

## Datenmodell (eine Kampagne = eine Excel-Zeile)

Siehe [`src/types.ts`](../src/types.ts). Felder: `quartal`, `kw`, `weekStart`,
`zielgruppe`, `kanal`, `details`, `ziel`, `kategorie` (db 4+1), `bereiche[]`,
`verantwortung`, `owners[]`, `status`.

## Phasenplan

- **Phase 1 (erledigt):** Lauffähige App, echte Daten, drei Ansichten, Status,
  Filter, Rollen-Gerüst, GitHub-Pages-Deploy.
- **Phase 2 (erledigt):** Supabase eingebunden – `SupabaseRepository` + echte
  Anmeldung (Supabase Auth) + Nutzer-/Rechteverwaltung durch Admin, Row Level
  Security, Live-Updates (Realtime), Bearbeitungs-Sperren, Änderungs-Historie
  + Undo, tägliches Backup (7 Tage), individuelle Tabellenansicht je Nutzer.
  Umgesetztes Schema: `docs/supabase-schema.sql`, Betrieb: `docs/LIVEGANG.md`.
- **Phase 3 (optional):** Benachrichtigungen, Druck-/Mobilansicht, weitere
  Auswertungen.

## Rechtemanagement (Phase 2)

| Rolle | Rechte |
|---|---|
| **viewer** (Leserechte) | Nur Ansicht, keine Änderungen. |
| **editor** (Schreibrechte) | Alles erstellen/ändern/löschen – **außer** Excel-Import. |
| **admin** | Wie editor + Nutzer-/Rechteverwaltung, Excel-Import, User-Logs, Änderungen rückgängig machen, Backups wiederherstellen. |

- **Anmeldung:** Supabase Auth. Neue Nutzer legt **nur der Admin** an
  (Einladung per E-Mail); öffentliche Selbst-Registrierung ist deaktiviert.
- **Gleichzeitigkeit:** Beim Öffnen eines Eintrags wird dieser für andere
  gesperrt (Nur-Lese-Hinweis); alle Änderungen erscheinen live bei allen.
  Abgelaufene Sperren (>5 min) werden automatisch übernommen.
- **Sicherheit:** Durchgesetzt serverseitig über Row Level Security; die UI
  blendet zusätzlich passende Aktionen je Rolle ein/aus. Admin-Aktionen
  (Nutzeranlage) laufen über eine Edge Function mit Service-Role – der
  Service-Key ist nie im Frontend.
