# Architecture Documentation - KoliCode

## Related Documents

- [Project Charter](PROJECT_CHARTER.md) - product goals, scope boundaries, success criteria and non-goals
- [Integration Contracts](INTEGRATION_CONTRACTS.md) - module contracts, latency targets and compatibility matrices
- [Architecture Diagrams](architecture/README.md) - visual component, sequence and state diagrams

## System Overview

KoliCode is a desktop application that integrates four specialized components into a unified microservices architecture with a single React frontend.

**Architecture Requirements (from requirements.md):**
- **FR-ARC-001**: Electron-based desktop app generating .exe, .dmg, .deb executables
- **NFR-ARC-001**: Main/renderer process isolation for stability
- **NFR-ARC-002**: TypeScript + React with <2s render time, type-check passing
- **NFR-ARC-003**: Node.js/Express backend with PostgreSQL + Redis (>80% cache hit, <200ms response)
- **NFR-ARC-004**: Support for 500 concurrent users with encrypted secrets

```
┌─────────────────────────────────────────────────┐
│           Frontend (React + Vite)               │
│              Port: 5173                         │
└────────────────┬────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────┐
│         API Gateway (Node.js)                   │
│              Port: 4000                         │
└────┬──────────────────────┬─────────────────────┘
     │                      │
     ▼                      ▼
┌──────────────┐    ┌──────────────────┐
│ ThunderKoli  │    │ UniversalEngine  │
│  (Node.js)   │    │   (Kotlin/Ktor)  │
│  Port: 3001  │    │   Port: 8080     │
└──────┬───────┘    └────────┬─────────┘
       │                     │
       ▼                     ▼
┌─────────────────────────────────────┐
│      PostgreSQL + Redis             │
│      Ports: 5432, 6379              │
└─────────────────────────────────────┘
```

## Directory Structure

```
kolicode/
├── backend/
│   ├── thunderkoli/           # Security & Audit Module (Node.js + Express)
│   │   ├── src/
│   │   │   ├── agents/        # ArchitectAgent, ExecutorAgent
│   │   │   ├── lib/           # Core services (Vault, Engine, Auth)
│   │   │   ├── config/        # Configuration files
│   │   │   ├── data/          # JSON-based data storage
│   │   │   └── server.js      # Main Express server
│   │   ├── package.json
│   │   └── Dockerfile
│   │
│   ├── universalengine/       # AI Code Generation Module (Kotlin + Ktor)
│   │   ├── src/
│   │   ├── build.gradle
│   │   └── Dockerfile
│   │
│   └── gateway/               # API Gateway (Node.js + Express)
│       ├── src/
│       │   ├── middleware/    # CORS, Auth, Rate Limiting
│       │   ├── proxy/         # Service routing
│       │   └── routes/        # Route definitions
│       └── package.json
│
├── frontend/                  # React + TypeScript + Vite
│   ├── src/
│   │   ├── components/        # Reusable UI components
│   │   ├── pages/             # Page components
│   │   ├── hooks/             # Custom React hooks
│   │   ├── utils/             # Utility functions
│   │   ├── styles/            # Global styles
│   │   └── assets/            # Images, icons, fonts
│   ├── package.json
│   └── vite.config.ts
│
├── python-worker/             # GPU Workers (MediaPipe, Blend2D, Little CMS)
│   ├── src/
│   │   ├── pose_transform/    # MediaPipe pose transformations
│   │   ├── vector_process/    # Blend2D vector operations
│   │   └── color_manage/      # Little CMS color management
│   └── requirements.txt
│
├── creative/                  # Processing sketches
│   └── sketches/
│
├── config/                    # Unified configuration
│   ├── docker-compose.yml
│   ├── .env.example
│   └── settings.json
│
├── docs/                      # Documentation
│   ├── API.md                 # API endpoints documentation
│   ├── ARCHITECTURE.md        # This file
│   ├── DEPLOYMENT.md          # Deployment guide
│   └── architecture/          # Architecture diagrams
│
├── README.md                  # Project overview
├── CHANGELOG.md               # Version history
└── .gitignore
```

