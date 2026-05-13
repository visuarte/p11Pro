#!/usr/bin/env zsh
set -euo pipefail

script_dir="$(cd "$(dirname "$0")" && pwd)"
root_dir="$(cd "$script_dir/.." && pwd)"
RUN_STARTUP_CHECK="${RUN_STARTUP_CHECK:-1}"
SYSTEM_CHECK_LEVEL="${SYSTEM_CHECK_LEVEL:-quick}"
RESET_DB="${RESET_DB:-0}"
env_file="$root_dir/.env"

if [[ ! -f "$env_file" ]]; then
  echo "ERROR: no existe $env_file" >&2
  exit 1
fi

compose_project_name="$(awk -F= '/^COMPOSE_PROJECT_NAME=/{print $2; exit}' "$env_file" | tr -d '[:space:]')"
if [[ -z "$compose_project_name" ]]; then
  echo "ERROR: COMPOSE_PROJECT_NAME no definido en $env_file" >&2
  exit 1
fi

compose_cmd=(docker compose --env-file "$env_file" -p "$compose_project_name")

cd "$root_dir"

echo "[1/5] Unificando carpetas de salida..."
"$script_dir/unificar_generados.zsh"

echo "[2/5] Reiniciando stack Docker..."
if [[ "$RESET_DB" == "1" ]]; then
  echo "  - RESET_DB=1 -> se borran volumenes (DB limpia)"
  "${compose_cmd[@]}" down -v --remove-orphans
else
  echo "  - RESET_DB=0 -> se preservan volumenes"
  "${compose_cmd[@]}" down --remove-orphans
fi
"${compose_cmd[@]}" up -d

echo "[3/5] Esperando /status..."
for i in {1..45}; do
  code=$(curl -s -o /tmp/cineops_status.txt -w "%{http_code}" http://localhost:8081/status || true)
  echo "  intento $i -> $code"
  if [[ "$code" == "200" ]]; then
    break
  fi
  sleep 2
done

echo "[4/5] Verificando endpoint del Hub (/api/v1/projects)..."
for i in {1..45}; do
  code=$(curl -s -o /tmp/cineops_projects.txt -w "%{http_code}" http://localhost:8081/api/v1/projects || true)
  echo "  intento $i -> $code"
  if [[ "$code" == "200" ]]; then
    break
  fi
  sleep 2
done

echo "[5/6] Estado final de contenedores:"
"${compose_cmd[@]}" ps

if [[ "$RUN_STARTUP_CHECK" == "1" ]]; then
  echo "[6/6] Check de sistema al arrancar (level=$SYSTEM_CHECK_LEVEL)..."
  API_PORT=8081 SYSTEM_CHECK_LEVEL="$SYSTEM_CHECK_LEVEL" "$script_dir/system_check_startup.zsh"
else
  echo "[6/6] RUN_STARTUP_CHECK=0 -> check de sistema omitido"
fi

echo "\n/status ->"
cat /tmp/cineops_status.txt 2>/dev/null || true

echo "\n/api/v1/projects ->"
cat /tmp/cineops_projects.txt 2>/dev/null || true

echo "\nSi el Hub sigue vacio en UI, limpia localStorage en el navegador:"
echo "localStorage.removeItem('cineops:apiBaseUrl'); location.reload();"

