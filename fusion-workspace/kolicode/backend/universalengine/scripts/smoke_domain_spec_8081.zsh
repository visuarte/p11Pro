#!/usr/bin/env zsh
set -euo pipefail

# Smoke de persistencia DomainSpec en PROJECT_CONTEXT.json.
# Falla si el domainSpec enviado no queda guardado con contenido.
#
# Uso:
#   scripts/smoke_domain_spec_8081.zsh
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

STATUS_BODY="/tmp/ue_domain_status_${API_PORT}.txt"
CREATE_BODY="/tmp/ue_domain_create_${API_PORT}.json"
FILES_BODY="/tmp/ue_domain_files_${API_PORT}.json"
PAYLOAD_FILE="/tmp/ue_domain_payload_${API_PORT}.json"

cd "$ROOT_DIR"
printf "[domain-spec] API target: %s\n" "$API_BASE"

ready_code="$(curl -s -m "$REQUEST_TIMEOUT" -o "$STATUS_BODY" -w "%{http_code}" "$API_BASE/status" || true)"
if [[ "$ready_code" != "200" ]]; then
  printf "ERROR: API no disponible en %s/status (HTTP %s)\n" "$API_BASE" "$ready_code" >&2
  exit 1
fi

cat > "$PAYLOAD_FILE" <<'JSON'
{
  "name": "DomainSpec Smoke",
  "nombre": "DomainSpec Smoke",
  "profile": "static",
  "cliente": "QA",
  "tarea": "domain-spec-persist",
  "descripcion": "Smoke para validar persistencia domainSpec",
  "dependencias": ["postgres", "exposed", "jwt"],
  "timeline": [
    {
      "title": "Validacion domain-spec",
      "type": "qa",
      "deadline": "2026-06-23T10:00",
      "status": "planned",
      "notes": "Persistencia obligatoria"
    }
  ],
  "domainSpec": {
    "functionalRequirements": [
      "Registro e inicio de sesion con JWT",
      "Creacion y edicion de posts"
    ],
    "useCases": [
      "Usuario crea perfil y publica contenido",
      "Moderador revisa reportes"
    ],
    "dataModel": [
      "User(id,email,role)",
      "Post(id,authorId,content,status)"
    ],
    "requiredApis": [
      "POST /api/v1/auth/login",
      "GET|POST /api/v1/posts"
    ]
  }
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
ds = ctx_json.get("domainSpec")
if not isinstance(ds, dict):
    raise SystemExit("domainSpec ausente en PROJECT_CONTEXT.json")

required = ["functionalRequirements", "useCases", "dataModel", "requiredApis"]
for key in required:
    value = ds.get(key)
    if not isinstance(value, list) or len(value) == 0:
        raise SystemExit(f"domainSpec.{key} ausente o vacio")

print("[domain-spec] OK: persistencia validada")
PY

if [[ "$DELETE_CREATED" == "1" ]]; then
  delete_code="$(curl -s -m "$REQUEST_TIMEOUT" -o /tmp/ue_domain_delete_${API_PORT}.json -w "%{http_code}" -X DELETE "$API_BASE/api/v1/projects/${project_id}" || true)"
  if [[ "$delete_code" != "200" ]]; then
    printf "WARN: no se pudo eliminar proyecto temporal %s (HTTP %s)\n" "$project_id" "$delete_code" >&2
  fi
fi

printf "[domain-spec] Done. projectId=%s\n" "$project_id"

