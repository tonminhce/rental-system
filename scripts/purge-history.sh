#!/usr/bin/env bash
# Owner-run helper: purge leaked secrets and scraped PII from git history.
# Read docs/REMEDIATION.md FIRST. Ordering matters:
#   1. ROTATE every leaked credential (they stay valid until revoked — purging
#      history does NOT un-leak them).
#   2. Run this script BEFORE merging fix/prod-ready-review.
#   3. Force-push, then everyone discards their clones and re-clones.
set -euo pipefail

REPO_ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$REPO_ROOT"

if ! command -v git-filter-repo >/dev/null 2>&1; then
  echo "[ERROR] git-filter-repo not found. Install: pip install git-filter-repo" >&2
  exit 1
fi

echo "This REWRITES published history and requires a force-push."
echo "Every existing clone must be discarded and re-cloned afterwards."
read -r -p "All keys rotated and collaborators warned? Type PURGE to continue: " ack
if [[ "${ack}" != "PURGE" ]]; then
  echo "Aborted."
  exit 1
fi

# Work on a mirror so a mistake can't touch the working checkout.
MIRROR="../$(basename "$REPO_ROOT")-purge-mirror.git"
git clone --mirror . "$MIRROR"
cd "$MIRROR"

git filter-repo --force \
  --invert-paths \
  --path frontend/.env.development \
  --path chatbot-service/.env \
  --path-glob 'nhatot-crawler/data/*.csv'
# 13MB demo MP4s (~50% of clone cost) — owner's call, see docs/REMEDIATION.md §4.
# To purge them too, re-run with these added to the filter-repo flags above:
#   --path docs/demo/rental-system-demo.mp4 \
#   --path docs/demo/rental-system-demo-60s.mp4

echo
echo "History rewritten in: $MIRROR"
echo "Verify the blobs are gone, e.g.:"
echo "  git -C '$MIRROR' log --all --oneline -- frontend/.env.development chatbot-service/.env   # must be empty"
echo "Then push from the mirror (filter-repo removed 'origin' by design):"
echo "  git -C '$MIRROR' remote add origin <REMOTE_URL>"
echo "  git -C '$MIRROR' push --force --all && git -C '$MIRROR' push --force --tags"
echo "Finally: every collaborator deletes their clone and re-clones."
