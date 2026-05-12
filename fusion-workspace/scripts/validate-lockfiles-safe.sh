#!/usr/bin/env bash
set -euo pipefail
# validate-lockfiles-safe.sh
# Valida package-lock.json por módulo de forma NO destructiva.
# - Genera un package-lock temporal en un directorio seguro
# - Compara con el existente y escribe diffs en reports/artifacts

ROOT_DIR="$(dirname "$0")/.."
ARTIFACTS_DIR="$ROOT_DIR/reports/artifacts/lockfile-check-$(date +%Y%m%d-%H%M%S)"
mkdir -p "$ARTIFACTS_DIR"

echo "🔍 Validando lockfiles por módulo (modo NO destructivo)..."

# Encuentra package.json que estén versionados en git (evita node_modules)
mapfile -t MODULE_DIRS < <(git ls-files -- '*/package.json' | sed 's:/package.json::' | sort -u)

if [ ${#MODULE_DIRS[@]} -eq 0 ]; then
  echo "[WARN] No se encontraron package.json versionados en el repo (git ls-files returned 0)."
  exit 0
fi

for dir in "${MODULE_DIRS[@]}"; do
  echo "----- $dir -----"
  if [ ! -f "$dir/package-lock.json" ]; then
    echo "  [WARN] No existe package-lock.json en $dir" | tee -a "$ARTIFACTS_DIR/summary.txt"
    continue
  fi

  tmpdir=$(mktemp -d)
  echo "  Generando lockfile temporal en $tmpdir..."
  cp "$dir/package.json" "$tmpdir/"
  pushd "$tmpdir" >/dev/null
  # generar lockfile sin instalar node_modules ni ejecutar scripts
  if ! npm install --package-lock-only --no-audit --no-fund --ignore-scripts >/dev/null 2>&1; then
    echo "  [ERR] npm falló al generar package-lock temporal para $dir" | tee -a "$ARTIFACTS_DIR/summary.txt"
    popd >/dev/null
    rm -rf "$tmpdir"
    continue
  fi
  popd >/dev/null

  # comparar
  if diff -u "$dir/package-lock.json" "$tmpdir/package-lock.json" > "$ARTIFACTS_DIR/$(echo "$dir" | tr '/ ' '__')-diff.txt" 2>/dev/null; then
    echo "  ✅ Lockfile consistente" | tee -a "$ARTIFACTS_DIR/summary.txt"
  else
    echo "  ❌ Lockfile DESINCRONIZADO" | tee -a "$ARTIFACTS_DIR/summary.txt"
    echo "  Diff guardado en: $ARTIFACTS_DIR/$(echo "$dir" | tr '/ ' '__')-diff.txt" | tee -a "$ARTIFACTS_DIR/summary.txt"
  fi

  rm -rf "$tmpdir"
done

echo "🔚 Completado. Artefactos en: $ARTIFACTS_DIR"
echo "Resumen:"
cat "$ARTIFACTS_DIR/summary.txt" || true

exit 0

