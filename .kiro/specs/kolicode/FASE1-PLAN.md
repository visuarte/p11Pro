# Fase 1: Infraestructura Base - Plan de Acción

**Fecha:** 2026-05-15  
**Estado:** 100% Completada (20/20 subtasks)  
**Prioridad:** CRÍTICA - Bloqueante para Fase 2-6  
**Tiempo Estimado Restante:** ~19h

---

## 📊 Estado Actual (Mayo 2026)

### Resumen Ejecutivo

| Métrica | Valor | Notas |
|---------|-------|-------|
| **Subtasks Totales** | 20 | Divididas en 4 grupos principales |
| **Completadas** | 20 (100%) | ✅ 1.1, 1.2, 1.3, 1.4, 1.5, 2.1, 2.2, 2.3, 2.4, 2.5, 3.1, 3.2, 3.3, 3.4, 3.5, 4.1, 4.2, 4.3, 4.4, 4.5 |
| **En Progreso** | 0 | Pendiente retomar |
| **Bloqueadas** | 0 | Sin bloqueos activos en Task 3 |
| **Tiempo Usado** | ~66h | Setup CI/CD, TypeScript, Electron, Bridge, engines, persistencia y protocolos de comunicación completados |
| **Tiempo Restante** | 0h | Fase 1 cerrada |

---

## ✅ Tasks Completadas

### Task 1: Setup del Proyecto Base (100% completado)

- [x] **1.1 Inicializar monorepo** ✅
  - Estructura creada en `fusion-workspace/`
  - Directorios: kolicode/{frontend,backend,creative}
  - **Tiempo usado:** ~2h

- [x] **1.2 Configurar TypeScript workspace** ✅
  - `tsconfig.json` en frontend
  - TypeScript 5.6.3 configurado
  - **Tiempo usado:** ~1h

- [x] **1.3 Setup ESLint + Prettier + Husky** ✅
  - `eslint.config.js` (ESLint 10 flat config)
  - `.prettierrc` con formatting rules
  - `.husky/pre-commit` hook con lint-staged
  - Scripts: `lint`, `lint:fix`, `format`, `format:check`
  - **Tiempo usado:** 1.5h (estimado: 8h)

- [x] **1.4 Configurar Docker Compose** ✅
  - `docker-compose.yml` con PostgreSQL 16 + Redis 7
  - `.env.example` con variables configurables
  - Scripts: `docker:up`, `docker:down`, `docker:restart`, `docker:logs`
  - Health checks automáticos
  - **Tiempo usado:** 2h (estimado: 12h)

- [x] **1.5 Setup CI/CD pipeline** ✅
  - `.github/workflows/ci.yml`: build validation + npm ci fallback
  - `.github/workflows/qa-matrix.yml`: automated QA matrix
  - Node.js v24, artifacts upload, smoke tests
  - **Tiempo usado:** ~5h

---

## ⏳ Tasks Pendientes - CRÍTICAS

**No quedan pendientes críticos.** Tasks 1, 2, 3 y 4 están cerradas al 100%.

**Resultado:** Fase 1 quedó cerrada con Docker, persistencia, gRPC, WebSocket y fallback REST validados.

---

### Task 2: Arquitectura de Tres Capas - Base (100% completado)

**Estimado Total:** 24h  
**Prioridad:** CRÍTICA (fundación del proyecto)

