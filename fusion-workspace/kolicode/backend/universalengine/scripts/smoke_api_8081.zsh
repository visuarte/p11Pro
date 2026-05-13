#!/usr/bin/env zsh
set -euo pipefail

# Smoke check for the local API exposed by docker compose on port 8081.
# Usage:
#   scripts/smoke_api_8081.zsh
# Optional env vars:
#   API_PORT=8081
#   WAIT_ATTEMPTS=40
#   WAIT_SECONDS=2
#   REQUEST_TIMEOUT=10
#   SMOKE_CREATE=1   # creates a demo project via /api/v1/projects/init-static
#   STRICT_JSON=0    # set 1 to fail if /projects or /capabilities body is not valid JSON
#   STRICT_HEADERS=1 # set 0 to only warn when Content-Type is not application/json

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
ROOT_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"
ENV_FILE="$ROOT_DIR/.env"

API_PORT="${API_PORT:-8081}"
WAIT_ATTEMPTS="${WAIT_ATTEMPTS:-40}"
WAIT_SECONDS="${WAIT_SECONDS:-2}"
REQUEST_TIMEOUT="${REQUEST_TIMEOUT:-10}"
STRICT_JSON="${STRICT_JSON:-0}"
STRICT_HEADERS="${STRICT_HEADERS:-1}"
API_BASE="http://localhost:${API_PORT}"

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

STATUS_BODY="/tmp/ue_status_${API_PORT}.txt"
PROJECTS_BODY="/tmp/ue_projects_${API_PORT}.txt"
CAPS_BODY="/tmp/ue_caps_${API_PORT}.txt"
CREATE_BODY="/tmp/ue_create_${API_PORT}.txt"
CAPS_HEADERS="/tmp/ue_caps_headers_${API_PORT}.txt"
INIT_STATIC_HEADERS="/tmp/ue_init_static_headers_${API_PORT}.txt"
INIT_STATIC_BODY="/tmp/ue_init_static_body_${API_PORT}.txt"

validate_json_body() {
  local file_path="$1"
  python3 - <<'PY' "$file_path" >/dev/null 2>&1
import json, pathlib, sys
p = pathlib.Path(sys.argv[1])
if (not p.exists()) or p.stat().st_size == 0:
    raise SystemExit(1)
json.loads(p.read_text())
PY
}

report_json_state() {
  local label="$1"
  local file_path="$2"

  if validate_json_body "$file_path"; then
    printf "  - %s JSON: OK\n" "$label"
    return 0
  fi

  printf "  - %s JSON: INVALID/EMPTY\n" "$label"
  if [[ "$STRICT_JSON" == "1" ]]; then
    printf "ERROR: strict JSON mode enabled and %s is invalid\n" "$label" >&2
    return 1
  fi
  return 0
}

report_json_content_type() {
  local label="$1"
  local header_file="$2"

  if [[ ! -f "$header_file" ]]; then
    printf "  - %s Content-Type: MISSING_HEADERS\n" "$label"
    [[ "$STRICT_HEADERS" == "1" ]] && return 1 || return 0
  fi

  local content_type
  content_type="$(awk 'BEGIN{IGNORECASE=1} /^Content-Type:/ {print $0}' "$header_file" | tr -d '\r' | head -n 1)"
  if [[ -n "$content_type" ]] && [[ "${content_type:l}" == *"application/json"* ]]; then
    printf "  - %s Content-Type: OK (%s)\n" "$label" "$content_type"
    return 0
  fi

  printf "  - %s Content-Type: INVALID (%s)\n" "$label" "${content_type:-none}"
  if [[ "$STRICT_HEADERS" == "1" ]]; then
    printf "ERROR: strict header mode enabled and %s is not application/json\n" "$label" >&2
    return 1
  fi
  return 0
}

printf "[1/6] API target: %s\n" "$API_BASE"
printf "[2/6] docker compose services\n"
cd "$ROOT_DIR"
"${COMPOSE_CMD[@]}" ps | cat

