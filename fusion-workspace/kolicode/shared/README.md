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

### Contratos implementados en `shared/proto/`

- `common.proto` - metadatos compartidos, health checks y enums base
- `bridge.proto` - control plane del Bridge (`CheckHealth`, `GetBridgeState`)
- `engine.proto` - contratos base Bridge ↔ ThunderKoli / UniversalEngine / Design Studio
- `render.proto` - `RenderRequest`, `RenderOptions` y `RenderResponse` para Design Studio
- `diagnostic.proto` - `DiagnosticCapture`, severidad/capa y `DiagnosticService`

### Ejemplo: Bridge Service

```protobuf
// shared/proto/bridge.proto
syntax = "proto3";

package kolicode.bridge.v1;

import "common.proto";

service BridgeControlService {
  rpc CheckHealth(kolicode.common.v1.HealthCheckRequest) returns (kolicode.common.v1.HealthCheckResponse);
  rpc GetBridgeState(GetBridgeStateRequest) returns (GetBridgeStateResponse);
}
```

### Ejemplo: Render Request

```protobuf
// shared/proto/render.proto
syntax = "proto3";

package kolicode.render.v1;

service RenderService {
  rpc RenderAsset(RenderRequest) returns (RenderResponse);
}

message RenderRequest {
  kolicode.common.v1.RequestMetadata metadata = 1;
  string project_id = 2;
  bytes canvas_data = 3;
  RenderOptions options = 4;
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
  string format = 5;
  int64 generated_at_ms = 6;
}
```

### Ejemplo: Diagnostic Capture

```protobuf
// shared/proto/diagnostic.proto
syntax = "proto3";

package kolicode.diagnostic.v1;

message DiagnosticCapture {
 kolicode.common.v1.RequestMetadata metadata = 1;
 DiagnosticLayer layer = 2;
  int64 timestamp_ms = 3;
 map<string, string> labels = 4;
  bytes payload = 5;
 string source = 6;
 string type = 7;
 DiagnosticSeverity severity = 8;
 string message = 9;
}

enum DiagnosticLayer {
 DIAGNOSTIC_LAYER_UNSPECIFIED = 0;
 DIAGNOSTIC_LAYER_FRONTEND = 1;
 DIAGNOSTIC_LAYER_BRIDGE = 2;
 DIAGNOSTIC_LAYER_ENGINE = 3;
}
```

---

## Generación de Código

### TypeScript desde Protobuf

```bash
# Desde backend/bridge
npm run grpc:generate
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

**Estado:** ✅ Contratos Protobuf base implementados (Tasks 4.1, 4.3, 4.4)  
**Última actualización:** 2026-05-15
