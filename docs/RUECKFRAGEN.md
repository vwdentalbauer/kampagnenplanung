# Rückfragen & Vorschläge

Ich habe überall dort, wo eine Entscheidung nötig war, einen **Vorschlag**
umgesetzt (siehe „mein Vorschlag"), damit die App jetzt läuft. Bitte gib
Rückmeldung – ich passe es entsprechend an.

## A. Status

1. **Reichen die vier Status?** Mein Vorschlag: `Geplant → In Arbeit → Erledigt`
   plus `Abgesagt`. Brauchst du zusätzlich z. B. `In Freigabe/Review` oder
   `Verschoben`?
2. **Soll der Status farblich wie eine Ampel wirken?** Aktuell: grau/gelb/grün/rot.

## B. Ziele (für die Auswertung „nach Ziel")

3. In der Excel gibt es **40 verschiedene Ziel-Texte**, viele fast gleich
   (z. B. „Image stärken und Beziehung aufbauen" in 3 Schreibweisen).
   **Mein Vorschlag:** wir definieren eine feste Liste an Hauptzielen (ca. 8–12)
   und ordnen jede Maßnahme einem davon zu. Welche Hauptziele sind das?
   (Kandidaten aus den Daten: *Image & Beziehung*, *Shop Go Live*, *Salespush*,
   *Hygiene-Kampagne*, *WM 2026*, *Messe-Push*, *Existenzgründer*, *Awareness*…)

## C. Marken/Bereiche (db 4+1)

4. Ich habe die Spalten **Brand, MIZ, EV, TS, Planung, Exi, DSO** als
   Mehrfach-Auswahl übernommen. **Stimmen die Bezeichnungen** und sind das alle?
   Was bedeutet „db 4+1" genau (Kategorie-Spalte O)?
5. Die Kategorien sind aktuell: *db Kampagnen, Hero Kampagne, Abverkauf/Aktionen,
   CI*. Vollständig?

## D. Kanäle

6. In der Excel stehen **~30 Kanäle**, teils Tippfehler (z. B. „Prinanzeige" vs.
   „Printanzeige", „Website" vs. „Website "). **Mein Vorschlag:** feste
   Kanal-Liste als Dropdown statt Freitext. Bitte die gewünschte Liste bestätigen.

## E. Zeit / Kalenderwoche

7. Die Excel mischt „KW + Wochentage" mit einem teils fehlerhaften Feld
   „Zeitraum/Startdatum" (einige Datumswerte waren vertauscht, z. B. 3.10 statt
   10.3.). **Mein Vorschlag:** ein **Startdatum** pro Maßnahme; KW und Quartal
   werden automatisch berechnet. Brauchst du auch ein **Enddatum / Zeitraum**
   (z. B. „läuft KW 10–14")?
8. Sollen Maßnahmen ohne festes Datum („tbd") einen eigenen Bereich bekommen?
   (Aktuell: Sammelblock „Ohne Kalenderwoche".)

## F. Rollen & Nutzerverwaltung (Supabase, Phase 2)

9. **Rollen-Definition** – mein Vorschlag:
   - **Leserechte (viewer):** alles sehen, nichts ändern.
   - **Schreibrechte (editor):** Kampagnen anlegen/bearbeiten, Status ändern.
   - **Admin:** zusätzlich Nutzer freigeben/Rollen vergeben, Daten zurücksetzen.
   - *Frage:* Darf ein Editor auch **löschen**, oder nur Admin? (Aktuell: nur Admin.)
10. **Nutzerfreigabe:** Soll sich jeder mit Firmen-E-Mail registrieren und ein
    Admin gibt frei? Oder lädt der Admin gezielt per E-Mail ein?
11. Gibt es eine **Domain** (z. B. nur `@dentalbauer.de`), auf die wir die
    Anmeldung beschränken sollen?

## G. Sonstiges

12. Brauchen wir einen **Excel-Export** (für Reporting/Backup) und/oder einen
    **Excel-Import**, um künftige Zeilen wieder einzuspielen?
13. Soll es eine **Historie/Änderungsverfolgung** geben (wer hat wann was geändert)?
14. **Mehrsprachigkeit** nötig oder reicht Deutsch?
