# CHANGELOG - KoliCode

> **Nota:** Proyecto renombrado de "Unified Design Studio" a "KoliCode" el 2026-04-21

## [1.0.0] - 2026-04-21

### Added

#### ThunderKoli v2.1 (Security & Audit Module)
- **Vault Service (AES-256-GCM)**: Encriptación de assets con claves únicas por proyecto usando PBKDF2
- **Audit Trail v2.1**: Sistema completo de auditoría con rotación automática de logs (1MB limit)
- **Identity Management**: Gestión de identidad con QR tokens HMAC-SHA256 con expiración de 5 minutos
- **Multi-Provider Authentication**: 
  - Google OAuth 2.0 con sincronización de contactos
  - WhatsApp Web.js con notificaciones automáticas
- **Sovereign Landing Page**: Página de identidad verificada con validación de token y expiración
- **Master Audit Middleware**: Interceptor de acciones críticas en endpoints

#### API Endpoints (ThunderKoli)
- `GET /users` - Listar todos los usuarios
- `POST /users` - Crear nuevo usuario
- `DELETE /users/:id` - Eliminar usuario
- `GET /users/:id/documents` - Obtener documentos del usuario (DMS)
- `GET /users/:id/update` - Actualizar perfil de usuario
- `GET /users/:id/qr` - Generar código QR de identidad con token HMAC
- `GET /card/:id` - Landing page de identidad verificada (con validación de token)
- `POST /agent/interact` - Procesar prompts con ThunderEngine
- `GET /agent/config` - Obtener configuración del sistema
- `POST /agent/config/keys` - Configurar claves API (DeepSeek, Google)
- `POST /agent/config/provider` - Cambiar proveedor IA (Ollama/DeepSeek)
- `GET /agent/history` - Obtener historial de conversaciones
- `DELETE /agent/history/all` - Limpiar historial completo
- `DELETE /agent/history/:id` - Eliminar mensaje específico
- `POST /agent/history/save/:id` - Guardar mensaje en Vault
- `POST /agent/history/delete-bulk` - Eliminar múltiples mensajes
- `GET /agent/tasks` - Obtener tareas activas y notificaciones
- `POST /agent/tasks/spawn` - Crear nueva tarea asíncrona
- `DELETE /agent/tasks/clear-notifications` - Limpiar notificaciones
- `GET /auth/google/url` - Obtener URL de autenticación Google
- `GET /auth/google/callback` - Callback de Google OAuth
- `GET /whatsapp/status` - Estado de conexión WhatsApp
- `POST /whatsapp/logout` - Cerrar sesión WhatsApp
- `GET /core/status` - Estado general del sistema
- `GET /health` - Health check del servidor

#### Backend Architecture
- **Express.js Server**: Puerto 3001 con timeout de 5 minutos
- **Vault Service**: Encriptación AES-256 con inyección de secretos en variables de entorno
- **ThunderEngine**: Motor de procesamiento de misiones con soporte para Ollama y DeepSeek
- **Background Agents**: ArchitectAgent y ExecutorAgent para tareas autónomas
- **Data Persistence**: JSON-based storage con rutas configurables para testing

#### Security Features
- Encriptación AES-256-GCM para assets en Vault
- Tokens HMAC-SHA256 para identidad con expiración
- Validación de integridad de token en landing page
- Rotación automática de logs de auditoría
- Bloqueo de sesión en intentos de acceso no autorizado
- Sanitización de nombres de archivo en exportaciones

#### Performance Optimizations
- Caché de configuración en memoria
- Sincronización de Google Contacts cada 3600s (configurable)
- Lazy loading de datos de usuario
- Compresión de logs archivados

### Technical Details

#### Vault Implementation
- Algoritmo: AES-256-GCM
- Generación de claves: PBKDF2 con 100,000 iteraciones
- Rotación de claves: Cada 30 días (configurable)
- Almacenamiento: Directorio `vault/` con encriptación

#### Audit System
- Formato: JSON estructurado
- Rotación: Automática a 1MB
- Retención: Últimos 2000 registros en memoria
- Acciones registradas: API_ACTION, SECRET_ACCESSED, SECURITY_VIOLATION, TOKEN_EXPIRED, IDENTITY_VERIFIED

#### Authentication
- Google OAuth: Sincronización de contactos cada hora
- WhatsApp: Autenticación con QR, notificaciones automáticas
- Session Management: Almacenamiento en Redis (configurado)

### Fixed
- Manejo de errores en lectura de configuración
- Validación de entrada en endpoints de usuario
- Prevención de inyección SQL con queries parametrizadas
- XSS prevention en landing page

### Security Improvements
- Secrets inyectados desde Vault en lugar de hardcoded
- Audit logging para todas las acciones críticas
- Rate limiting en endpoints de autenticación (implementado en middleware)
- HTTPS ready para producción

