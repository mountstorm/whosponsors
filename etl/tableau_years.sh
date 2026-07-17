#!/bin/zsh
# Pull per-fiscal-year CSVs from the USCIS Tableau hub.
# The quick-filter field caption is "Fiscal Year   " (three trailing spaces).
# The server 504s freely; retry each year until it lands.
set -u
BASE="https://bigdataanalyticspub-sb.uscis.dhs.gov/views/H1BEmployerDataHub-Final/H1B-EmployerDataHub.csv"
FIELD="Fiscal%20Year%20%20%20"
OUT="$(dirname "$0")/../data/raw"
mkdir -p "$OUT"

for y in "$@"; do
  dest="$OUT/tableau_fy${y}.csv"
  for attempt in 1 2 3 4 5 6 7 8; do
    code=$(curl -s -A "Mozilla/5.0" -o "$dest" -w "%{http_code}" --max-time 300 "$BASE?$FIELD=$y")
    if [[ "$code" == "200" ]] && head -1 "$dest" | grep -q "Employer"; then
      echo "FY$y OK ($(wc -l < "$dest" | tr -d ' ') lines, attempt $attempt)"
      break
    fi
    echo "FY$y attempt $attempt failed (HTTP $code), backing off"
    sleep $((attempt * 45))
  done
done