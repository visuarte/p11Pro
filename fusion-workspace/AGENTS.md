# 🤖 AGENTS.md - Protocolo de Fusión Inteligente de Proyectos

## 🎯 Propósito


> **Norma General:** Después de cada implementación realizada, todo agente (humano o IA) debe generar un reporte de auditoría y un resumen corto de lo realizado, registrándolo en los reportes correspondientes (ej: FUSION_LOG.md, VALIDATION_REPORT.md, etc.). Esta regla es transversal y obligatoria para garantizar trazabilidad y transparencia.

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

## 🛠️ Versiones mínimas y recomendadas de herramientas

> **Antes de ejecutar cualquier paso, asegúrate de tener instalado:**
>
> - Node.js: 20.x LTS
> - Python: 3.11.x
> - Docker: 24+
> - Gradle: 8.x o superior
> - JDK: 17 (o 21 si el proyecto lo requiere)
> - npm: 10.x
>
> Consulta y sigue siempre la matriz de [`VERSIONS.md`](./VERSIONS.md) para evitar conflictos de entorno.

---

## 📚 Referencias cruzadas QA y Trazabilidad

- **Política de versiones y checklist QA:**
  - Ver [`VERSIONS.md`](./VERSIONS.md) y [`reports/PRE_IMPLEMENTACION_QA_2026-04-21.md`](./reports/PRE_IMPLEMENTACION_QA_2026-04-21.md)
- **Trazabilidad:**
  - Cada paso de fusión debe registrar TRACE-ID y justificación en los reportes de auditoría y cambios.

---

## 🤖 Agentes personalizados y responsabilidades

| Agente/Bot/Script         | Rol / Responsabilidad principal                                                      |
|---------------------------|-------------------------------------------------------------------------------------|
| **Todos los agentes**     | **Tras cada implementación, deben generar un reporte de auditoría y resumen corto**   |
| fusion-scripts.sh         | Automatiza la fusión y copia de archivos                                            |
| merge-dependencies.py     | Fusión inteligente de dependencias Node/Python                                      |
| validation-agent (manual) | Verifica estructura, imports, auditoría                                             |
| doc-agent (manual)        | Genera documentación final y reportes QA                                            |

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

## 📜 Referencias clave
- [Manifiesto de Ingeniería y Buenas Prácticas 2026](../../docs/04_manifiesto_final.md)

---

## Ventajas del pipeline idempotente multiplataforma ARM64

- **Reproducibilidad total:** Cada build es idéntico, sin diferencias entre máquinas o ejecuciones.
- **Evita recompilaciones innecesarias:** Solo recompila módulos nativos C++ si realmente cambió algo, acelerando builds y evitando errores de ABI.
- **Prevención de errores de arquitectura:** Bloquea builds en terminales x64/Rosetta, evitando binarios corruptos o incompatibles.
- **Onboarding inmediato:** Cualquier desarrollador o agente IA puede seguir el README y tener builds funcionales en minutos, sin pasos ocultos.
- **Automatización CI/CD robusta:** El mismo flujo se ejecuta en local y en la nube, garantizando que lo que pasa en tu máquina pasa igual en producción.
- **Menos soporte y troubleshooting:** Minimiza errores de “en mi máquina funciona”, conflictos de dependencias y problemas de entorno.
- **Escalabilidad:** Puedes añadir nuevos módulos/proyectos y heredan automáticamente el estándar, sin duplicar documentación ni scripts.
- **Auditoría y trazabilidad:** Todo build queda registrado y es auditable, cumpliendo con normativas y buenas prácticas 2026.
- **Seguridad:** Reduce el riesgo de ejecutar binarios incompatibles o inseguros en producción.
- **Velocidad:** Builds incrementales mucho más rápidos tras el primer build completo.

---

## Desventajas y precauciones

- **Requiere disciplina:** Todos los desarrolladores y agentes IA deben seguir el flujo y no saltarse scripts ni pasos.
- **Dependencia de versiones fijas:** Si olvidas fijar la versión de Electron o dependencias nativas, la idempotencia se rompe.
- **No mezcla arquitecturas:** No puedes compilar para x64 desde terminal ARM64 ni viceversa sin limpiar y recompilar todo.
- **Scripts deben ejecutarse desde la raíz:** Si ejecutas desde `/scripts` u otra ruta, electron-builder fallará.
- **Puede requerir limpieza extrema tras upgrades mayores:** Si cambias de versión mayor de Electron o dependencias nativas, es obligatorio limpiar todo y reinstalar.
- **No cubre dependencias Python/Java:** Este pipeline es para Node.js/Electron/C++. Los workers Python/Java deben tener su propio flujo idempotente alineado.

---

