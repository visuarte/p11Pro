#!/usr/bin/env zsh
set -euo pipefail

usage() {
  cat <<'EOF'
Uso:
  scripts/new-clone.zsh <Nombre-Copia> [CLONE_ID] [--up] [--dry-run]

Ejemplos:
  scripts/new-clone.zsh laprint-copia-1 1
  scripts/new-clone.zsh laprint-demo 2 --up
  scripts/new-clone.zsh laprint-copia-test 3 --dry-run
EOF
}

if [[ $# -lt 1 ]]; then
  usage
  exit 1
fi

clone_name="$1"
shift

clone_id=""
auto_up="false"
dry_run="false"

while [[ $# -gt 0 ]]; do
  case "$1" in
    --up)
      auto_up="true"
      ;;
    --dry-run)
      dry_run="true"
      ;;
    ''|*[!0-9]*)
      echo "Error: CLONE_ID debe ser numerico. Valor recibido: $1" >&2
      exit 1
      ;;
    *)
      if [[ -n "$clone_id" ]]; then
        echo "Error: solo se permite un CLONE_ID." >&2
        exit 1
      fi
      clone_id="$1"
      ;;
  esac
  shift
done

if [[ -z "$clone_id" ]]; then
  if [[ "$clone_name" =~ '([0-9]+)$' ]]; then
    clone_id="${match[1]}"
  else
    clone_id="1"
  fi
fi

script_dir="$(cd "$(dirname "$0")" && pwd)"
root_dir="$(cd "$script_dir/.." && pwd)"
parent_dir="$(cd "$root_dir/.." && pwd)"
clone_dir="$parent_dir/$clone_name"

# Reutilizamos el nombre para project/container, normalizado para Docker y Postgres.
slug="$(echo "$clone_name" | tr '[:upper:]' '[:lower:]' | sed -E 's/[^a-z0-9]+/-/g; s/^-+//; s/-+$//')"
if [[ -z "$slug" ]]; then
  echo "Error: el nombre del clon no es valido despues de normalizar." >&2
  exit 1
fi
project_name="$(echo "$slug" | tr '-' '_')"
db_suffix="$project_name"

api_port=$((8080 + clone_id))
web_port=$((3000 + clone_id))
db_port=$((5432 + clone_id))

env_content=$(cat <<EOF
COMPOSE_PROJECT_NAME=$project_name

API_CONTAINER_NAME=motor-ktor-$slug
WEB_CONTAINER_NAME=interfaz-web-$slug
DB_CONTAINER_NAME=base-datos-$slug

API_HOST_PORT=$api_port
WEB_HOST_PORT=$web_port
DB_HOST_PORT=$db_port

DB_NAME=universal_db_$db_suffix
DB_USER=admin
DB_PASS=universal_password
GENERATED_HOST_DIR=./proyectos_generados
AI_MODEL=qwen2.5:0.5b
EOF
)

compose_content=$(cat <<'EOF'
name: ${COMPOSE_PROJECT_NAME}

services:
  api-universal:
    image: gradle:8-jdk17
    container_name: ${API_CONTAINER_NAME}
    restart: unless-stopped
    ports:
      - "${API_HOST_PORT}:8080"
    working_dir: /app
    environment:
      - SERVER_PORT=8080
      - DB_URL=jdbc:postgresql://db-universal:5432/${DB_NAME}
      - DB_USER=${DB_USER}
      - DB_PASS=${DB_PASS}
      - OLLAMA_URL=http://host.docker.internal:11434/api/generate
      - GENERATED_FILES_DIR=/app/proyectos_generados
      - LEGACY_PROJECT_MODE=${LEGACY_PROJECT_MODE:-warn}
      - LEGACY_PROJECT_AUTO_GONE=${LEGACY_PROJECT_AUTO_GONE:-false}
    volumes:
      - .:/app
      - gradle_cache:/home/gradle/.gradle
      - ${GENERATED_HOST_DIR:-./proyectos_generados}:/app/proyectos_generados
    extra_hosts:
      - "host.docker.internal:host-gateway"
    command: gradle run --no-daemon
    networks:
      - universal_net
    depends_on:
      db-universal:
        condition: service_healthy

  web-universal:
    image: nginx:alpine
    container_name: ${WEB_CONTAINER_NAME}
    restart: unless-stopped
    ports:
      - "${WEB_HOST_PORT}:80"
    volumes:
      - ./frontend:/usr/share/nginx/html:ro
    networks:
      - universal_net
    depends_on:
      - api-universal

  db-universal:
    image: postgres:15-alpine
    container_name: ${DB_CONTAINER_NAME}
    restart: unless-stopped
    environment:
      POSTGRES_USER: ${DB_USER}
      POSTGRES_PASSWORD: ${DB_PASS}
      POSTGRES_DB: ${DB_NAME}
    ports:
      - "${DB_HOST_PORT}:5432"
    volumes:
      - pgdata_universal:/var/lib/postgresql/data
    networks:
      - universal_net
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U ${DB_USER} -d ${DB_NAME}"]
      interval: 5s
      timeout: 5s
      retries: 5

networks:
  universal_net:
    driver: bridge

volumes:
  gradle_cache:
    name: ${COMPOSE_PROJECT_NAME}_gradle_cache
  pgdata_universal:
    name: ${COMPOSE_PROJECT_NAME}_pgdata_universal
EOF
)

if [[ "$dry_run" == "true" ]]; then
  echo "[dry-run] Proyecto original: $root_dir"
  echo "[dry-run] Copia destino:    $clone_dir"
  echo "[dry-run] API port:         $api_port"
  echo "[dry-run] WEB port:         $web_port"
  echo "[dry-run] DB port:          $db_port"
  echo "[dry-run] COMPOSE_PROJECT:  $project_name"
  exit 0
fi

if [[ -e "$clone_dir" ]]; then
  echo "Error: ya existe la carpeta destino: $clone_dir" >&2
  exit 1
fi

if lsof -nP -iTCP:"$api_port" -sTCP:LISTEN >/dev/null 2>&1; then
  echo "Error: el puerto API $api_port ya esta en uso." >&2
  exit 1
fi
if lsof -nP -iTCP:"$web_port" -sTCP:LISTEN >/dev/null 2>&1; then
  echo "Error: el puerto WEB $web_port ya esta en uso." >&2
  exit 1
fi
if lsof -nP -iTCP:"$db_port" -sTCP:LISTEN >/dev/null 2>&1; then
  echo "Error: el puerto DB $db_port ya esta en uso." >&2
  exit 1
fi

cp -R "$root_dir" "$clone_dir"
printf "%s\n" "$env_content" > "$clone_dir/.env"
printf "%s\n" "$compose_content" > "$clone_dir/docker-compose.yml"

echo "Clon creado en: $clone_dir"
echo "Compose project: $project_name"
echo "API: http://localhost:$api_port"
echo "WEB: http://localhost:$web_port"

echo "Siguientes comandos:"
echo "  cd \"$clone_dir\""
echo "  docker compose --env-file .env -p $project_name up -d"

auto_up_result="no"
if [[ "$auto_up" == "true" ]]; then
  (
    cd "$clone_dir"
    docker compose --env-file .env -p "$project_name" up -d
  )
  auto_up_result="si"
fi

echo "Auto up ejecutado: $auto_up_result"

