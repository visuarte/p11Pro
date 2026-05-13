# Shared - Types & Protocols

**Ubicación:** Raíz del proyecto  
**Propósito:** Código compartido entre capas  
**Tecnología:** TypeScript + Protobuf

---

## Propósito

El directorio **shared/** contiene código compartido entre todas las capas:

- **types/**: TypeScript types y interfaces
- **proto/**: Protocol Buffers definitions (gRPC)

---

## Estructura

```
shared/
├── types/                 # TypeScript types compartidos
│   ├── user.ts           # User-related types
│   ├── project.ts        # Project types
│   ├── canvas.ts         # Canvas types
│   ├── asset.ts          # Asset types
│   ├── api.ts            # API request/response types
│   └── index.ts          # Re-exports
│
└── proto/                # Protocol Buffers definitions
    ├── bridge.proto      # Bridge ↔ Services
    ├── engine.proto      # Engine RPCs
    ├── render.proto      # Render requests
    ├── diagnostic.proto  # Diagnostic capture
    └── common.proto      # Common messages
```

---

## TypeScript Types

### Ejemplo: User Types

```typescript
// shared/types/user.ts
export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  createdAt: Date;
  updatedAt: Date;
}

export enum UserRole {
  VIEWER = 'viewer',
  EDITOR = 'editor',
  ADMIN = 'admin'
}

export interface AuthToken {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}
```

### Ejemplo: Project Types

```typescript
// shared/types/project.ts
export interface Project {
  id: string;
  name: string;
  ownerId: string;
  canvasData: CanvasData;
  assets: Asset[];
  collaborators: Collaborator[];
  createdAt: Date;
  updatedAt: Date;
}

export interface CanvasData {
  width: number;
  height: number;
  layers: Layer[];
  backgroundColor: string;
}

export interface Layer {
  id: string;
  name: string;  type: LayerType;
  visible: boolean;
  locked: boolean;
  opacity: number;
  elements: CanvasElement[];
}
```

---

## Protocol Buffers

### Ejemplo: Bridge Service

```protobuf
// shared/proto/bridge.proto
syntax = "proto3";

package bridge;

// Health check service
service Health {
  rpc Check(HealthCheckRequest) returns (HealthCheckResponse);
}

message HealthCheckRequest {
  string service = 1;
}

message HealthCheckResponse {
  enum Status {
    UNKNOWN = 0;
    HEALTHY = 1;
    UNHEALTHY = 2;
  }
  Status status = 1;
  string message = 2;
  int64 timestamp = 3;
}
```

### Ejemplo: Render Request

```protobuf
// shared/proto/render.proto
syntax = "proto3";

package render;

service RenderService {
  rpc RenderAsset(RenderRequest) returns (RenderResponse);
}

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

message RenderResponse {
  string asset_id = 1;
  bytes data = 2;
  int64 size_bytes = 3;
  string checksum = 4;
}
```

### Ejemplo: Diagnostic Capture

```protobuf
// shared/proto/diagnostic.proto
syntax = "proto3";

package diagnostic;

message DiagnosticCapture {
  string session_id = 1;
  Layer layer = 2;
  int64 timestamp_ms = 3;
  map<string, string> metadata = 4;
  bytes payload = 5;
}

enum Layer {
  UNKNOWN = 0;
  FRONTEND = 1;
  BRIDGE = 2;
  ENGINE = 3;
}
```

---

## Generación de Código

### TypeScript desde Protobuf

```bash
# Install protoc y plugins
npm install -g protoc-gen-ts

# Generate TypeScript from .proto files
protoc \
  --plugin=protoc-gen-ts=./node_modules/.bin/protoc-gen-ts \
  --ts_out=src/generated \
  --proto_path=shared/proto \
  shared/proto/*.proto
```

### Uso en Node.js

```typescript
import * as grpc from '@grpc/grpc-js';
import * as protoLoader from '@grpc/proto-loader';

const packageDefinition = protoLoader.loadSync(
  'shared/proto/bridge.proto',
  {
    keepCase: true,
    longs: String,
    enums: String,
    defaults: true,
    oneofs: true
  }
);

const proto = grpc.loadPackageDefinition(packageDefinition);
```

---

## Versionado

Las definiciones Protocol Buffers siguen **versionado semántico**:

```protobuf
syntax = "proto3";

package bridge.v1;  // Version 1

// Breaking changes → bridge.v2
// Compatible changes → mantener v1
```

---

## Best Practices

### TypeScript Types
1. ✅ **Usar interfaces** para objetos
2. ✅ **Usar enums** para constantes
3. ✅ **Strict typing** habilitado
4. ✅ **Documentar** con JSDoc
5. ✅ **Exportar todo** desde index.ts

### Protobuf
1. ✅ **Semantic versioning** en packages
2. ✅ **No breaking changes** en versiones existentes
3. ✅ **Reserved fields** para deprecations
4. ✅ **Comments** en cada message
5. ✅ **Consistent naming** (snake_case)

---

## Referencias

- [TypeScript Handbook](https://www.typescriptlang.org/docs/)
- [Protocol Buffers Guide](https://protobuf.dev/)
- [gRPC Node.js](https://grpc.io/docs/languages/node/)
- Task 4.1, 4.3, 4.4 en FASE1-PLAN.md

---

**Estado:** 🚧 Pendiente implementación (Task 4)  
**Última actualización:** 2026-05-13

