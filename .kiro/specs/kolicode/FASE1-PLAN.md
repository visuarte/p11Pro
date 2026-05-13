# Fase 1: Infraestructura Base - Plan de Acción

**Fecha:** 2026-05-13  
**Estado:** 20% Completada (4/20 subtasks)  
**Prioridad:** CRÍTICA - Bloqueante para Fase 2-6  
**Tiempo Estimado Restante:** 72h (~9 días con 2 devs)

---

## 📊 Estado Actual (Mayo 2026)

### Resumen Ejecutivo

| Métrica | Valor | Notas |
|---------|-------|-------|
| **Subtasks Totales** | 20 | Divididas en 4 grupos principales |
| **Completadas** | 4 (20%) | ✅ 1.1, 1.2, 1.5, (parcial) |
| **En Progreso** | 0 | Pendiente retomar |
| **Bloqueadas** | 0 | Ninguna bloqueada actualmente |
| **Tiempo Usado** | ~8h | Setup CI/CD, TypeScript, estructura base |
| **Tiempo Restante** | ~72h | ESLint/Prettier, Arquitectura, DB, Protocolos |

---

## ✅ Tasks Completadas

### Task 1: Setup del Proyecto Base (60% completado)

- [x] **1.1 Inicializar monorepo** ✅
  - Estructura creada en `fusion-workspace/`
  - Directorios: kolicode/{frontend,backend,creative}
  - **Tiempo usado:** ~2h

- [x] **1.2 Configurar TypeScript workspace** ✅
  - `tsconfig.json` en frontend
  - TypeScript 5.6.3 configurado
  - **Tiempo usado:** ~1h

- [x] **1.5 Setup CI/CD pipeline** ✅
  - `.github/workflows/ci.yml`: build validation + npm ci fallback
  - `.github/workflows/qa-matrix.yml`: automated QA matrix
  - Node.js v24, artifacts upload, smoke tests
  - **Tiempo usado:** ~5h

---

## ⏳ Tasks Pendientes - CRÍTICAS

### Task 1: Setup del Proyecto Base (40% pendiente)

- [ ] **1.3 Setup ESLint + Prettier + Husky** 🔴 CRÍTICO
  - **Estimado:** 8h
  - **Prioridad:** ALTA (garantiza code quality)
  - **Bloqueante para:** Task 2 (Arquitectura)
  - **Acción:**
    ```bash
    # ESLint config
    npm install --save-dev eslint @typescript-eslint/parser @typescript-eslint/eslint-plugin
    npx eslint --init
    
    # Prettier
    npm install --save-dev prettier eslint-config-prettier eslint-plugin-prettier
    
    # Husky (pre-commit hooks)
    npm install --save-dev husky lint-staged
    npx husky install
    ```
  - **Entregables:**
    - `.eslintrc.json` con reglas TypeScript/React
    - `.prettierrc` con formatting rules
    - `.husky/pre-commit` hook
    - `package.json` scripts: `lint`, `format`, `lint:fix`

- [ ] **1.4 Configurar Docker Compose** 🟡 MEDIA PRIORIDAD
  - **Estimado:** 12h
  - **Prioridad:** MEDIA (necesario para Task 3)
  - **Acción:**
    ```yaml
    # docker-compose.yml
    services:
      postgres:
        image: postgres:16-alpine
        environment:
          POSTGRES_DB: kolicode
          POSTGRES_USER: kolicode
          POSTGRES_PASSWORD: ${DB_PASSWORD}
        ports:
          - "5432:5432"
        volumes:
          - postgres_data:/var/lib/postgresql/data
      
      redis:
        image: redis:7-alpine
        ports:
          - "6379:6379"
        volumes:
          - redis_data:/data
    ```
  - **Entregables:**
    - `docker-compose.yml` en raíz
    - `.env.example` con variables requeridas
    - Scripts: `npm run docker:up`, `docker:down`
    - README con instrucciones de setup

---

### Task 2: Arquitectura de Tres Capas - Base (0% completado)

**Estimado Total:** 24h  
**Prioridad:** CRÍTICA (fundación del proyecto)

- [ ] **2.1 Crear estructura de directorios según design.md** 🔴
  - **Estimado:** 2h
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

