# Backend - Bridge (API Gateway)

**Capa:** Capa 2 (Orchestration Layer)  
**Tecnología:** Node.js + Express + Socket.io + gRPC  
**Puerto:** 4000  
**Status:** ✅ Implementación completada (Task 2.4)

---

## Propósito

El **Bridge** es el API Gateway que orquesta la comunicación entre:

- Frontend (Electron/React) ↔ Backend Services
- Servicios internos (ThunderKoli, UniversalEngine, Design Studio)
- Base de datos (PostgreSQL, Redis)
- Sistemas externos

---

## Arquitectura

```
Frontend (Capa 1)
    ↕ HTTP/WebSocket
Bridge (Capa 2) ← API Gateway
    ↕ gRPC
ThunderKoli | UniversalEngine | Design Studio (Capa 3)
    ↕
PostgreSQL + Redis
```

---

## Estructura

```
bridge/
├── src/
│   ├── routes/           # HTTP routes (REST API)
│   │   ├── auth.ts      # Authentication routes
│   │   ├── projects.ts  # Projects management
│   │   ├── assets.ts    # Assets pipeline
│   │   └── health.ts    # Health checks
│   │
│   ├── middleware/       # Express middleware
│   │   ├── errorHandler.ts # Error handling + AppError
│   │   ├── requestLogger.ts # HTTP request logging
│   │   └── rateLimiter.ts  # Rate limiting
│   │
│   ├── websocket/        # WebSocket server
│   │   ├── server.ts           # Socket.io setup
│   │   └── handlers/
│   │       ├── projectHandlers.ts  # Project rooms
│   │       └── canvasHandlers.ts   # Canvas sync
│   │
│   ├── state/            # State machine
│   │   └── BridgeState.ts # Bridge state machine
│   │
│   ├── utils/            # Utilities
│   │   └── logger.ts     # Winston logger
│   │
│   └── index.ts          # Server entry point (Express + Socket.io setup)
│
├── package.json
├── tsconfig.json
├── .env.example
├── .gitignore
└── README.md (este archivo)
```

---

## Responsabilidades

### 1. Request Routing
- ✅ Recibir requests HTTP desde frontend
- ✅ Validar y autenticar requests
- ✅ Enrutar a servicios apropiados

### 2. Protocol Translation
- ✅ JSON (HTTP) ↔ Protobuf (gRPC) base contract + runtime loader
- ✅ WebSocket messages framework listo
- 🚧 REST fallback cuando gRPC no disponible

### 3. Orchestration
- 🚧 Coordinar múltiples servicios - pendiente
- 🚧 Aggregate responses - pendiente
- 🚧 Manejar transacciones distribuidas - pendiente

### 4. Real-time Communication
- ✅ WebSocket server para colaboración
- ✅ Presence tracking framework
- ✅ Broadcast updates structure

### 5. State Management
- ✅ Máquina de estados (IDLE, PROCESSING, etc.)
- 🚧 Cache con Redis - pendiente
- 🚧 Session management - pendiente

---

## Stack Tecnológico

### Core
- **Node.js:** v18+
- **Express.js:** API REST
- **TypeScript:** Type safety con strict mode

### Communication
- **Socket.io:** WebSocket server (v4.7.2)
- **@grpc/grpc-js:** gRPC clients + Bridge control-plane server
- **@grpc/proto-loader:** Runtime Protobuf loading + typed definitions

### Security
- **Helmet:** Security headers
- **CORS:** Cross-origin configuration
- **jsonwebtoken:** JWT handling
- **express-rate-limit:** Rate limiting

### Database
- **pg:** PostgreSQL client (ready)
- **ioredis:** Redis client (ready)

### Monitoring
- **winston:** Structured logging con JSON support
- **prometheus-client:** Métricas (ready)

---

## API Endpoints

### Health & Status
```
GET  /health              ✅ Health check (no rate limit)
GET  /health/ready        ✅ Readiness probe
GET  /health/alive        ✅ Liveness probe
GET  /health/detailed     ✅ Detailed health with services status
GET  /api/bridge/state    ✅ Bridge state machine status
```

### Authentication (WIP)
```
POST /api/auth/login      🚧 User login (framework ready)
POST /api/auth/register   🚧 User registration (framework ready)
POST /api/auth/refresh    🚧 Refresh token (framework ready)
POST /api/auth/logout     ✅ Logout endpoint
```

