# KoliCode - Arquitectura de Tres Capas

**Fecha:** 2026-05-13  
**Versión:** 1.0  
**Estado:** Estructura base creada (Task 2.1 completada)

---

## 📐 Visión General

KoliCode implementa una **arquitectura de tres capas** para separar responsabilidades:

```
┌─────────────────────────────────────────────────┐
│          CAPA 1: FRONTEND                       │
│  Electron (Main + Renderer) + React            │
│  Puerto: 5173 (dev), N/A (prod)                │
└──────────────────┬──────────────────────────────┘
                   │ HTTP/WebSocket/IPC
┌──────────────────┴──────────────────────────────┐
│          CAPA 2: BRIDGE (API Gateway)           │
│  Node.js + Express + Socket.io + gRPC          │
│  Puerto: 4000                                   │
└──────────────────┬──────────────────────────────┘
                   │ gRPC/Protobuf
┌──────────────────┴──────────────────────────────┐
│          CAPA 3: ENGINES                        │
│  ┌─────────────┬──────────────┬──────────────┐  │
│  │ ThunderKoli │UniversalEngine│Design Studio│  │
│  │  (Node.js)  │   (Kotlin)    │  (Python)   │  │
│  │  Port: 3001 │  Port: 8080   │ Port: 8081  │  │
│  └─────────────┴──────────────┴──────────────┘  │
└─────────────────────────────────────────────────┘
                   │
┌──────────────────┴──────────────────────────────┐
│    PERSISTENCIA: PostgreSQL 16 + Redis 7        │
│    Ports: 5432, 6379                            │
└─────────────────────────────────────────────────┘
```

---

## 📁 Estructura de Directorios

```
kolicode/
├── frontend/              # CAPA 1: Frontend (Electron + React)
│   ├── src/
│   │   ├── main/         # Electron main process
│   │   ├── renderer/     # React app
│   │   ├── preload/      # Electron preload scripts
│   │   └── shared/       # Código compartido frontend
│   ├── package.json
│   └── vite.config.js
│
├── backend/               # CAPA 2 & 3: Backend services
│   ├── bridge/           # CAPA 2: API Gateway
│   │   ├── src/
│   │   │   ├── routes/
│   │   │   ├── middleware/
│   │   │   ├── websocket/
│   │   │   └── grpc/
│   │   └── package.json
│   │
│   ├── thunderkoli/      # CAPA 3: Security Service
│   │   ├── src/
│   │   └── package.json
│   │
│   └── universalengine/  # CAPA 3: AI Service
│       ├── src/
│       └── build.gradle.kts
│
├── creative/             # CAPA 3: Design Studio
│   ├── gpu_workers/
│   ├── color_mgmt/
│   └── requirements.txt
│
├── shared/               # Código compartido
│   ├── types/           # TypeScript types
│   └── proto/           # Protocol Buffers
│
├── docker-compose.yml   # Infraestructura
├── package.json         # Root scripts
└── README.md
```

---

## 🔄 Flujo de Comunicación

### 1. User Interaction → Render

```
User clicks button (React)
    ↓ IPC
Electron Main Process
    ↓ HTTP POST /api/render
Bridge validates + routes
    ↓ gRPC RenderRequest
Design Studio processes
    ↓ GPU workers render
    ↓ gRPC RenderResponse
Bridge aggregates response
    ↓ HTTP Response + WebSocket notify
React updates UI
    ↓
User sees result
```

### 2. Authentication Flow

```
User login (React)
    ↓ HTTP POST /auth/login
Bridge receives credentials
    ↓ gRPC Authenticate
ThunderKoli verifies
    ↓ JWT token generated
    ↓ Redis session stored
Bridge returns token
    ↓ HTTP Response
React stores token (memory)
```

### 3. Real-time Collaboration

```
User A edits canvas (React)
    ↓ WebSocket 'canvas:update'
Bridge broadcasts
    ├─→ User B (WebSocket)
    ├─→ User C (WebSocket)
    └─→ PostgreSQL (persist)
```

---

## 📦 Capa 1: Frontend

### Componentes

- **Main Process** (Node.js)
  - Window management
  - File system access
  - Native integrations
  - IPC handling

- **Renderer Process** (React)
  - UI components
  - Canvas editor
  - State management (Zustand)
  - HTTP/WebSocket client

- **Preload Scripts**
  - Secure IPC bridge
  - Context isolation
  - API exposure

### Tecnologías

- Electron 41.2.2
- React 18
- TypeScript 5.6.3
- Vite 8.0.12
- Tailwind CSS
- ESLint + Prettier

### Puertos

- Dev: 5173 (Vite dev server)
- Prod: N/A (bundled with Electron)

---

## 🌉 Capa 2: Bridge (API Gateway)

### Responsabilidades

