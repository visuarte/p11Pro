#!/usr/bin/env zsh
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
GENERATED_DIR="$ROOT_DIR/proyectos_generados"

mkdir -p "$GENERATED_DIR/_archive"
mkdir -p "$GENERATED_DIR/_candidates"
mkdir -p "$GENERATED_DIR/_legacy_import"

echo "Layout preparado en: $GENERATED_DIR"
echo "Reglas:"
echo " - mantener proyectos vivos en proyecto_<id>"
echo " - usar _archive para snapshots o copias retiradas"
echo " - usar _candidates para candidatos a plantilla"
echo " - no mover proyecto_<id> fuera de la raíz mientras el runtime dependa de esa convención"