printf "[3/6] waiting for %s/status\n" "$API_BASE"
ready_code="000"
for ((i = 1; i <= WAIT_ATTEMPTS; i++)); do
  ready_code="$(curl -s -m "$REQUEST_TIMEOUT" -o "$STATUS_BODY" -w "%{http_code}" "$API_BASE/status" || true)"
  printf "  - attempt %d/%d -> %s\n" "$i" "$WAIT_ATTEMPTS" "$ready_code"
  if [[ "$ready_code" == "200" ]]; then
    break
  fi
  sleep "$WAIT_SECONDS"
done

if [[ "$ready_code" != "200" ]]; then
  printf "ERROR: API did not become ready on %s/status\n" "$API_BASE" >&2
  exit 1
fi

printf "[4/6] GET /api/v1/projects\n"
projects_code="000"
for ((i = 1; i <= 3; i++)); do
  projects_code="$(curl -s -m "$REQUEST_TIMEOUT" -o "$PROJECTS_BODY" -w "%{http_code}" "$API_BASE/api/v1/projects" || true)"
  [[ "$projects_code" == "200" ]] && break
  sleep 1
done
printf "  - HTTP %s\n" "$projects_code"
if [[ "$projects_code" == "200" ]]; then
  if [[ -f "$PROJECTS_BODY" ]]; then
    cat "$PROJECTS_BODY"
  else
    printf "  - body: (empty)\n"
  fi
  printf "\n"
else
  printf "  - body:\n"
  cat "$PROJECTS_BODY" || true
  printf "\n"
fi
report_json_state "/api/v1/projects" "$PROJECTS_BODY"

printf "[5/6] GET /api/v1/capabilities\n"
caps_code="000"
for ((i = 1; i <= 3; i++)); do
  caps_code="$(curl -s -m "$REQUEST_TIMEOUT" -o "$CAPS_BODY" -w "%{http_code}" "$API_BASE/api/v1/capabilities" || true)"
  # Algunas veces responde 200 pero sin body en caliente; intentamos de nuevo.
  if [[ "$caps_code" == "200" ]] && validate_json_body "$CAPS_BODY"; then
    break
  fi
  sleep 1
done
printf "  - HTTP %s\n" "$caps_code"
if [[ "$caps_code" == "200" ]]; then
  if [[ -f "$CAPS_BODY" ]]; then
    cat "$CAPS_BODY"
  else
    printf "  - body: (empty)\n"
  fi
  printf "\n"
else
  printf "  - body:\n"
  cat "$CAPS_BODY" || true
  printf "\n"
fi
report_json_state "/api/v1/capabilities" "$CAPS_BODY"

printf "[6/6] Content-Type contract checks\n"
curl -s -m "$REQUEST_TIMEOUT" -D "$CAPS_HEADERS" -o /dev/null "$API_BASE/api/v1/capabilities" || true
report_json_content_type "/api/v1/capabilities" "$CAPS_HEADERS"

curl -s -m "$REQUEST_TIMEOUT" \
  -D "$INIT_STATIC_HEADERS" \
  -o "$INIT_STATIC_BODY" \
  -X POST "$API_BASE/api/v1/projects/init-static" \
  -H "Content-Type: application/json" \
  -d '{"nombre":"demo"' || true
report_json_content_type "/api/v1/projects/init-static (400)" "$INIT_STATIC_HEADERS"

if [[ "${SMOKE_CREATE:-0}" == "1" ]]; then
  printf "[extra] POST /api/v1/projects/init-static (demo)\n"
  create_code="$(curl -s -m "$REQUEST_TIMEOUT" -o "$CREATE_BODY" -w "%{http_code}" \
    -X POST "$API_BASE/api/v1/projects/init-static" \
    -H "Content-Type: application/json" \
    -d '{"nombre":"Smoke Demo","cliente":"Smoke","tarea":"Healthcheck","descripcion":"demo","dependencias":[],"timeline":[]}' || true)"
  printf "  - HTTP %s\n" "$create_code"
  cat "$CREATE_BODY" || true
  printf "\n"
fi

printf "Done.\n"

