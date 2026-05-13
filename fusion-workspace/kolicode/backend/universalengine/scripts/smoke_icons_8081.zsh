#!/usr/bin/env zsh
set -euo pipefail

# Smoke de iconos del Motor Universal IA.
# Valida:
#  - GET /assets/icons.svg
#  - GET /assets/icons/catalog
#  - POST /api/v1/projects/icons/propagate
# Uso:
#   scripts/smoke_icons_8081.zsh
# Variables opcionales:
#   API_PORT=8081
#   REQUEST_TIMEOUT=12

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
ROOT_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"

API_PORT="${API_PORT:-8081}"
REQUEST_TIMEOUT="${REQUEST_TIMEOUT:-12}"
API_BASE="http://localhost:${API_PORT}"

STATUS_BODY="/tmp/ue_icons_status_${API_PORT}.txt"
SPRITE_BODY="/tmp/ue_icons_sprite_${API_PORT}.svg"
CATALOG_BODY="/tmp/ue_icons_catalog_${API_PORT}.json"
PROPAGATE_BODY="/tmp/ue_icons_propagate_${API_PORT}.json"

cd "$ROOT_DIR"
printf "[icons-smoke] API target: %s\n" "$API_BASE"

status_code="$(curl -s -m "$REQUEST_TIMEOUT" -o "$STATUS_BODY" -w "%{http_code}" "$API_BASE/status" || true)"
if [[ "$status_code" != "200" ]]; then
  printf "ERROR: API no disponible en /status (HTTP %s)\n" "$status_code" >&2
  exit 1
fi

sprite_code="$(curl -s -m "$REQUEST_TIMEOUT" -o "$SPRITE_BODY" -w "%{http_code}" "$API_BASE/assets/icons.svg" || true)"
if [[ "$sprite_code" != "200" ]]; then
  printf "ERROR: /assets/icons.svg devolvio HTTP %s\n" "$sprite_code" >&2
  cat "$SPRITE_BODY" || true
  exit 1
fi

python3 - <<'PY' "$SPRITE_BODY"
import pathlib
import sys
text = pathlib.Path(sys.argv[1]).read_text()
if "<symbol id=\"icon-alert\"" not in text:
    raise SystemExit("sprite invalido: falta icon-alert")
if text.count("<symbol id=") < 10:
    raise SystemExit("sprite invalido: cantidad de symbols demasiado baja")
print("[icons-smoke] OK: sprite contiene simbolos esperados")
PY

catalog_code="$(curl -s -m "$REQUEST_TIMEOUT" -o "$CATALOG_BODY" -w "%{http_code}" "$API_BASE/assets/icons/catalog" || true)"
if [[ "$catalog_code" != "200" ]]; then
  printf "ERROR: /assets/icons/catalog devolvio HTTP %s\n" "$catalog_code" >&2
  cat "$CATALOG_BODY" || true
  exit 1
fi

python3 - <<'PY' "$CATALOG_BODY"
import json
import pathlib
import sys
obj = json.loads(pathlib.Path(sys.argv[1]).read_text())
if obj.get("status") != "SUCCESS":
    raise SystemExit("catalog status != SUCCESS")
payload = obj.get("payload") or {}
for key in ["version", "count", "icons"]:
    if key not in payload:
        raise SystemExit(f"catalog faltante: {key}")
icons = payload.get("icons") or []
if not isinstance(icons, list):
    raise SystemExit("catalog icons no es lista")
if payload.get("count") != len(icons):
    raise SystemExit("catalog count no coincide con len(icons)")
if "home" not in icons:
    raise SystemExit("catalog no incluye icono home")
print("[icons-smoke] OK: catalog consistente")
PY

propagate_code="$(curl -s -m "$REQUEST_TIMEOUT" -o "$PROPAGATE_BODY" -w "%{http_code}" \
  -X POST "$API_BASE/api/v1/projects/icons/propagate" \
  -H "Content-Type: application/json" || true)"

if [[ "$propagate_code" != "200" ]]; then
  printf "ERROR: /api/v1/projects/icons/propagate devolvio HTTP %s\n" "$propagate_code" >&2
  cat "$PROPAGATE_BODY" || true
  exit 1
fi

python3 - <<'PY' "$PROPAGATE_BODY"
import json
import pathlib
import sys
obj = json.loads(pathlib.Path(sys.argv[1]).read_text())
if obj.get("status") != "SUCCESS":
    raise SystemExit("propagate status != SUCCESS")
payload = obj.get("payload") or {}
required = ["totalProjects", "filesCreated", "filesUpdated", "iconVersion"]
for key in required:
    if key not in payload:
        raise SystemExit(f"propagate faltante: {key}")
print("[icons-smoke] OK: propagate response valida")
PY

printf "[icons-smoke] Done.\n"

