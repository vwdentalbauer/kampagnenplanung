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
- **Phase 2:** Supabase einbinden – `SupabaseRepository` + echte Anmeldung +
  Nutzerfreigabe durch Admin. Schema-Entwurf liegt in `docs/supabase-schema.sql`.
- **Phase 3 (optional):** Excel-Import/Export, Benachrichtigungen, Verlauf/Historie.
