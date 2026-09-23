#!/usr/bin/env bash
# Crawl mogi.vn -> timestamped mogi_after_parsing_*.csv. Exits non-zero when
# the run yields 0 rows (stale selectors / blocked gateway must be loud).
# ponytail: row-count exit code; real alerting when a scheduler exists.
set -euo pipefail
cd "$(dirname "$0")"
PY="${PYTHON:-python3}"

"$PY" -m scrapy crawl mogi_spider -a pages_limit="${PAGES_LIMIT:-20}"

out="$(ls -t mogi_after_parsing_*.csv | head -1)"
rows=$(( $(wc -l < "$out") - 1 ))
echo "[run_crawl] $out: $rows rows"
[ "$rows" -gt 0 ] || { echo "[run_crawl] FATAL: 0 rows scraped" >&2; exit 1; }