- [x] **2.1 Crear estructura de directorios según design.md** ✅
  - **Estimado:** 2h
  - **Tiempo usado:** 1h (50% más rápido)
  - **Completado:** 2026-05-13
  - **Entregables completados:**
    - ✅ `frontend/src/main/` - Electron main process
    - ✅ `frontend/src/renderer/` - React app
    - ✅ `frontend/src/preload/` - Preload scripts
    - ✅ `backend/bridge/` - API Gateway con subdirectorios (routes, middleware, websocket, grpc)
    - ✅ `shared/types/` - TypeScript types compartidos
    - ✅ `shared/proto/` - Protocol Buffers definitions
    - ✅ `creative/gpu_workers/` - GPU worker pool
    - ✅ `creative/color_mgmt/` - Color management
    - ✅ 7 README.md files (~1,240 líneas de documentación)
    - ✅ ARCHITECTURE.md - Documentación de arquitectura de 3 capas
    - ✅ TASK_2.1_VERIFICATION.md - Verificación completa
  - **Estructura propuesta:**
    ```
    fusion-workspace/kolicode/
    ├── frontend/           # Capa 1: React + Electron
    │   ├── src/
    │   │   ├── main/      # Electron main process
    │   │   ├── renderer/  # React app
    │   │   ├── shared/    # Types, utils compartidos
    │   │   └── preload/   # Preload scripts
    │   └── electron.config.js
    │
    ├── backend/
    │   ├── bridge/        # Capa 2: API Gateway (Node.js)
    │   │   ├── src/
    │   │   │   ├── routes/
    │   │   │   ├── middleware/
    │   │   │   ├── websocket/
    │   │   │   └── grpc/
    │   │   └── package.json
    │   │
    │   ├── thunderkoli/   # Capa 3: Security Service (Node.js)
    │   │   ├── src/
    │   │   └── package.json
    │   │
    │   └── universalengine/ # Capa 3: AI Service (Kotlin)
    │       ├── src/
    │       └── build.gradle.kts
    │
    ├── creative/          # Design Studio (Python)
    │   ├── gpu_workers/
    │   ├── color_mgmt/
    │   └── requirements.txt
    │
    └── shared/
        ├── types/         # TypeScript types compartidos
        └── proto/         # Protobuf definitions
    ```

- [x] **2.2 Setup Electron main process** ✅
  - **Estimado:** 6h
  - **Tiempo usado:** ~6h
  - **Completado:** 2026-05-14
  - **Dependencias:** electron ^41.2.2, electron-builder
  - **Entregables completados:**
    - ✅ `frontend/package.json`: entrypoint Electron (`dist-electron/main/index.js`) y scripts `build:electron`, `electron:dev`, `electron:start`
    - ✅ `frontend/scripts/build-electron.mjs`: build de `src/main` y `src/preload` con esbuild
    - ✅ `frontend/src/main/index.ts`: bootstrap del main process y ciclo de vida de la app
    - ✅ `frontend/src/main/window.ts`: BrowserWindow, preload seguro y carga dev/prod
    - ✅ `frontend/src/main/ipc-handlers.ts`: handlers base (`app:ping`, `app:open-file`, `debug:ping-pong`, `update-settings`)
    - ✅ `frontend/src/main/settings-store.ts`: persistencia tipada de settings con zod
    - ✅ `frontend/src/preload/index.ts`: `contextBridge` expuesto como `window.electron`, `window.api` y `window.ipcRenderer`
    - ✅ `frontend/dist-electron/`: artefactos compilados de main/preload
    - ✅ Integración de DevTools en desarrollo

- [x] **2.3 Setup React renderer process** ✅
  - **Estimado:** 4h
  - **Tiempo usado:** ~4h
  - **Completado:** 2026-05-15
  - **Entregables completados:**
    - ✅ `frontend/src/main.ts`: montaje del renderer con `createRoot()`
    - ✅ `frontend/src/renderer/App.tsx`: raíz React del renderer
    - ✅ `frontend/src/renderer/RendererShellHost.tsx`: integración del shell actual dentro del árbol React
    - ✅ `frontend/src/renderer/components/RendererDiagnostics.tsx`: runtime diagnostics + IPC-backed settings
    - ✅ `frontend/src/renderer/electronBridge.ts`: bridge tipado para preload/context isolation
    - ✅ `frontend/src/stores/settingsStore.ts`: estado Zustand conectado al main process vía IPC
    - ✅ `frontend/src/renderer/README.md`: documentación alineada al estado real

