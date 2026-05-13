#!/usr/bin/env zsh
# Script para detectar credenciales hardcodeadas comunes en el repo
set -euo pipefail

ROOT=$(cd "$(dirname "$0")/.." && pwd)
cd "$ROOT"

echo "[check_secrets] Analizando el repositorio en $ROOT"

PATTERNS=("PASSWORD" "POSTGRES" "DB_PASSWORD" "DB_USER" "AUTH_TOKEN" "SECRET" "ACCESS_KEY" "SECRET_KEY" "AWS_SECRET" "JWT_SECRET")
EXCLUDE_DIRS=(.git build dist node_modules frontend/dist .gradle)

GREP_EXCLUDE_ARGS=()
for d in "${EXCLUDE_DIRS[@]}"; do
  GREP_EXCLUDE_ARGS+=(--exclude-dir="$d")
done

FOUND=0
for p in "${PATTERNS[@]}"; do
  echo "[check_secrets] buscando patrón: $p"
  if grep -R --line-number "${p}" . "${GREP_EXCLUDE_ARGS[@]}" >/dev/null 2>&1; then
    echo "[check_secrets][warning] coincidencias para '$p':"
    grep -R --line-number "${p}" . "${GREP_EXCLUDE_ARGS[@]}" || true
    FOUND=1
  fi
done

if [ $FOUND -eq 1 ]; then
  echo "[check_secrets][error] Se detectaron posibles secretos. Revisa las coincidencias y mueve valores a .env o a un secret manager."
  exit 1
else
  echo "[check_secrets] No se detectaron patrones obvios de secretos."
fi


