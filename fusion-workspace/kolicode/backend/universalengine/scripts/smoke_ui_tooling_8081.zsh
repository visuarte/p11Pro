#!/usr/bin/env zsh
set -euo pipefail

# Smoke de persistencia UI tooling en PROJECT_CONTEXT.json + archivo design-tokens.css.
#
# Uso:
#   scripts/smoke_ui_tooling_8081.zsh
#
# Variables opcionales:
#   API_PORT=8081
#   REQUEST_TIMEOUT=15
#   DELETE_CREATED=1

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
ROOT_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"

API_PORT="${API_PORT:-8081}"
REQUEST_TIMEOUT="${REQUEST_TIMEOUT:-15}"
DELETE_CREATED="${DELETE_CREATED:-1}"
API_BASE="http://localhost:${API_PORT}"

STATUS_BODY="/tmp/ue_ui_status_${API_PORT}.txt"
CREATE_BODY="/tmp/ue_ui_create_${API_PORT}.json"
FILES_BODY="/tmp/ue_ui_files_${API_PORT}.json"
PAYLOAD_FILE="/tmp/ue_ui_payload_${API_PORT}.json"

cd "$ROOT_DIR"
printf "[ui-tooling] API target: %s\n" "$API_BASE"

ready_code="$(curl -s -m "$REQUEST_TIMEOUT" -o "$STATUS_BODY" -w "%{http_code}" "$API_BASE/status" || true)"
if [[ "$ready_code" != "200" ]]; then
  printf "ERROR: API no disponible en %s/status (HTTP %s)\n" "$API_BASE" "$ready_code" >&2
  exit 1
fi

cat > "$PAYLOAD_FILE" <<'JSON'
{
  "name": "UI Tooling Smoke",
  "nombre": "UI Tooling Smoke",
  "profile": "static",
  "cliente": "QA",
  "tarea": "ui-tooling-persist",
  "descripcion": "Smoke de persistencia UI",
  "dependencias": ["postgres"],
  "timeline": [],
  "uiPreset": "enterprise-dashboard",
  "uiTooling": ["design-tokens", "ui-kit", "a11y-checks"],
  "enableA11yChecks": true,
  "enableVisualRegression": false
}
JSON

create_code="$(curl -s -m "$REQUEST_TIMEOUT" -o "$CREATE_BODY" -w "%{http_code}" \
  -X POST "$API_BASE/api/v1/projects/init-static" \
  -H "Content-Type: application/json" \
  --data @"$PAYLOAD_FILE" || true)"

if [[ "$create_code" != "201" ]]; then
  printf "ERROR: init-static devolvio HTTP %s\n" "$create_code" >&2
  cat "$CREATE_BODY" || true
  exit 1
fi

project_id="$(python3 - <<'PY' "$CREATE_BODY"
import json
import pathlib
import sys
body = pathlib.Path(sys.argv[1]).read_text()
obj = json.loads(body)
pid = obj.get("payload")
if not isinstance(pid, int):
    raise SystemExit(1)
print(pid)
PY
)"

files_code="$(curl -s -m "$REQUEST_TIMEOUT" -o "$FILES_BODY" -w "%{http_code}" "$API_BASE/api/v1/projects/${project_id}/files" || true)"
if [[ "$files_code" != "200" ]]; then
  printf "ERROR: /files devolvio HTTP %s para projectId=%s\n" "$files_code" "$project_id" >&2
  cat "$FILES_BODY" || true
  exit 1
fi

python3 - <<'PY' "$FILES_BODY"
import json
import pathlib
import sys

obj = json.loads(pathlib.Path(sys.argv[1]).read_text())
files = obj.get("payload") or []

ctx = next((f for f in files if f.get("nombreArchivo") == "PROJECT_CONTEXT.json"), None)
if not ctx:
    raise SystemExit("PROJECT_CONTEXT.json no encontrado en /files")

ctx_json = json.loads(ctx.get("contenido") or "{}")
if ctx_json.get("uiPreset") != "enterprise-dashboard":
    raise SystemExit("uiPreset no persistido correctamente")

ui_tooling = ctx_json.get("uiTooling") or []
required = {"design-tokens", "ui-kit", "a11y-checks"}
if not required.issubset(set(ui_tooling)):
    raise SystemExit("uiTooling no contiene los elementos esperados")

if ctx_json.get("enableA11yChecks") is not True:
    raise SystemExit("enableA11yChecks no persistido")

if ctx_json.get("enableVisualRegression") is not False:
    raise SystemExit("enableVisualRegression no persistido")

tokens = next((f for f in files if f.get("nombreArchivo") == "design-tokens.css" and f.get("ruta") == "/ui/styles"), None)
if not tokens:
    raise SystemExit("design-tokens.css no fue generado")

content = tokens.get("contenido") or ""
if "--color-primary" not in content:
    raise SystemExit("design-tokens.css generado sin contenido esperado")

print("[ui-tooling] OK: persistencia + design-tokens validados")
PY

if [[ "$DELETE_CREATED" == "1" ]]; then
  delete_code="$(curl -s -m "$REQUEST_TIMEOUT" -o /tmp/ue_ui_delete_${API_PORT}.json -w "%{http_code}" -X DELETE "$API_BASE/api/v1/projects/${project_id}" || true)"
  if [[ "$delete_code" != "200" ]]; then
    printf "WARN: no se pudo eliminar proyecto temporal %s (HTTP %s)\n" "$project_id" "$delete_code" >&2
  fi
fi

printf "[ui-tooling] Done. projectId=%s\n" "$project_id"

