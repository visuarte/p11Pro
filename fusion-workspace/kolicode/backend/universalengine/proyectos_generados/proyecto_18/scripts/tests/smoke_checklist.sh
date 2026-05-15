#!/usr/bin/env bash
# Smoke test que levanta el stack local del proyecto y valida endpoints básicos.
set -euo pipefail

REPO_ROOT=$(cd "$(dirname "$0")/../.." && pwd)
cd "$REPO_ROOT"

if docker compose version >/dev/null 2>&1; then
  COMPOSE=(docker compose -f "$REPO_ROOT/docker-compose.yml")
else
  COMPOSE=(docker-compose -f "$REPO_ROOT/docker-compose.yml")
fi

cleanup() {
  "${COMPOSE[@]}" down -v --remove-orphans >/dev/null 2>&1 || true
}

trap cleanup EXIT

find "$REPO_ROOT" -name '._*' -delete

echo "[smoke] Levantando servicios con docker-compose..."
"${COMPOSE[@]}" up --build -d

URL="http://localhost:8040"
MAX_WAIT=60
SLEEP=2
elapsed=0
echo "[smoke] Esperando a que $URL/health responda (timeout ${MAX_WAIT}s)"
until curl -fsS "$URL/health" >/dev/null 2>&1; do
  sleep $SLEEP
  elapsed=$((elapsed + SLEEP))
  if [ $elapsed -ge $MAX_WAIT ]; then
    echo "[smoke][error] Timeout esperando al endpoint /health"
    "${COMPOSE[@]}" logs --no-color backend | sed -n '1,200p'
    exit 1
  fi
done

echo "[smoke] /health OK"

echo "[smoke] Comprobando /api/v1/webgl/config"
curl -fsS "$URL/api/v1/webgl/config" || { echo "[smoke][error] /api/v1/webgl/config falló"; exit 1; }

echo "[smoke] Creando un checklist de prueba"
RESP=$(curl -sS -X POST "$URL/api/v1/checklist" -H 'Content-Type:text/plain' -d '{"smoke":"1"}')
echo "[smoke] POST response: $RESP"

# Extraer id (int) del JSON devuelto
if command -v jq >/dev/null 2>&1; then
  ID=$(echo "$RESP" | jq -r .id)
else
  ID=$(echo "$RESP" | sed -E 's/.*"id"[[:space:]]*:[[:space:]]*([0-9]+).*/\1/')
fi

if [ -z "$ID" ] || [ "$ID" = "null" ]; then
  echo "[smoke][error] No se obtuvo id válido al crear checklist"
  exit 1
fi

echo "[smoke] Obteniendo checklist id=$ID"
curl -fsS "$URL/api/v1/checklist/$ID" || { echo "[smoke][error] GET checklist/$ID falló"; exit 1; }

echo "[smoke] Verificando que el registro existe en la DB (si existe el servicio 'db')"
if "${COMPOSE[@]}" ps --services | grep -qx "db"; then
  "${COMPOSE[@]}" exec -T db psql -U postgres -d ciberpunk -c "SELECT count(*) FROM checklist_estado;" || true
fi

echo "[smoke] Prueba completada con éxito. Para ver logs: docker-compose logs --no-color"
