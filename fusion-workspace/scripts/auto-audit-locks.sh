#!/usr/bin/env bash
set -euo pipefail
# auto-audit-locks.sh
# Modes:
#  --plan   : run validate-lockfiles-safe.sh --full and list modules with diffs (no git changes)
#  --apply  : for a given --module <path>, create audit branch, backup, copy generated package-lock and create PR (requires confirmation)
# Usage examples:
#  ./auto-audit-locks.sh --plan
#  ./auto-audit-locks.sh --apply --module fusion-workspace/kolicode/frontend --confirm

REPO_ROOT="$(git rev-parse --show-toplevel 2>/dev/null || echo "$(cd "$(dirname "$0")/.." && pwd)")"
VALIDATOR="$REPO_ROOT/fusion-workspace/scripts/validate-lockfiles-safe.sh"

if [ ! -x "$VALIDATOR" ]; then
  echo "Validator not found or not executable: $VALIDATOR" >&2
  exit 2
fi

MODE="plan"
MODULE_TO_APPLY=""
CONFIRM="no"

while [ "$#" -gt 0 ]; do
  case "$1" in
    --plan) MODE="plan"; shift;;
    --apply) MODE="apply"; shift;;
    --module) MODULE_TO_APPLY="$2"; shift 2;;
    --confirm) CONFIRM="yes"; shift;;
    --help) echo "Usage: $0 --plan | --apply --module <path> [--confirm]"; exit 0;;
    *) echo "Unknown arg: $1"; exit 1;;
  esac
done

if [ "$MODE" = "plan" ]; then
  echo "Running validator (full) to detect desincronizaciones..."
  # validator will generate artifacts with diffs
  /usr/bin/env bash "$VALIDATOR" --full
  echo
  echo "Summary of artifacts directories:"
  ls -1 "$REPO_ROOT/fusion-workspace/reports/artifacts/" | sed -n '1,200p'
  echo
  echo "To apply fixes for a module, run: $0 --apply --module <module_path> --confirm"
  exit 0
fi

if [ "$MODE" = "apply" ]; then
  if [ -z "$MODULE_TO_APPLY" ]; then
    echo "--module is required for --apply" >&2
    exit 2
  fi
  echo "Preparing to apply audit fix for module: $MODULE_TO_APPLY"
  # Find latest artifact diff for this module
  ARTROOT="$REPO_ROOT/fusion-workspace/reports/artifacts"
  LATEST_DIR=$(ls -1dt "$ARTROOT"/* 2>/dev/null | head -n1 || true)
  if [ -z "$LATEST_DIR" ]; then
    echo "No artifacts found. Run with --plan first." >&2
    exit 3
  fi
  DIFFFILE=$(ls -1 "$LATEST_DIR" | grep "$(echo "$MODULE_TO_APPLY" | tr '/ ' '__')-diff.txt" || true)
  if [ -z "$DIFFFILE" ]; then
    echo "No diff file found for module in latest artifacts: $LATEST_DIR" >&2
    echo "Available: "
    ls -1 "$LATEST_DIR" | sed -n '1,200p'
    exit 4
  fi
  echo "Found diff: $LATEST_DIR/$DIFFFILE"

  if [ "$CONFIRM" != "yes" ]; then
    echo "Dry-run: would create branch audit/update-lockfile-<module>-<ts>, backup package-lock, copy generated lockfile, git add -f, commit, push and create PR. Use --confirm to perform." >&2
    exit 0
  fi

  # Apply steps
  TS=$(date +%Y%m%d-%H%M%S)
  BRANCH="audit/update-lockfile-$(basename "$MODULE_TO_APPLY")-$TS"
  echo "Creating branch $BRANCH"
  git checkout -b "$BRANCH"

  # Backup existing
  if [ -f "$MODULE_TO_APPLY/package-lock.json" ]; then
    cp "$MODULE_TO_APPLY/package-lock.json" "$MODULE_TO_APPLY/package-lock.json.audit-backup-$TS"
    echo "Backup created: $MODULE_TO_APPLY/package-lock.json.audit-backup-$TS"
  fi

  # Copy generated lockfile from artifact (the validator stores temp lock in tmp, but diff is in artifacts)
  # We will regenerate here to get the actual temp file
  TMPDIR=$(mktemp -d)
  cp "$MODULE_TO_APPLY/package.json" "$TMPDIR/"
  pushd "$TMPDIR" >/dev/null
  npm install --package-lock-only --no-audit --no-fund --ignore-scripts || echo "npm install failed in tempdir"
  popd >/dev/null

  if [ ! -f "$TMPDIR/package-lock.json" ]; then
    echo "Failed to generate temp package-lock.json" >&2
    exit 5
  fi

  cp "$TMPDIR/package-lock.json" "$MODULE_TO_APPLY/package-lock.json"
  git add -f "$MODULE_TO_APPLY/package-lock.json"
  git commit -m "chore(audit): actualizar package-lock.json $MODULE_TO_APPLY (auditoría)"
  git push -u origin "$BRANCH"

  # create PR (requires gh)
  gh pr create --base main --head "$BRANCH" --title "chore(audit): actualizar package-lock.json $MODULE_TO_APPLY" --body "Auditoría: regenerado package-lock para $MODULE_TO_APPLY. Ver artifacts in fusion-workspace/reports/artifacts."
  echo "PR created."
  exit 0
fi

exit 0