## Component Architecture

### 1. Frontend (React + Vite)

**Purpose:** Unified user interface for all four modules

**Key Features:**
- Single-page application (SPA)
- Real-time canvas editing
- Multi-module navigation
- Responsive design

**Communication:**
- All requests go through API Gateway (Port 4000)
- WebSocket support for real-time updates
- Session management via cookies/tokens

**Port:** 5173 (development)

**Frontend Requirements (from requirements.md):**

#### UI & Navigation (Req 17)
- **FR-UI-001**: React Router v6+ with SPA navigation (no full page reloads)
- **FR-UI-002**: Unified navigation bar visible on all routes
- **FR-UI-003**: Breadcrumbs reflecting full navigation path
- **FR-UI-004**: Keyboard shortcuts (Ctrl+K for command palette)
- **NFR-UI-001**: Preserve context when navigating between modules
- **NFR-UI-002**: Lazy loading with <500KB initial bundle size

#### State Management (Req 18)
- **FR-STATE-001**: Zustand or Redux Toolkit for global state
- **FR-STATE-002**: API client integrated with store for backend sync
- **FR-STATE-003**: Persist critical state with localStorage/IndexedDB
- **NFR-STATE-001**: Optimistic updates with <50ms UI response
- **NFR-STATE-002**: DevTools integration for state debugging

#### Design System (Req 19)
- **FR-DS-001**: 20+ reusable base components with TypeScript props
- **FR-DS-002**: Tailwind CSS or styled-components (consistent system)
- **FR-DS-003**: Light/dark theming with persistence
- **NFR-DS-001**: WCAG 2.1 AA compliance (Lighthouse score >90)
- **NFR-DS-002**: Storybook for component documentation

#### Canvas Editor (Req 20)
- **FR-CANVAS-001**: Drawing tools (pen, shapes, text)
- **FR-CANVAS-002**: Layer system with drag-and-drop reordering
- **FR-CANVAS-003**: Real-time transformations (move, scale, rotate)
- **NFR-CANVAS-001**: 60 FPS with 100+ elements
- **NFR-CANVAS-002**: Export to SVG, PNG, PDF with configurable quality

#### API Communication (Req 21)
- **FR-API-001**: Centralized API client (no direct fetch calls)
- **FR-API-002**: JWT authentication with automatic token refresh
- **FR-API-003**: Retry logic (3x with exponential backoff)
- **NFR-API-001**: Request/response logging with interceptors
- **NFR-API-002**: Consistent error handling with user-friendly messages

#### Authentication (Req 22)
- **FR-AUTH-001**: Login/registration with client-side validation
- **FR-AUTH-002**: Secure JWT storage (access token in memory, refresh in httpOnly cookie)
- **FR-AUTH-003**: Protected routes with redirect to login
- **NFR-AUTH-001**: Google OAuth and WhatsApp integration
- **NFR-AUTH-002**: Preserve original route after authentication (returnUrl)

---

### 2. API Gateway (Node.js + Express)

**Purpose:** Single entry point for all frontend requests

**Responsibilities:**
- Route requests to appropriate microservices
- Handle CORS and security headers
- Implement rate limiting
- Aggregate responses when needed
- Manage authentication tokens

**Routing Pattern:**
```
/api/v1/thunderkoli/* → http://localhost:3001/*
/api/v1/universalengine/* → http://localhost:8080/*
/api/v1/p10pro/* → http://localhost:5000/*
/api/v1/design-studio/* → http://localhost:6000/*
```

**Port:** 4000

---

### 3. ThunderKoli (Node.js + Express)

**Purpose:** Security, Audit, Identity, and Vault management

**Core Services:**

#### Vault Service
- **Algorithm:** AES-256-GCM
- **Key Generation:** PBKDF2 (100,000 iterations)
- **Key Rotation:** Every 30 days
- **Storage:** Encrypted files in vault directory

#### Audit Trail
- **Format:** JSON structured logs
- **Rotation:** Automatic at 1MB
- **Retention:** Last 2000 records in memory
- **Actions Logged:** API_ACTION, SECRET_ACCESSED, SECURITY_VIOLATION, TOKEN_EXPIRED, IDENTITY_VERIFIED

