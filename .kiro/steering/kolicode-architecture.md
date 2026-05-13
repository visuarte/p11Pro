---
inclusion: always
---

# KoliCode - Architecture Guidelines

## Project Overview

KoliCode is a desktop application that integrates four specialized components:
- **ThunderKoli v2.1**: Security + Auditoría + Identidad + Vault AES-256
- **UniversalEngine Hub**: Generador de código IA + Knowledge Hub
- **P10pro**: Editor creativo + Tokens + Assets + Canvas
- **Design Studio**: Motor gráfico (Pose, Color, Vectores)

## Architecture Pattern

**Microservices with Unified Frontend**

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
│   ├── thunderkoli/       # Node.js + Express (Security & Audit)
│   ├── universalengine/   # Kotlin + Ktor (AI Code Generation)
│   └── gateway/           # Node.js API Gateway
├── frontend/              # React + TypeScript + Vite
├── python-worker/         # GPU workers (MediaPipe, Blend2D, Little CMS)
├── creative/              # Processing sketches
└── config/                # Unified configuration
```

## Key Principles

### 1. Microservices Boundaries
- Each backend service is independent
- Communication only through API Gateway
- No direct service-to-service calls
- Shared database (PostgreSQL) for data consistency

### 2. API Gateway Pattern
- Single entry point for frontend
- Routes requests to appropriate backend service
- Handles CORS, authentication, rate limiting
- Aggregates responses when needed

### 3. Security First
- All sensitive data encrypted with AES-256 (ThunderKoli Vault)
- Every action audited and logged
- Multi-provider authentication (Google + WhatsApp)
- No secrets in code (use .env files)

### 4. Naming Conventions
- **Files**: kebab-case (e.g., `user-service.ts`)
- **Classes**: PascalCase (e.g., `UserService`)
- **Functions**: camelCase (e.g., `getUserById`)
- **Constants**: UPPER_SNAKE_CASE (e.g., `MAX_RETRIES`)
- **Interfaces**: PascalCase with `I` prefix (e.g., `IUserData`)

### 5. Port Assignments
- Frontend: 5173 (Vite dev)
- API Gateway: 4000
- ThunderKoli: 3001
- UniversalEngine: 8080
- PostgreSQL: 5432
- Redis: 6379

## File Organization Rules

### Backend Files
- Controllers: `src/api/controllers/`
- Services: `src/services/`
- Models: `src/models/`
- Middleware: `src/middleware/`
- Utils: `src/utils/`
- Config: `src/config/`

### Frontend Files
- Components: `src/components/`
- Pages: `src/pages/`
- Hooks: `src/hooks/`
- Utils: `src/utils/`
- Styles: `src/styles/`
- Assets: `src/assets/`

### Tests
- Unit tests: `*.test.ts` (same directory as source)
- Integration tests: `tests/integration/`
- E2E tests: `tests/e2e/`

## Communication Patterns

### Frontend → Backend
```typescript
// Always go through API Gateway
const response = await fetch('http://localhost:4000/api/v1/resource');
```

### API Gateway → Microservices
```typescript
// Proxy pattern
app.use('/api/v1/thunderkoli', proxy('http://localhost:3001'));
app.use('/api/v1/universalengine', proxy('http://localhost:8080'));
```

### Backend → Database
```typescript
// Use connection pooling
// PostgreSQL for persistent data
// Redis for sessions and cache
```

## Error Handling

### Standard Error Response
```json
{
  "error": {
    "code": "ERROR_CODE",
    "message": "Human-readable message",
    "details": {},
    "timestamp": "ISO 8601"
  }
}
```

### HTTP Status Codes
- 200: Success
- 201: Created
- 400: Bad Request
- 401: Unauthorized
- 403: Forbidden
- 404: Not Found
- 500: Internal Server Error

## Performance Guidelines

- API responses: < 200ms (p95)
- Frontend render: < 2s on mid-range hardware
- Canvas operations: 60 FPS
- Database queries: < 50ms (p95)
- Use caching (Redis) for frequently accessed data
- Implement pagination for large datasets

## Security Checklist

- [ ] All user input validated
- [ ] SQL injection prevention (parameterized queries)
- [ ] XSS prevention (sanitize output)
- [ ] CSRF tokens for state-changing operations
- [ ] Rate limiting on API endpoints
- [ ] Secrets in .env files (never in code)
- [ ] HTTPS in production
- [ ] Audit logs for sensitive operations

## When to Create New Files

### Create a new service when:
- Logic exceeds 200 lines
- Functionality is reusable
- Clear single responsibility

### Create a new component when:
- UI element is reused 2+ times
- Component exceeds 300 lines
- Clear visual/functional boundary

### Create a new model when:
- New database entity
- Complex data structure
- Shared across multiple services

## References

- Project Root: `fusion-workspace/kolicode/`
- Documentation: `docs/`
- Specs: `.kiro/specs/kolicode/`
