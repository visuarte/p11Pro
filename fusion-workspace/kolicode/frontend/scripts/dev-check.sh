#!/bin/bash
# dev:check - Health Check Local para entorno de desarrollo KoliCode
set -e

# 1. Verifica Node
NODE_VERSION=$(node -v)
if [[ $NODE_VERSION != v20* ]]; then
  echo "[ERROR] Node.js 20.x requerido. Encontrado: $NODE_VERSION"; exit 1;
fi

# 2. Verifica Python
PYTHON_VERSION=$(python3 --version 2>&1)
if [[ $PYTHON_VERSION != Python\ 3.11* ]]; then
  echo "[ERROR] Python 3.11.x requerido. Encontrado: $PYTHON_VERSION"; exit 1;
fi

# 3. Verifica binario C++ (ejemplo: AsyncCanvasBuffer)
if [[ ! -f "../AsyncCanvasBuffer.node" ]]; then
  echo "[ERROR] Binario C++ AsyncCanvasBuffer.node no encontrado. Ejecuta build nativo."; exit 1;
fi

# 4. Verifica conexión al Worker Python
if ! nc -z localhost 5000; then
  echo "[ERROR] Worker Python no responde en localhost:5000. Inícialo antes de continuar."; exit 1;
fi

echo "[OK] Health check local superado. Puedes ejecutar npm run dev."

