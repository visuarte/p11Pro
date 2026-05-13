#!/usr/bin/env zsh
set -euo pipefail

# Unified local preflight before deploy.
# Phases:
#   1) key tests
#   2) recreate API container
#   3) strict smoke check
#
# Usage:
#   scripts/preflight_local.zsh
#
# Optional env vars:
#   API_PORT=8081
#   WAIT_ATTEMPTS=40
#   WAIT_SECONDS=2
#   MAX_CYCLES=2
#   REQUEST_TIMEOUT=10
#   SKIP_TESTS=0
#   RUN_DOMAIN_SPEC_SMOKE=0
#   RUN_UI_TOOLING_SMOKE=0
#   RUN_SYNC_SMOKE=0          (sync-from-disk dryRun gate)
#   RUN_ICONS_SMOKE=0         (icons assets + catalog + propagation gate)
#
# Exit codes:
#   10 -> key tests failed
#   20 -> API recreate/runtime stabilization failed
#   30 -> strict smoke failed
#   40 -> domainSpec persistence smoke failed
#   50 -> ui tooling persistence smoke failed
#   60 -> sync-from-disk smoke failed
#   70 -> icons smoke failed

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
ROOT_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"

API_PORT="${API_PORT:-8081}"
WAIT_ATTEMPTS="${WAIT_ATTEMPTS:-40}"
WAIT_SECONDS="${WAIT_SECONDS:-2}"
MAX_CYCLES="${MAX_CYCLES:-2}"
REQUEST_TIMEOUT="${REQUEST_TIMEOUT:-10}"
SKIP_TESTS="${SKIP_TESTS:-0}"
RUN_DOMAIN_SPEC_SMOKE="${RUN_DOMAIN_SPEC_SMOKE:-0}"
RUN_UI_TOOLING_SMOKE="${RUN_UI_TOOLING_SMOKE:-0}"
RUN_SYNC_SMOKE="${RUN_SYNC_SMOKE:-0}"
RUN_ICONS_SMOKE="${RUN_ICONS_SMOKE:-0}"

FIX_SCRIPT="$SCRIPT_DIR/fix_api_runtime.zsh"
SMOKE_SCRIPT="$SCRIPT_DIR/smoke_api_8081.zsh"
DOMAIN_SPEC_SMOKE_SCRIPT="$SCRIPT_DIR/smoke_domain_spec_8081.zsh"
UI_TOOLING_SMOKE_SCRIPT="$SCRIPT_DIR/smoke_ui_tooling_8081.zsh"
SYNC_SMOKE_SCRIPT="$SCRIPT_DIR/smoke_sync_from_disk_8081.zsh"
ICONS_SMOKE_SCRIPT="$SCRIPT_DIR/smoke_icons_8081.zsh"

if [[ ! -x "$FIX_SCRIPT" ]]; then
  printf "ERROR: missing executable %s\n" "$FIX_SCRIPT" >&2
  exit 20
fi
if [[ ! -x "$SMOKE_SCRIPT" ]]; then
  printf "ERROR: missing executable %s\n" "$SMOKE_SCRIPT" >&2
  exit 30
fi
if [[ "$RUN_DOMAIN_SPEC_SMOKE" == "1" ]] && [[ ! -x "$DOMAIN_SPEC_SMOKE_SCRIPT" ]]; then
  printf "ERROR: missing executable %s\n" "$DOMAIN_SPEC_SMOKE_SCRIPT" >&2
  exit 40
fi
if [[ "$RUN_UI_TOOLING_SMOKE" == "1" ]] && [[ ! -x "$UI_TOOLING_SMOKE_SCRIPT" ]]; then
  printf "ERROR: missing executable %s\n" "$UI_TOOLING_SMOKE_SCRIPT" >&2
  exit 50
fi
if [[ "$RUN_SYNC_SMOKE" == "1" ]] && [[ ! -x "$SYNC_SMOKE_SCRIPT" ]]; then
  printf "ERROR: missing executable %s\n" "$SYNC_SMOKE_SCRIPT" >&2
  exit 60
