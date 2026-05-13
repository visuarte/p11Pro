#!/bin/bash
# Script para cerrar todos los procesos uvicorn en el puerto 8000
echo "Buscando procesos en el puerto 8000..."
PIDS=$(lsof -ti:8000)
if [ -z "$PIDS" ]; then
  echo "No hay procesos usando el puerto 8000."
else
  echo "Matando procesos: $PIDS"
  kill $PIDS
  echo "Procesos terminados."
fi
