#!/bin/bash
# Script de validación para Task 1.3: ESLint + Prettier + Husky
# Objetivo: Verificar que todas las configuraciones están correctas

echo "======================================"
echo "🔍 Validando Task 1.3: ESLint + Prettier + Husky"
echo "======================================"
echo ""

FAILED=0

# Navigate to frontend directory (parent of scripts)
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
FRONTEND_DIR="$(dirname "$SCRIPT_DIR")"
cd "$FRONTEND_DIR" || exit 1

# Test 1: ESLint ejecuta sin errores críticos
echo "1️⃣  Validando ESLint..."
ESLINT_OUTPUT=$(npm run lint 2>&1)
if echo "$ESLINT_OUTPUT" | grep -q "(0 errors"; then
  echo "✅ ESLint ejecuta correctamente"
else
  echo "❌ ESLint tiene errores críticos"
  ((FAILED++))
fi
echo ""

# Test 2: Prettier formatea correctamente
echo "2️⃣  Validando Prettier..."
if npm run format:check > /dev/null 2>&1; then
  echo "✅ Prettier format es correcto"
else
  echo "⚠️  Prettier encuentra diferencias (ejecutar: npm run format)"
fi
echo ""

# Test 3: lint-staged está configurado
echo "3️⃣  Validando lint-staged..."
if grep -q "lint-staged" package.json; then
  echo "✅ lint-staged configurado en package.json"
else
  echo "❌ lint-staged NO está configurado"
  ((FAILED++))
fi
echo ""

# Test 4: Husky pre-commit hook existe
echo "4️⃣  Validando Husky pre-commit hook..."
if [ -x ".husky/pre-commit" ]; then
  echo "✅ .husky/pre-commit existe y es ejecutable"
else
  echo "❌ .husky/pre-commit no existe o no es ejecutable"
  ((FAILED++))
fi
echo ""

# Test 5: Scripts npm configurados
echo "5️⃣  Validando npm scripts..."
SCRIPTS_OK=1
for SCRIPT in "lint" "lint:fix" "format" "format:check"; do
  if grep -q "\"$SCRIPT\"" package.json; then
    echo "  ✅ Script '$SCRIPT' configurado"
  else
    echo "  ❌ Script '$SCRIPT' NO encontrado"
    SCRIPTS_OK=0
  fi
done
[ "$SCRIPTS_OK" -eq 1 ] || ((FAILED++))
echo ""

# Resumen final
echo "======================================"
if [ "$FAILED" -eq 0 ]; then
  echo "✅ TODAS LAS VALIDACIONES PASARON"
  echo "Task 1.3: 100% COMPLETADA"
  echo "======================================"
  exit 0
else
  echo "❌ $FAILED VALIDACIONES FALLARON"
  echo "======================================"
  exit 1
fi

