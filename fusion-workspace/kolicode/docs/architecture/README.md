# Architecture Diagrams - KoliCode

Este directorio centraliza diagramas visuales para complementar `docs/ARCHITECTURE.md` y `docs/INTEGRATION_CONTRACTS.md`.

## Component Diagram

```mermaid
flowchart TD
    User[Usuario]
    Frontend[Frontend\nElectron + React + TypeScript]
    Bridge[Bridge\nNode.js API Gateway]
    Thunder[ThunderKoli\nSecurity + Vault + Audit]
    Universal[UniversalEngine\nAI + Knowledge Hub]
    Design[Design Studio\nRendering + Color + GPU]
    Postgres[(PostgreSQL)]
    Redis[(Redis)]

    User --> Frontend
    Frontend -->|HTTP / WebSocket / IPC| Bridge
    Bridge -->|gRPC / HTTP interno| Thunder
    Bridge -->|gRPC / HTTP interno| Universal
    Bridge -->|gRPC / HTTP interno| Design
    Bridge --> Postgres
    Bridge --> Redis
    Thunder --> Postgres
    Thunder --> Redis
    Universal --> Postgres
    Design --> Postgres
```

## Authentication Sequence

```mermaid
sequenceDiagram
    participant U as Usuario
    participant F as Frontend
    participant B as Bridge
    participant T as ThunderKoli
    participant R as Redis

    U->>F: Envia credenciales
    F->>B: POST /auth/login
    B->>B: Valida request y aplica rate limiting
    B->>T: Authenticate
    T->>T: Verifica identidad y politicas
    T-->>B: Token + contexto de sesion
    B->>R: Guarda sesion / refresh metadata
    B-->>F: JWT + respuesta autenticada
    F-->>U: Sesion iniciada
```

## Render / Asset Processing Sequence

```mermaid
sequenceDiagram
    participant U as Usuario
    participant F as Frontend
    participant B as Bridge
    participant D as Design Studio
    participant T as ThunderKoli

    U->>F: Solicita render o export
    F->>B: POST /api/assets/process
    B->>B: Autentica, valida y normaliza payload
    B->>D: RenderAsset / ConvertColor
    D->>D: Ejecuta pipeline GPU y color
    D-->>B: Resultado + metadata tecnica
    B->>T: Audit / sign when required
    T-->>B: Audit record / signature
    B-->>F: Estado final + payload agregado
    F-->>U: Resultado visible
```

## Bridge State Machine

```mermaid
stateDiagram-v2
    [*] --> IDLE
    IDLE --> AUTHENTICATING: request recibida
    AUTHENTICATING --> PROCESSING: token valido
    AUTHENTICATING --> ERROR: auth invalida
    PROCESSING --> COLLABORATING: evento en tiempo real
    PROCESSING --> AUDITING: operacion critica
    PROCESSING --> COMPLETED: respuesta lista
    COLLABORATING --> PROCESSING: sync confirmada
    AUDITING --> COMPLETED: audit persistido
    PROCESSING --> ERROR: fallo de engine o contrato
    AUDITING --> ERROR: fallo de auditoria
    ERROR --> IDLE: reset / recovery
    COMPLETED --> IDLE: listo para siguiente request
```

## Uso recomendado

1. Mantener estos diagramas alineados con cambios en rutas, contratos o modulos.
2. Referenciar este directorio desde README y documentacion de arquitectura.
3. Extender con diagramas de error handling, retries y versionado cuando esos contratos se formalicen.
