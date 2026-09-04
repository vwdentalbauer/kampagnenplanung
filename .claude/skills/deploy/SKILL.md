---
name: deploy
description: Veröffentlicht die Kampagnenplanung auf GitHub Pages – prüft vorher lokal (Typprüfung, Tests, Build), committet, pusht auf den Produktiv-Branch, überwacht den CI-Lauf, behebt Fehlschläge und verifiziert danach, dass die Live-Seite den neuen Stand ausliefert. Nutze diesen Skill immer, wenn es ums Veröffentlichen, Deployen, Live-Schalten, Hochladen oder Ausrollen von Änderungen geht, wenn gefragt wird „ist das schon live?", wenn ein Deploy oder CI-Lauf fehlgeschlagen ist, oder wenn eine Änderung an diesem Projekt fertig ist und beim Nutzer ankommen soll – auch wenn das Wort „Deployment" gar nicht fällt.
---

# Deployment der Kampagnenplanung

Diese App wird von mehreren Personen im Arbeitsalltag genutzt. Ein kaputter
Stand fällt sofort allen auf, und wer gerade mitten in der Planung steckt,
verliert Zeit. Deshalb ist der Ablauf hier bewusst so gebaut, dass ein Fehler
**vor** der Veröffentlichung auffällt und nicht danach.

Das Wichtigste vorweg: Ein Deployment ist erst fertig, wenn die Live-Seite den
neuen Stand ausliefert – nicht schon, wenn der Push durch ist.

## Die Fakten zu diesem Projekt

- **Es gibt keinen `main`-Branch.** Produktiv-Branch ist
  `claude/great-noether-bhev0p`. Jeder Push dorthin veröffentlicht.
- Der Workflow `.github/workflows/deploy.yml` macht: Typprüfung → Tests →
  Build → GitHub Pages. Schlägt ein Schritt fehl, wird **nicht** veröffentlicht
  und der vorherige Stand bleibt live.
- Live: https://vwdentalbauer.github.io/kampagnenplanung/
- Die Fußzeile der App zeigt „Version vom …" (`__BUILD_TIME__`, Europe/Berlin).
  Das ist das verlässlichste Signal dafür, ob ein Deploy wirklich angekommen ist.
- Kampagnen-Daten liegen in Supabase, **nicht** im Repository. Ein Deploy ändert
  niemals Daten – wer nach einem neuen Eintrag fragt, braucht die App oder den
  Supabase SQL-Editor, kein Deployment.

## Ablauf

### 1. Vorprüfung

Erst den Zustand klären, damit nicht versehentlich fremde Arbeit mitgeht:

```bash
git status              # Was ist ungespeichert? Gehört das alles zu dieser Änderung?
git branch --show-current
git fetch origin claude/great-noether-bhev0p
git log --oneline -1 origin/claude/great-noether-bhev0p
```

Ist der Remote-Branch weiter als lokal, erst zusammenführen. Liegen fremde
Änderungen im Arbeitsverzeichnis, nachfragen statt blind mitzucommitten.

### 2. Lokal prüfen – vor dem Commit, nicht danach

```bash
npm run pruefen     # Typprüfung + Tests
npm run build       # Produktions-Build
```

Der Build gehört dazu, auch wenn er länger dauert: Er fängt Fehler, die die
Typprüfung allein nicht sieht.

**Wenn etwas fehlschlägt, ist das ein Befund, kein Hindernis.** Ursache
beheben. Einen Test überspringen, deaktivieren oder seine Erwartung
abschwächen, damit er grün wird, ist keine Option – der Test hat dann ja gerade
seine Aufgabe erfüllt.

Bei geänderter Logik: Gehören Tests dazu? Besonders `src/lib/filter.ts` trägt
alle Ansichten; `src/lib/kampagneRow.ts` und `src/lib/excel.ts` sind die
Stellen, an denen Daten still verloren gehen können.

### 3. Committen

Deutsche Commit-Nachricht: erste Zeile knapp, was sich ändert, darunter das
Warum. Vor dem Commit noch einmal `git status` lesen – nichts Unerwartetes
dabei? Keine Zugangsdaten, keine großen Dateien?

### 4. Pushen

```bash
git push -u origin claude/great-noether-bhev0p
```

Bei Netzwerkfehlern mit wachsendem Abstand erneut versuchen (2s, 4s, 8s, 16s).

### 5. Den CI-Lauf zu Ende verfolgen

