---
## 🛡️ Práctica Permanente: Auditoría y Limpieza Segura

> **Regla de oro:** Toda limpieza, reorganización o eliminación de archivos/código debe seguir el protocolo de auditoría técnica senior para refactorización segura:
>
> 1. Inventario completo de archivos (código, tests, config, scripts, assets, docs).
> 2. Detección y clasificación de duplicados (idénticos, casi idénticos, código copiado, funciones/config/assets duplicados).
> 3. Identificación de archivos potencialmente obsoletos o basura (sin uso, temporales, backups, legacy, no referenciados).
> 4. Análisis de impacto: dependencias, imports, referencias, tests, CI, despliegue.
> 5. Estrategias seguras: consolidar, deprecar, reorganizar sin romper imports ni contratos públicos. Prohibido borrar directamente.
> 6. Reorganización no destructiva: mantener compatibilidad, usar aliases/reexports, documentar todo.
> 7. Validación post-limpieza: tests, arranque, imports, warnings, comportamiento.
> 8. Reporte técnico detallado: duplicados, candidatos, acciones, riesgos evitados, confirmación de no ruptura.
> 9. Confirmación final: nunca romper funcionalidad, nunca eliminar archivos críticos, limpieza reversible y documentada.
>
> **Prioridad:** Seguridad y reversibilidad sobre limpieza. Ante la duda, conservar y documentar.

---

# 📁 Estructura del Proyecto - KoliCode

**Fecha:** 2026-04-21  
**Estado:** ✅ ORGANIZADO Y LIMPIO

---

## 🎯 Estructura Raíz

```
p11pro/                                    ← Raíz del workspace
│
├── .kiro/                                 ← Configuración de Kiro
│   └── specs/
│       └── unified-design-studio/         ← Especificación del proyecto
│           ├── .config.kiro               ← Config de spec
│           └── requirements.md            ← Requerimientos completos
│
├── docs/                                  ← Documentación general
│   └── fusion-process/                    ← Proceso de fusión
│       ├── AGENTS.md                      ← Protocolo de fusión
│       └── analisis_fusion_completa.md    ← Análisis técnico
│
├── fusion-workspace/                      ← Workspace de fusión
│   │
│   ├── unified-design-studio/             ← ✨ PROYECTO PRINCIPAL
│   │   ├── backend/
│   │   │   ├── thunderkoli/               ← Node.js + Express
│   │   │   ├── universalengine/           ← Kotlin + Ktor
│   │   │   └── gateway/                   ← API Gateway (por implementar)
│   │   ├── frontend/                      ← React + TypeScript + Vite
│   │   ├── creative/                      ← Processing sketches
│   │   ├── python-worker/                 ← GPU workers (por implementar)
│   │   ├── config/                        ← Configuración unificada
│   │   ├── docs/                          ← Documentación del proyecto
│   │   ├── docker-compose.yml             ← Orquestación
│   │   ├── .gitignore                     ← Reglas Git
│   │   └── README.md                      ← Documentación principal
│   │
│   ├── reports/                           ← Reportes de fusión
│   │   ├── FUSION_REPORT.md               ← Análisis de proyectos
│   │   ├── FUSION_LOG.md                  ← Log de ejecución
│   │   ├── ASSET_INVENTORY.json           ← Mapeo de archivos
│   │   └── INSTALLATION_COMPLETE.md       ← Guía de instalación
│   │
│   ├── backup-zips/                       ← Backups de proyectos originales
│   │   ├── thunderkoli-v2.1.zip
│   │   ├── universalengine-hub.zip
│   │   └── p10pro-editor.zip
│   │
│   ├── scripts/                           ← Scripts de utilidad
│   │
│   ├── AGENTS.md                          ← Protocolo de fusión (referencia)
│   ├── fusion-scripts.sh                  ← Script de fusión ejecutado
│   └── cleanup-project.sh                 ← Script de limpieza ejecutado
│
└── PROJECT_STRUCTURE.md                   ← Este archivo
```

---

## 🎯 Proyecto Principal: unified-design-studio/

### Backend

