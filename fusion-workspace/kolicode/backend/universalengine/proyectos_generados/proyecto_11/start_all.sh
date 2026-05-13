#!/bin/bash
# Script para levantar backend y frontend automáticamente

# Cierra procesos en el puerto 8000
DIR=$(dirname "$0")
source "$DIR/kill_uvicorn_8000.sh"

# Inicia backend
cd "$DIR/backend"
echo "Activando entorno virtual y levantando backend..."
source ../frontend/venv/bin/activate
uvicorn main:app --reload &
BACKEND_PID=$!
echo "Backend iniciado con PID $BACKEND_PID"

# Inicia frontend
cd ../frontend
echo "Levantando frontend (Vite)..."
npm run dev &
FRONTEND_PID=$!
echo "Frontend iniciado con PID $FRONTEND_PID"

echo "Ambos servidores están corriendo."
echo "Para detenerlos, usa: kill $BACKEND_PID $FRONTEND_PID"
