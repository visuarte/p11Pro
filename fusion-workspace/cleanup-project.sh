#!/bin/bash

# ============================================================================
# CLEANUP SCRIPT - Unified Design Studio
# ============================================================================
# Elimina archivos temporales, duplicados y basura innecesaria
# ============================================================================

set -e

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"

echo "============================================================================"
echo "  🧹 CLEANUP - Unified Design Studio"
echo "============================================================================"
echo ""

# ============================================================================
# 1. ELIMINAR ARCHIVOS ._* (macOS metadata)
# ============================================================================

echo -e "${BLUE}[1/7]${NC} Eliminando archivos de metadata macOS (._*)"
find "$PROJECT_ROOT" -name "._*" -type f -delete 2>/dev/null || true
echo -e "${GREEN}✓${NC} Archivos ._* eliminados"
echo ""

# ============================================================================
# 2. ELIMINAR ARCHIVOS DUPLICADOS EN RAÍZ
# ============================================================================

echo -e "${BLUE}[2/7]${NC} Eliminando archivos duplicados en raíz"

# Estos archivos están duplicados entre raíz y fusion-workspace
cd "$PROJECT_ROOT"
rm -f AGENTS.md analisis_fusion_completa.md prepare-workspace.sh QUICKSTART.md README_DESCARGA.txt 2>/dev/null || true

echo -e "${GREEN}✓${NC} Archivos duplicados eliminados de raíz"
echo ""

# ============================================================================
# 3. LIMPIAR CARPETA files/ (DUPLICADOS)
# ============================================================================

echo -e "${BLUE}[3/7]${NC} Limpiando carpeta files/ (duplicados)"

if [ -d "$PROJECT_ROOT/files" ]; then
    # Mover documentación útil a docs/
    mkdir -p "$PROJECT_ROOT/docs/fusion-process"
    
    if [ -f "$PROJECT_ROOT/files/AGENTS.md" ]; then
        mv "$PROJECT_ROOT/files/AGENTS.md" "$PROJECT_ROOT/docs/fusion-process/" 2>/dev/null || true
    fi
    
    if [ -f "$PROJECT_ROOT/files/analisis_fusion_completa.md" ]; then
        mv "$PROJECT_ROOT/files/analisis_fusion_completa.md" "$PROJECT_ROOT/docs/fusion-process/" 2>/dev/null || true
    fi
    
    # Eliminar el resto
    rm -rf "$PROJECT_ROOT/files"
    echo -e "${GREEN}✓${NC} Carpeta files/ eliminada (docs movidos a docs/fusion-process/)"
else
    echo -e "${YELLOW}⚠${NC} Carpeta files/ no existe"
fi
echo ""

# ============================================================================
# 4. LIMPIAR DIRECTORIO TEMPORAL DE FUSIÓN
# ============================================================================

echo -e "${BLUE}[4/7]${NC} Limpiando directorio temporal de fusión"

if [ -d "$SCRIPT_DIR/temp" ]; then
    rm -rf "$SCRIPT_DIR/temp"
    echo -e "${GREEN}✓${NC} Directorio temp/ eliminado"
else
    echo -e "${YELLOW}⚠${NC} Directorio temp/ no existe"
fi
echo ""

# ============================================================================
# 5. ELIMINAR ZIP FILES ORIGINALES (OPCIONAL)
# ============================================================================

echo -e "${BLUE}[5/7]${NC} Moviendo ZIP files originales a backup/"

mkdir -p "$SCRIPT_DIR/backup-zips"

if [ -f "$SCRIPT_DIR/thunderkoli-v2.1.zip" ]; then
    mv "$SCRIPT_DIR/thunderkoli-v2.1.zip" "$SCRIPT_DIR/backup-zips/" 2>/dev/null || true
fi

if [ -f "$SCRIPT_DIR/universalengine-hub.zip" ]; then
    mv "$SCRIPT_DIR/universalengine-hub.zip" "$SCRIPT_DIR/backup-zips/" 2>/dev/null || true
fi

if [ -f "$SCRIPT_DIR/p10pro-editor.zip" ]; then
    mv "$SCRIPT_DIR/p10pro-editor.zip" "$SCRIPT_DIR/backup-zips/" 2>/dev/null || true
fi

echo -e "${GREEN}✓${NC} ZIP files movidos a backup-zips/"
echo ""

