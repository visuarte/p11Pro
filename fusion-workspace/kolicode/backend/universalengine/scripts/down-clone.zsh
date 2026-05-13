#!/usr/bin/env zsh
set -euo pipefail

if [[ $# -ne 1 ]]; then
  echo "Uso: scripts/down-clone.zsh <ruta-clon>" >&2
  exit 1
fi

clone_dir="$1"
if [[ ! -d "$clone_dir" ]]; then
  echo "Error: no existe la carpeta del clon: $clone_dir" >&2
  exit 1
fi
if [[ ! -f "$clone_dir/.env" ]]; then
  echo "Error: falta $clone_dir/.env" >&2
  exit 1
fi

# shellcheck disable=SC1090
source "$clone_dir/.env"
if [[ -z "${COMPOSE_PROJECT_NAME:-}" ]]; then
  echo "Error: COMPOSE_PROJECT_NAME no definido en .env" >&2
  exit 1
fi

(
  cd "$clone_dir"
  docker compose --env-file .env -p "$COMPOSE_PROJECT_NAME" down
)

