# p11Pro / KoliCode

Monorepo de trabajo para **KoliCode**, una plataforma desktop modular que integra:

- **Frontend Electron + React** para shell desktop, canvas y experiencia de usuario
- **Bridge** en Node.js como API Gateway, WebSocket hub y capa de orquestación
- **Engines** especializados:
  - **ThunderKoli**: seguridad, vault, auditoría e identidad
  - **UniversalEngine**: generación asistida por IA y servicios Kotlin/Ktor
  - **Design Studio**: render, color y procesamiento creativo
- **Persistencia** con PostgreSQL + Redis

El producto activo vive en `fusion-workspace/kolicode/`. El resto del repo contiene documentación raíz, historial de trabajo y artefactos de soporte del proceso de fusión.

## Estado actual

- **Fase 1 de infraestructura base: completada**
- **Bridge** con HTTP, health checks, PostgreSQL, Redis, gRPC base, WebSocket y REST fallback
- **Frontend** con Electron main/preload + renderer React
- **Engines base** alineados para ThunderKoli, UniversalEngine y Design Studio
- **Contratos compartidos** en `shared/proto/` y `shared/types/`

## Dónde trabajar

```text
/Volumes/PROYECTOSAP/p11pro
├── fusion-workspace/
│   └── kolicode/              # Producto principal activo
├── .kiro/                     # Planes, specs y tracking de trabajo
├── docs/                      # Documentación raíz y material histórico
├── README.md                  # Este archivo
└── PROJECT_STRUCTURE.md       # Mapa actualizado del repo
```

## Estructura activa de KoliCode

```text
fusion-workspace/kolicode/
├── frontend/                  # Electron + React + TypeScript + Vite
├── backend/
│   ├── bridge/                # API Gateway / WebSocket / gRPC bridge
│   ├── thunderkoli/           # Seguridad y auditoría
│   └── universalengine/       # Servicios Kotlin/Ktor + área legacy/generados
├── creative/                  # Design Studio base (Python / GPU / color)
├── shared/                    # Tipos TS + contratos Protobuf
├── scripts/                   # Docker, DB, backups y utilidades
├── docs/                      # Documentación del producto
├── docker-compose.yml         # Infraestructura local principal
└── README.md                  # Documentación interna de KoliCode
```

## Documentación importante

- `PROJECT_STRUCTURE.md` — mapa del repo raíz actualizado
- `.kiro/specs/kolicode/FASE1-PLAN.md` — estado consolidado de Fase 1
- `fusion-workspace/kolicode/README.md` — guía principal del producto
- `fusion-workspace/kolicode/ARCHITECTURE.md` — arquitectura de tres capas
- `fusion-workspace/kolicode/backend/bridge/README.md` — estado y endpoints del Bridge
- `fusion-workspace/kolicode/shared/README.md` — contratos compartidos y Protobuf

## Flujo recomendado

1. Trabajar dentro de `fusion-workspace/kolicode/`
2. Usar `docker-compose.yml` del producto para PostgreSQL + Redis
3. Mantener README/docs alineados con el estado real, no con el plan original
4. Tratar `backend/universalengine/proyectos_generados/` como área a sanear o aislar, no como fuente canónica del producto

## Próximo foco

Con la infraestructura base cerrada, el siguiente trabajo debe concentrarse en:

- consolidación de `UniversalEngine` y su área de proyectos generados
- implementación funcional sobre los contratos ya definidos
- limpieza progresiva de residuos legacy sin romper compatibilidad

Para el detalle estructural actualizado del repo, ver `PROJECT_STRUCTURE.md`.