fi
if [[ "$RUN_ICONS_SMOKE" == "1" ]] && [[ ! -x "$ICONS_SMOKE_SCRIPT" ]]; then
  printf "ERROR: missing executable %s\n" "$ICONS_SMOKE_SCRIPT" >&2
  exit 70
fi

cd "$ROOT_DIR"
printf "Preflight local (API %s)\n" "$API_PORT"

if [[ "$SKIP_TESTS" != "1" ]]; then
  printf "\n[1/7] Running key tests...\n"
  if ! ./gradlew test \
    --tests "com.universal.api.AiPromptPolicyTest" \
    --tests "com.universal.api.CapabilitiesApiTest" \
    --tests "com.universal.api.CapabilitiesSerializationTest" \
    --tests "com.universal.api.CreativeCodingTemplateTest" \
    --tests "com.universal.api.UiToolingPersistenceTest" \
    --tests "api.*" \
    --tests "com.universal.api.ProjectTest" \
    --no-daemon; then
    printf "ERROR: key tests failed\n" >&2
    exit 10
  fi
else
  printf "\n[1/7] SKIP_TESTS=1 -> skipping key tests\n"
fi

printf "\n[2/7] Recreate + runtime stabilization...\n"
if ! API_PORT="$API_PORT" WAIT_ATTEMPTS="$WAIT_ATTEMPTS" WAIT_SECONDS="$WAIT_SECONDS" MAX_CYCLES="$MAX_CYCLES" "$FIX_SCRIPT"; then
  printf "ERROR: API runtime stabilization failed\n" >&2
  exit 20
fi

printf "\n[3/7] Strict smoke...\n"
if ! API_PORT="$API_PORT" REQUEST_TIMEOUT="$REQUEST_TIMEOUT" STRICT_JSON=1 STRICT_HEADERS=1 "$SMOKE_SCRIPT"; then
  printf "ERROR: strict smoke failed\n" >&2
  exit 30
fi

if [[ "$RUN_DOMAIN_SPEC_SMOKE" == "1" ]]; then
  printf "\n[4/7] DomainSpec persistence smoke...\n"
  if ! API_PORT="$API_PORT" REQUEST_TIMEOUT="$REQUEST_TIMEOUT" DELETE_CREATED=1 "$DOMAIN_SPEC_SMOKE_SCRIPT"; then
    printf "ERROR: domainSpec persistence smoke failed\n" >&2
    exit 40
  fi
else
  printf "\n[4/7] RUN_DOMAIN_SPEC_SMOKE=0 -> skipping domainSpec persistence smoke\n"
fi

if [[ "$RUN_UI_TOOLING_SMOKE" == "1" ]]; then
  printf "\n[5/7] UI tooling persistence smoke...\n"
  if ! API_PORT="$API_PORT" REQUEST_TIMEOUT="$REQUEST_TIMEOUT" DELETE_CREATED=1 "$UI_TOOLING_SMOKE_SCRIPT"; then
    printf "ERROR: UI tooling persistence smoke failed\n" >&2
    exit 50
  fi
else
  printf "\n[5/7] RUN_UI_TOOLING_SMOKE=0 -> skipping UI tooling persistence smoke\n"
fi

if [[ "$RUN_SYNC_SMOKE" == "1" ]]; then
  printf "\n[6/7] Sync-from-disk smoke (dryRun)...\n"
  if ! API_PORT="$API_PORT" REQUEST_TIMEOUT="$REQUEST_TIMEOUT" "$SYNC_SMOKE_SCRIPT"; then
    printf "ERROR: sync-from-disk smoke failed\n" >&2
    exit 60
  fi
else
  printf "\n[6/7] RUN_SYNC_SMOKE=0 -> skipping sync-from-disk smoke\n"
fi

if [[ "$RUN_ICONS_SMOKE" == "1" ]]; then
  printf "\n[7/7] Icons smoke...\n"
  if ! API_PORT="$API_PORT" REQUEST_TIMEOUT="$REQUEST_TIMEOUT" "$ICONS_SMOKE_SCRIPT"; then
    printf "ERROR: icons smoke failed\n" >&2
    exit 70
  fi
else
  printf "\n[7/7] RUN_ICONS_SMOKE=0 -> skipping icons smoke\n"
fi

printf "\nPreflight OK. Ready for local deploy.\n"