## 🛡️ Plan Estratégico de Pre-Implementación: Pipeline Idempotente ARM64 (Skills & Hooks para Agentes)

Todo agente IA debe cumplir y verificar los siguientes puntos ANTES de ejecutar cualquier build, fusión o despliegue:


### Pasos obligatorios para agentes (skills/hook):
1. Validar que todos los módulos (frontend, backend, gateway, worker) tienen el pipeline idempotente ARM64 activo y probado.
2. Confirmar que los scripts de build y hooks (`enforce-arm64.js`, `idempotent-rebuild.sh`) están presentes y ejecutándose desde la raíz de cada módulo.
3. Verificar que la versión de Electron está fija (sin ^ o ~) en todos los `package.json`.
4. Auditar que la documentación (README, AGENTS.md, manifiesto, auditorías) está actualizada y visible en cada módulo.
5. Ejecutar una ronda de builds consecutivos y limpiezas extremas en local y CI/CD para validar la idempotencia real.
6. Registrar los resultados en los reportes de auditoría y checklist de pre-implementación.
7. **Después de cada implementación, generar un reporte de auditoría y un resumen corto de lo realizado en los reportes correspondientes.**
8. Comunicar a todo el equipo (y agentes IA) los riesgos de saltarse pasos y las ventajas del pipeline.

### Consideraciones para agentes IA
- Si se agregan nuevos módulos, replicar el pipeline y documentación desde la plantilla estándar.
- Mantener vigilancia sobre errores ENOENT y advertencias de arquitectura en cada build.
- Actualizar periódicamente los reportes y checklist tras cada cambio estructural relevante.

**Nota:** Si el agente detecta que algún paso no se cumple, debe abortar el proceso y notificar al responsable humano o registrar el error en el log correspondiente.

---

## 🛠️ Ejecución del Checklist Automatizado de Idempotencia (CI/CD & Agentes IA)

Todo agente (humano o IA) debe ejecutar el siguiente comando desde la raíz del workspace antes de cualquier despliegue, build o fusión:

```bash
bash ./fusion-workspace/scripts/validate-idempotent-checklist.sh
```

- El script validará lockfile, integridad de ZIPs y builds idempotentes en todos los módulos en paralelo.
- Si algún módulo falla, el proceso aborta y se debe revisar el log correspondiente.
- Si todo pasa, el sistema está listo para preimplementación o despliegue seguro.

**Importante:**
- Este checklist es obligatorio en CI/CD y para cualquier agente IA antes de ejecutar builds, merges o tareas críticas.
- Si el agente detecta errores, debe notificar y registrar el fallo antes de continuar.

---

## 📄 Plantilla de Reporte de Auditoría (Sugerida)

Todos los agentes, tras una implementación o cambio relevante, deben generar un reporte de auditoría siguiendo esta plantilla. Se recomienda guardar el reporte en `fusion-workspace/reports/AUDIT_<YYYYMMDD>-<ID>.md` y subir artefactos a `fusion-workspace/reports/artifacts/<ID>/`.

Plantilla mínima (pegar en `fusion-workspace/reports/AUDIT_<YYYYMMDD>-<ID>.md`):

```
# AUDIT_<YYYYMMDD>-<ID>

- ID: <YYYYMMDD>-<short>
- Autor: <name/email>
- Branch: <branch>
- Resumen: 1–3 líneas describiendo el cambio
- Fecha: <YYYY-MM-DD HH:MMZ>

## Cambios realizados
- Lista de archivos modificados o acciones (no destructivas sin aprobación)

## Checks ejecutados (comandos y resultado)
- validate-lockfiles-safe.sh → OK / FAIL (ruta al diff si FAIL)
- clean-macos-forks.sh (dry-run) → lista de candidatos
- validate-zips.sh → OK / FAIL

## Artefactos
- fusion-workspace/reports/artifacts/<ID>/ (diffs, logs, capturas)

## Recomendación y siguientes pasos
- Acción recomendada: [ej: abrir PR, ejecutar npm install en módulo X, solicitar revisión de frontend]
- Grado de urgencia: P0 / P1 / P2

```

## ✅ Comandos útiles (modo NO destructivo) — copiar y ejecutar desde la raíz del repo

```zsh
# 1) Validar lockfiles por módulo (modo no destructivo)
zsh fusion-workspace/scripts/validate-lockfiles-safe.sh

# 2) Inspeccionar resource forks (dry-run)
zsh fusion-workspace/scripts/clean-macos-forks.sh

# 3) Listar archivos ignorados que serían eliminados por git clean (dry-run)
git clean -n -X

# 4) Crear branch de auditoría localmente
git checkout -b audit/$(date +%Y%m%d)-repo-health
```

---