#### Identity Management
- **QR Tokens:** HMAC-SHA256 with 5-minute expiration
- **Landing Page:** Sovereign identity verification
- **Token Validation:** Integrity and expiry checks

#### Authentication
- **Google OAuth 2.0:** Contact synchronization every 3600s
- **WhatsApp:** QR-based authentication with notifications
- **Session Management:** Redis-based (configured)

**Agents:**
- **ArchitectAgent:** Plans missions from user prompts
- **ExecutorAgent:** Executes planned tasks
- **ThunderEngine:** Processes missions with AI (Ollama/DeepSeek)

**Port:** 3001

---

### 4. UniversalEngine (Kotlin + Ktor)

**Purpose:** AI-powered code generation and knowledge hub

**Features:**
- Code generation from prompts
- Technical specification creation
- Knowledge hub with reusable patterns
- Support for multiple AI providers (DeepSeek, Ollama)

**Port:** 8080

---

### 5. P10pro (Future Module)

**Purpose:** Creative editor with design tokens and canvas

**Features:**
- Interactive canvas editor with sub-pixel precision
- Design token management (colors, typography, spacing, borders, shadows)
- Real-time preview (<500ms p95)
- Asset management with versioning and organization
- Export to SVG, PNG, PDF, CSS/SCSS, JSON
- Undo/redo with unlimited history
- WCAG AA/AAA accessibility validation
- Figma/Sketch import support
- Real-time collaboration with WebSocket

**P10pro Requirements (from requirements.md):**

#### Canvas Editor (Subsection A)
- **FR-P10-001**: Sub-pixel precision transformations (3 decimal places)
- **FR-P10-002**: Intelligent snapping (grid, guides, elements) with 5px threshold
- **FR-P10-003**: Unlimited undo/redo with navigable history panel

#### Design System (Subsection B)
- **FR-P10-004**: Token validation with cascade impact analysis
- **FR-P10-005**: Automatic WCAG 2.1 accessibility audit (AA/AAA compliance)
- **FR-P10-006**: Unused token detection with usage tracking (max 5 references)

#### Collaboration (Subsection C)
- **FR-P10-007**: Real-time collaborative editing (<100ms WebSocket latency)
- **FR-P10-008**: Granular permission control (Editor, Commenter roles)

#### Export Pipeline (Subsection D)
- **FR-P10-009**: High-quality export pipeline with multi-layer architecture
  - **Flow**: P10pro generates specs (format, resolution, ICC profile) → Bridge routes to Design_Studio → Design_Studio renders with Blend2D at 300 DPI + applies ICC profile → ThunderKoli adds digital signature → delivers <5MB
  - **Validation**: PNG quality exceeds Figma export, DPI in metadata, file size <5MB, digital signature verifiable
- **FR-P10-010**: Figma JSON import with component mapping (47/50 elements target)
- **FR-P10-011**: Component instance linking with upgrade guides

#### Enhanced Features
- **Asset Management**: Folder organization, instance replacement, unused detection, 100MB/1000+ asset limits
- **Usability**: 20+ undo steps, version snapshots, change history, keyboard shortcuts (Ctrl+Z, Ctrl+D)
- **Integration**: Figma/Sketch import, external component libraries, design system sync
- **Quality Validation**: WCAG contrast validation, token consistency checks, typography size alerts
- **Export Formats**: SVG (layered), PNG (1x/2x/3x), PDF (multi-page), CSS/SCSS variables, JSON
- **Performance**: <500ms preview updates, smooth zoom, non-blocking UI for 500+ elements

**Port:** 5000 (planned)

---

### 6. Design Studio (Future Module)

**Purpose:** Professional graphics processing

**Features:**
- Vector processing (Blend2D)
- Color space management (CMYK, LAB)
- Pose transformations (MediaPipe)
- Professional color management (Little CMS)

**Design Studio Requirements (from requirements.md):**