# ============================================================================
# 6. ORGANIZAR DOCUMENTACIÓN DE FUSIÓN
# ============================================================================

echo -e "${BLUE}[6/7]${NC} Organizando documentación de fusión"

mkdir -p "$SCRIPT_DIR/reports"

# Mover reportes a carpeta reports/
for file in FUSION_REPORT.md FUSION_LOG.md ASSET_INVENTORY.json INSTALLATION_COMPLETE.md; do
    if [ -f "$SCRIPT_DIR/$file" ]; then
        mv "$SCRIPT_DIR/$file" "$SCRIPT_DIR/reports/" 2>/dev/null || true
    fi
done

# Eliminar archivos de setup ya no necesarios
rm -f "$SCRIPT_DIR/AGENT_REQUEST_TEMPLATE.md" 2>/dev/null || true
rm -f "$SCRIPT_DIR/README_SETUP.md" 2>/dev/null || true
rm -f "$SCRIPT_DIR/SETUP_CHECKLIST.md" 2>/dev/null || true
rm -f "$SCRIPT_DIR/QUICKSTART.md" 2>/dev/null || true
rm -f "$SCRIPT_DIR/README_DESCARGA.txt" 2>/dev/null || true
rm -f "$SCRIPT_DIR/PROGRESS_SUMMARY.txt" 2>/dev/null || true
rm -f "$SCRIPT_DIR/MERGED_STRUCTURE.txt" 2>/dev/null || true
rm -f "$SCRIPT_DIR/prepare-workspace.sh" 2>/dev/null || true
rm -f "$SCRIPT_DIR/analisis_fusion_completa.md" 2>/dev/null || true

# Mantener solo AGENTS.md como referencia
if [ ! -f "$SCRIPT_DIR/AGENTS.md" ]; then
    if [ -f "$SCRIPT_DIR/reports/AGENTS.md" ]; then
        cp "$SCRIPT_DIR/reports/AGENTS.md" "$SCRIPT_DIR/" 2>/dev/null || true
    fi
fi

echo -e "${GREEN}✓${NC} Documentación organizada en reports/"
echo ""

# ============================================================================
# 7. LIMPIAR PROYECTO UNIFICADO
# ============================================================================

echo -e "${BLUE}[7/7]${NC} Limpiando proyecto unificado"

UNIFIED_DIR="$SCRIPT_DIR/unified-design-studio"

if [ -d "$UNIFIED_DIR" ]; then
    # Eliminar archivos .DS_Store
    find "$UNIFIED_DIR" -name ".DS_Store" -type f -delete 2>/dev/null || true
    
    # Eliminar directorios vacíos en python-worker (por implementar)
    if [ -d "$UNIFIED_DIR/python-worker" ]; then
        if [ -z "$(ls -A "$UNIFIED_DIR/python-worker")" ]; then
            echo "  - python-worker/ está vacío (por implementar)"
        fi
    fi
    
    # Eliminar directorios vacíos en gateway (por implementar)
    if [ -d "$UNIFIED_DIR/backend/gateway/src" ]; then
        if [ -z "$(ls -A "$UNIFIED_DIR/backend/gateway/src")" ]; then
            echo "  - backend/gateway/ está vacío (por implementar)"
        fi
    fi
    
    echo -e "${GREEN}✓${NC} Proyecto unificado limpio"
else
    echo -e "${RED}✗${NC} Proyecto unificado no encontrado"
fi
echo ""

# ============================================================================
# RESUMEN FINAL
# ============================================================================

echo "============================================================================"
echo -e "${GREEN}✓ LIMPIEZA COMPLETADA${NC}"
echo "============================================================================"
echo ""
echo "📊 Estructura final:"
echo ""
echo "fusion-workspace/"
echo "├── unified-design-studio/    ← Proyecto principal"
echo "├── reports/                  ← Reportes de fusión"
echo "├── backup-zips/              ← ZIP files originales"
echo "├── scripts/                  ← Scripts de utilidad"
echo "├── AGENTS.md                 ← Protocolo de fusión"
echo "└── fusion-scripts.sh         ← Script de fusión"
echo ""
echo "docs/"
echo "└── fusion-process/           ← Documentación del proceso"
echo ""
echo "🎯 Siguiente paso:"
echo "   cd unified-design-studio/"
echo ""
echo "============================================================================"