- [x] **2.4 Setup Node.js Bridge (API Gateway)** ✅
  - **Estimado:** 8h
  - **Tiempo usado:** ~8h
  - **Completado:** 2026-05-15
  - **Stack:** Express.js, Socket.io, gRPC
  - **Entregables completados:**
    - ✅ `backend/bridge/src/index.ts`: bootstrap Express + HTTP server + Socket.io
    - ✅ `backend/bridge/src/routes/health.ts`: `/health`, `/health/ready`, `/health/alive`, `/health/detailed`
    - ✅ `backend/bridge/src/middleware/requestLogger.ts`: logging middleware con Winston
    - ✅ `backend/bridge/src/middleware/errorHandler.ts`: error handling middleware y `AppError`
    - ✅ `backend/bridge/src/middleware/rateLimiter.ts`: rate limiting sobre rutas API
    - ✅ `backend/bridge/src/websocket/server.ts`: setup base de WebSocket para colaboración
    - ✅ `backend/bridge/src/state/BridgeState.ts`: state machine base del gateway
    - ✅ `backend/bridge/src/utils/logger.ts`: logger estructurado para consola y archivos
    - ✅ `backend/bridge/package.json`: scripts `dev`, `build`, `start`, `typecheck`, `test`
    - ✅ Validación local: build TypeScript correcto y endpoints `/health` + `/api/bridge/state` respondiendo

- [x] **2.5 Setup Engine services base** ✅
  - **Estimado:** 4h
  - **Tiempo usado:** ~4h
  - **Completado:** 2026-05-15
  - **Servicios:**
    - ThunderKoli (Node.js, puerto 3001): package.json base y README
    - UniversalEngine (Kotlin, puerto 8080): Gradle setup operativo
    - Design Studio (Python, puerto 8081): `requirements.txt` y `server.py`
  - **Entregables completados:**
    - ✅ `backend/thunderkoli/package.json`: scripts base incluyendo `build`, `dev`, `start`, `test`
    - ✅ `backend/thunderkoli/server.js` y `backend/thunderkoli/src/server.js`: puerto por defecto alineado a `3001`
    - ✅ `backend/thunderkoli/README.md`: documentación base del servicio
    - ✅ `backend/universalengine/build.gradle.kts`: build base del servicio Kotlin
    - ✅ `backend/universalengine/settings.gradle.kts`: nombre del proyecto alineado a KoliCode
    - ✅ `backend/universalengine/gradle/wrapper/gradle-wrapper.jar`: wrapper regenerado y funcional
    - ✅ `creative/requirements.txt`: dependencias base para Design Studio
    - ✅ `creative/server.py`: scaffold base FastAPI con health endpoints y rutas placeholder
    - ✅ Validación local: `npm run build` en ThunderKoli, `./gradlew tasks --all` en UniversalEngine y `python3 -m py_compile server.py` en Design Studio

---

### Task 3: Base de Datos y Persistencia (100% completado)

**Estimado Total:** 16h  
**Prioridad:** ALTA (requerido para backend)  
**Dependencia:** Task 1.4 (Docker Compose) debe completarse primero

- [x] **3.1 Configurar PostgreSQL schema inicial** ✅
  - **Estimado:** 4h
  - **Tiempo usado:** ~4h
  - **Entregables completados:**
    - ✅ `backend/bridge/src/db/migrations/001_initial_schema.js`
    - ✅ Schema `kolicode` con tablas `users`, `projects`, `assets`, `audit_logs`
    - ✅ Índices base y triggers `updated_at`
    - ✅ `scripts/init-db.sql` mantenido para extensiones y bootstrap base
  - **Validación:** migración aplicada correctamente sobre PostgreSQL en Docker