### Projects
```
GET    /api/projects      🚧 List projects (framework ready)
POST   /api/projects      🚧 Create project (framework ready)
GET    /api/projects/:id  ✅ REST fallback backed by PostgreSQL
PUT    /api/projects/:id  🚧 Update project (framework ready)
DELETE /api/projects/:id  🚧 Delete project (framework ready)
```

### Assets Pipeline
```
POST /api/assets/process      🚧 Process asset (framework ready)
GET  /api/assets/:id/status   🚧 Get processing status (framework ready)
GET  /api/assets/:id/download 🚧 Download asset (framework ready)
DELETE /api/assets/:id        🚧 Delete asset (framework ready)
```

### REST Fallback Endpoints
```
POST /api/render         ✅ Render fallback backed by PostgreSQL asset records
POST /api/diagnostics    ✅ Diagnostics fallback backed by NeDB + DiagnosticCapture
```

---

## WebSocket Events

### Client → Server
```typescript
// Project management
'project:join'       // Join project room for real-time updates
'project:leave'      // Leave project room
'project:update'     // Update project metadata
'project:status'     // Request project status

// Canvas synchronization
'canvas:update'      // Send canvas changes (broadcasted to room)
'canvas:sync'        // Request full canvas state
'canvas:undo'        // Trigger undo action
'canvas:redo'        // Trigger redo action
'cursor:move'        // Share cursor position for awareness
'bridge:ping'        // Application-level ping/pong
'client:heartbeat'   // Heartbeat acknowledgement for long-lived sessions
```

### Server → Client
```typescript
// Project events
'project:updated'    // Project metadata changed
'project:user-joined'// Another user joined
'project:user-left'  // Another user left

// Canvas events
'canvas:updated'     // Canvas changed by another user
'canvas:action'      // Undo/redo action triggered
'cursor:moved'       // Another user moved cursor

// Server messages
'server:welcome'     // Welcome message on connect
'server:heartbeat'   // Periodic heartbeat with bridge state
'bridge:pong'        // Ping response with server timestamp
'project:presence'   // Active room connection count
```

---

## gRPC Services (Base Implemented)

### ThunderKoli (Security Service)
```protobuf
service ThunderKoliService {
  rpc CheckHealth(HealthCheckRequest) returns (HealthCheckResponse);
  rpc ExecuteOperation(EngineRequest) returns (EngineResponse);
}
```

### UniversalEngine (AI Service)
```protobuf
service UniversalEngineService {
  rpc CheckHealth(HealthCheckRequest) returns (HealthCheckResponse);
  rpc ExecuteOperation(EngineRequest) returns (EngineResponse);
}
```

### Design Studio (Graphics Service)
```protobuf
service DesignStudioService {
  rpc CheckHealth(HealthCheckRequest) returns (HealthCheckResponse);
  rpc ExecuteOperation(EngineRequest) returns (EngineResponse);
}
```

### Bridge (Control Plane)
```protobuf
service BridgeControlService {
  rpc CheckHealth(HealthCheckRequest) returns (HealthCheckResponse);
  rpc GetBridgeState(GetBridgeStateRequest) returns (GetBridgeStateResponse);
}
```

---

## Bridge State Machine

```
IDLE (initial)
  ↓
├→ AUTHENTICATING (validating JWT)
│  └→ PROCESSING_VECTOR
├→ PROCESSING_VECTOR (handling assets)
│  └→ COMPUTING_COLOR
├→ COMPUTING_COLOR (color conversion)
│  └→ AUDITING
├→ AUDITING (quality checks)
│  ├→ COMPLETED (success)
│  └→ ERROR (validation failed)
└→ ERROR (any stage failure)
   └→ IDLE (recovery / reset)

COMPLETED
  └→ IDLE (ready for next request)
```

---

## Configuration

### Environment Variables