- [ ] **2.2 Setup Electron main process** 🔴
  - **Estimado:** 6h
  - **Dependencias:** electron ^41.2.2, electron-builder
  - **Entregables:**
    - `src/main/index.ts`: main process entry
    - Window management
    - IPC handlers base
    - Dev tools integration

- [ ] **2.3 Setup React renderer process** 🔴
  - **Estimado:** 4h
  - **Ya parcialmente hecho** (Vite + React existe)
  - **Faltante:**
    - Integration con Electron renderer
    - IPC communication setup
    - Context isolation config

- [ ] **2.4 Setup Node.js Bridge (API Gateway)** 🔴
  - **Estimado:** 8h
  - **Stack:** Express.js, Socket.io, gRPC
  - **Entregables:**
    - Express server base (puerto 4000)
    - Health check endpoint (`/health`)
    - Logging middleware (winston/pino)
    - Error handling middleware

- [ ] **2.5 Setup Engine services base** 🔴
  - **Estimado:** 4h
  - **Servicios:**
    - ThunderKoli (Node.js, puerto 3001): package.json base
    - UniversalEngine (Kotlin, puerto 8080): Gradle setup
    - Design Studio (Python): requirements.txt
  - **Entregables:**
    - Estructura de directorios
    - Package managers configurados
    - Scripts de inicio básicos

---

### Task 3: Base de Datos y Persistencia (0% completado)

**Estimado Total:** 16h  
**Prioridad:** ALTA (requerido para backend)  
**Dependencia:** Task 1.4 (Docker Compose) debe completarse primero

- [ ] **3.1 Configurar PostgreSQL schema inicial** 🟡
  - **Estimado:** 4h
  - **Schema inicial:**
    - `users`: authentication, profiles
    - `projects`: canvas projects
    - `assets`: uploaded assets
    - `audit_logs`: security audit trail
  - **Acciones:**
    ```sql
    -- migrations/001_initial.sql
    CREATE TABLE users (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      email VARCHAR(255) UNIQUE NOT NULL,
      created_at TIMESTAMP DEFAULT NOW()
    );
    
    CREATE TABLE projects (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      owner_id UUID REFERENCES users(id),
      name VARCHAR(255) NOT NULL,
      canvas_data JSONB,
      created_at TIMESTAMP DEFAULT NOW()
    );
    ```

- [ ] **3.2 Setup Redis para caché y sesiones** 🟡
  - **Estimado:** 2h
  - **Uso:**
    - Session storage
    - JWT token blacklist
    - Rate limiting counters
    - WebSocket presence
  - **Cliente:** ioredis

- [ ] **3.3 Implementar migraciones automáticas** 🟡
  - **Estimado:** 4h
  - **Tool:** node-pg-migrate o Prisma
  - **Scripts:**
    - `npm run migrate:up`
    - `npm run migrate:down`
    - `npm run migrate:create <name>`

- [ ] **3.4 Setup @seald-io/nedb para diagnósticos** 🟢
  - **Estimado:** 3h
  - **Uso:** Diagnósticos locales (lite database)
  - **Entregables:**
    - DB instance en `~/.kolicode/diagnostics.db`
    - Write operations sin bloquear main thread

- [ ] **3.5 Configurar backup automático cada 10 minutos** 🟢
  - **Estimado:** 3h
  - **Estrategia:**
    - PostgreSQL: pg_dump cada 10min
    - Retention: last 24 backups (4 horas)
    - Location: `backups/pg_<timestamp>.sql`
  - **Script:**
    ```bash
    #!/bin/bash
    # scripts/backup-db.sh
    while true; do
      pg_dump -h localhost -U kolicode kolicode > "backups/pg_$(date +%s).sql"
      find backups/ -name "pg_*.sql" | sort -r | tail -n +25 | xargs rm -f
      sleep 600  # 10 minutos
    done
    ```

---

### Task 4: Protocolos de Comunicación (0% completado)

**Estimado Total:** 16h  
**Prioridad:** ALTA (comunicación entre capas)  
**Dependencia:** Task 2 debe completarse primero

