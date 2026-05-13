# 🤖 AGENTS.md - Protocolo de Fusión Inteligente de Proyectos

## 🎯 Propósito

Este documento define cómo un **Agente IA** (Claude, ChatGPT, etc.) puede ayudarte a fusionar múltiples proyectos en UNO solo, sin perder ningún archivo, configuración o lógica.

**Caso de uso:** Fusionar ThunderKoli + UniversalEngine + P10pro en un **único proyecto coherente**.

---

## 📋 FLUJO DE FUSIÓN (7 Pasos)

### **Paso 0: Preparación (Tú - 10 minutos)**

1. Comprime los 3 proyectos en **ZIP separados**:
   ```bash
   zip -r thunderkoli-v2.1.zip /path/to/thunderkoli
   zip -r universalengine-hub.zip /path/to/vegabajaimprentaa
   zip -r p10pro-editor.zip /path/to/P10pro
   ```

2. Crea una carpeta en raíz:
   ```bash
   mkdir fusion-workspace
   cd fusion-workspace
   ```

3. Sube los 3 ZIP aquí + copia este archivo:
   ```bash
   fusion-workspace/
   ├── thunderkoli-v2.1.zip
   ├── universalengine-hub.zip
   ├── p10pro-editor.zip
   └── AGENTS.md (este archivo)
   ```

---

### **Paso 1: Análisis Automático (Agente)**

**Comando al Agente:**
```
"Analiza los 3 ZIP en fusion-workspace/ y genera un 
FUSION_REPORT.md que contenga:
- Estructura de directorios de cada uno
- Dependencias (package.json, requirements.txt, build.gradle.kts)
- Conflictos potenciales (puertos, nombres de archivos, librerías duplicadas)
- Activos únicos de cada proyecto (no duplicados)"
```

**Agente genera:**
```
fusion-workspace/
└── FUSION_REPORT.md
    ├── Proyecto A: ThunderKoli (Backend Node, Frontend Vue, Auditoría)
    ├── Proyecto B: UniversalEngine (Backend Kotlin, Frontend Vue, IA)
    ├── Proyecto C: P10pro (Frontend Vite, Assets, Processing)
    ├── Conflictos detectados:
    │   - Puerto 3001 (ThunderKoli + UniversalEngine)
    │   - node_modules duplicados
    │   - package.json con deps conflictivas
    └── Plan de fusión recomendado
```

---

### **Paso 2: Mapping de Activos (Agente)**

**Comando al Agente:**
```
"Crea ASSET_INVENTORY.json que mapee:
- Todos los archivos de cada proyecto
- Rutas de origen
- Tipo (config, código, assets, docs)
- Destino en estructura unificada"
```

**Salida: ASSET_INVENTORY.json**
```json
{
  "thunderkoli": {
    "files": [
      {
        "source": "src/server.js",
        "destination": "backend/thunderkoli/server.js",
        "type": "backend-core",
        "action": "keep"
      },
      {
        "source": "frontend/index.html",
        "destination": "frontend/public/index.html",
        "type": "frontend-core",
        "action": "merge" // Requiere decisión
      }
    ]
  },
  "universalengine": { ... },
  "p10pro": { ... },
  "conflicts": [
    {
      "file": "package.json",
      "projects": ["thunderkoli", "p10pro"],
      "decision": "merge-dependencies"
    }
  ]
}
```

---

### **Paso 3: Generación de Estructura (Agente)**

**Comando al Agente:**
```
"Basándote en ASSET_INVENTORY.json, genera un MERGED_STRUCTURE.txt 
que muestre la estructura final unificada"
```

**Salida:**
```
unified-design-studio/
│
├── backend/
│   ├── src/
│   │   ├── api/
│   │   │   ├── thunderkoli/     ← Auditoría + Vault
│   │   │   ├── universalengine/ ← Code gen + Knowledge
│   │   │   └── design/          ← Motor gráfico
│   │   ├── services/
│   │   ├── models/
│   │   └── config/
│   ├── package.json (UNIFICADO)
│   └── docker-compose.yml
│
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── ThunderCard/
│   │   │   ├── CodeGenerator/
│   │   │   ├── CanvasEditor/
│   │   │   └── DesignStudio/
│   │   ├── assets/             ← Tokens unificados
│   │   └── store/
│   ├── package.json (UNIFICADO)
│   └── vite.config.ts
│
├── creative/
│   └── processing/
│       └── Sketch.pde
│
├── config/
│   └── project-context.json
│
├── docs/
│   ├── ARCHITECTURE.md
│   ├── SETUP.md
│   └── DEPLOYMENT.md
│
└── .github/
    └── workflows/
```

---

### **Paso 4: Generación de Scripts de Fusión (Agente)**

