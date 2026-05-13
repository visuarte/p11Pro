#!/bin/bash

echo "🔍 Validando integridad de ZIP files..."
echo ""

cd "$(dirname "$0")/.."

FILES=(
  "thunderkoli-v2.1.zip"
  "universalengine-hub.zip"
  "p10pro-editor.zip"
)

FAILED=0

for file in "${FILES[@]}"; do
  if [ ! -f "$file" ]; then
    echo "❌ NO ENCONTRADO: $file"
    FAILED=$((FAILED + 1))
  else
    if unzip -t "$file" > /dev/null 2>&1; then
      SIZE=$(du -h "$file" | cut -f1)
      echo "✅ OK: $file ($SIZE)"
    else
      echo "❌ CORRUPTO: $file"
      FAILED=$((FAILED + 1))
    fi
  fi
done

echo ""
if [ $FAILED -eq 0 ]; then
  echo "🎉 Todos los ZIP están OK. Listo para fusión."
else
  echo "⚠️  $FAILED ZIP(s) tienen problemas. Verifica y copia de nuevo."
fi
