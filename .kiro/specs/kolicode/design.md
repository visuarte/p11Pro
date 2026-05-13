# Documento de Diseño - KoliCode

## Tabla de Contenidos

1. [Visión General](#visión-general)
2. [Arquitectura de Tres Capas](#arquitectura-de-tres-capas)
3. [Componentes Principales](#componentes-principales)
4. [Flujos de Datos Críticos](#flujos-de-datos-críticos)
5. [Contrato de Interfaz del Bridge](#contrato-de-interfaz-del-bridge)
6. [Decisiones de Diseño](#decisiones-de-diseño)
7. [Patrones de Implementación](#patrones-de-implementación)

---

## Visión General

KoliCode es un sistema integrado de desktop que fusiona cuatro componentes especializados en una arquitectura de **tres capas**:

```
┌─────────────────────────────────────────────────────────────┐
│  CAPA 1: FRONTEND (React + TypeScript + Electron)           │
│  - P10pro Canvas Editor                                      │
│  - UI Components & Design System                             │
│  - State Management (Zustand/Redux)                          │
│  - WebSocket Client                                          │
└────────────────────┬────────────────────────────────────────┘
                     │ WebSocket + JSON (UI Control)
                     │ gRPC + Protobuf (Heavy Data)
                     ▼
┌─────────────────────────────────────────────────────────────┐
│  CAPA 2: BRIDGE (Node.js Express + API Gateway)             │
│  - Request Routing & Orchestration                           │
│  - Data Transformation (JSON ↔ Binary)                       │
│  - Authentication & Authorization                            │
│  - Worker Pool Management                                    │
│  - State Synchronization                                     │
└────────────────────┬────────────────────────────────────────┘
                     │ gRPC + Protobuf (Binary Protocol)
                     │ REST + JSON (Legacy)
                     ▼
┌─────────────────────────────────────────────────────────────┐
│  CAPA 3: ENGINE (Backend Services + GPU Workers)            │
│  - ThunderKoli (Security & Audit)                            │
│  - UniversalEngine (AI Code Generation)                      │
│  - Design Studio (Graphics Processing)                       │
│  - GPU Workers (Blend2D, Little CMS, MediaPipe)              │
│  - PostgreSQL + Redis                                        │
└─────────────────────────────────────────────────────────────┘
```

---

## Arquitectura de Tres Capas

### Capa 1: Frontend (React + Electron)

**Responsabilidades:**
- Renderizar interfaz de usuario
- Capturar interacciones del usuario
- Mantener estado local de UI
- Comunicar con Bridge vía WebSocket
- Mostrar feedback visual en tiempo real

**Tecnologías:**
- React 18+ con TypeScript
- Electron para desktop
- Zustand/Redux para state management
- Tailwind CSS para estilos
- WebSocket para comunicación bidireccional

**Módulos Principales:**
- Canvas Editor - Editor visual interactivo (60 FPS)
- Design System - Componentes reutilizables (20+)
- State Store - Gestión de estado global
- API Client - Cliente HTTP/WebSocket centralizado

### Capa 2: Bridge (API Gateway + Orquestación)

**Responsabilidades:**
- Enrutar requests a servicios correctos
- Transformar datos entre formatos (JSON ↔ Protobuf)
- Manejar autenticación y autorización
- Orquestar operaciones complejas
- Sincronizar estado entre capas
- Gestionar workers paralelos

**Tecnologías:**
- Node.js + Express
- gRPC para comunicación binaria
- Protocol Buffers para serialización
- Worker Threads para paralelización
- Redis para caché y sesiones

**Máquina de Estados:**
```
BRIDGE_IDLE
  ↓
BRIDGE_PROCESSING_VECTOR (Blend2D)
  ↓
BRIDGE_COMPUTING_COLOR (Little CMS)
  ↓
BRIDGE_AUDITING (ThunderKoli)
  ↓
BRIDGE_IDLE (o BRIDGE_ERROR)
```

### Capa 3: Engine (Backend Services)

**Responsabilidades:**
- Procesar lógica de negocio
- Ejecutar operaciones gráficas intensivas
- Gestionar seguridad y auditoría
- Persistir datos en base de datos
- Generar código con IA

**Servicios:**
- ThunderKoli - Encriptación AES-256, auditoría, identidad
- UniversalEngine - Generación de código IA (DeepSeek/GPT)
- Design Studio - Procesamiento gráfico (Blend2D, Little CMS)
- GPU Workers - Operaciones paralelas en Python/C++

---

## Componentes Principales

### 1. Canvas Editor (Frontend)

**Características:**
- Precisión sub-pixel (3 decimales)
- Snapping inteligente (grid, guides, elementos)
- Undo/Redo ilimitado con historial visual
- Selección múltiple avanzada
- Transformaciones en tiempo real (60 FPS)
- Layers panel con jerarquía

**Flujo de Datos:**
```
User Action (move, rotate, scale)
  ↓
Canvas State Update (local)
  ↓
Render (60 FPS)
  ↓
Send to Bridge (WebSocket) - Debounced 100ms
  ↓
Bridge Validates & Broadcasts to Collaborators
```

### 2. Design System (Frontend)

**Componentes Base (20+):**
- Button, Input, Select, Checkbox, Radio
- Card, Modal, Tooltip, Popover
- Tabs, Accordion, Breadcrumb
- Alert, Badge, Progress, Spinner
- Form, Table, List, Grid

**Tokens:**
- Colors (primario, secundario, neutros)
- Tipografías (familias, pesos, tamaños)
- Espaciados (escala 4px, 8px, 12px...)
- Bordes y radios
- Sombras y efectos

### 3. Asset Pipeline (Bridge + Engine)

**Flujo Completo (<30s):**
```
1. User Input Prompt (Frontend)
   ↓
2. Bridge Receives & Validates (100ms)
   ↓
3. UniversalEngine Processes (5-10s)
   ↓
4. P10pro Refines Visually (5-10s)
   ↓
5. Design Studio Renders (5-10s)
   ↓
6. ThunderKoli Audits & Encrypts (1-2s)
   ↓
7. Download Link Generated (<1s)
```

### 4. Colaboración en Tiempo Real (Bridge)

**Mecanismo:**
- WebSocket connection per user
- Last-Write-Wins conflict resolution
- Operational Transformation (OT) para merges
- Presence awareness (avatares, cursores)
- Comment threads contextuales

**Latencias:**
- WebSocket connect: <500ms
- Change propagation: <100ms (p95)
- Presence update: <1s

### 5. Seguridad & Auditoría (ThunderKoli)

**Vault AES-256:**
- Encriptación por proyecto
- PBKDF2 key generation (100k iterations)
- Rotación automática (30 días)
- Desencriptación bajo demanda

**Audit Trail:**
- JSON structured logs
- Rotación automática (1MB)
- Retención: últimos 2000 registros
- Acciones: API_ACTION, SECRET_ACCESSED, SECURITY_VIOLATION

---

## Flujos de Datos Críticos

### Flujo 1: Edición de Canvas (60 FPS)

```
Frontend Canvas
  │
  ├─ User moves element (X=123.456)
  │
  ├─ Local state update (instant)
  │
  ├─ Render (16.67ms per frame)
  │
  └─ WebSocket send (debounced 100ms)
       │
       Bridge
       │
       ├─ Validate position
       │
       ├─ Broadcast to collaborators
       │
       └─ Persist to Redis cache
```

**Performance Targets:**
- Local render: <16.67ms (60 FPS)
- WebSocket latency: <100ms (p95)
- Broadcast to others: <100ms (p95)

### Flujo 2: Export Pipeline (Multi-capa)

```
P10pro Canvas
  │
  ├─ Generate export specs (JSON)
  │
  Bridge
  │
  ├─ Validate specs
  │
  ├─ Route to Design_Studio
  │
  Design_Studio (GPU Worker)
  │
  ├─ Render Blend2D (300 DPI)
  │
  ├─ Apply ICC profile (Little CMS)
  │
  ├─ Compress PNG/PDF
  │
  ThunderKoli
  │
  ├─ Sign digitally
  │
  ├─ Audit log
  │
  ├─ Encrypt if needed
  │
  Frontend
  │
  └─ Download link (<5MB)
```

**Latencias Máximas (p95):**
- Specs generation: <500ms
- Bridge routing: <100ms
- Blend2D render: <2s
- ICC transform: <50ms
- Compression: <1s
- Signing: <500ms
- Total: <5s

### Flujo 3: Importación Figma (Bridge Orchestration)

```
Frontend
  │
  ├─ Upload figma.json
  │
  Bridge
  │
  ├─ Parse JSON (100ms)
  │
  ├─ Validate structure (100ms)
  │
  ├─ Extract components (500ms)
  │
  ├─ Map design tokens (200ms)
  │
  ├─ Detect missing assets (300ms)
  │
  ├─ Generate report (100ms)
  │
  Frontend
  │
  └─ Display results + progress
```

**Target: <10s (p95) para 200+ elementos**

---

## Contrato de Interfaz del Bridge

### 1. Protocolo de Comunicación

**Frontend ↔ Bridge:**
- WebSocket para control de estado UI
- JSON para payloads de control
- Latencia máxima: 50ms (NFR-STATE-001)

**Bridge ↔ Engine:**
- gRPC + Protocol Buffers para datos pesados
- Binario para matrices de imágenes
- Latencia máxima: <2s para renderizado (FR-ARC-002)

### 2. Máquina de Estados del Bridge

```json
{
  "state": "BRIDGE_IDLE | BRIDGE_PROCESSING_VECTOR | BRIDGE_COMPUTING_COLOR | BRIDGE_AUDITING | BRIDGE_ERROR",
  "timestamp": "ISO-8601",
  "progress": 0-100,
  "message": "string"
}
```

### 3. Esquemas de Datos Estrictos

**RenderRequest (Frontend → Bridge → Engine):**
```json
{
  "request_id": "uuid-v4",
  "project_id": "string",
  "operation_type": "RENDER_EXPORT | COLOR_CONVERT | POSE_ESTIMATION",
  "canvas_state": {
    "elements_count": "number",
    "dpi_target": 300,
    "color_space": "RGB | CMYK | LAB",
    "icc_profile_path": "string (optional)"
  },
  "spot_colors": {
    "big_star": "boolean",
    "ultramarina": "boolean"
  }
}
```

**DiagnosticCapture (Engine → Bridge → ThunderKoli):**
```json
{
  "timestamp": "ISO-8601",
  "layer": "FRONTEND | BRIDGE | ENGINE",
  "component": "string",
  "error_code": "string",
  "execution_time_ms": "number",
  "context_hash_sha256": "string"
}
```

### 4. Catálogo de Señales y Fallbacks

| Señal | Origen → Destino | Acción | Timeout | Fallback |
|-------|------------------|--------|---------|----------|
| SyncTokens | P10pro → Bridge | Valida tokens en cascada | 500ms | Usa caché Redis |
| ProcessVectors | Bridge → Design_Studio | Renderizado Blend2D | 2000ms | BRIDGE_ERROR + Snapshot |
| ApplyColorProfile | Bridge → Design_Studio | Conversión Little CMS | 50ms | Aborta, alerta en UI |
| AuditAsset | Bridge → ThunderKoli | Encriptación AES-256 | 1000ms | Bloqueo de exportación |

---

## Decisiones de Diseño

### 1. Protobuf vs JSON

**Decisión:** Usar Protobuf para datos pesados (imágenes, vectores), JSON para control.

**Justificación:**
- Protobuf: 3-10x más compacto que JSON
- Necesario para <50ms en transformaciones de color (NFR-COLOR-001)
- Necesario para 60 FPS en canvas (NFR-CANVAS-001)
- JSON suficiente para control de estado UI

### 2. WebSocket vs REST

**Decisión:** WebSocket para colaboración en tiempo real, REST para operaciones CRUD.

**Justificación:**
- WebSocket: <100ms latencia para cambios en tiempo real
- REST: Suficiente para operaciones no-críticas
- Híbrido: Mejor de ambos mundos

### 3. Undo/Redo Ilimitado

**Decisión:** Almacenar en memoria con límite de 100 pasos, persistir en IndexedDB.

**Justificación:**
- Memoria: <500MB para 100 pasos
- Performance: Cada undo <16ms
- Persistencia: Recuperación post-crash

### 4. Colaboración: Last-Write-Wins

**Decisión:** Usar timestamps para resolver conflictos.

**Justificación:**
- Simple de implementar
- Predecible para usuarios
- Suficiente para 20 usuarios concurrentes (NFR-COLLAB-001)

### 5. Seguridad: AES-256-GCM

**Decisión:** Encriptación por proyecto con rotación automática.

**Justificación:**
- Grado militar (AES-256)
- PBKDF2 con 100k iteraciones
- Rotación cada 30 días
- Cumple FR-ASSET-005

---

## Patrones de Implementación

### 1. Patrón: Bridge Orchestrator

El Bridge actúa como orquestador central:

```typescript
// Bridge recibe request
app.post('/api/export', async (req, res) => {
  // 1. Validar
  const specs = validateExportSpecs(req.body);
  
  // 2. Enrutar a Design_Studio
  const renderResult = await designStudio.render(specs);
  
  // 3. Enrutar a ThunderKoli
  const auditResult = await thunderkoli.audit(renderResult);
  
  // 4. Retornar al Frontend
  res.json({ downloadUrl: auditResult.url });
});
```

### 2. Patrón: State Machine en Bridge

```typescript
class BridgeStateMachine {
  state = 'BRIDGE_IDLE';
  
  async processVector(specs) {
    this.setState('BRIDGE_PROCESSING_VECTOR');
    try {
      const result = await blend2d.render(specs);
      this.setState('BRIDGE_COMPUTING_COLOR');
      const colored = await littleCMS.transform(result);
      this.setState('BRIDGE_AUDITING');
      const audited = await thunderkoli.sign(colored);
      this.setState('BRIDGE_IDLE');
      return audited;
    } catch (error) {
      this.setState('BRIDGE_ERROR');
      throw error;
    }
  }
}
```

### 3. Patrón: Debounced WebSocket Updates

```typescript
// Frontend: Debounce canvas updates
const debouncedSend = debounce((state) => {
  socket.emit('canvas:update', state);
}, 100);

canvas.on('change', (state) => {
  updateLocalState(state);  // Instant
  render();                  // 60 FPS
  debouncedSend(state);      // Send after 100ms
});
```

### 4. Patrón: Diagnostic Capture

```typescript
// Engine: Captura diagnóstico solo si cumple criterios
if (ENABLE_ENGINE_DIAGNOSTICS && executionTime > THRESHOLD) {
  const diagnostic = {
    timestamp: new Date().toISOString(),
    layer: 'ENGINE',
    component: 'Blend2D',
    error_code: null,
    execution_time_ms: executionTime,
    context_hash_sha256: sha256(context)
  };
  
  await diagnosticDB.insert(diagnostic);
}
```

### 5. Patrón: Rollback Automático

```typescript
// Bridge: Rollback en caso de error
async function exportWithRollback(specs, previousState) {
  try {
    const result = await designStudio.render(specs);
    return result;
  } catch (error) {
    // Rollback automático
    await restoreState(previousState);
    
    // Crear snapshot del error
    await createErrorSnapshot({
      specs,
      error: error.message,
      timestamp: new Date()
    });
    
    throw error;
  }
}
```

---

## Resumen de Decisiones Clave

| Aspecto | Decisión | Justificación |
|--------|----------|---------------|
| Protocolo Bridge | gRPC + Protobuf | <50ms para color, 60 FPS canvas |
| Colaboración | WebSocket + Last-Write-Wins | <100ms latencia, simple |
| Undo/Redo | Memoria + IndexedDB | <16ms por operación |
| Seguridad | AES-256-GCM por proyecto | Grado militar, rotación 30d |
| State Management | Zustand/Redux | Predecible, DevTools |
| Componentes | 20+ reutilizables | Consistencia visual |
| Performance | 60 FPS canvas, <30s pipeline | Flujo de trabajo eficiente |

---

**Versión:** 1.0.0  
**Fecha:** 2026-04-21  
**Estado:** Listo para implementación
