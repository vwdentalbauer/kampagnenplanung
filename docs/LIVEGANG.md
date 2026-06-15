# To-do bis zum Livegang

Reihenfolge ist so gewählt, dass nach jedem Block etwas Vorzeigbares existiert.

## ✅ Phase 1 – Lauffähige App (erledigt)

- [x] Excel-Daten analysiert und bereinigt importiert (182 Maßnahmen)
- [x] Datenmodell + austauschbare Datenschicht (Repository-Pattern)
- [x] Drei Ansichten: nach Woche, nach Ziel, Tabelle
- [x] Einfacher Status + Filter + Suche
- [x] Rollenmodell (viewer/editor/admin) in der UI
- [x] Build + GitHub-Actions-Workflow für GitHub Pages

## 🔜 Phase 1.5 – GitHub Pages live schalten

- [ ] Repository auf GitHub anlegen/prüfen (`kampagnenplanung`)
- [ ] In **Settings → Pages**: Source = „GitHub Actions"
- [ ] Auf `main` pushen → Workflow deployt automatisch
- [ ] URL prüfen: `https://<organisation>.github.io/kampagnenplanung/`
- [ ] Falls Repo-Name abweicht: `base` in `vite.config.ts` anpassen
- [ ] Mit dem Team durchklicken, offene Punkte aus `RUECKFRAGEN.md` klären

## 🔜 Phase 2 – Supabase (gemeinsame Daten + Anmeldung)

- [ ] Supabase-Projekt anlegen
- [ ] Schema aus `docs/supabase-schema.sql` einspielen (ggf. nach Rückfragen anpassen)
- [ ] Echte Excel-Daten einmalig in die DB importieren (Skript vorhanden/anpassbar)
- [ ] `SupabaseRepository` implementieren (gleiche Schnittstelle wie heute)
- [ ] `AuthContext` auf Supabase Auth umstellen (Login per E-Mail/Magic-Link)
- [ ] **Nutzerfreigabe:** Admin-Ansicht, um neue Nutzer freizugeben & Rollen zu vergeben
- [ ] Row Level Security testen (kann ein viewer wirklich nicht schreiben?)
- [ ] `.env` mit `VITE_SUPABASE_URL` / `VITE_SUPABASE_ANON_KEY` befüllen
      (in GitHub als Repository-Secrets für den Build hinterlegen)

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
