#!/usr/bin/env bash
# Prüft, ob die Live-Seite erreichbar ist, und zeigt ihren Versionsstempel.
#
# Aufruf:  scripts/pruefe-live.sh [erwarteter-stempel]
#
# Der Stempel steht in der Fußzeile der App („Version vom …") und wird beim
# Build gesetzt. Er ist das verlässlichste Signal dafür, ob GitHub Pages den
# neuen Stand tatsächlich ausliefert – der CI-Lauf allein sagt das nicht.
#
# Ohne Argument wird der Stempel nur angezeigt. Mit Argument wird verglichen
# und der Rückgabewert entsprechend gesetzt (0 = passt, 1 = noch der alte).

set -uo pipefail

BASIS="https://vwdentalbauer.github.io/kampagnenplanung"
ERWARTET="${1:-}"

status=$(curl -s -o /dev/null -w '%{http_code}' "$BASIS/")
if [ "$status" = "000" ]; then
  # Keine HTTP-Antwort: In abgeschotteten Umgebungen (z.B. einer Sandbox mit
  # eingeschränktem Netzzugang) wird die Verbindung geblockt. Das sagt nichts
  # über den Zustand der Seite aus – dann im Browser prüfen, nicht raten.
  echo "Keine Verbindung zu $BASIS – vermutlich durch die Umgebung blockiert,"
  echo "nicht zwingend ein Problem der Seite. Bitte im Browser prüfen:"
  echo "  $BASIS/"
  exit 2
fi
if [ "$status" != "200" ]; then
  echo "Live-Seite antwortet mit HTTP $status (erwartet: 200)."
  exit 1
fi

seite=$(curl -s "$BASIS/")
bundle=$(printf '%s' "$seite" | grep -oE 'assets/index-[A-Za-z0-9_-]+\.js' | head -1)
if [ -z "$bundle" ]; then
  echo "Kein JavaScript-Bündel in der Seite gefunden – Ausgabe unerwartet."
  exit 1
fi

stempel=$(curl -s "$BASIS/$bundle" \
  | grep -oE 'Version vom ","[^"]+"' \
  | head -1 \
  | sed -E 's/.*","([^"]+)"/\1/')

if [ -z "$stempel" ]; then
  echo "Versionsstempel nicht gefunden (Bündel: $bundle)."
  exit 1
fi

echo "Live erreichbar (HTTP 200)"
echo "Bündel:  $bundle"
echo "Version: $stempel"

if [ -n "$ERWARTET" ]; then
  if [ "$stempel" = "$ERWARTET" ]; then
    echo "Stimmt mit dem erwarteten Stand überein."
    exit 0
  fi
  echo "Erwartet war: $ERWARTET"
  echo "Noch der alte Stand – Pages braucht manchmal ein bis zwei Minuten."
  exit 1
fi
