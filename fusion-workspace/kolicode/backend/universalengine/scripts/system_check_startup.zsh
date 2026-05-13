#!/usr/bin/env zsh
set -euo pipefail

# Startup system check wrapper.
# Levels:
#   quick -> strict HTTP/JSON contract smoke
#   full  -> full preflight gate (tests + runtime + optional smokes)

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
ROOT_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"

API_PORT="${API_PORT:-8081}"
SYSTEM_CHECK_LEVEL="${SYSTEM_CHECK_LEVEL:-quick}"
SYSTEM_CHECK_SKIP_HTTP="${SYSTEM_CHECK_SKIP_HTTP:-0}"

SMOKE_SCRIPT="$SCRIPT_DIR/smoke_api_8081.zsh"
PREFLIGHT_SCRIPT="$SCRIPT_DIR/preflight_local.zsh"

cd "$ROOT_DIR"

printf "[startup-check] level=%s api=%s\n" "$SYSTEM_CHECK_LEVEL" "$API_PORT"

if [[ "$SYSTEM_CHECK_LEVEL" == "full" ]]; then
  # Full gate for local release readiness.
  RUN_DOMAIN_SPEC_SMOKE="${RUN_DOMAIN_SPEC_SMOKE:-1}" \
  RUN_UI_TOOLING_SMOKE="${RUN_UI_TOOLING_SMOKE:-1}" \
  RUN_SYNC_SMOKE="${RUN_SYNC_SMOKE:-1}" \
  RUN_ICONS_SMOKE="${RUN_ICONS_SMOKE:-1}" \
  API_PORT="$API_PORT" \
  "$PREFLIGHT_SCRIPT"
  exit 0
fi

if [[ "$SYSTEM_CHECK_SKIP_HTTP" == "1" ]]; then
  printf "[startup-check] SYSTEM_CHECK_SKIP_HTTP=1 -> skipped quick HTTP checks\n"
  exit 0
fi

# Quick check used on regular stack startup.
API_PORT="$API_PORT" STRICT_JSON=1 STRICT_HEADERS=1 "$SMOKE_SCRIPT"
printf "[startup-check] quick check OK\n"