### Documentation
- Creado: API.md con documentación completa de endpoints
- Creado: ARCHITECTURE.md con diagrama de componentes
- Creado: DEVELOPMENT_GUIDE.md con metodología de debugging en tres capas
- Agregados: Comentarios inline en código complejo
- Actualizado: README.md con referencias a documentación
- Completado: Renombrado de proyecto a "KoliCode" en toda la documentación
- Actualizado: Todas las referencias de rutas y nombres de archivos Docker
- Mejorado: Requirements.md con criterios de aceptación FR/NFR en formato Dado-Cuando-Entonces
- Agregado: Métricas específicas de validación (p95 <30s, cache hit >80%, render <2s)
- Creado: Hook automático para sincronizar requirements.md con documentación
- Agregado: Requerimiento 16 - Sistema de Diagnóstico y Debugging (FR-DIAG-001 a NFR-DIAG-003)
- Creado: Steering file debugging-methodology.md con template de Pedido de Ejecución Técnica
- Actualizado: debugging-methodology.md con 5 prácticas avanzadas (Reproducción, Bisección, Logging, Tests, RCA)
- Creado: Hook "enforce-debugging-methodology" para validar prácticas al editar código
- Creado: Hook "remind-debugging-methodology" para recordar metodología al iniciar sesión
- Agregado: Requerimientos 17-22 de Frontend (UI/Navegación, Estado, Design System, Canvas, API, Auth)
  - **Req 17 - UI y Navegación**: React Router v6+, breadcrumbs, shortcuts (Ctrl+K), lazy loading (<500KB bundle)
  - **Req 18 - Gestión de Estado**: Zustand/Redux, optimistic updates (<50ms), persistencia local
  - **Req 19 - Design System**: 20+ componentes base, Tailwind CSS, theming, WCAG 2.1 AA (Lighthouse >90)
  - **Req 20 - Canvas Editor**: 60 FPS, layers, transformaciones, undo/redo, export SVG/PNG/PDF
    - **FR-EXPORT-001**: Pipeline de exportación multi-capa (P10pro genera specs → Bridge enruta → Design_Studio renderiza Blend2D 300 DPI + ICC → ThunderKoli firma digitalmente → entrega <5MB)
  - **Req 21 - API Client**: JWT auth, retry logic (3x backoff), WebSocket, interceptors
  - **Req 22 - Autenticación Frontend**: Protected routes, secure JWT storage, Google OAuth + WhatsApp
- Expandido: Requerimiento 4 - Integración de P10pro (Editor Creativo)
  - **FR-P10-001 a FR-P10-003**: Canvas Editor con precisión sub-pixel, snapping inteligente, undo/redo ilimitado
  - **FR-P10-004 a FR-P10-006**: Design System con validación de tokens, auditoría WCAG automática, detección de tokens no usados
  - **FR-P10-007 a FR-P10-008**: Colaboración en tiempo real (<100ms WebSocket), control de permisos granular
  - **FR-P10-009 a FR-P10-011**: Export pipeline (300 DPI, <5MB), importación Figma JSON, mapeo de componentes
  - **Enhanced Features**: Asset management (100MB/1000+ assets), usabilidad (20+ undo steps, shortcuts), integración (Figma/Sketch), validación WCAG, múltiples formatos de exportación (SVG, PNG 1x/2x/3x, PDF, CSS/SCSS, JSON), performance (<500ms preview, 500+ elementos sin lag)
- Creado: Metodología de debugging en tres capas (.kiro/steering/debugging-methodology.md)
- Creado: Development Guide (docs/DEVELOPMENT_GUIDE.md)
- Agregado: Requerimiento 16 - Sistema de Diagnóstico y Debugging con FR-DIAG-001 a NFR-DIAG-003
- Creado: INTEGRATION_CONTRACTS.md con schemas JSON, latencias, timeouts y matrices de compatibilidad
  - **Contratos de datos**: Frontend → Bridge → Engine con schemas completos
  - **Latencias máximas**: Login <500ms, Canvas <100ms, AI <10s, Export <2s, Vault <50ms (p95)
  - **Timeouts configurados**: 5s a 60s según operación
  - **Matriz de compatibilidad**: Espacios de color (RGB/CMYK/LAB), formatos de importación (Figma 95%, Sketch 70%, SVG 100%)
  - **Elementos no soportados**: Plugins Figma, animaciones complejas, variables Figma