- **Request Routing:** HTTP/WebSocket → gRPC
- **Protocol Translation:** JSON ↔ Protobuf
- **Authentication:** JWT validation
- **Rate Limiting:** Per-user limits
- **Caching:** Redis integration
- **State Management:** Bridge state machine
- **Real-time:** WebSocket server
- **Logging:** Structured logs

### Endpoints

```typescript
// Authentication
POST   /auth/login
POST   /auth/refresh
POST   /auth/logout

// Projects
GET    /projects
POST   /projects
GET    /projects/:id
PUT    /projects/:id
DELETE /projects/:id

// Assets
POST   /assets/process
GET    /assets/:id/status

// Health
GET    /health
GET    /metrics
```

### Tecnologías

- Node.js + Express
- Socket.io (WebSocket)
- @grpc/grpc-js (gRPC client)
- ioredis (Redis)
- pg (PostgreSQL)
- Winston/Pino (logging)

### Puerto

- 4000

---

## ⚙️ Capa 3: Engines

### ThunderKoli (Security Service)

**Propósito:** Authentication, encryption, audit

**Tecnología:** Node.js  
**Puerto:** 3001

**Features:**
- Vault AES-256-GCM
- PBKDF2 key derivation
- Key rotation (30 días)
- Audit trail (JSON logs)
- Multi-provider auth (Google + WhatsApp)
- QR token generation

---

### UniversalEngine (AI Service)

**Propósito:** AI-powered code generation

**Tecnología:** Kotlin + Ktor  
**Puerto:** 8080

**Features:**
- DeepSeek API integration
- GPT API integration
- Knowledge Hub
- Prompt processing (<10s)
- Iterative refinement

---

### Design Studio (Graphics Service)

**Propósito:** Vector rendering, color management

**Tecnología:** Python + GPU  
**Puerto:** 8081

**Features:**
- Blend2D vector rendering
- Little CMS color management
- MediaPipe pose detection
- GPU worker pool
- ICC profile support
- Spot colors + halftone

---

## 🔐 Seguridad

### Por Capa

**Capa 1 (Frontend):**
- Context isolation enabled
- Node integration disabled
- Content Security Policy
- Input validation

**Capa 2 (Bridge):**
- JWT authentication
- Rate limiting
- CORS configuration
- Request validation
- SQL injection prevention

**Capa 3 (Engines):**
- gRPC mTLS (mutual TLS)
- Service-to-service auth
- Audit logging
- Encryption at rest

---

## 📊 Base de Datos

### PostgreSQL 16

**Uso:**
- User accounts
- Projects
- Assets metadata
- Audit logs

**Schema:**
```sql
users
projects
assets
audit_logs
sessions
```

### Redis 7

**Uso:**
- Session store
- JWT token blacklist
- Rate limiting counters
- WebSocket presence
- Cache (>80% hit rate)

---

## 🔧 Protocolos de Comunicación

### Frontend ↔ Bridge

- **HTTP REST:** CRUD operations
- **WebSocket:** Real-time updates
- **IPC:** Electron main ↔ renderer

### Bridge ↔ Engines

- **gRPC:** Primary protocol
- **Protobuf:** Serialization
- **REST:** Fallback

---

## 📈 Performance Targets

| Métrica | Target | Capa |
|---------|--------|------|
| Canvas render | 60 FPS | Capa 1 |
| API response | <100ms p95 | Capa 2 |
| Asset processing | <30s | Capa 3 |
| Color conversion | <50ms | Capa 3 |
| DB query | <50ms p95 | Persistencia |
| Cache hit rate | >80% | Capa 2 + Redis |

---

## 🚀 Estado de Implementación

### Task 2.1: Estructura de Directorios ✅

- [x] frontend/src/main/ (Electron main)
- [x] frontend/src/renderer/ (React)
- [x] frontend/src/preload/ (Preload scripts)
- [x] backend/bridge/ (API Gateway)
- [x] shared/types/ (TypeScript types)
- [x] shared/proto/ (Protobuf definitions)
- [x] creative/gpu_workers/ (GPU pool)
- [x] creative/color_mgmt/ (Color management)
- [x] README.md en cada directorio
- [x] .gitkeep en directorios vacíos

### Pendientes (Tasks 2.2 - 2.5)

- [ ] Task 2.2: Electron main process setup
- [ ] Task 2.3: React renderer integration
- [ ] Task 2.4: Bridge implementation
- [ ] Task 2.5: Engine services base

---

## 📚 Referencias

- [Electron Architecture](https://www.electronjs.org/docs/latest/tutorial/process-model)
- [gRPC Best Practices](https://grpc.io/docs/guides/performance/)
- [Microservices Patterns](https://microservices.io/patterns/)
- design.md en .kiro/specs/kolicode/

---

**Mantenido por:** KoliCode Team  
**Última actualización:** 2026-05-13  
**Próximo milestone:** Task 2.2 (Electron setup)

