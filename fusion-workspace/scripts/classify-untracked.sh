#!/usr/bin/env bash
set -euo pipefail
# classify-untracked.sh
# Produce a CSV-style report with suggestions for untracked files.
# Usage: ./classify-untracked.sh > /tmp/untracked_classification.csv

REPO_ROOT="$(git rev-parse --show-toplevel 2>/dev/null || echo "$(cd "$(dirname "$0")/.." && pwd)")"
cd "$REPO_ROOT"

OUT=/tmp/untracked_classification_$(date +%Y%m%d-%H%M%S).csv
printf "path,size,ext,suggested,reason\n" > "$OUT"

git status --porcelain | awk '/^\?\?/ {print substr($0,4)}' | sed 's@^./@@' | while IFS= read -r f; do
  if [ ! -e "$f" ]; then
    continue
  fi
  size=$(du -h "$f" 2>/dev/null | cut -f1 || echo "-")
  ext="$(basename "$f" | awk -F. 'NF>1{print tolower($NF)}')"
  suggested=""
  reason=""

  # Rules
  case "$f" in
    *.zip|*.tar|*.tar.gz|*.tgz)
      suggested="ARCHIVE"
      reason="archive or release candidate"
      ;;
    *.log|*.tmp|*.temp)
      suggested="IGNORE"
      reason="log/temp files"
      ;;
    .DS_Store|._*|Thumbs.db)
      suggested="IGNORE"
      reason="os-specific resource fork"
      ;;
    node_modules/*)
      suggested="IGNORE"
      reason="node_modules (build output)"
      ;;
    */dist/*|*/build/*)
      suggested="IGNORE"
      reason="build output"
      ;;
    fusion-workspace/reports/*|fusion-workspace/docs/*)
      suggested="KEEP_DOCS"
      reason="project docs or reports"
      ;;
    fusion-workspace/backup-zips/*)
      suggested="ARCHIVE"
      reason="backup zip in workspace"
      ;;
    *.md|docs/*)
      suggested="KEEP_DOCS"
      reason="documentation"
      ;;
    *.js|*.ts|*.py|*.java|*.kt|*.sh)
      # Likely source: keep if under fusion-workspace/kolicode or other module
      case "$f" in
        fusion-workspace/*|*/kolicode/*)
          suggested="KEEP"
          reason="source in fusion-workspace/module"
          ;;
        *)
          suggested="REVIEW"
          reason="source file outside known modules — review"
          ;;
      esac
      ;;
    *)
      # fallback by path
      if [[ "$f" == fusion-workspace/* ]]; then
        suggested="REVIEW"
        reason="inside fusion-workspace, manual check"
      else
        suggested="REVIEW"
        reason="unknown, manual review"
      fi
      ;;
  esac

  printf "%s,%s,%s,%s,%s\n" "$f" "$size" "$ext" "$suggested" "$reason" >> "$OUT"
done

cat "$OUT"

echo "Report saved to: $OUT" >&2
exit 0