```
backend/
│
├── thunderkoli/                           ✅ LISTO
│   ├── src/
│   │   ├── server.js                      # Servidor Express principal
│   │   ├── agents/                        # Agentes IA (Transformers)
│   │   ├── lib/                           # Librerías compartidas
│   │   ├── config/                        # Configuraciones
│   │   └── services/
│   │       ├── vault/                     # Encriptación AES-256
│   │       ├── auth/                      # Google + WhatsApp Auth
│   │       └── audit/                     # Sistema de auditoría
│   ├── data/                              # Datos persistentes
│   ├── logs/                              # Logs de aplicación
│   ├── tests/                             # Tests unitarios (Jest)
│   ├── .wwebjs_auth/                      # Auth WhatsApp
│   ├── .google_auth/                      # Auth Google
│   ├── package.json                       # 660 paquetes instalados
│   ├── Dockerfile                         # Containerización
│   └── node_modules/                      # Dependencias instaladas
│
├── universalengine/                       ⏭️ REQUIERE GRADLE BUILD
│   ├── src/                               # Código Kotlin/Ktor
│   ├── config/                            # Configuraciones
│   ├── scripts/                           # Scripts de automatización
│   ├── proyectos_generados/               # Outputs de IA (20+ proyectos)
│   ├── frontend-legacy/                   # Frontend Vue.js legacy
│   ├── gradle/                            # Gradle wrapper
│   ├── build.gradle.kts                   # Build Kotlin
│   ├── settings.gradle.kts                # Settings Gradle
│   ├── gradlew                            # Gradle wrapper Unix
│   ├── gradlew.bat                        # Gradle wrapper Windows
│   ├── .env                               # Variables de entorno
│   └── .env.example                       # Template de configuración
│
└── gateway/                               ⏭️ POR IMPLEMENTAR
    ├── src/
    │   ├── routes/                        # Enrutamiento unificado
    │   ├── proxy/                         # Proxy a microservicios
    │   └── middleware/                    # CORS, Auth, Logging
    ├── config/                            # Configuraciones
    └── package.json                       # Por crear
```

### Frontend

```
frontend/                                  ✅ LISTO
├── src/
│   ├── main.ts                            # Entry point
│   ├── app/                               # Lógica de aplicación
│   ├── editor/                            # Canvas editor (P10pro)
│   ├── assets/                            # Assets estáticos
│   ├── shared/                            # Componentes compartidos
│   └── styles/                            # Estilos CSS
├── public/                                # Assets públicos
├── index.html                             # HTML principal
├── package.json                           # 11 paquetes instalados
├── tsconfig.json                          # Config TypeScript
├── vite.config.ts                         # Config Vite
└── node_modules/                          # Dependencias instaladas
```

### Creative

```
creative/                                  ✅ LISTO
└── processing/
    ├── Sketch.pde                         # Sketch Processing
    ├── README_PROCESSING.md               # Documentación
    └── run-local.sh                       # Script de ejecución
```

### Python Workers

```
python-worker/                             ⏭️ POR IMPLEMENTAR
├── ai_engine.py                           # Worker de IA (DeepSeek/GPT)
├── pose_detector.py                       # MediaPipe landmarks
├── color_processor.py                     # Little CMS wrapper
├── vector_renderer.py                     # Blend2D/Skia wrapper
└── requirements.txt                       # Dependencias Python
```

### Configuración

```
config/                                    ✅ LISTO
└── project-context.json                   # Contexto de proyecto P10pro
```

### Documentación

```
docs/                                      ✅ LISTO
├── universalengine/                       # Docs UniversalEngine
├── p10pro/                                # Docs P10pro
│   ├── index.html
│   ├── error-codes.html
│   ├── NOTES.md
│   ├── README_CREATIVE.md
│   └── RESOURCES.md
└── architecture/                          # Docs de arquitectura (vacío)
```

### Infraestructura

```
.                                          ✅ LISTO
├── docker-compose.yml                     # Orquestación completa
├── .gitignore                             # Reglas Git unificadas
└── README.md                              # Documentación principal
```

---

## 💻 ESPECIFICACIONES DE HERRAMIENTAS (VERSIÓN JETBRAINS)
- **IDE Principal:** JetBrains CLion (con plugin de Python instalado).
- **Sistema de Construcción:** CMake (Obligatorio para gestionar dependencias de Qt y C++).
- **Lenguajes:** C++ (Qt Framework) + Python 3.x.
- **Librerías Open Source:** Little CMS (Color), Blend2D (Vectores), dlib/DeepFace (IA Pose).
- **IA de Apoyo:** Plugin de GitHub Copilot para JetBrains o JetBrains AI Assistant.
- **Target Hardware:** Optimización extrema para fluidez en equipos de gama baja (Gama "Visionado Limpio").

Archivo Base para CLion: CMakeLists.txt


cmake_minimum_required(VERSION 3.16)
# Recuerda: El proyecto NO tiene nombre.
project(Proyecto_Sin_Nombre VERSION 0.1.0 LANGUAGES CXX)

set(CMAKE_CXX_STANDARD 17)
set(CMAKE_CXX_STANDARD_REQUIRED ON)

# Configuraciones automáticas para Qt
set(CMAKE_AUTOMOC ON)
set(CMAKE_AUTORCC ON)
set(CMAKE_AUTOUIC ON)

