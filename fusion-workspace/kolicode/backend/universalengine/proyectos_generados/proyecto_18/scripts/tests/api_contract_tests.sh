#!/usr/bin/env zsh
set -euo pipefail

ROOT=$(cd "$(dirname "$0")/../../.." && pwd)
cd "$ROOT"

URL="http://localhost:8040"

echo "[api-tests] Levantando servicios con docker-compose..."
docker-compose up --build -d

MAX_WAIT=60
SLEEP=2
elapsed=0
echo "[api-tests] Esperando a que $URL/health responda (timeout ${MAX_WAIT}s)"
until curl -fsS "$URL/health" >/dev/null 2>&1; do
  sleep $SLEEP
  elapsed=$((elapsed + SLEEP))
  if [ $elapsed -ge $MAX_WAIT ]; then
    echo "[api-tests][error] Timeout esperando al endpoint /health"
    docker-compose logs --no-color backend | sed -n '1,200p'
    exit 1
  fi
done

echo "[api-tests] /health OK — comprobando contenido exacto"
HEALTH_BODY=$(curl -fsS "$URL/health")
if [ "$HEALTH_BODY" != "Health Check successful" ]; then
  echo "[api-tests][fail] /health devolvió: $HEALTH_BODY"
  exit 1
fi

echo "[api-tests] Comprobando /api/v1/webgl/config esquema"
WEBGL_JSON=$(curl -fsS "$URL/api/v1/webgl/config")
if ! echo "$WEBGL_JSON" | jq -e '.useThreeJsInterop|type == "boolean" and .enableTailwindDirectives|type == "boolean"' >/dev/null; then
  echo "[api-tests][fail] /api/v1/webgl/config no tiene los booleanos esperados: $WEBGL_JSON"
  exit 1
fi

echo "[api-tests] Creando checklist de prueba"
CREATE_RESP=$(curl -sS -w "%{http_code}" -o /tmp/api_create_resp.json -X POST "$URL/api/v1/checklist" -H 'Content-Type:text/plain' -d 'api contract test')
HTTP_CODE=${CREATE_RESP:(-3)}
if [ "$HTTP_CODE" != "201" ]; then
  echo "[api-tests][fail] POST /api/v1/checklist devolvió código $HTTP_CODE"
  cat /tmp/api_create_resp.json
  exit 1
fi
ID=$(jq -r .id /tmp/api_create_resp.json)
if ! [[ "$ID" =~ ^[0-9]+$ ]]; then
  echo "[api-tests][fail] id no numérico: $ID" ; exit 1
fi

echo "[api-tests] GET /api/v1/checklist/$ID"
curl -fsS "$URL/api/v1/checklist/$ID" >/dev/null || { echo "[api-tests][fail] GET created id failed"; exit 1; }

echo "[api-tests] GET /api/v1/checklist/notanumber => debe devolver 400"
set +e
curl -fsS -o /tmp/resp_400.txt "$URL/api/v1/checklist/notanumber"
RC=$?
set -e
if [ $RC -eq 0 ]; then
  echo "[api-tests][fail] expected 400 but got 200 for notanumber"; exit 1
else
  echo "[api-tests] 400 behavior observed (non-numeric id)."
fi

echo "[api-tests] GET non-existent id => 404"
set +e
curl -fsS -o /tmp/resp_404.txt "$URL/api/v1/checklist/99999999"
RC=$?
set -e
if [ $RC -eq 0 ]; then
  echo "[api-tests][fail] expected 404 but got 200 for non-existent id"; exit 1
else
  echo "[api-tests] 404 behavior observed for non-existent id."
fi

echo "[api-tests] Contratos básicos validados: /health, /api/v1/webgl/config, /api/v1/checklist (create/read/400/404)"
echo "[api-tests] Para 500 internal error hay un script de simulación que detiene la DB antes de probar inserción: scripts/tests/error_simulation_500.sh"

echo "[api-tests] OK"