Das ist der Schritt, der am ehesten vergessen wird – und genau der, der zählt.
Nach dem Push startet der Workflow. Warten, bis er abgeschlossen ist:

```bash
.claude/skills/deploy/scripts/warte-auf-deploy.sh
```

Das Skript findet den aktuellen Lauf, wartet auf sein Ende und meldet das
Ergebnis. Alternativ direkt über die GitHub-Werkzeuge (`actions_list` /
`actions_get`), falls verfügbar.

### 6. Bei Fehlschlag: diagnostizieren und beheben

Nicht raten, sondern die Logs des fehlgeschlagenen Jobs lesen
(`get_job_logs` mit `failed_only`, oder der Link aus dem Skript). Typische
Ursachen in diesem Projekt:

| Symptom | Ursache |
|---|---|
| Test schlägt nur in CI fehl, lokal grün | Umgebungsunterschied – meist Node-Version oder ein Modul mit Import-Nebenwirkung. Ein Testmodul darf `src/lib/supabase.ts` nicht (auch nicht indirekt) importieren, sonst wird eine echte Verbindung aufgebaut. Reine Logik gehört in ein Modul ohne Supabase-Import. |
| Typfehler nur in CI | Lokal fehlten `node_modules` oder sie sind veraltet – `npm ci` und erneut prüfen. |
| Build läuft, Deploy-Schritt bricht ab | Meist GitHub-Pages-Infrastruktur. Einmal erneut auslösen ist hier legitim; wiederholt sich es, liegt es nicht an der Infrastruktur. |

Nach der Korrektur wieder bei Schritt 2 einsteigen. Es gibt kein Rundenlimit –
so lange, bis es grün ist.

### 7. Verifizieren, dass es wirklich live ist

CI-grün heißt „veröffentlicht", nicht „angekommen". Prüfen:

```bash
.claude/skills/deploy/scripts/pruefe-live.sh
```

Das Skript lädt die Live-Seite samt JavaScript-Bündel und zeigt den
Versionsstempel. Ist er noch der alte, hat GitHub Pages den neuen Stand noch
nicht ausgeliefert – kurz warten und erneut prüfen. Bleibt er alt, stimmt etwas
nicht, und das gehört gemeldet.

Rückgabewert **2** bedeutet: gar keine Verbindung möglich. In abgeschotteten
Umgebungen (etwa einer Sandbox mit eingeschränktem Netzzugang) ist
`github.io` oft gesperrt. Das ist keine Aussage über die Seite – dann ehrlich
sagen, dass die Verifikation von hier aus nicht möglich war, und den Nutzer
bitten, im Browser nachzusehen. Keinesfalls „ist live" behaupten, ohne es
gesehen zu haben.

### 8. Rückmelden

Kurz und konkret: was veröffentlicht wurde, Link auf den CI-Lauf, und dass die
Live-Seite den neuen Stand zeigt. Beim Nutzer erwähnen, dass ggf.
`Strg`+`F5` nötig ist, wenn der Browser die alte Version zwischenspeichert.

## Wenn ein veröffentlichter Stand kaputt ist

Erst stabilisieren, dann in Ruhe reparieren – die Leute arbeiten währenddessen
mit der App:

```bash
git revert <commit>          # kehrt genau diese Änderung um, Historie bleibt nachvollziehbar
npm run pruefen && npm run build
git push -u origin claude/great-noether-bhev0p
```

Kein `reset --hard` auf dem Produktiv-Branch und kein Force-Push: Andere haben
diesen Stand ggf. schon ausgecheckt, und die Historie ist die einzige
Nachvollziehbarkeit, die dieses Projekt hat.

Danach den Fehler mit einem Test absichern, damit er nicht ein zweites Mal
denselben Weg nimmt.

## Was einen Deploy nicht rechtfertigt

- **Reine Datenänderungen** (neue Kampagne, Eintrag korrigieren) – die gehören
  in die App oder den Supabase SQL-Editor.
- **Ein leerer Commit, um die CI erneut anzustoßen** – dafür gibt es
  „Run workflow" (`workflow_dispatch`) im Actions-Reiter.

## Ohne Änderung neu veröffentlichen

Manchmal ist nur ein Redeploy nötig (Pages-Infrastruktur hat gehakt):
Actions → „Deploy auf GitHub Pages" → „Run workflow" auf
`claude/great-noether-bhev0p`.