#### Color Management (Req 5.1)
- **FR-COLOR-001**: RGB↔CMYK conversion with side-by-side preview (ΔE <3)
- **FR-COLOR-002**: ICC profile management with soft-proof warnings
- **FR-COLOR-003**: Spot color channels (Big Star, Ultramarina) preserved in PDF export
- **FR-COLOR-004**: Configurable halftone angles per channel (C:15°, M:75°, Y:0°, K:45°)
- **NFR-COLOR-001**: Little CMS transformations <50ms without visual artifacts
- **NFR-COLOR-002**: 16/32-bit color depth support (no banding in gradients)

**Port:** 6000 (planned)

---

### 7. Python Workers

**Purpose:** GPU-accelerated graphics operations

**Capabilities:**
- MediaPipe pose transformations
- Blend2D vector operations
- Little CMS color management
- Parallel processing for intensive operations

**Communication:** REST API or message queue

---

## Data Flow

### Asset Pipeline (Complete Flow)

```
1. User Input (Frontend)
   ↓
2. API Gateway (Route to appropriate service)
   ↓
3. ThunderEngine (Process prompt)
   ↓
4. UniversalEngine (Generate code/specs)
   ↓
5. P10pro (Visual refinement)
   ↓
6. Design Studio (Graphics processing)
   ↓
7. Python Workers (GPU operations)
   ↓
8. ThunderKoli Vault (Encrypt & store)
   ↓
9. Audit Trail (Log all actions)
   ↓
10. Frontend (Download encrypted asset)
```

**Performance Target:** < 30 seconds for typical operations (p95)

**Pipeline Requirements (from requirements.md):**
- **FR-ASSET-001**: Prompt triggers UniversalEngine processing (<5s)
- **FR-ASSET-002**: Generate valid JSON specs (quality >80%)
- **FR-ASSET-003**: Real-time visual refinement in P10pro
- **FR-ASSET-004**: Generate vectorial assets (SVG/PNG, >300 DPI)
- **FR-ASSET-005**: Audit and encrypt with digital signature
- **FR-ASSET-006**: Secure download via HTTPS with 5-min token expiration
- **NFR-ASSET-001**: Complete pipeline <30s for typical prompts (<500 chars)
- **NFR-ASSET-002**: 99% success rate with 100 concurrent pipelines

---

## Security Architecture

### Encryption Strategy

**At Rest:**
- All assets encrypted with AES-256-GCM
- Keys generated per project using PBKDF2
- Vault stores encrypted data in vault directory

**In Transit:**
- HTTPS/TLS for all communications
- Secure WebSocket (WSS) for real-time updates
- API Gateway enforces HTTPS in production

**Key Management:**
- Master password stored in environment variables
- Project-specific keys derived from master password
- Automatic key rotation every 30 days

### Authentication Flow

```
1. User initiates login (Google or WhatsApp)
   ↓
2. OAuth provider verification
   ↓
3. Session token generation (JWT)
   ↓
4. Token stored in secure cookie
   ↓
5. All subsequent requests include token
   ↓
6. API Gateway validates token
   ↓
7. Request routed to appropriate service
```

### Audit Logging

Every sensitive operation is logged:
- User ID
- Action type
- Resource accessed
- Timestamp (ISO 8601)
- Input/output hashes (SHA-256)
- Status (success/error)
- Metadata

---

## Database Schema

### PostgreSQL (Persistent Data)

