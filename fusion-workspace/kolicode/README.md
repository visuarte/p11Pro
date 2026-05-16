# 🚀 KoliCode

Sistema integrado que fusiona ThunderKoli v2.1, UniversalEngine Hub, P10pro y Design Studio en una aplicación desktop unificada.

> **Proyecto renombrado de "Unified Design Studio" a "KoliCode" el 2026-04-21**

## 🎯 Componentes

- **ThunderKoli v2.1** - Seguridad + Auditoría + Identidad + Vault AES-256
- **UniversalEngine Hub** - Generador de código IA + Knowledge Hub
- **P10pro** - Editor creativo + Tokens + Assets + Canvas
- **Design Studio** - Motor gráfico (Pose, Color, Vectores)

## 🏗️ Arquitectura

```
kolicode/
├── backend/
│   ├── thunderkoli/      # Node.js + Express (Puerto 3001)
│   ├── universalengine/  # Kotlin + Ktor (Puerto 8080)
│   └── gateway/          # API Gateway (Puerto 4000)
├── frontend/             # React + TypeScript + Vite (Puerto 5173)
├── creative/             # Processing sketches
├── python-worker/        # GPU workers (IA, vectores, color)
└── config/               # Configuración unificada
```

## 🚀 Quick Start

### Prerequisitos

- Docker + Docker Compose
- Node.js 18+ LTS
- JDK 17+ (para Kotlin)
- Python 3.11+

### Instalación

```bash
# 1. Clonar el repositorio
git clone <repo-url>
cd kolicode

# 2. Instalar dependencias backend ThunderKoli
cd backend/thunderkoli
npm install
cd ../..

# 3. Instalar dependencias frontend
cd frontend
npm install
cd ..

# 4. Configurar variables de entorno
cp backend/universalengine/.env.example backend/universalengine/.env
# Editar .env con tus credenciales

# 5. Iniciar con Docker Compose
docker-compose up -d

# 6. Verificar servicios
docker-compose ps
```

### Desarrollo Local

```bash
# Terminal 1: ThunderKoli
cd backend/thunderkoli
npm run dev

# Terminal 2: UniversalEngine
cd backend/universalengine
./gradlew run

# Terminal 3: Frontend
cd frontend
npm run dev

# Terminal 4: API Gateway
cd backend/gateway
npm run dev
```

## 📚 Documentación

- [Project Charter](docs/PROJECT_CHARTER.md) - Objetivos, alcance, criterios de exito y no-goals del proyecto
- [Arquitectura del Sistema](docs/ARCHITECTURE.md) - Diagrama de componentes, flujos de datos, seguridad
- [Architecture Diagrams](docs/architecture/README.md) - Diagramas Mermaid de componentes, secuencias y estados
- [Shared Contracts](shared/README.md) - TypeScript compartido y contratos Protobuf/gRPC
- [Guía de Desarrollo](docs/DEVELOPMENT_GUIDE.md) - Metodología de debugging, estándares de código, testing
- [API Documentation](docs/API.md) - Endpoints completos, ejemplos de requests/responses
- [Integration Contracts](docs/INTEGRATION_CONTRACTS.md) - Contratos entre modulos, latencias y compatibilidad
- [Changelog](CHANGELOG.md) - Historial de cambios y versiones
- [Deployment Guide](docs/DEPLOYMENT.md) - Guía de despliegue
- [ThunderKoli Docs](backend/thunderkoli/README.md) - Módulo de seguridad y auditoría
- [UniversalEngine Docs](backend/universalengine/README.md) - Generador de código IA
- [P10pro Docs](frontend/README.md) - Editor creativo

## 🔒 Seguridad

- Vault AES-256 para encriptación de assets
- Auditoría completa de todas las acciones
- Autenticación multi-proveedor (Google + WhatsApp)

## 📊 Performance

- Render: <2s en hardware mid-range
- Canvas: 60 FPS durante edición
- Pipeline completo: <30s

## 🧪 Testing

```bash
# Backend ThunderKoli
cd backend/thunderkoli
npm test

# Frontend
cd frontend
npm test
```

## 📦 Build & Deploy

```bash
# Build completo
docker-compose build

# Deploy
docker-compose up -d

# Logs
docker-compose logs -f
```

## 🤝 Contribución

Ver [CONTRIBUTING.md](CONTRIBUTING.md)

## 📄 Licencia

Ver [LICENSE](LICENSE)

---

**Generado por:** Fusion Scripts v1.0.0  
**Fecha:** 2026-04-20
