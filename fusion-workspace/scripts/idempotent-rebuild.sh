#!/bin/bash
# [TRACE-ID: FASE-10-DEPLOY-002-REBUILD]
set -e

echo "[INFO] Iniciando chequeo idempotente de dependencias nativas C++..."

# Forzar estrictamente las variables de entorno de compilación para Mac M1
export npm_config_arch=arm64
export npm_config_target_arch=arm64
export APPLE_SILICON=true

# Ejecutamos el instalador idempotente.
# Si los .node ya coinciden con el ABI de Electron, esto tardará 1 segundo.
# Si no coinciden o no existen, los compilará de forma segura.
npx electron-builder install-app-deps --arch arm64

echo "[INFO] ✅ Módulos nativos listos y alineados con la arquitectura."