- [x] **3.2 Setup Redis para caché y sesiones** ✅
  - **Estimado:** 2h
  - **Tiempo usado:** ~2h
  - **Uso base implementado:**
    - Session/cache client reusable
    - Health checks para readiness del Bridge
    - Base para JWT blacklist, rate limiting y presence
  - **Entregables completados:**
    - ✅ `backend/bridge/src/db/redis.ts`
    - ✅ `backend/bridge/src/routes/health.ts` con chequeo real de Redis

- [x] **3.3 Implementar migraciones automáticas** ✅
  - **Estimado:** 4h
  - **Tiempo usado:** ~4h
  - **Tool:** `node-pg-migrate`
  - **Scripts completados:**
    - ✅ `backend/bridge/package.json`: `npm run migrate:up`
    - ✅ `backend/bridge/package.json`: `npm run migrate:down`
    - ✅ `backend/bridge/package.json`: `npm run migrate:create`
    - ✅ `scripts/db-migrate.sh`
    - ✅ `package.json`: `db:migrate:up`, `db:migrate:down`, `db:migrate:create`

- [x] **3.4 Setup @seald-io/nedb para diagnósticos** ✅
  - **Estimado:** 3h
  - **Tiempo usado:** ~3h
  - **Uso:** Diagnósticos locales (lite database)
  - **Entregables completados:**
    - ✅ `backend/bridge/src/diagnostics/store.ts`
    - ✅ DB instance en `~/.kolicode/diagnostics.db`
    - ✅ Writes en background desde `requestLogger` y `errorHandler`
    - ✅ Estado visible en `/health/detailed`

- [x] **3.5 Configurar backup automático cada 10 minutos** ✅
  - **Estimado:** 3h
  - **Estado:** Implementado y validado
  - **Estrategia implementada:**
    - PostgreSQL: `pg_dump` cada 10 minutos
    - Retention: last 24 backups
    - Location: `backups/pg_<timestamp>.sql`
  - **Entregables implementados:**
    - ✅ `scripts/backup-db.sh`
    - ✅ `package.json`: `db:backup` y `db:backup:watch`
    - ✅ `.env.example`: `BACKUP_DIR`, `BACKUP_INTERVAL_SECONDS`, `BACKUP_RETENTION_COUNT`
    - ✅ Compatibilidad con Bash 3 de macOS sin `mapfile`
    - ✅ Ajuste de host Postgres en `5433` para evitar colisión con un Postgres local en `5432`
  - **Validación completada:**
    - ✅ `npm run docker:up`
    - ✅ `npm run db:migrate:up`
    - ✅ `npm run db:backup`
    - ✅ `/health/ready` y `/health/detailed` del Bridge con `database` y `redis` en estado `healthy`

---

### Task 4: Protocolos de Comunicación (60% completado)

**Estimado Total:** 16h  
**Prioridad:** ALTA (comunicación entre capas)  
**Dependencia:** Task 2 debe completarse primero

- [x] **4.1 Setup gRPC + Protocol Buffers** ✅
  - **Estimado:** 5h
  - **Uso:** Bridge ↔ Engine communication
  - **Completado:** 2026-05-15
  - **Entregables completados:**
    - ✅ `shared/proto/common.proto`: metadatos compartidos y health checks versionados
    - ✅ `shared/proto/bridge.proto`: `BridgeControlService` con `CheckHealth` y `GetBridgeState`
    - ✅ `shared/proto/engine.proto`: contratos base `ExecuteOperation` y `CheckHealth` para ThunderKoli, UniversalEngine y Design Studio
    - ✅ `backend/bridge/src/grpc/proto-loader.ts`: carga runtime de Protobuf con `@grpc/proto-loader`
    - ✅ `backend/bridge/src/grpc/clients.ts`: clientes gRPC base tipados para los Engines
    - ✅ `backend/bridge/src/grpc/server.ts`: servidor gRPC base del Bridge
    - ✅ `backend/bridge/src/grpc/generated/`: TypeScript generado desde `.proto` con `proto-loader-gen-types`
    - ✅ `backend/bridge/package.json`: script `npm run grpc:generate` integrado en `build` y `typecheck`
    - ✅ `.env.example` y `backend/bridge/.env.example`: targets gRPC y puerto del Bridge gRPC
  - **Validación completada:**
    - ✅ `npm run build` en `backend/bridge`
    - ✅ arranque local de Bridge con servidor gRPC en puerto temporal
    - ✅ `GET /health/ready` con `database` y `redis` en estado `healthy`
    - ✅ llamada gRPC real a `GetBridgeState` devolviendo `BRIDGE_LIFECYCLE_STATE_IDLE`

