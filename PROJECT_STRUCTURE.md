# PROJECT_STRUCTURE.md

Mapa actualizado del repositorio raíz después del avance de la fusión inicial y del cierre de la **Fase 1: Infraestructura Base**.

> Este archivo sustituye la visión inicial de la primera fusión.
> El estado descrito aquí refleja el repo **tal como está hoy**, no el diseño original previo.

---

## 1. Vista general del repositorio

```text
p11pro/
├── .github/                           # Workflows de CI/CD del repo
├── .kiro/                             # Specs, planes y seguimiento operativo
├── docs/                              # Documentación raíz / histórica
├── fusion-workspace/                  # Workspace principal de consolidación
│   └── kolicode/                      # Producto activo
├── .ai/                               # Artefactos locales no funcionales del producto
├── README.md                          # Resumen raíz del repo
├── PROJECT_STRUCTURE.md               # Este archivo
├── WORKFLOW_PLAN.md                   # Material previo de proceso
└── WORKFLOW_COMPLETE.md               # Material previo de proceso
```

---

## 2. Workspace activo: `fusion-workspace/kolicode/`

```text
fusion-workspace/kolicode/
├── frontend/                          # Capa 1: Electron + React
├── backend/
│   ├── bridge/                        # Capa 2: API Gateway / orchestration
│   ├── thunderkoli/                   # Capa 3: seguridad / vault / auditoría
│   └── universalengine/               # Capa 3: IA / Kotlin / zona legacy
├── creative/                          # Design Studio base (Python)
├── shared/                            # Contratos y tipos compartidos
├── scripts/                           # Docker, DB, backups y utilidades
├── docs/                              # Docs específicas del producto
├── docker-compose.yml                 # Infraestructura local
├── package.json                       # Scripts raíz del workspace
└── README.md                          # Guía principal de KoliCode
```

---

## 3. Arquitectura funcional actual

### Capa 1 — Frontend

```text
frontend/
├── src/main/                          # Electron main process
├── src/preload/                       # Secure bridge / IPC exposure
├── src/renderer/                      # React app
├── src/stores/                        # Estado del renderer
├── dist-electron/                     # Build de Electron
└── package.json
```

**Estado actual**
- Electron main/preload configurados
- Renderer React operativo
- IPC y settings store base implementados

### Capa 2 — Bridge

```text
backend/bridge/
├── src/routes/                        # Health, projects, render, diagnostics...
├── src/middleware/                    # Logging, errors, rate limit
├── src/websocket/                     # Auth, rooms, handlers, heartbeat
├── src/grpc/                          # Loader, clients, server, generated types
├── src/db/                            # PostgreSQL, Redis, migrations
├── src/diagnostics/                   # Datastore / DiagnosticCapture mapping
├── src/state/                         # Bridge state machine
└── package.json
```

**Estado actual**
- HTTP + readiness/liveness/detailed health
- PostgreSQL y Redis conectados
- base gRPC + Protobuf implementada
- WebSocket con auth, presence y heartbeat
- REST fallback para `projects/:id`, `render` y `diagnostics`

### Capa 3 — Engines

```text
backend/thunderkoli/                   # Node.js
backend/universalengine/               # Kotlin + Ktor
creative/                              # Python / Design Studio base
```

**Estado actual**
- `thunderkoli/`: base de servicio alineada y documentada
- `universalengine/`: build base operativo, pero con residuos legacy/generados aún por consolidar
- `creative/`: scaffold Python con workers/color management base

---

## 4. Shared contracts

```text
shared/
├── types/                             # Tipos TypeScript compartidos
└── proto/
    ├── common.proto
    ├── bridge.proto
    ├── engine.proto
    ├── render.proto
    └── diagnostic.proto
```

**Estado actual**
- contratos versionados para Bridge, engines, render y diagnósticos
- generación de tipos gRPC conectada al Bridge

---

## 5. Infraestructura y persistencia

```text
fusion-workspace/kolicode/
├── docker-compose.yml
├── .env.example
└── scripts/
    ├── docker-up.sh
    ├── db-migrate.sh
    ├── backup-db.sh
    └── ...
```

**Estado actual**
- Docker Compose con PostgreSQL 16 + Redis 7
- puerto PostgreSQL del stack local movido para evitar colisiones del host
- migraciones y backup validados durante Fase 1

---

## 6. Zona a sanear: `backend/universalengine/proyectos_generados/`

```text
backend/universalengine/proyectos_generados/
├── proyecto_1
├── proyecto_2
├── ...
├── proyecto_18
├── proyecto_19
└── _legacy_import
```

**Interpretación actual**
- no es la fuente canónica del producto KoliCode
- contiene proyectos generados/arrastrados del flujo previo de UniversalEngine
- debe tratarse como **área de consolidación o archivo**, no como estructura principal de producto

**Recomendación estructural**
1. extraer una única plantilla canónica reutilizable
2. dejar `proyectos_generados/` solo para instancias temporales o archivadas
3. limpiar residuos legacy de forma no destructiva y documentada

---

## 7. Estado documental correcto

Los documentos que hoy deben considerarse fuente de verdad son:

- `README.md` (raíz) — orientación del monorepo
- `PROJECT_STRUCTURE.md` — mapa estructural actualizado
- `.kiro/specs/kolicode/FASE1-PLAN.md` — estado de Fase 1
- `fusion-workspace/kolicode/README.md` — guía principal del producto
- `fusion-workspace/kolicode/ARCHITECTURE.md` — arquitectura funcional

Los documentos heredados del primer momento de fusión deben leerse como **históricos**, no como descripción exacta del presente.

---

## 8. Resumen ejecutivo

- El **producto activo** es `fusion-workspace/kolicode/`
- La **infraestructura base de Fase 1** está completada
- El **Bridge** ya es la pieza central de integración
- `UniversalEngine` sigue siendo el principal punto de consolidación/limpieza pendiente
- La documentación raíz queda ahora alineada para seguir implementando features sin arrastrar la visión antigua de la primera fusión