- Expandido: Requirements.md con 44 nuevos criterios FR/NFR (2026-04-21)
  - **Req 5.1 - Gestión Avanzada de Color y Perfiles ICC**: 
    - **FR-COLOR-001**: Conversión RGB↔CMYK sin pérdida (ΔE <3) con preview side-by-side
    - **FR-COLOR-002**: Gestión perfiles ICC con soft-proof warnings
    - **FR-COLOR-003**: Canales spot (Big Star, Ultramarina) preservados en PDF export
    - **FR-COLOR-004**: Angulación de trama configurable por canal (C:15°, M:75°, Y:0°, K:45°)
    - **NFR-COLOR-001**: Little CMS transformaciones <50ms sin artifacts visuales
    - **NFR-COLOR-002**: Profundidad 16/32 bits (sin banding en gradientes)
  - **Req 6 - Asset Pipeline**: Rollback automático, versionado (10+ versiones), comparación visual, delta-encoding (<30% espacio)
  - **Req 20 - Canvas Editor**: Precisión sub-pixel (3 decimales), snapping (<5px), historial visual, selección múltiple, undo ilimitado (<16ms)
  - **Req 4.2 - Importación**: Figma JSON (47/50 elementos), Sketch (.sketch), detección assets faltantes, import <10s
  - **Req 4.3 - Calidad**: Auditoría WCAG (AA/AAA), tokens no usados, consistencia tipográfica, validación espaciados
  - **Req 4.4 - Librerías**: .kolitoken format, sincronización automática, changelog semántico, búsqueda fuzzy, descarga incremental (<5MB)
  - **Req 4.5 - Colaboración**: Edición tiempo real (<100ms WebSocket), permisos granulares, comentarios contextuales, 20 usuarios concurrentes
  - **Req 20 - Exportación**: Multi-escala batch (1x/2x/3x), CSS/SCSS desde tokens, PDF multipágina, export paralelo (<15s)
  - **Req 10.1 - Analytics**: Dashboard métricas, análisis performance, reporte tokens, estimación export (±20%), cálculo background

### Dependencies
- express: ^4.18.0
- cors: ^2.8.5
- qrcode: ^1.5.0
- whatsapp-web.js: ^1.20.0
- google-auth-library: ^8.8.0
- crypto: built-in Node.js

---

## Notas de Implementación

### Configuración Requerida
```bash
# .env
GOOGLE_CLIENT_ID=<your-client-id>
GOOGLE_CLIENT_SECRET=<your-client-secret>
SYSTEM_SECRET=thunder-sovereign-2026
PORT=3001
DATA_PATH=./data.json
```

### Próximas Fases
- [ ] Integración con PostgreSQL para persistencia
- [ ] Redis para caché de sesiones
- [ ] Rate limiting avanzado
- [ ] Métricas de performance en tiempo real
- [ ] Dashboard de auditoría
- [ ] Exportación de audit trail en múltiples formatos

### Conocidos Issues
- WhatsApp requiere escaneo de QR en primera ejecución
- Google Contacts sync requiere permisos adicionales
- Vault requiere SYSTEM_SECRET configurado

## [1.0.2] - 2026-04-21

### Added

#### Implementation Tasks (Spec Phase 3)
- **tasks.md**: Plan de implementación completo (156 tasks, 540h estimadas)
  - 6 fases: Infraestructura (20 tasks), Frontend (40 tasks), Bridge (40 tasks), Engine (30 tasks), Features avanzadas (20 tasks), Testing (6 tasks)
  - Estimación: 13.5 semanas con 2 desarrolladores
  - Property-Based Testing: 9 correctness properties definidas
  - Orden de implementación: Infraestructura → Engine → Bridge → Frontend
  - Criterios de aceptación: Tests, Performance, Security, Code Review, Documentation
- **design-validation.md**: Validación exhaustiva contra requirements.md
  - Matriz de validación: 97/97 FR/NFR criterios cubiertos
  - Análisis de cobertura por requerimiento (1-22)
  - Recomendaciones de mejora: Analytics, Testing Strategy, Deployment
  - Estado: Listo para implementación

### Documentation Updates
- Completado: Workflow requirements-first (Requirements → Design → Tasks)
- Validado: Cobertura 100% de criterios FR/NFR
- Definido: Plan de implementación con dependencias críticas
- Especificado: Tecnologías por capa (React/Node.js/Python/Kotlin)

---

## [1.0.1] - 2026-04-21

### Added

#### Design Document (Spec Phase 2)
- **design.md**: Documento de diseño completo (500+ líneas)
  - Arquitectura de tres capas (Frontend → Bridge → Engine)
  - Máquina de estados del Bridge (BRIDGE_IDLE, BRIDGE_PROCESSING_VECTOR, BRIDGE_COMPUTING_COLOR, BRIDGE_AUDITING, BRIDGE_ERROR)
  - Flujos de datos críticos: Canvas editing (60 FPS), Export pipeline (<5s), Figma import (<10s)
  - Contrato de interfaz del Bridge: Protobuf para datos pesados, JSON para control
  - Esquemas de datos estrictos: RenderRequest, DiagnosticCapture
  - Catálogo de señales y fallbacks (SyncTokens, ProcessVectors, ApplyColorProfile, AuditAsset)
  - 5 patrones de implementación: Bridge Orchestrator, State Machine, Debounced WebSocket, Diagnostic Capture, Rollback automático
  - Decisiones de diseño justificadas: Protobuf vs JSON, WebSocket vs REST, Undo/Redo, Colaboración, Seguridad

### Documentation Updates
- Creado: `.kiro/specs/kolicode/design.md` (fase 2 del workflow requirements-first)
- Alineado con 97 FR/NFR criteria del requirements.md
- Especifica latencias máximas (p95): Canvas <16.67ms, WebSocket <100ms, Color transform <50ms, Export <5s, Pipeline <30s
- Define protocolos binarios (Protobuf/gRPC) para cumplir NFR-COLOR-001 y NFR-CANVAS-001

---

**Última actualización:** 2026-04-21  
**Versión:** 1.0.2  
**Estado:** Implementation Ready