- [ ] **4.1 Setup gRPC + Protocol Buffers** 🟡
  - **Estimado:** 5h
  - **Uso:** Bridge ↔ Engine communication
  - **Acciones:**
    ```bash
    npm install @grpc/grpc-js @grpc/proto-loader
    ```
  - **Entregables:**
    - `shared/proto/bridge.proto`: service definitions
    - `shared/proto/engine.proto`: engine RPCs
    - Generated TypeScript clients
    - Server base en Bridge

- [ ] **4.2 Setup WebSocket server** 🔴
  - **Estimado:** 4h
  - **Stack:** Socket.io
  - **Uso:** Bridge ↔ Frontend real-time
  - **Entregables:**
    - WebSocket server en Bridge (puerto 4000)
    - Authentication middleware
    - Room management base
    - Heartbeat/ping-pong

- [ ] **4.3 Definir schemas Protobuf para RenderRequest** 🟡
  - **Estimado:** 3h
  - **Schema:**
    ```protobuf
    // render_request.proto
    message RenderRequest {
      string project_id = 1;
      bytes canvas_data = 2;
      RenderOptions options = 3;
    }
    
    message RenderOptions {
      int32 width = 1;
      int32 height = 2;
      string format = 3;  // png, jpg, webp
      int32 quality = 4;
    }
    ```

- [ ] **4.4 Definir schemas Protobuf para DiagnosticCapture** 🟢
  - **Estimado:** 2h
  - **Schema:**
    ```protobuf
    message DiagnosticCapture {
      string session_id = 1;
      Layer layer = 2;  // FRONTEND, BRIDGE, ENGINE
      int64 timestamp_ms = 3;
      map<string, string> metadata = 4;
      bytes payload = 5;
    }
    ```

- [ ] **4.5 Implementar fallback REST endpoints** 🟢
  - **Estimado:** 2h
  - **Razón:** Fallback si gRPC/WebSocket fallan
  - **Endpoints:**
    - `POST /api/render`: render request
    - `GET /api/projects/:id`: get project
    - `POST /api/diagnostics`: capture diagnostic

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
- ✅ Task 2: 60% completada (2.1-2.3, parcial 2.4)

---

### Sprint 1.2 - Semana 2 (Dev 1 + Dev 2)

**Objetivo:** Completar Task 2, Task 3, Task 4

| Día | Dev 1 | Dev 2 | Horas |
|-----|-------|-------|-------|
| Lun | 2.4 Bridge finalize + 2.5 Engine setup | 3.1 PostgreSQL schema | 8h |
| Mar | 4.1 gRPC + Protobuf base | 3.2 Redis + 3.3 Migrations | 8h |
| Mié | 4.3 RenderRequest proto | 3.4 NeDB diagnostics | 8h |
| Jue | 4.2 WebSocket server | 3.5 Backup automation | 8h |
| Vie | 4.4 DiagnosticCapture + 4.5 REST fallback | Integration testing | 8h |

**Entregables Semana 2:**
- ✅ Task 2 100% completada (Arquitectura)
- ✅ Task 3 100% completada (Database)
- ✅ Task 4 100% completada (Protocolos)
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
- [x] Fallback REST responde

### ✅ Fase 1 Completada Cuando:
1. Todos los 20 subtasks ✅
2. Tests de integración pasan
3. Documentación actualizada (README por servicio)
4. Demo funcional: Frontend → Bridge → PostgreSQL

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
# Verificar estado Fase 1
npm run phase1:check

# Levantar servicios dev
npm run dev:all

# Tests de integración Fase 1
npm run test:phase1

# Generar reporte progreso
npm run tasks:report
```

---

## 📝 Notas de Implementación

1. **Paralelización:** Dev 1 enfocado en infraestructura (Docker, DB), Dev 2 en arquitectura (Electron, Bridge)
2. **Testing continuo:** Cada subtask debe incluir smoke test antes de marcar como completada
3. **Documentation as Code:** README.md en cada servicio con setup, usage, troubleshooting
4. **Rollback plan:** Docker volumes nombrados para evitar pérdida de datos en restart
5. **Security first:** .env.example sin secrets, .gitignore actualizado

---

**Última actualización:** 2026-05-13  
**Autor:** Sistema automatizado  
**Revisión requerida:** PM/Tech Lead antes Sprint 1.1  
**Estado:** LISTO PARA EJECUCIÓN