- [x] **4.2 Setup WebSocket server** ✅
  - **Estimado:** 4h
  - **Stack:** Socket.io
  - **Uso:** Bridge ↔ Frontend real-time
  - **Completado:** 2026-05-15
  - **Entregables completados:**
    - ✅ middleware de autenticación WebSocket con JWT y fallback anónimo solo en desarrollo
    - ✅ `backend/bridge/src/websocket/rooms.ts`: gestión base de rooms y presencia por proyecto
    - ✅ `backend/bridge/src/websocket/auth.ts`: parsing/validación de token y sesión del socket
    - ✅ `backend/bridge/src/websocket/ack.ts`: acknowledgements seguros en handlers Socket.io
    - ✅ `backend/bridge/src/websocket/server.ts`: `bridge:ping`, `bridge:pong`, `client:heartbeat`, `server:heartbeat`
    - ✅ `projectHandlers.ts` y `canvasHandlers.ts`: control de acceso por room, presencia y metadata de usuario
    - ✅ `.env.example` y `backend/bridge/.env.example`: `WS_ALLOW_ANONYMOUS`, `WS_HEARTBEAT_INTERVAL_MS`, `WS_HEARTBEAT_TIMEOUT_MS`
  - **Validación completada:**
    - ✅ `npm run build` en `backend/bridge`
    - ✅ conexión WebSocket anónima en desarrollo con `server:welcome`
    - ✅ `bridge:ping`/`bridge:pong`
    - ✅ `project:join` + `project:presence`
    - ✅ `client:heartbeat`
    - ✅ rechazo de token inválido con error `Invalid authentication token`

- [x] **4.3 Definir schemas Protobuf para RenderRequest** ✅
  - **Estimado:** 3h
  - **Completado:** 2026-05-15
  - **Entregables completados:**
    - ✅ `shared/proto/render.proto`: `RenderRequest`, `RenderOptions`, `RenderResponse`, `RenderService`
    - ✅ `shared/proto/engine.proto`: `DesignStudioService.RenderAsset(...)`
    - ✅ `backend/bridge/src/grpc/generated/kolicode/render/v1/*`: tipos TypeScript generados
    - ✅ `backend/bridge/package.json`: generación gRPC actualizada para incluir `render.proto`
    - ✅ `shared/README.md`: documentación del schema de render actualizada
  - **Validación completada:**
    - ✅ `npm run build` en `backend/bridge`
    - ✅ generación de `RenderRequest`, `RenderOptions` y `RenderResponse` en `src/grpc/generated/`

- [x] **4.4 Definir schemas Protobuf para DiagnosticCapture** ✅
  - **Estimado:** 2h
  - **Completado:** 2026-05-15
  - **Entregables completados:**
    - ✅ `shared/proto/diagnostic.proto`: `DiagnosticCapture`, `DiagnosticCaptureAck`, `DiagnosticService`, `DiagnosticLayer`, `DiagnosticSeverity`
    - ✅ `backend/bridge/package.json`: generación gRPC actualizada para incluir `diagnostic.proto`
    - ✅ `backend/bridge/src/grpc/generated/kolicode/diagnostic/v1/*`: tipos TypeScript generados
    - ✅ `backend/bridge/src/diagnostics/store.ts`: builder tipado `buildDiagnosticCapture(...)` y persistencia de `capture`
    - ✅ `shared/README.md`: documentación del schema de diagnósticos actualizada
  - **Validación completada:**
    - ✅ `npm run build` en `backend/bridge`
    - ✅ generación de `DiagnosticCapture`, `DiagnosticCaptureAck` y `DiagnosticService` en `src/grpc/generated/`
    - ✅ validación runtime del builder de `DiagnosticCapture` con capa `BRIDGE`, severidad `ERROR` y metadata serializada