# Buscar módulos de Qt (Asegúrate de tener Qt instalado en el sistema)
find_package(Qt6 COMPONENTS Core Gui Widgets REQUIRED)

# Definir el ejecutable apuntando a la estructura de Fase 1
add_executable(${PROJECT_NAME} 
    src/core/main.cpp
    # Aquí se irán añadiendo los archivos de Little CMS y Blend2D
)

# Enlazar las librerías
target_link_libraries(${PROJECT_NAME} PRIVATE 
    Qt6::Core 
    Qt6::Gui 
    Qt6::Widgets
)

---

## 📊 Estadísticas del Proyecto

| Métrica | Valor |
|---------|-------|
| **Archivos totales** | 11,215 |
| **Directorios** | 2,140 |
| **Tamaño en disco** | 2.0GB |
| **Dependencias Node.js** | 671 paquetes |
| **Proyectos fusionados** | 3 |
| **Lenguajes** | JavaScript, TypeScript, Kotlin, Python |
| **Frameworks** | Express, Ktor, React, Vite |

---

## 🗑️ Archivos Eliminados (Limpieza)

### Archivos de metadata macOS
- Todos los archivos `._*` eliminados

### Archivos duplicados en raíz
- `AGENTS.md` (movido a docs/fusion-process/)
- `analisis_fusion_completa.md` (movido a docs/fusion-process/)
- `prepare-workspace.sh` (eliminado)
- `QUICKSTART.md` (eliminado)
- `README_DESCARGA.txt` (eliminado)

### Carpeta files/ completa
- Contenido duplicado eliminado
- Documentación útil movida a `docs/fusion-process/`

### Directorio temporal
- `fusion-workspace/temp/` eliminado (archivos de extracción)

### ZIP files originales
- Movidos a `fusion-workspace/backup-zips/` para backup

### Archivos de setup
- `AGENT_REQUEST_TEMPLATE.md` (eliminado)
- `README_SETUP.md` (eliminado)
- `SETUP_CHECKLIST.md` (eliminado)
- `PROGRESS_SUMMARY.txt` (eliminado)
- `MERGED_STRUCTURE.txt` (eliminado)

---

## 📚 Documentación Disponible

### Especificación del Proyecto
- `.kiro/specs/unified-design-studio/requirements.md` - Requerimientos completos

### Proceso de Fusión
- `docs/fusion-process/AGENTS.md` - Protocolo de fusión
- `docs/fusion-process/analisis_fusion_completa.md` - Análisis técnico

### Reportes de Fusión
- `fusion-workspace/reports/FUSION_REPORT.md` - Análisis de proyectos
- `fusion-workspace/reports/FUSION_LOG.md` - Log de ejecución
- `fusion-workspace/reports/ASSET_INVENTORY.json` - Mapeo de archivos
- `fusion-workspace/reports/INSTALLATION_COMPLETE.md` - Guía completa

### Proyecto Principal
- `fusion-workspace/unified-design-studio/README.md` - Documentación principal
- `fusion-workspace/unified-design-studio/backend/thunderkoli/README.md` - Docs ThunderKoli
- `fusion-workspace/unified-design-studio/backend/universalengine/README.md` - Docs UniversalEngine
- `fusion-workspace/unified-design-studio/frontend/README.md` - Docs P10pro

---

## 🚀 Comandos Rápidos

### Navegar al proyecto principal
```bash
cd fusion-workspace/unified-design-studio
```

### Iniciar desarrollo
```bash
# Backend ThunderKoli
cd fusion-workspace/unified-design-studio/backend/thunderkoli
npm run dev

# Frontend
cd fusion-workspace/unified-design-studio/frontend
npm run dev

# UniversalEngine
cd fusion-workspace/unified-design-studio/backend/universalengine
./gradlew run
```

### Ver reportes
```bash
# Reporte de fusión
cat fusion-workspace/reports/FUSION_REPORT.md

# Log de ejecución
cat fusion-workspace/reports/FUSION_LOG.md

# Guía de instalación
cat fusion-workspace/reports/INSTALLATION_COMPLETE.md
```

---

## ✅ Estado Actual

**FASE 1 COMPLETADA:**
- ✅ Fusión de proyectos
- ✅ Instalación de dependencias
- ✅ Limpieza y organización
- ✅ Documentación completa

**SIGUIENTE FASE:**
- Implementar API Gateway
- Crear Python Workers
- Migrar frontend a React
- Configurar PostgreSQL

---

**Generado por:** Kiro AI Agent  
**Fecha:** 2026-04-21  
**Última actualización:** Después de limpieza completa
