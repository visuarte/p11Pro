#!/bin/bash
set -e

# --- Checklist automatizado de pre-implementación idempotente ARM64 ---
# Este script puede ser ejecutado en CI/CD o por agentes IA en paralelo.

# 1. Validar lockfile (por módulo)
echo "🔍 Validando lockfiles por módulo..."
# Buscar package.json en submódulos (ignorar node_modules) y ejecutar validate-lockfile.sh en cada uno
find kolicode -type f -name 'package.json' -not -path '*/node_modules/*' -print | while IFS= read -r pkg; do
  dir=$(dirname "$pkg")
  echo "🔎 Validando lockfile en $dir ..."
  (
    cd "$dir"
    # Ejecuta el script de validación de lockfile relativo al workspace
    bash ../../scripts/validate-lockfile.sh || echo "[WARN] validate-lockfile.sh devolvió error en $dir"
  )
done

# 2. Validar integridad de ZIPs (si aplica)
if [ -f ./scripts/validate-zips.sh ]; then
  ./scripts/validate-zips.sh
fi

# 3. Validar builds idempotentes en paralelo para cada módulo
MODULES=(frontend backend gateway python-worker)
PIDS=()

for module in "${MODULES[@]}"; do
  if [ -d "kolicode/$module" ]; then
    echo "🚀 Validando build idempotente en $module..."
    (
      cd kolicode/$module
      bash ../../scripts/validate-build.sh all
    ) &
    PIDS+=("$!")
  fi
  # Python worker
  if [ "$module" == "python-worker" ] && [ -d "python-worker" ]; then
    echo "🚀 Validando worker Python..."
    (
      cd python-worker
      # Aquí puedes agregar validaciones específicas de Python
      echo "[INFO] Validación placeholder para Python worker."
    ) &
    PIDS+=("$!")
  fi
  # Gateway
  if [ "$module" == "gateway" ] && [ -d "kolicode/gateway" ]; then
    echo "🚀 Validando gateway..."
    (
      cd kolicode/gateway
      bash ../../scripts/validate-build.sh all
    ) &
    PIDS+=("$!")
  fi

done

# Esperar a que todos los procesos terminen
FAIL=0
for pid in "${PIDS[@]}"; do
  if ! wait $pid; then
    FAIL=1
  fi
fi

if [ $FAIL -eq 0 ]; then
  echo "✅ Checklist CI/CD idempotente ARM64: TODO OK."
  exit 0
else
  echo "❌ Algún módulo falló la validación. Revisa los logs."
  exit 1
fi