- [x] **4.5 Implementar fallback REST endpoints** ✅
  - **Estimado:** 2h
  - **Completado:** 2026-05-15
  - **Razón:** Fallback si gRPC/WebSocket fallan
  - **Entregables completados:**
    - ✅ `backend/bridge/src/routes/render.ts`: `POST /api/render`
    - ✅ `backend/bridge/src/routes/diagnostics.ts`: `POST /api/diagnostics`
    - ✅ `backend/bridge/src/routes/projects.ts`: `GET /api/projects/:id` respaldado por PostgreSQL
    - ✅ `backend/bridge/src/index.ts`: wiring de rutas fallback
    - ✅ `backend/bridge/README.md`: endpoints fallback documentados
  - **Validación completada:**
    - ✅ `npm run build` en `backend/bridge`
    - ✅ `GET /api/projects/:id` devolviendo un proyecto real desde PostgreSQL
    - ✅ `POST /api/render` devolviendo asset fallback y persistiendo registro en `kolicode.assets`
    - ✅ `POST /api/diagnostics` devolviendo `DiagnosticCapture` y persistiendo entrada de diagnóstico

---

## 📅 Cronograma Sugerido (2 Desarrolladores)

### Sprint 1.1 - Semana 1 (Dev 1 + Dev 2)

**Objetivo:** Completar Task 1 y arrancar Task 2

| Día | Dev 1 | Dev 2 | Horas |
|-----|-------|-------|-------|
| Lun | 1.3 ESLint/Prettier setup | 2.1 Directorios + 2.2 Electron (inicio) | 8h |
| Mar | 1.3 Husky hooks + tests | 2.2 Electron main process | 8h |
| Mié | 1.4 Docker Compose PostgreSQL | 2.3 React renderer integration | 8h |
| Jue | 1.4 Docker Compose Redis + scripts | 2.4 Bridge base (Express) | 8h |
| Vie | 1.4 Testing Docker + docs | 2.4 Bridge (Socket.io, middleware) | 8h |

**Entregables Semana 1:**
- ✅ Task 1 100% completada (ESLint + Docker)
- ✅ Task 2: 100% completada (2.1-2.5)

---

### Sprint 1.2 - Semana 2 (Dev 1 + Dev 2)

**Objetivo:** Completar Task 2, Task 3, Task 4

| Día | Dev 1 | Dev 2 | Horas |
|-----|-------|-------|-------|
| Lun | 2.4 Bridge finalize ✅ + 2.5 Engine setup ✅ | 3.1 PostgreSQL schema ✅ | 8h |
| Mar | 4.1 gRPC + Protobuf base ✅ | 3.2 Redis ✅ + 3.3 Migrations ✅ | 8h |
| Mié | 4.3 RenderRequest proto ✅ | 3.4 NeDB diagnostics ✅ | 8h |
| Jue | 4.2 WebSocket server ✅ | 3.5 Backup automation ✅ | 8h |
| Vie | 4.4 DiagnosticCapture ✅ + 4.5 REST fallback ✅ | Integration testing ✅ | 8h |

**Entregables Semana 2:**
- ✅ Task 2 100% completada (Arquitectura)
- ✅ Task 3 100% completada (Database)
- ✅ Task 4 100% completada (gRPC, WebSocket, RenderRequest, DiagnosticCapture y REST fallback)
- ✅ **FASE 1 COMPLETADA**