```sql
CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  name VARCHAR(255) NOT NULL,
  role VARCHAR(50),
  avatar_url TEXT,
  bio TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE projects (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id),
  name VARCHAR(255) NOT NULL,
  description TEXT,
  vault_key_hash VARCHAR(255),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE audit_logs (
  id UUID PRIMARY KEY,
  user_id INTEGER REFERENCES users(id),
  action VARCHAR(50) NOT NULL,
  resource VARCHAR(255),
  input_hash VARCHAR(64),
  output_hash VARCHAR(64),
  status VARCHAR(20),
  metadata JSONB,
  timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE assets (
  id SERIAL PRIMARY KEY,
  project_id INTEGER REFERENCES projects(id),
  name VARCHAR(255) NOT NULL,
  type VARCHAR(50),
  encrypted_data BYTEA,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### Redis (Cache & Sessions)

```
sessions:{session_id} → User session data (TTL: 24 hours)
config:{user_id} → User configuration cache (TTL: 1 hour)
tasks:{user_id} → Active background tasks (TTL: 24 hours)
```

---

## Deployment Architecture

### Docker Compose Stack

```yaml
services:
  frontend:
    image: kolicode:frontend
    ports:
      - "5173:5173"
    depends_on:
      - gateway

  gateway:
    image: kolicode:gateway
    ports:
      - "4000:4000"
    depends_on:
      - thunderkoli
      - universalengine
      - postgres
      - redis

  thunderkoli:
    image: kolicode:thunderkoli
    ports:
      - "3001:3001"
    depends_on:
      - postgres
      - redis

  universalengine:
    image: kolicode:universalengine
    ports:
      - "8080:8080"
    depends_on:
      - postgres

  postgres:
    image: postgres:15
    ports:
      - "5432:5432"

  redis:
    image: redis:7
    ports:
      - "6379:6379"

  python-worker:
    image: kolicode:python-worker
    depends_on:
      - gateway
```

---

## Performance Optimization

### Frontend
- **Render Time:** < 2 seconds on mid-range hardware (NFR-ARC-002)
- **Canvas FPS:** 60 FPS during editing
- **Lazy Loading:** Assets loaded on demand
- **Code Splitting:** Route-based bundle splitting
- **Type Safety:** TypeScript with zero `tsc --noEmit` errors
- **Performance:** Lighthouse score >90

### Backend
- **API Response Time:** < 200ms (p95) (NFR-ARC-003)
- **Database Queries:** < 50ms (p95)
- **Cache Hit Rate:** > 80% for frequently accessed data (NFR-ARC-003)
- **Connection Pooling:** PostgreSQL connection pool (10-20 connections)
- **Concurrency:** Support for 500 concurrent users (NFR-ARC-004)
- **Validation:** Redis benchmark tests, PostgreSQL EXPLAIN ANALYZE

### GPU Workers
- **Parallel Processing:** Multi-threaded operations
- **Memory Management:** Efficient buffer allocation
- **Operation Timeout:** 30 seconds per operation

---

## Monitoring & Observability

### Logging
- **Format:** JSON structured logs
- **Levels:** DEBUG, INFO, WARN, ERROR
- **Rotation:** Automatic at 1MB
- **Retention:** 30 days

### Metrics
- Request latency (p50, p95, p99)
- Error rates by endpoint
- Database query performance
- Cache hit/miss rates
- GPU worker utilization

### Health Checks
- Frontend: /health
- API Gateway: /health
- ThunderKoli: /health
- UniversalEngine: /health
- Database: Connection test
- Redis: PING command

---

## Security Checklist

- [x] All user input validated and sanitized
- [x] SQL injection prevention (parameterized queries)
- [x] XSS prevention (output sanitization)
- [x] CSRF tokens for state-changing operations
- [x] Rate limiting on auth endpoints
- [x] Secrets in environment variables
- [x] HTTPS ready for production
- [x] Audit logs for sensitive operations
- [x] Encryption at rest (AES-256-GCM)
- [x] Encryption in transit (TLS/HTTPS)

---

## Future Enhancements

1. **Kubernetes Deployment:** Replace Docker Compose with K8s manifests
2. **Distributed Tracing:** OpenTelemetry integration
3. **Advanced Monitoring:** Prometheus + Grafana stack
4. **Message Queue:** RabbitMQ for async operations
5. **Caching Layer:** Memcached for distributed caching
6. **Load Balancing:** Nginx reverse proxy
7. **API Versioning:** Support for v2, v3 endpoints
8. **GraphQL:** Alternative to REST API
9. **Diagnostic Dashboard:** Real-time visualization of captured diagnostics
10. **AI-Powered Debugging:** Automatic root cause analysis from diagnostic data

---

**Last Updated:** 2026-04-21  
**Architecture Version:** 1.0.0  
**Status:** Production Ready