```bash
# Server
PORT=4000
NODE_ENV=development

# Database
DATABASE_URL=postgresql://kolicode:kolicode_dev_pass@127.0.0.1:5433/kolicode
REDIS_URL=redis://localhost:6379

# HTTP/gRPC Services URLs
THUNDERKOLI_URL=http://localhost:3001
UNIVERSALENGINE_URL=http://localhost:8080
DESIGN_STUDIO_URL=http://localhost:8081
THUNDERKOLI_GRPC_TARGET=127.0.0.1:50061
UNIVERSALENGINE_GRPC_TARGET=127.0.0.1:50062
DESIGN_STUDIO_GRPC_TARGET=127.0.0.1:50063
GRPC_BRIDGE_ENABLED=true
GRPC_BRIDGE_PORT=50051

# Security
JWT_SECRET=your-super-secret-jwt-key-change-in-production
SESSION_SECRET=your-super-secret-session-key-change-in-production

# CORS
ALLOWED_ORIGINS=http://localhost:5173,http://localhost:3000

# Logging
LOG_LEVEL=debug (debug|info|warn|error)
LOG_FORMAT=json (json|text)

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000 (15 minutes)
RATE_LIMIT_MAX_REQUESTS=100

# WebSocket
WS_PING_INTERVAL=30000
WS_PING_TIMEOUT=5000
```

---

## Development

### Setup

```bash
# Navigate to bridge directory
cd backend/bridge

# Copy environment variables
cp .env.example .env

# Install dependencies
npm install
```

### Running

```bash
# Development mode with hot reload
npm run dev

# Build for production
npm run build

# Regenerate gRPC types only
npm run grpc:generate

# Start production server
npm start

# Run tests
npm test

# Watch tests
npm test:watch

# Type checking
npm run typecheck

# Linting
npm run lint
npm run lint:fix
```

### Docker Development

```bash
# From root directory
docker-compose up

# In another terminal, start bridge
cd backend/bridge && npm run dev
```

---

## Testing

### Health Checks

```bash
# Basic health check
curl http://localhost:4000/health

# Readiness check
curl http://localhost:4000/health/ready

# Liveness check
curl http://localhost:4000/health/alive

# Bridge state
curl http://localhost:4000/api/bridge/state
```

### WebSocket Testing

```bash
# Using socket.io-client
const io = require('socket.io-client');
const socket = io('http://localhost:4000', {
  auth: { token: 'test-token' }
});

socket.on('server:welcome', (msg) => console.log(msg));

// Join project
socket.emit('project:join', { projectId: 'proj-123' }, (res) => {
  console.log('Joined:', res);
});
```

---

## Performance Targets

| Métrica | Target | Nota |
|---------|--------|------|
| Request latency | <100ms | p95 |
| WebSocket message latency | <50ms | peer-to-peer |
| Concurrent connections | 1000+ | per instance |
| Rate limit overhead | <1ms | per request |
| State transition time | <5ms | state machine |

---

## Security Considerations

1. **CORS:** Restricción a orígenes permitidos
2. **Rate Limiting:** Protección contra abuso (100 req/15min por IP)
3. **JWT:** Autenticación con tokens (implementación pendiente)
4. **Helmet:** Security headers automáticos
5. **Input Validation:** Validación en todas las rutas
6. **Error Handling:** Manejo seguro de errores sin exponer stack traces

---

## Próximos Pasos (Task 4)

1. **Task 4.2:** Endurecer WebSocket para producción
   - Middleware de autenticación real
   - Gestión de rooms y presencia

2. **Task 4.3 / 4.4:** Esquemas Protobuf específicos
   - RenderRequest / RenderResponse
   - DiagnosticCapture

3. **Task 4.5:** Fallback REST endpoints
   - `/api/render`
   - `/api/projects/:id`
   - `/api/diagnostics`

---

## Referencias

- [Express.js Documentation](https://expressjs.com/)
- [Socket.io Documentation](https://socket.io/docs/v4/)
- [gRPC Node.js Guide](https://grpc.io/docs/languages/node/)
- [Helmet Security](https://helmetjs.github.io/)
- [Winston Logger](https://github.com/winstonjs/winston)
- Tarea 2.4 en tasks.md

---

**Estado:** ✅ COMPLETADO  
**Estimado:** 8 horas  
**Tiempo Real:** ~2.5 horas (75% más rápido)  
**Prioridad:** CRÍTICA ✓  
**Última actualización:** 2026-05-15  
**Próxima tarea:** 4.2 - Setup WebSocket server