---

## 🎯 Hitos y Criterios de Aceptación

### Hito 1.1: Code Quality Setup (Fin Día 2)
- [x] ESLint ejecuta sin errores
- [x] Prettier formatea según estándares
- [x] Pre-commit hooks funcionan
- [x] Docker Compose up/down exitoso

### Hito 1.2: Arquitectura Base (Fin Día 7)
- [x] Estructura de directorios completa
- [x] Electron arranca y renderiza React
- [x] Bridge responde en puerto 4000
- [x] Servicios Engine inicializables

### Hito 1.3: Persistencia (Fin Día 9)
- [x] PostgreSQL accesible desde Bridge
- [x] Redis funcional para sesiones
- [x] Migraciones ejecutan correctamente
- [x] Backups automáticos cada 10min

### Hito 1.4: Comunicación (Fin Día 10)
- [x] gRPC server Bridge → Engine funciona
- [x] WebSocket Frontend ↔ Bridge funciona
- [x] Schemas Protobuf versionados
- [x] DiagnosticCapture formalizado y conectado al flujo del Bridge
- [x] Fallback REST responde

### ✅ Fase 1 Completada Cuando:
1. Todos los 20 subtasks ✅
2. Tests y smoke tests de integración de la fase pasan ✅
3. Documentación actualizada por servicio y contrato ✅
4. Demo funcional: Frontend → Bridge → PostgreSQL ✅

---

## 🚧 Riesgos y Mitigaciones

| Riesgo | Probabilidad | Impacto | Mitigación |
|--------|--------------|---------|------------|
| Electron + React integration issues | Media | Alto | Usar electron-vite template, revisar docs oficiales |
| gRPC learning curve | Alta | Medio | Comenzar con ejemplos simples, incrementar complejidad |
| Docker en dev machines (M1/M2) | Media | Medio | Usar imágenes multi-arch (arm64/amd64) |
| Database migrations conflictos | Baja | Alto | Single source of truth, code review obligatorio |
| Tiempo estimado insuficiente | Media | Alto | Buffer +20% ya incluido en Sprint planning |

---

## 📚 Recursos y Referencias

### Documentación Técnica
- [Electron Quick Start](https://www.electronjs.org/docs/latest/tutorial/quick-start)
- [gRPC Node.js Guide](https://grpc.io/docs/languages/node/)
- [Socket.io Documentation](https://socket.io/docs/v4/)
- [PostgreSQL Best Practices](https://wiki.postgresql.org/wiki/Don%27t_Do_This)

### Código de Referencia
- `fusion-workspace/kolicode/frontend/vite.config.js`: Vite config actual
- `.github/workflows/qa-matrix.yml`: CI/CD patterns
- `fusion-workspace/reports/PR-16-QA-CHECKLIST.md`: QA standards

### Scripts Útiles
```bash
# Levantar servicios base
npm run docker:up

# Levantar entorno de desarrollo principal
npm run dev:all

# Aplicar migraciones y generar backup
npm run db:migrate:up
npm run db:backup
```

---

## 📝 Notas de Implementación

1. **Paralelización:** Dev 1 enfocado en infraestructura (Docker, DB), Dev 2 en arquitectura (Electron, Bridge)
2. **Testing continuo:** Cada subtask debe incluir smoke test antes de marcar como completada
3. **Documentation as Code:** README.md en cada servicio con setup, usage, troubleshooting
4. **Rollback plan:** Docker volumes nombrados para evitar pérdida de datos en restart
5. **Security first:** .env.example sin secrets, .gitignore actualizado

---

**Última actualización:** 2026-05-15  
**Autor:** Sistema automatizado  
**Revisión requerida:** PM/Tech Lead para cierre de Fase 1  
**Estado:** EN EJECUCIÓN - 2 subtasks pendientes
