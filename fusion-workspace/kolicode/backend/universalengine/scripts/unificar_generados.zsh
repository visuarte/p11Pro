#!/usr/bin/env zsh
set -euo pipefail

# Unifica salida historica en una sola carpeta canonica:
# - destino: proyectos_generados/
# - origen legacy: generados/

script_dir="$(cd "$(dirname "$0")" && pwd)"
root_dir="$(cd "$script_dir/.." && pwd)"
legacy_dir="$root_dir/generados"
canonical_dir="$root_dir/proyectos_generados"
archive_dir="$canonical_dir/_legacy_import"
ts="$(date +%Y%m%d-%H%M%S)"

mkdir -p "$canonical_dir"

move_entry() {
  local src="$1"
  local dst_dir="$2"
  local base
  base="$(basename "$src")"
  local dst="$dst_dir/$base"

  if [[ -e "$dst" ]]; then
    dst="$dst_dir/${base}_legacy_${ts}"
  fi
  mv "$src" "$dst"
}

echo "[1/4] Moviendo contenido de generados -> proyectos_generados (si existe)..."
if [[ -d "$legacy_dir" ]]; then
  legacy_entries=("$legacy_dir"/*(N))
  for entry in "${legacy_entries[@]}"; do
    move_entry "$entry" "$canonical_dir"
  done

  if [[ -z "$(ls -A "$legacy_dir" 2>/dev/null || true)" ]]; then
    rmdir "$legacy_dir" 2>/dev/null || true
  fi
else
  echo "  - No existe carpeta legacy: $legacy_dir"
fi

echo "[2/4] Archivando entradas no canonicas dentro de proyectos_generados..."
mkdir -p "$archive_dir"
canonical_entries=("$canonical_dir"/*(N))
for entry in "${canonical_entries[@]}"; do
  name="$(basename "$entry")"
  if [[ "$name" == "_legacy_import" ]]; then
    continue
  fi
  if [[ "$name" != proyecto_* ]]; then
    move_entry "$entry" "$archive_dir"
  fi
done

echo "[3/4] Estructura final de proyectos_generados:"
ls -la "$canonical_dir"

echo "[4/4] Hecho. Ruta canonica: $canonical_dir"

