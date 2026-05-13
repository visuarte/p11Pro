# Backend - Bridge (API Gateway)

**Capa:** Capa 2 (Orchestration Layer)  
**Tecnología:** Node.js + Express + Socket.io + gRPC  
**Puerto:** 4000

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
│   │   ├── auth.ts      # JWT validation
│   │   ├── cors.ts      # CORS configuration
│   │   ├── ratelimit.ts # Rate limiting
│   │   ├── logging.ts   # Request logging
│   │   └── error.ts     # Error handling
│   │
│   ├── websocket/        # WebSocket server
│   │   ├── server.ts    # Socket.io server
│   │   ├── handlers.ts  # Message handlers
│   │   └── rooms.ts     # Room management
│   │
│   ├── grpc/             # gRPC clients
│   │   ├── thunder.ts   # ThunderKoli client
│   │   ├── engine.ts    # UniversalEngine client
│   │   └── studio.ts    # Design Studio client
│   │
│   ├── services/         # Business logic
│   ├── models/           # Data models
│   ├── utils/            # Utilities
│   └── index.ts          # Server entry point
│
├── package.json
├── tsconfig.json
└── README.md (este archivo)
```

---

## Responsabilidades

### 1. Request Routing
- Recibir requests HTTP desde frontend
- Validar y autenticar requests
- Enrutar a servicios apropiados

### 2. Protocol Translation
- JSON (HTTP) ↔ Protobuf (gRPC)
- WebSocket messages ↔ gRPC streams
- REST fallback cuando gRPC no disponible

### 3. Orchestration
- Coordinar múltiples servicios
- Aggregate responses
- Manejar transacciones distribuidas

### 4. Real-time Communication
- WebSocket server para colaboración
- Presence tracking
- Broadcast updates

### 5. State Management
- Máquina de estados (IDLE, PROCESSING, etc.)
- Cache con Redis
- Session management

---

## Stack Tecnológico

### Core
- **Node.js:** v18+
- **Express.js:** API REST
- **TypeScript:** Type safety

### Communication
- **Socket.io:** WebSocket server
- **@grpc/grpc-js:** gRPC client
- **@grpc/proto-loader:** Protobuf support

### Database
- **pg:** PostgreSQL client
- **ioredis:** Redis client

### Monitoring
- **winston/pino:** Logging
- **prometheus-client:** Métricas

---

## API Endpoints

### Health & Status
```
GET  /health              Health check
GET  /metrics             Prometheus metrics
GET  /status              Bridge state
```

### Authentication
```
POST /auth/login          User login
POST /auth/refresh        Refresh token
POST /auth/logout         Logout
```

### Projects
```
GET    /projects          List projects
POST   /projects          Create project
GET    /projects/:id      Get project
PUT    /projects/:id      Update project
DELETE /projects/:id      Delete project
```

### Assets Pipeline
```
POST /assets/process      Process asset
GET  /assets/:id/status   Get processing status
GET  /assets/:id/download Download processed asset
```

---

## WebSocket Events

### Client → Server
```typescript
'project:join'       // Join project room
'project:leave'      // Leave project room
'canvas:update'      // Canvas change
'cursor:move'        // Cursor position
```

### Server → Client
```typescript
'project:updated'    // Project changed
'user:joined'        // User joined room
'user:left'          // User left room
'canvas:synced'      // Canvas synchronized
```

---

## gRPC Services

### ThunderKoli (Security Service)
```protobuf
service ThunderKoli {
  rpc Authenticate(AuthRequest) returns (AuthResponse);
  rpc ValidateToken(TokenRequest) returns (TokenResponse);
  rpc Encrypt(EncryptRequest) returns (EncryptResponse);
}
```

### UniversalEngine (AI Service)
```protobuf
service UniversalEngine {
  rpc ProcessPrompt(PromptRequest) returns (PromptResponse);
  rpc GenerateCode(CodeRequest) returns (CodeResponse);
}
```

### Design Studio (Graphics Service)
```protobuf
service DesignStudio {
  rpc RenderAsset(RenderRequest) returns (RenderResponse);
  rpc ConvertColor(ColorRequest) returns (ColorResponse);
}
```

---

## State Machine

```
IDLE
  → AUTHENTICATING
  → PROCESSING_VECTOR
  → COMPUTING_COLOR
  → AUDITING
  → COMPLETED
  → ERROR (rollback)
```

---

## Environment Variables

```bash
PORT=4000
NODE_ENV=development

# Database
DATABASE_URL=postgresql://kolicode:pass@localhost:5432/kolicode
REDIS_URL=redis://localhost:6379

# Services
THUNDERKOLI_URL=localhost:3001
UNIVERSALENGINE_URL=localhost:8080
DESIGN_STUDIO_URL=localhost:8081

# Security
JWT_SECRET=your-secret-key
SESSION_SECRET=your-session-secret
```

---

## Development

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Start production server
npm start

# Run tests
npm test
```

---

## Referencias

- [Express.js Documentation](https://expressjs.com/)
- [Socket.io Documentation](https://socket.io/docs/v4/)
- [gRPC Node.js Guide](https://grpc.io/docs/languages/node/)
- Task 2.4 en FASE1-PLAN.md

---

**Estado:** 🚧 Pendiente implementación (Task 2.4)  
**Estimado:** 8 horas  
**Prioridad:** CRÍTICA  
**Última actualización:** 2026-05-13

