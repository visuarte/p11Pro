#!/bin/bash

set -euo pipefail

SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"

if [ -f "$PROJECT_ROOT/.env" ]; then
  # shellcheck disable=SC1091
  source "$PROJECT_ROOT/.env"
fi

BACKUP_DIR="${BACKUP_DIR:-$PROJECT_ROOT/backups}"
BACKUP_INTERVAL_SECONDS="${BACKUP_INTERVAL_SECONDS:-600}"
BACKUP_RETENTION_COUNT="${BACKUP_RETENTION_COUNT:-24}"
POSTGRES_USER="${POSTGRES_USER:-kolicode}"
POSTGRES_DB="${POSTGRES_DB:-kolicode}"
RUN_ONCE="false"

if [ "${1:-}" = "--once" ]; then
  RUN_ONCE="true"
fi

mkdir -p "$BACKUP_DIR"

create_backup() {
  local timestamp
  timestamp="$(date +%Y%m%d_%H%M%S)"
  local target_file="$BACKUP_DIR/pg_${timestamp}.sql"

  docker-compose -f "$PROJECT_ROOT/docker-compose.yml" exec -T postgres \
    pg_dump -U "$POSTGRES_USER" "$POSTGRES_DB" > "$target_file"

  echo "✅ Backup created: $target_file"
}

prune_backups() {
  backup_files=()

  while IFS= read -r backup_file; do
    backup_files+=("$backup_file")
  done < <(ls -1t "$BACKUP_DIR"/pg_*.sql 2>/dev/null || true)

  if [ "${#backup_files[@]}" -le "$BACKUP_RETENTION_COUNT" ]; then
    return
  fi

  for backup_file in "${backup_files[@]:$BACKUP_RETENTION_COUNT}"; do
    rm -f "$backup_file"
    echo "🧹 Removed old backup: $backup_file"
  done
}

run_cycle() {
  create_backup
  prune_backups
}

if [ "$RUN_ONCE" = "true" ]; then
  run_cycle
  exit 0
fi

echo "♻️ Starting recurring PostgreSQL backups every $BACKUP_INTERVAL_SECONDS seconds"
echo "📦 Retaining the latest $BACKUP_RETENTION_COUNT backups in $BACKUP_DIR"

while true; do
  run_cycle
  sleep "$BACKUP_INTERVAL_SECONDS"
done
