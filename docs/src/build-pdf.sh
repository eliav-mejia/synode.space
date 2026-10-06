#!/bin/sh
# Builds docs/synode-vX.pdf from docs/src/synode-vX.html with headless Chrome or Edge.
# Run from the project root:  sh docs/src/build-pdf.sh 1.0.2
set -e
HERE="$(cd "$(dirname "$0")" && pwd)"
VERSION="${1:-1.0.2}"
SRC="$HERE/synode-v$VERSION.html"
OUT="$HERE/../synode-v$VERSION.pdf"

for b in "$CHROME" \
         "/c/Program Files/Google/Chrome/Application/chrome.exe" \
         "/c/Program Files (x86)/Microsoft/Edge/Application/msedge.exe" \
         "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome" \
         google-chrome chromium; do
  if [ -n "$b" ] && command -v "$b" >/dev/null 2>&1; then BROWSER="$b"; break; fi
done
[ -n "$BROWSER" ] || { echo "Chrome/Edge not found; set CHROME=/path/to/browser"; exit 1; }

# Git Bash / MSYS: hand Windows-style paths to the browser.
if command -v cygpath >/dev/null 2>&1; then
  URL="file:///$(cygpath -m "$SRC")"; OUT="$(cygpath -w "$OUT")"
else
  URL="file://$SRC"
fi
"$BROWSER" --headless=new --disable-gpu --no-pdf-header-footer \
  --virtual-time-budget=10000 --print-to-pdf="$OUT" "$URL"
echo "Wrote $OUT"
