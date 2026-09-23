#!/usr/bin/env bash
# Crawl chotot/nhatot rentals -> timestamped data/nhatot_rentals_*.csv.
# nhatot_crawl_100k.py already exits 1 when it collects 0 new rows
# (ponytail: row-count exit code; real alerting when a scheduler exists);
# this wrapper adds the row-count log line.
set -euo pipefail
cd "$(dirname "$0")"
PY="${PYTHON:-python3}"

"$PY" nhatot_crawl_100k.py "${1:-100000}"

out="$(ls -t data/nhatot_rentals_*.csv | head -1)"
echo "[run_crawl] $out: $(( $(wc -l < "$out") - 1 )) rows"
