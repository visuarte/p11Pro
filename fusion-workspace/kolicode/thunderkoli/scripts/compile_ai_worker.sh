#!/bin/bash
# Script de compilación segura para IA Python Worker (ThunderKoli)
# Compila todos los módulos .py a binarios nativos usando Nuitka

set -e

SRC_DIR="../src/ai"
OUT_DIR="../dist/ai_bin"
mkdir -p "$OUT_DIR"

for file in "$SRC_DIR"/*.py; do
  nuitka --standalone --onefile --output-dir="$OUT_DIR" "$file"
done

echo "[ThunderKoli] IA Python Worker compilado y protegido con Nuitka."

