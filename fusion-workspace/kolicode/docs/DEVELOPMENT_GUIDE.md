# Guía de Desarrollo - KoliCode

## Tabla de Contenidos

1. [Introducción](#introducción)
2. [Configuración del Entorno](#configuración-del-entorno)
3. [Arquitectura de Tres Capas](#arquitectura-de-tres-capas)
4. [Metodología de Debugging](#metodología-de-debugging)
5. [Estándares de Código](#estándares-de-código)
6. [Testing](#testing)
7. [Deployment](#deployment)

---

## Introducción

KoliCode es una aplicación desktop que integra cuatro componentes especializados en una arquitectura de microservicios unificada. Esta guía proporciona las mejores prácticas y metodologías para desarrollar, debuggear y mantener el sistema.

## Configuración del Entorno

### Prerequisitos

```bash
# Node.js 18+ LTS
node --version  # v18.x.x o superior

# PostgreSQL 15+
psql --version  # 15.x o superior

# Redis 7+
redis-cli --version  # 7.x o superior

# Docker + Docker Compose
docker --version
docker-compose --version
```

### Instalación Local

```bash
# 1. Clonar repositorio
git clone <repo-url>
cd kolicode

# 2. Instalar dependencias ThunderKoli
cd backend/thunderkoli
npm install
cd ../..

# 3. Instalar dependencias frontend
cd frontend
npm install
cd ..

# 4. Configurar variables de entorno
cp backend/thunderkoli/.env.example backend/thunderkoli/.env
# Editar .env con tus credenciales

# 5. Iniciar servicios
docker-compose up -d postgres redis

# 6. Iniciar desarrollo
npm run dev:all
```

### Variables de Entorno Críticas

```bash
# backend/thunderkoli/.env
NODE_ENV=development
PORT=3001
DATABASE_URL=postgresql://user:pass@localhost:5432/kolicode
REDIS_URL=redis://localhost:6379
SYSTEM_SECRET=<your-secret-here>
GOOGLE_CLIENT_ID=<your-client-id>
GOOGLE_CLIENT_SECRET=<your-client-secret>

# Flags de debugging
ENABLE_ENGINE_DIAGNOSTICS=true
ENABLE_VAULT_DIAGNOSTICS=true
ENABLE_PIPELINE_DIAGNOSTICS=true
DEBUG_LOG_LEVEL=info
```

---

## Arquitectura de Tres Capas

KoliCode utiliza una arquitectura de tres capas claramente definida:

```
┌─────────────────────────────────────────────────┐
│         CAPA 1: Frontend (React + Vite)         │
│         Puerto: 5173                            │
│         - Componentes UI                        │
│         - State Management (Redux/Context)      │
│         - Canvas Editor                         │
│         - Interacciones de Usuario              │
└────────────────┬────────────────────────────────┘
                 │ HTTP/WebSocket
                 ▼
┌─────────────────────────────────────────────────┐
│         CAPA 2: Bridge (API Gateway)            │
│         Puerto: 4000                            │
│         - Routing de Requests                   │
│         - Autenticación y Autorización          │
│         - Rate Limiting                         │
│         - Transformación de Datos               │
│         - Agregación de Respuestas              │
└────────────────┬────────────────────────────────┘
                 │ HTTP
                 ▼
┌─────────────────────────────────────────────────┐
│         CAPA 3: Engine (Backend Services)       │
│         - ThunderKoli (Puerto 3001)             │
│           * Security & Audit                    │
│           * Vault AES-256                       │
│           * Identity Management                 │
│         - UniversalEngine (Puerto 8080)         │
│           * AI Code Generation                  │
│           * Knowledge Hub                       │
│         - Database Layer                        │
│           * PostgreSQL (Puerto 5432)            │
│           * Redis (Puerto 6379)                 │
└─────────────────────────────────────────────────┘
```

### Principios de Diseño

1. **Separación de Responsabilidades**: Cada capa tiene un propósito específico
2. **Comunicación Unidireccional**: Frontend → Bridge → Engine (nunca al revés directamente)
3. **Contratos de Datos**: Interfaces claras entre capas
4. **Aislamiento de Fallos**: Un fallo en una capa no debe colapsar el sistema

---

## Metodología de Debugging

### Filosofía: "No Romper Nada"

Todos los cambios de debugging deben ser:
- **Quirúrgicos**: Mínima modificación del código existente
- **Modulares**: Fáciles de activar/desactivar
- **Reversibles**: Rollback simple y rápido
- **No invasivos**: Tests existentes deben pasar sin cambios

### Pedido de Ejecución Técnica

Ver documentación completa en `.kiro/steering/debugging-methodology.md`

### Ejemplo Real: Debugging ThunderEngine

```javascript
// backend/thunderkoli/src/lib/ThunderEngine.js

async processMission(prompt) {
  const startTime = Date.now();
  
  try {
    const response = await this.aiProvider.generate(prompt);
    const processingTime = Date.now() - startTime;
    
    // 🔍 DIAGNÓSTICO: Capturar si es lento o falla
    if (process.env.ENABLE_ENGINE_DIAGNOSTICS === 'true') {
      if (processingTime > 10000 || response.status === 'error') {
        await this.captureDiagnostic({
          timestamp: new Date().toISOString(),
          missionId: this.generateId(),
          prompt: prompt.substring(0, 500),
          processingTime,
          status: response.status,
          error: null
        });
      }
    }
    
    return response;
  } catch (error) {
    const processingTime = Date.now() - startTime;
    
    // 🔍 DIAGNÓSTICO: Capturar error
    if (process.env.ENABLE_ENGINE_DIAGNOSTICS === 'true') {
      await this.captureDiagnostic({
        timestamp: new Date().toISOString(),
        missionId: this.generateId(),
        prompt: prompt.substring(0, 500),
        processingTime,
        status: 'error',
        error: error.stack
      });
    }
    
    throw error;
  }
}
```

---

## Estándares de Código

### Naming Conventions

```javascript
// ✅ CORRECTO
const userName = 'John';                    // camelCase para variables
function getUserById(id) {}                 // camelCase para funciones
class UserService {}                        // PascalCase para clases
const MAX_RETRIES = 3;                      // UPPER_SNAKE_CASE para constantes
interface IUserData {}                      // PascalCase con I prefix
```

### File Organization

```
backend/thunderkoli/
├── src/
│   ├── api/controllers/        # Controladores de endpoints
│   ├── services/               # Lógica de negocio
│   ├── models/                 # Modelos de datos
│   ├── middleware/             # Middleware de Express
│   ├── utils/                  # Utilidades generales
│   ├── config/                 # Configuración
│   └── lib/                    # Librerías core (Vault, Engine)
├── tests/
│   ├── unit/                   # Tests unitarios
│   ├── integration/            # Tests de integración
│   └── e2e/                    # Tests end-to-end
└── data/                       # Datos persistentes
```

---

## Testing

### Running Tests

```bash
# Tests unitarios
npm run test:unit

# Tests de integración
npm run test:integration

# Tests E2E
npm run test:e2e

# Coverage
npm run test:coverage
```

### Test Coverage Requirements

- **Unit Tests**: > 80% coverage
- **Integration Tests**: Todos los endpoints críticos
- **E2E Tests**: Flujos principales (Asset Pipeline completo)

---

## Deployment

### Docker Deployment

```bash
# Build images
docker-compose build

# Deploy
docker-compose up -d

# Logs
docker-compose logs -f
```

---

## Referencias

- [Arquitectura](ARCHITECTURE.md)
- [API Documentation](API.md)
- [Changelog](../CHANGELOG.md)
- [Debugging Methodology](../.kiro/steering/debugging-methodology.md)

---

**Última actualización:** 2026-04-21  
**Versión:** 1.0.0
