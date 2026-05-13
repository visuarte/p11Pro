#!/bin/sh
# Docker entrypoint: usa binario installDist si existe; si no, cae a gradle run.
set -e

APP_BIN="/app/build/install/sisi-v1/bin/sisi-v1"

if [ -x "$APP_BIN" ]; then
    echo "[entrypoint] Binario installDist encontrado: $APP_BIN"
    echo "[entrypoint] Iniciando con binario distribuido (arranque rápido)..."
    exec "$APP_BIN"
fi

echo "[entrypoint] Binario installDist no encontrado en /app/build/install/sisi-v1/bin"
echo "[entrypoint] Compilando y ejecutando con Gradle (esto puede tardar varios minutos)..."
exec gradle run --no-daemon

