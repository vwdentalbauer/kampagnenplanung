# To-do bis zum Livegang

Reihenfolge ist so gewählt, dass nach jedem Block etwas Vorzeigbares existiert.

## ✅ Phase 1 – Lauffähige App (erledigt)

- [x] Excel-Daten analysiert und bereinigt importiert (182 Maßnahmen)
- [x] Datenmodell + austauschbare Datenschicht (Repository-Pattern)
- [x] Drei Ansichten: nach Woche, nach Ziel, Tabelle
- [x] Einfacher Status + Filter + Suche
- [x] Rollenmodell (viewer/editor/admin) in der UI
- [x] Build + GitHub-Actions-Workflow für GitHub Pages

## ✅ Phase 1.5 – GitHub Pages live schalten (erledigt)

- [x] Repository auf GitHub angelegt (`vwdentalbauer/kampagnenplanung`)
- [x] In **Settings → Pages**: Source = „GitHub Actions"
- [x] Deploy läuft automatisch (siehe „Deploy & Branches" unten)
- [ ] Mit dem Team durchklicken, offene Punkte aus `RUECKFRAGEN.md` klären

### Deploy & Branches

Wichtig: Das Repository hat **keinen `main`-Branch**. Produktiv-Branch ist
**`claude/great-noether-bhev0p`** – jeder Push dorthin startet den Workflow
`.github/workflows/deploy.yml` und veröffentlicht den neuen Stand auf GitHub
Pages. Ein Deploy ohne Code-Änderung lässt sich unter **Actions → „Deploy auf
GitHub Pages" → „Run workflow"** manuell auslösen (`workflow_dispatch`).

## ✅ Phase 2 – Supabase (gemeinsame Daten + Anmeldung) – umgesetzt

Implementiert: gemeinsame Datenbank, Supabase-Auth-Login, drei Rollen
(viewer/editor/admin), Live-Updates (Realtime), Bearbeitungs-Sperren,
Änderungs-Historie + Undo, tägliches Backup (7 Tage) und individuelle
Tabellenansicht je Nutzer. Schema siehe `docs/supabase-schema.sql`.

### Noch manuell zu erledigen (einmalig, im Supabase-Dashboard)

1. **GitHub-Secrets** setzen (Settings → Secrets and variables → Actions):
   - `VITE_SUPABASE_URL` = `https://bylcztqahqzsaeztqfov.supabase.co`
   - `VITE_SUPABASE_ANON_KEY` = der anon/publishable Key des Projekts
   (öffentlich-sicher – Schutz erfolgt über Row Level Security). Ohne diese
   Secrets baut die App im lokalen Demo-Modus (`localStorage`).

2. **Selbst-Registrierung deaktivieren** (Authentication → Sign In / Providers →
   „Allow new users to sign up" **aus**). Damit können sich nur per Admin
   eingeladene Nutzer anmelden. (Zusätzliche Absicherung im Code: selbst
   angelegte Konten ohne Admin-Rolle bleiben inaktiv = ohne Zugriff.)

3. **E-Mail/SMTP** (Authentication → Emails): Für zuverlässige Einladungs- und
   Passwort-Reset-Mails ein **eigenes SMTP** hinterlegen (der eingebaute
   Supabase-Mailversand ist stark limitiert). Einladungs- und Reset-Vorlagen
   können auf Deutsch angepasst werden. Ohne SMTP kann der Admin Nutzer
   alternativ mit einem Initial-Passwort anlegen (Funktion ist vorhanden).

4. **Site URL / Redirect URLs** (Authentication → URL Configuration): die
   GitHub-Pages-URL eintragen, z.B.
   `https://<organisation>.github.io/kampagnenplanung/`, damit Einladungs- und
   Reset-Links zurück in die App führen.

### Bootstrap-Admin

Der erste Admin ist bereits angelegt:
**valeska.wiedemann@dentalbauer.de** (Rolle `admin`). Das Initial-Passwort
wurde gesondert mitgeteilt und sollte beim ersten Login über
„Passwort vergessen" bzw. das Profil **sofort geändert** werden. Danach lädt
die Admin die übrigen Nutzer über **⚙ Administration → Nutzerverwaltung** ein.

### Backups & Wiederherstellung

- Täglich um 02:17 UTC erstellt ein `pg_cron`-Job automatisch ein
  vollständiges Backup; Backups älter als 7 Tage werden gelöscht.
- Admins können unter **⚙ Administration → Backups** einen Tagesstand
  wiederherstellen (der aktuelle Stand wird vorher automatisch gesichert) und
  unter **User-Logs** einzelne Änderungen gezielt rückgängig machen.

## 🧭 Phase 3 – Komfort (optional, nach Bedarf)

- [ ] Excel-Export (Backup/Reporting) und ggf. -Import
- [ ] Änderungshistorie (wer/wann/was)
- [ ] Benachrichtigungen (z. B. „Maßnahme dieser Woche noch offen")
- [ ] Mobil-Optimierung / Druckansicht für die wöchentliche Besprechung

## Hinweise / Risiken

- **GitHub Pages ist öffentlich**, solange das Repo öffentlich ist. Bis Supabase
  greift, stehen also Beispiel-/Echtdaten ohne Login im Netz. Optionen:
  Repo privat halten (Pages bleibt erreichbar, aber nur über die URL), oder mit
  dem Supabase-Login direkt scharf gehen, bevor echte Daten online gehen.
- Solange `localStorage` aktiv ist, hat **jeder seine eigene Datenkopie** –
  Änderungen werden nicht geteilt. Gemeinsames Arbeiten kommt erst mit Supabase.
