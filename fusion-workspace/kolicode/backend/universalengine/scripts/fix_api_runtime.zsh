#!/usr/bin/env zsh
set -euo pipefail

# Recreate api-universal and validate runtime health with strict smoke checks.
# Usage:
#   scripts/fix_api_runtime.zsh
# Optional env vars:
#   API_SERVICE=api-universal
#   DB_SERVICE=db-universal
#   API_PORT=8081
#   MAX_CYCLES=2
#   WAIT_ATTEMPTS=40
#   WAIT_SECONDS=2

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
ROOT_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"
ENV_FILE="$ROOT_DIR/.env"

API_SERVICE="${API_SERVICE:-api-universal}"
DB_SERVICE="${DB_SERVICE:-db-universal}"
API_PORT="${API_PORT:-8081}"
MAX_CYCLES="${MAX_CYCLES:-2}"
WAIT_ATTEMPTS="${WAIT_ATTEMPTS:-40}"
WAIT_SECONDS="${WAIT_SECONDS:-2}"
SMOKE_SCRIPT="$SCRIPT_DIR/smoke_api_8081.zsh"

if [[ ! -f "$ENV_FILE" ]]; then
  printf "ERROR: missing %s\n" "$ENV_FILE" >&2
  exit 1
fi

COMPOSE_PROJECT_NAME_VALUE="$(awk -F= '/^COMPOSE_PROJECT_NAME=/{print $2; exit}' "$ENV_FILE" | tr -d '[:space:]')"
if [[ -z "$COMPOSE_PROJECT_NAME_VALUE" ]]; then
  printf "ERROR: COMPOSE_PROJECT_NAME is not set in %s\n" "$ENV_FILE" >&2
  exit 1
fi

COMPOSE_CMD=(docker compose --env-file "$ENV_FILE" -p "$COMPOSE_PROJECT_NAME_VALUE")

if [[ ! -x "$SMOKE_SCRIPT" ]]; then
  printf "ERROR: required script not found or not executable: %s\n" "$SMOKE_SCRIPT" >&2
  exit 1
fi

cd "$ROOT_DIR"
printf "Runtime fixer: service=%s port=%s cycles=%s\n" "$API_SERVICE" "$API_PORT" "$MAX_CYCLES"

for ((cycle = 1; cycle <= MAX_CYCLES; cycle++)); do
  printf "\n[cycle %d/%d] recreate %s\n" "$cycle" "$MAX_CYCLES" "$API_SERVICE"
  "${COMPOSE_CMD[@]}" up -d --force-recreate "$API_SERVICE"

  printf "[cycle %d/%d] wait for status endpoint\n" "$cycle" "$MAX_CYCLES"
  code="000"
  for ((i = 1; i <= WAIT_ATTEMPTS; i++)); do
    code="$(curl -s -o /tmp/fix_status_${API_PORT}.txt -w "%{http_code}" "http://localhost:${API_PORT}/status" || true)"
    printf "  - attempt %d/%d -> %s\n" "$i" "$WAIT_ATTEMPTS" "$code"
    [[ "$code" == "200" ]] && break
    sleep "$WAIT_SECONDS"
  done

  if [[ "$code" != "200" ]]; then
    printf "WARN: status did not become 200 in cycle %d\n" "$cycle"
    "${COMPOSE_CMD[@]}" logs --tail=80 "$API_SERVICE" | cat
    continue
  fi

  printf "[cycle %d/%d] strict smoke validation\n" "$cycle" "$MAX_CYCLES"
  if STRICT_JSON=1 STRICT_HEADERS=1 API_PORT="$API_PORT" "$SMOKE_SCRIPT"; then
    printf "\nRuntime OK on cycle %d.\n" "$cycle"
    exit 0
  fi

  printf "WARN: strict smoke failed on cycle %d\n" "$cycle"
  "${COMPOSE_CMD[@]}" logs --tail=120 "$API_SERVICE" | cat
  "${COMPOSE_CMD[@]}" ps | cat

  if (( cycle < MAX_CYCLES )); then
    printf "Retrying...\n"
  fi
done

printf "\nERROR: runtime fixer exhausted %d cycles without stable strict smoke.\n" "$MAX_CYCLES" >&2
exit 1

