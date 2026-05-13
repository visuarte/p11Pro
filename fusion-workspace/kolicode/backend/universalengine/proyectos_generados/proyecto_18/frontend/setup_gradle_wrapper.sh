#!/bin/sh

# Wrapper de Gradle para frontend (copiado de kotguaicli)
DIR=$(dirname "$0")
if [ -f "$DIR/../kotguaicli/gradlew" ]; then
  cp "$DIR/../kotguaicli/gradlew" "$DIR/gradlew"
  cp "$DIR/../kotguaicli/gradlew.bat" "$DIR/gradlew.bat"
  cp -r "$DIR/../kotguaicli/gradle" "$DIR/gradle"
else
  echo "No se encontró el wrapper de Gradle en kotguaicli. Copia manualmente gradlew, gradlew.bat y la carpeta gradle."
  exit 1
fi
