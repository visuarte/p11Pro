#!/usr/bin/env zsh
set -euo pipefail

# Smoke del endpoint sync-from-disk (dryRun, modo seguro).
# Uso:
#   scripts/smoke_sync_from_disk_8081.zsh
# Variables opcionales:
#   API_PORT=8081
#   REQUEST_TIMEOUT=12

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
ROOT_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"

API_PORT="${API_PORT:-8081}"
REQUEST_TIMEOUT="${REQUEST_TIMEOUT:-12}"
API_BASE="http://localhost:${API_PORT}"

STATUS_BODY="/tmp/ue_sync_status_${API_PORT}.txt"
PROJECTS_BODY="/tmp/ue_sync_projects_${API_PORT}.json"
SYNC_BODY="/tmp/ue_sync_body_${API_PORT}.json"

cd "$ROOT_DIR"
printf "[sync-smoke] API target: %s\n" "$API_BASE"

status_code="$(curl -s -m "$REQUEST_TIMEOUT" -o "$STATUS_BODY" -w "%{http_code}" "$API_BASE/status" || true)"
if [[ "$status_code" != "200" ]]; then
  printf "ERROR: API no disponible en /status (HTTP %s)\n" "$status_code" >&2
  exit 1
fi

projects_code="$(curl -s -m "$REQUEST_TIMEOUT" -o "$PROJECTS_BODY" -w "%{http_code}" "$API_BASE/api/v1/projects" || true)"
if [[ "$projects_code" != "200" ]]; then
  printf "ERROR: no se pudo listar proyectos (HTTP %s)\n" "$projects_code" >&2
  cat "$PROJECTS_BODY" || true
  exit 1
fi

project_id="$(python3 - <<'PY' "$PROJECTS_BODY"
import json
import pathlib
import sys
obj = json.loads(pathlib.Path(sys.argv[1]).read_text())
payload = obj.get("payload") or []
if not payload:
    sys.exit(0)  # señal de lista vacía -> creamos proyecto temp
first = payload[0]
pid = first.get("id")
if not isinstance(pid, int):
    sys.exit(0)
print(pid)
PY
)" || true

CREATED_TEMP_PROJECT=0
if [[ -z "$project_id" ]]; then
  printf "[sync-smoke] No hay proyectos en DB; creando proyecto temporal para el smoke...\n"
  TEMP_CREATE_BODY="/tmp/ue_sync_create_${API_PORT}.json"
  temp_code="$(curl -s -m "$REQUEST_TIMEOUT" -o "$TEMP_CREATE_BODY" -w "%{http_code}" \
    -X POST "$API_BASE/api/v1/projects/init-static" \
    -H "Content-Type: application/json" \
    -d '{"nombre":"sync-smoke-temp","cliente":"CI","tarea":"smoke","descripcion":"Proyecto temporal para smoke de sync","dependencias":[],"timeline":[]}' || true)"
  if [[ "$temp_code" != "200" && "$temp_code" != "201" ]]; then
    printf "ERROR: no se pudo crear proyecto temporal (HTTP %s)\n" "$temp_code" >&2
    cat "$TEMP_CREATE_BODY" || true
    exit 1
  fi
  project_id="$(python3 - <<'PY' "$TEMP_CREATE_BODY"
import json, pathlib, sys
obj = json.loads(pathlib.Path(sys.argv[1]).read_text())
payload = obj.get("payload")
if isinstance(payload, int):
    print(payload)
    raise SystemExit(0)
if isinstance(payload, dict) and isinstance(payload.get("id"), int):
    print(payload["id"])
    raise SystemExit(0)
raise SystemExit("no se pudo obtener id del proyecto creado")
PY
)"
  CREATED_TEMP_PROJECT=1
  printf "[sync-smoke] Proyecto temporal creado con id=%s\n" "$project_id"
fi

sync_code="$(curl -s -m "$REQUEST_TIMEOUT" -o "$SYNC_BODY" -w "%{http_code}" \
  -X POST "$API_BASE/api/v1/projects/${project_id}/sync-from-disk" \
  -H "Content-Type: application/json" \
  -d '{"dryRun":true,"deleteMissing":false}' || true)"

if [[ "$sync_code" != "200" ]]; then
  printf "ERROR: sync-from-disk devolvio HTTP %s para projectId=%s\n" "$sync_code" "$project_id" >&2
  cat "$SYNC_BODY" || true
  exit 1
fi

python3 - <<'PY' "$SYNC_BODY"
import json
import pathlib
import sys
obj = json.loads(pathlib.Path(sys.argv[1]).read_text())
if obj.get("status") != "SUCCESS":
    raise SystemExit("status != SUCCESS")
payload = obj.get("payload") or {}
required = [
    "projectId",
    "dryRun",
    "deleteMissing",
    "diskFiles",
    "dbFilesBefore",
    "created",
    "updated",
    "deleted",
    "unchanged",
    "skippedBinaryOrUnreadable",
]
for key in required:
    if key not in payload:
        raise SystemExit(f"faltante: {key}")
if payload.get("dryRun") is not True:
    raise SystemExit("dryRun esperado true")
if payload.get("deleteMissing") is not False:
    raise SystemExit("deleteMissing esperado false")
print("[sync-smoke] OK: contrato sync-from-disk valido")
PY

printf "[sync-smoke] Done. projectId=%s\n" "$project_id"

# Limpieza: borrar proyecto temporal creado para el smoke
if [[ "$CREATED_TEMP_PROJECT" == "1" ]]; then
  printf "[sync-smoke] Eliminando proyecto temporal id=%s...\n" "$project_id"
  del_code="$(curl -s -m "$REQUEST_TIMEOUT" -o /dev/null -w "%{http_code}" \
    -X DELETE "$API_BASE/api/v1/projects/${project_id}" || true)"
  if [[ "$del_code" == "200" ]]; then
    printf "[sync-smoke] Proyecto temporal eliminado OK\n"
  else
    printf "[sync-smoke] WARN: no se pudo eliminar proyecto temporal (HTTP %s) — continúa\n" "$del_code"
  fi
fi

