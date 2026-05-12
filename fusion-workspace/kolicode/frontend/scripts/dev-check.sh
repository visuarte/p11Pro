#!/bin/bash
# dev:check - Health Check Local para entorno de desarrollo KoliCode
set -e

# Allow skipping checks for fast local dev: DEV_CHECK_SKIP=1 or DEV_CHECK_SKIP=true
if [[ "$DEV_CHECK_SKIP" == "1" ]] || [[ "${DEV_CHECK_SKIP,,}" == "true" ]]; then
  echo "[WARN] DEV_CHECK_SKIP is set — omitiendo comprobaciones locales (dev-only).";
  exit 0;
fi

# 1. Verifica Node (acepta Node >= 20)
NODE_VERSION=$(node -v 2>/dev/null || echo "v0.0.0")
NODE_MAJOR=$(echo "$NODE_VERSION" | sed -E 's/^v([0-9]+).*/\1/' || echo "0")
if ! [[ $NODE_MAJOR =~ ^[0-9]+$ ]] || [ "$NODE_MAJOR" -lt 20 ]; then
  echo "[ERROR] Node.js >=20 requerido. Encontrado: $NODE_VERSION"; exit 1;
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

