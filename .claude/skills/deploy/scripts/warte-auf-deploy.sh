#!/usr/bin/env bash
# Wartet auf den aktuellen Deploy-Lauf und meldet dessen Ergebnis.
#
# Aufruf:  scripts/warte-auf-deploy.sh [commit-sha]
# Ohne Argument wird der HEAD des lokalen Branches verwendet.
#
# Rückgabewert: 0 bei Erfolg, 1 bei Fehlschlag oder Zeitüberschreitung –
# damit ein Aufrufer daran erkennt, ob weitergearbeitet werden darf.

set -uo pipefail

REPO="vwdentalbauer/kampagnenplanung"
SHA="${1:-$(git rev-parse HEAD)}"
API="https://api.github.com/repos/$REPO/actions/runs"
MAX_WARTEN=600 # Sekunden; ein normaler Lauf braucht ca. 40–60

# Ein Token erhöht nur das Rate-Limit; ohne funktioniert es bei öffentlichen
# Repositories ebenfalls.
kopf=(-s)
if [ -n "${GITHUB_TOKEN:-}" ]; then
  kopf+=(-H "Authorization: Bearer $GITHUB_TOKEN")
fi

hole_lauf() {
  curl "${kopf[@]}" "$API?head_sha=$SHA&per_page=1"
}

feld() { # feld <json> <schluessel>
  printf '%s' "$1" | grep -m1 "\"$2\":" | sed -E 's/.*: *"?([^",]*)"?.*/\1/'
}

echo "Warte auf den Deploy-Lauf für ${SHA:0:7} …"

# Der Lauf erscheint nicht sofort nach dem Push.
for _ in $(seq 1 12); do
  antwort=$(hole_lauf)
  printf '%s' "$antwort" | grep -q '"workflow_runs": \[\]' || break
  sleep 5
done

verstrichen=0
while [ "$verstrichen" -lt "$MAX_WARTEN" ]; do
  antwort=$(hole_lauf)
  status=$(feld "$antwort" status)
  url=$(printf '%s' "$antwort" | grep -m1 '"html_url": ".*actions/runs' | sed -E 's/.*"(https[^"]*)".*/\1/')

  if [ "$status" = "completed" ]; then
    ergebnis=$(feld "$antwort" conclusion)
    echo "Ergebnis: $ergebnis"
    [ -n "$url" ] && echo "Lauf: $url"
    if [ "$ergebnis" = "success" ]; then
      echo "Veröffentlicht. Jetzt mit scripts/pruefe-live.sh verifizieren."
      exit 0
    fi
    echo "Fehlgeschlagen – Logs des Jobs lesen und Ursache beheben."
    exit 1
  fi

  sleep 10
  verstrichen=$((verstrichen + 10))
done

echo "Zeitüberschreitung nach ${MAX_WARTEN}s – Lauf im Actions-Reiter prüfen."
[ -n "${url:-}" ] && echo "Lauf: $url"
exit 1
