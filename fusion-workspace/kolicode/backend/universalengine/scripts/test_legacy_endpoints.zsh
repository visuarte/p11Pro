#!/usr/bin/env zsh
set -euo pipefail

script_dir="$(cd "$(dirname "$0")" && pwd)"
root_dir="$(cd "$script_dir/.." && pwd)"
api_base="http://localhost:8081"
env_file="$root_dir/.env"

if [[ ! -f "$env_file" ]]; then
  echo "Error: no existe $env_file" >&2
  exit 1
fi

compose_project_name="$(awk -F= '/^COMPOSE_PROJECT_NAME=/{print $2; exit}' "$env_file" | tr -d '[:space:]')"
if [[ -z "$compose_project_name" ]]; then
  echo "Error: COMPOSE_PROJECT_NAME no definido en $env_file" >&2
  exit 1
fi

compose_cmd=(docker compose --env-file "$env_file" -p "$compose_project_name")

wait_api() {
  local label="$1"
  for i in {1..50}; do
    code=$(curl -s -o /tmp/legacy_status.txt -w "%{http_code}" "$api_base/status" || true)
    if [[ "$code" == "200" ]]; then
      echo "[$label] API lista en intento $i"
      return 0
    fi
    sleep 2
  done
  echo "[$label] API no respondió /status" >&2
  return 1
}

assert_http_code() {
  local code="$1"
  local expected="$2"
  local context="$3"
  if [[ "$code" != "$expected" ]]; then
    echo "Fallo $context: esperado HTTP $expected y llegó $code" >&2
    exit 1
  fi
}

cd "$root_dir"

echo "[1/6] Levantando API en modo warn para pruebas de uso legacy y summary..."
LEGACY_PROJECT_MODE=warn "${compose_cmd[@]}" up -d --force-recreate api-universal >/dev/null
wait_api "warn"

echo "[2/6] POST legacy con tenant para generar evidencia..."
legacy_response_headers=$(mktemp)
legacy_response_body=$(mktemp)
curl -s -D "$legacy_response_headers" -o "$legacy_response_body" \
  -X POST "$api_base/api/v1/projects" \
  -H "X-Tenant-Id: tenant-test-suite" \
  -H "Content-Type: application/json" \
  -d '{"nombre":"Legacy Test Suite","director":"QA","fecha_inicio":"2026-05-05","equipo":["Backend"]}' >/dev/null
legacy_code=$(awk 'NR==1 {print $2}' "$legacy_response_headers")
assert_http_code "$legacy_code" "200" "POST /api/v1/projects en modo warn"

echo "[3/6] Verificando legacy-usage/summary por tenant..."
summary_json=$(curl -s "$api_base/api/v1/projects/legacy-usage/summary?tenantId=tenant-test-suite")
python3 - <<'PY' "$summary_json"
import json, sys
payload = json.loads(sys.argv[1])
assert payload.get("status") == "SUCCESS", payload
data = payload.get("payload") or {}
assert data.get("totalHits", 0) >= 1, data
rows = data.get("byTenantEndpoint") or []
assert any(r.get("tenantId") == "tenant-test-suite" and r.get("endpoint") == "/api/v1/projects" for r in rows), rows
print("legacy-usage/summary OK")
PY

echo "[4/6] Verificando milestones/dashboard..."
dashboard_json=$(curl -s "$api_base/api/v1/projects/milestones/dashboard?status=planned")
python3 - <<'PY' "$dashboard_json"
import json, sys
payload = json.loads(sys.argv[1])
assert payload.get("status") == "SUCCESS", payload
data = payload.get("payload") or {}
assert "totalProjects" in data, data
assert "statusTotals" in data, data
assert "projectsMatchingFilter" in data, data
assert data.get("activeStatusFilter") == "planned", data
print("milestones/dashboard OK")
PY

echo "[5/6] Levantando API en modo gone y validando stub 410..."
LEGACY_PROJECT_MODE=gone "${compose_cmd[@]}" up -d --force-recreate api-universal >/dev/null
wait_api "gone"

legacy_gone_headers=$(mktemp)
legacy_gone_body=$(mktemp)
curl -s -D "$legacy_gone_headers" -o "$legacy_gone_body" \
  -X POST "$api_base/api/v1/projects" \
  -H "X-Tenant-Id: tenant-test-suite" \
  -H "Content-Type: application/json" \
  -d '{"nombre":"Legacy Gone Test","director":"QA","fecha_inicio":"2026-05-05","equipo":["Backend"]}' >/dev/null
legacy_gone_code=$(awk 'NR==1 {print $2}' "$legacy_gone_headers")
assert_http_code "$legacy_gone_code" "410" "POST /api/v1/projects en modo gone"

echo "[6/6] Restaurando modo warn..."
LEGACY_PROJECT_MODE=warn "${compose_cmd[@]}" up -d --force-recreate api-universal >/dev/null
wait_api "restore"

echo "Pruebas legacy automáticas completadas correctamente."

