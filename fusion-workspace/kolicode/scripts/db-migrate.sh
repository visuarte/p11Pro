#!/bin/bash

set -euo pipefail

SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"

if [ $# -lt 1 ]; then
  echo "Usage: bash scripts/db-migrate.sh <up|down|create> [name]"
  exit 1
fi

ACTION="$1"
shift || true

if [ -f "$PROJECT_ROOT/.env" ]; then
  # shellcheck disable=SC1091
  source "$PROJECT_ROOT/.env"
fi

POSTGRES_HOST="${POSTGRES_HOST:-127.0.0.1}"
POSTGRES_PORT="${POSTGRES_PORT:-5433}"
POSTGRES_DB="${POSTGRES_DB:-kolicode}"
POSTGRES_USER="${POSTGRES_USER:-kolicode}"
POSTGRES_PASSWORD="${POSTGRES_PASSWORD:-kolicode_dev_pass}"

export DATABASE_URL="postgresql://${POSTGRES_USER}:${POSTGRES_PASSWORD}@${POSTGRES_HOST}:${POSTGRES_PORT}/${POSTGRES_DB}"

cd "$PROJECT_ROOT/backend/bridge"

case "$ACTION" in
  up)
    npm run migrate:up
    ;;
  down)
    npm run migrate:down
    ;;
  create)
    if [ $# -lt 1 ]; then
      echo "Usage: bash scripts/db-migrate.sh create <migration_name>"
      exit 1
    fi
    npm exec -- node-pg-migrate -m src/db/migrations create "$1"
    ;;
  *)
    echo "Unknown action: $ACTION"
    echo "Usage: bash scripts/db-migrate.sh <up|down|create> [name]"
    exit 1
    ;;
esac
