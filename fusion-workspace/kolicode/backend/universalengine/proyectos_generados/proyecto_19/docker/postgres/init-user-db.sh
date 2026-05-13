#!/bin/bash
set -e
# Este script sólo se ejecuta la primera vez cuando la base de datos se inicializa
# Evita fallar si el usuario/BD ya existen.

ROLE_EXISTS=$(psql -U "$POSTGRES_USER" -tAc "SELECT 1 FROM pg_roles WHERE rolname='imprenta_user';") || true
if [ "$ROLE_EXISTS" = "1" ]; then
  echo "Role imprenta_user already exists, skipping creation."
else
  echo "Creating role imprenta_user..."
  psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" -c "CREATE USER imprenta_user WITH PASSWORD 'imprenta_pass';"
fi

DB_EXISTS=$(psql -U "$POSTGRES_USER" -tAc "SELECT 1 FROM pg_database WHERE datname='imprenta_user';") || true
if [ "$DB_EXISTS" = "1" ]; then
  echo "Database imprenta_user already exists, skipping creation."
else
  echo "Creating database imprenta_user..."
  psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" -c "CREATE DATABASE imprenta_user OWNER imprenta_user;"
fi


