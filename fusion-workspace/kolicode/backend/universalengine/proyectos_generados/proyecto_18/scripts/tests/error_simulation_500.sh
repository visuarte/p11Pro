#!/usr/bin/env zsh
set -euo pipefail

ROOT=$(cd "$(dirname "$0")/../../.." && pwd)
cd "$ROOT"

echo "[error-sim] Simulación de 500: deteniendo servicio de DB y ejecutando POST que requiere persistencia"
echo "ADVERTENCIA: Esto detendrá el contenedor 'db' definido en docker-compose. Úsalo solo en entornos de desarrollo."

docker-compose stop db || true
sleep 2

URL="http://localhost:8040"
echo "Ejecutando POST /api/v1/checklist — esperamos un 500 (error interno) si la inserción falla)"
set +e
HTTP_CODE=$(curl -s -o /tmp/err_sim_resp.txt -w "%{http_code}" -X POST "$URL/api/v1/checklist" -H 'Content-Type:text/plain' -d 'simulate 500')
RC=$?
set -e
echo "Código HTTP recibido: $HTTP_CODE (curl RC: $RC)"
echo "Cuerpo de respuesta:"
cat /tmp/err_sim_resp.txt || true

if [ "$HTTP_CODE" = "500" ]; then
  echo "[error-sim] Se obtuvo 500 como esperado"
else
  echo "[error-sim][warning] No se obtuvo 500; la aplicación puede estar manejando la excepción internamente o iniciada sin dependencia a DB. Revisa logs: docker-compose logs backend"
fi

echo "Restaurando servicio de DB"
docker-compose start db || true