**Comando al Agente:**
```
"Genera FUSION_SCRIPTS.sh que automáticamente:
1. Descomprima los 3 ZIP en carpetas temporales
2. Copie archivos según ASSET_INVENTORY.json
3. Fusione package.json inteligentemente
4. Resuelva conflictos de puertos/configuración
5. Cree carpetas faltantes
6. Genere reporte de qué se copió dónde"
```

**Salida: fusion-scripts.sh**
```bash
#!/bin/bash

# Descomprimir
unzip -q thunderkoli-v2.1.zip -d temp/thunderkoli
unzip -q universalengine-hub.zip -d temp/universalengine
unzip -q p10pro-editor.zip -d temp/p10pro

# Crear estructura base
mkdir -p unified-design-studio/{backend,frontend,creative,config,docs}

# Copiar ThunderKoli backend
cp -r temp/thunderkoli/src/* unified-design-studio/backend/src/

# Copiar UniversalEngine endpoints
cp -r temp/universalengine/api/* unified-design-studio/backend/src/api/

# Copiar P10pro assets
cp -r temp/p10pro/src/assets/* unified-design-studio/frontend/src/assets/

# Fusionar package.json
# (Agente genera código Python para esto)
python3 merge-dependencies.py

# Reporte final
echo "✅ Fusión completada. Ver FUSION_LOG.md"
```

---

### **Paso 5: Ejecución de Fusión (Tú - Supervisado)**

**Ejecutar:**
```bash
cd fusion-workspace
chmod +x fusion-scripts.sh
./fusion-scripts.sh
```

**Resultado:**
```
fusion-workspace/
├── unified-design-studio/          ← 🎉 PROYECTO UNIFICADO
│   ├── backend/
│   ├── frontend/
│   ├── creative/
│   └── ...
├── FUSION_LOG.md                   ← Qué se fusionó
├── ASSET_MAPPING.json              ← Trazabilidad completa
└── REMOVED_DUPLICATES.md           ← Qué se descartó (y por qué)
```

---

### **Paso 6: Validación Post-Fusión (Agente)**

**Comando al Agente:**
```
"Analiza la carpeta unified-design-studio/ y verifica:
1. Todos los package.json están presentes
2. No hay imports rotos
3. Las rutas de configuración son válidas
4. Los archivos de auditoría existen
5. El vault está integrado
Genera VALIDATION_REPORT.md con hallazgos y acciones"
```

---

### **Paso 7: Documentación Final (Agente)**

**Comando al Agente:**
```
"Crea FUSION_COMPLETE.md que contenga:
- Resumen de qué es ahora el proyecto
- Cómo ejecutarlo localmente
- Estructura de carpetas explicada
- Dónde está cada capacidad (Auditoría, IA, Design, etc.)
- Próximos pasos para Semana 1"
```

---

## 🔄 CICLO COMPLETO EN COMANDOS

```bash
# 1. Preparación (Tú)
mkdir fusion-workspace
cd fusion-workspace
# Copia los 3 ZIP + este archivo

# 2. Análisis (Envía a Agente)
"Analiza los 3 ZIP y genera FUSION_REPORT.md"

# 3. Mapping (Envía a Agente)
"Crea ASSET_INVENTORY.json con mapeo completo"

# 4. Estructura (Envía a Agente)
"Genera MERGED_STRUCTURE.txt"

# 5. Scripts (Envía a Agente)
"Genera fusion-scripts.sh"

# 6. Ejecución (Tú)
./fusion-scripts.sh

# 7. Validación (Envía a Agente)
"Valida la carpeta unified-design-studio/"

# 8. Documentación (Envía a Agente)
"Crea FUSION_COMPLETE.md"

# 🎉 Resultado
ls -la unified-design-studio/
# → Proyecto unificado listo
```

---

## 📝 PROTOCOLO DE COMUNICACIÓN CON AGENTE

### **Formato de Solicitud**

**Mensaje al Agente:**
```
FASE: [Analysis|Mapping|Structure|Scripts|Validation|Documentation]
ACCIÓN: [Describe qué necesitas]
ENTRADA: [ZIP files o carpetas en fusion-workspace/]
FORMATO SALIDA: [JSON|MD|SH|TXT]
CRITERIOS CRÍTICOS: [Lista qué NO debe romperse]
```

**Ejemplo:**
```
FASE: Mapping
ACCIÓN: Crear ASSET_INVENTORY.json completo
ENTRADA: 3 ZIP en fusion-workspace/
FORMATO SALIDA: JSON con estructura clara
CRITERIOS CRÍTICOS:
  - No perder archivos de auditoría (ThunderKoli)
  - No perder configuración IA (UniversalEngine)
  - No perder tokens de diseño (P10pro)
```

---

## 🛡️ GUARDRAILS (Lo Que NUNCA Debe Pasar)

El agente DEBE seguir estos principios:

```
❌ NO: Descartar archivos sin documentar
✅ SÍ: Crear REMOVED_DUPLICATES.md explicando por qué

❌ NO: Cambiar nombres de carpetas sin avisar
✅ SÍ: Mapear ruta antigua → nueva en ASSET_MAPPING.json

❌ NO: Fusionar package.json sin verificar conflictos
✅ SÍ: Generar package-merged.json + DEPENDENCY_CONFLICTS.md

❌ NO: Omitir archivos de configuración
✅ SÍ: Copiar TODO .env, .gitignore, docker-compose.yml, etc.

❌ NO: Generar estructura sin validar
✅ SÍ: Verificar que las rutas de import funcionan
```

---

## 📊 CHECKLIST PRE-FUSIÓN (Tú - Verificar)

Antes de enviar al agente:

- [ ] Los 3 ZIP están sin corrupción
- [ ] AGENTS.md está en la carpeta raíz
- [ ] Hay espacio en disco (al menos 5GB libre)
- [ ] Tienes backup de los 3 proyectos originales
- [ ] Entiendes qué proyecto hace qué
- [ ] Tienes clara la arquitectura final deseada

---

## 🚀 FLUJO TÍPICO DE USO

### **Día 1: Preparación**
```
Tú: Creo los 3 ZIP + carpeta fusion-workspace/
Agente: Espera instrucciones
```

### **Día 1 (Tarde): Análisis**
```
Tú: "Analiza los 3 proyectos"
Agente: Genera FUSION_REPORT.md (30 min)
Tú: Revisas y apruebas plan
```

### **Día 2 (Mañana): Mapping**
```
Tú: "Crea inventory de activos"
Agente: Genera ASSET_INVENTORY.json (20 min)
Tú: Revisa y ajusta si necesario
```

### **Día 2 (Tarde): Scripts**
```
Tú: "Genera fusion-scripts.sh"
Agente: Genera scripts listos (30 min)
Tú: Ejecutas ./fusion-scripts.sh (5 min)
```

### **Día 3: Validación**
```
Tú: "Valida la fusión"
Agente: Genera VALIDATION_REPORT.md (20 min)
Tú: Fixes menores si las hay
```

### **Día 3 (Tarde): Documentación**
```
Tú: "Crea FUSION_COMPLETE.md"
Agente: Genera documentación (30 min)
🎉 Proyecto unificado listo para Semana 1
```

---

## 📌 EJEMPLO: PRIMER COMANDO AL AGENTE

**Copia esto y envíalo:**

```
FASE: Analysis
ACCIÓN: Analiza los 3 ZIP (thunderkoli-v2.1.zip, universalengine-hub.zip, p10pro-editor.zip)

Genera FUSION_REPORT.md que contenga:

1. ESTRUCTURA DE CADA PROYECTO
   - Directorios principales
   - Archivos clave (package.json, dockerfile, etc.)
   - Dependencias principales

2. CONFLICTOS POTENCIALES
   - Puertos duplicados
   - package.json con deps conflictivas
   - Nombres de archivos iguales
   - Bases de datos (JSON vs PostgreSQL)

3. ACTIVOS ÚNICOS
   - Qué tiene ThunderKoli que nadie más
   - Qué tiene UniversalEngine que nadie más
   - Qué tiene P10pro que nadie más

4. RECOMENDACIÓN DE FUSIÓN
   - Orden sugerido
   - Decisiones de arquitectura
   - Qué se puede reutilizar vs. reescribir

Criterios críticos:
- NO perder archivos de auditoría
- NO perder lógica de IA
- NO perder tokens de diseño
```

---

## 🎯 RESULTADO ESPERADO DESPUÉS DE 3 DÍAS

```
fusion-workspace/
│
├── unified-design-studio/          ← ✅ PROYECTO LISTO
│   ├── backend/
│   ├── frontend/
│   ├── creative/
│   ├── config/
│   ├── docs/
│   ├── docker-compose.yml
│   ├── package.json
│   └── README.md
│
├── FUSION_REPORT.md                ← Qué hay en cada proyecto
├── ASSET_INVENTORY.json            ← Mapeo de archivos
├── MERGED_STRUCTURE.txt            ← Estructura final
├── FUSION_LOG.md                   ← Qué se hizo
├── ASSET_MAPPING.json              ← Trazabilidad
├── REMOVED_DUPLICATES.md           ← Qué se descartó
├── VALIDATION_REPORT.md            ← Verificación
└── FUSION_COMPLETE.md              ← Guía de uso
```

**Y estás listo para empezar Semana 1 de desarrollo. 🚀**

---

## 📞 SUPPORT: Si Algo Falla

**Si el agente se atasca:**

1. Genera archivo de log: `fusion-scripts.sh 2>&1 | tee fusion.log`
2. Comparte logs + mensaje al agente: "¿Por qué falló esto?"
3. Agente diagnostica y genera fix-script

**Siempre hay trazabilidad: cada paso está documentado.**

---

**Este protocolo garantiza que NO PIERDES NADA en el proceso de fusión.** 🛡️✅
