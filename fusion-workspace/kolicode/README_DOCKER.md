# KoliCode - Docker Compose Setup Guide

**Fecha:** 2026-05-13  
**Versión:** 1.0  
**Task:** 1.4 - Configurar Docker Compose

---

## 📋 Descripción General

Este proyecto utiliza Docker Compose para gestionar los servicios de infraestructura:
- **PostgreSQL 16** (alpine) - Base de datos principal
- **Redis 7** (alpine) - Caché, sesiones y rate limiting

Los servicios backend (ThunderKoli, UniversalEngine, Bridge) se habilitarán en Task 2.4 y 2.5.

---

## 🚀 Quick Start

### 1. Requisitos Previos

- **Docker Desktop** instalado y corriendo
  - macOS: [Docker Desktop for Mac](https://docs.docker.com/desktop/install/mac-install/)
  - Windows: [Docker Desktop for Windows](https://docs.docker.com/desktop/install/windows-install/)
  - Linux: [Docker Engine](https://docs.docker.com/engine/install/)

- **Node.js 18+** (para scripts npm)

### 2. Configuración Inicial

```bash
# 1. Copiar archivo de configuración
npm run setup
# o manualmente:
cp .env.example .env

# 2. (Opcional) Editar .env con tus valores
nano .env

# 3. Iniciar servicios Docker
npm run docker:up
```

### 3. Verificar que los Servicios Están Corriendo

```bash
# Ver estado de contenedores
npm run docker:ps

# Ver logs en tiempo real
npm run docker:logs
```

---

## 🛠️ Scripts Disponibles

### Gestión de Servicios

| Comando | Descripción |
|---------|-------------|
| `npm run docker:up` | 🚀 Inicia PostgreSQL y Redis |
| `npm run docker:down` | 🛑 Detiene todos los servicios |
| `npm run docker:restart` | 🔄 Reinicia todos los servicios |
| `npm run docker:logs` | 📋 Ver logs en tiempo real |
| `npm run docker:ps` | 📊 Ver estado de contenedores |
| `npm run docker:clean` | 🧹 Detener y eliminar volúmenes |

### Base de Datos

| Comando | Descripción |
|---------|-------------|
| `npm run db:psql` | 🐘 Conectar a PostgreSQL CLI |
| `npm run db:backup` | 💾 Crear backup de la base de datos |

### Redis

| Comando | Descripción |
|---------|-------------|
| `npm run redis:cli` | 🔴 Conectar a Redis CLI |

### Desarrollo

| Comando | Descripción |
|---------|-------------|
| `npm run dev:all` | 🚀 Iniciar Docker + Frontend dev server |

---

## 🔗 Conexión a los Servicios

### PostgreSQL

```bash
# Conexión desde tu máquina local
Host:     localhost
Port:     5432
Database: kolicode
User:     kolicode
Password: kolicode_dev_pass

# Connection String
postgresql://kolicode:kolicode_dev_pass@localhost:5432/kolicode
```

**Ejemplo con psql (CLI):**
```bash
npm run db:psql
```

**Ejemplo desde Node.js:**
```javascript
const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL
});
```

### Redis

```bash
# Conexión desde tu máquina local
Host: localhost
Port: 6379

# Connection String
redis://localhost:6379
```

**Ejemplo con redis-cli:**
```bash
npm run redis:cli
# Luego dentro de redis-cli:
> ping
PONG
> set mykey "Hello"
OK
> get mykey
"Hello"
```

**Ejemplo desde Node.js (con ioredis):**
```javascript
const Redis = require('ioredis');

const redis = new Redis(process.env.REDIS_URL);
```

---

## 📁 Estructura de Archivos

```
kolicode/
├── docker-compose.yml        # Configuración de servicios Docker
├── .env.example              # Variables de entorno (template)
├── .env                      # Variables de entorno (tu config)
├── package.json              # Scripts npm
├── scripts/
│   ├── docker-up.sh         # Script de inicio
│   ├── docker-down.sh       # Script de parada
│   ├── docker-restart.sh    # Script de reinicio
│   ├── docker-logs.sh       # Script de logs
│   └── init-db.sql          # Inicialización de PostgreSQL
└── README_DOCKER.md         # Esta guía
```

---

## 🐘 PostgreSQL - Detalles

### Configuración

- **Versión:** PostgreSQL 16 (alpine)
- **Volumen:** `postgres_data` (persistente)
- **Extensiones instaladas:**
  - `uuid-ossp` - Generación de UUIDs
  - `pg_trgm` - Búsqueda de texto fuzzy
- **Schema:** `kolicode`
- **Configuración:**
  - Max connections: 200
  - Shared buffers: 256MB

### Health Check

PostgreSQL tiene un health check cada 10 segundos:
```bash
pg_isready -U kolicode -d kolicode
```

### Acceso Directo

```bash
# CLI interactivo
npm run db:psql

# Ejecutar query directamente
docker-compose exec postgres psql -U kolicode -d kolicode -c "SELECT version();"

# Ver tablas
docker-compose exec postgres psql -U kolicode -d kolicode -c "\dt"
```

### Backup y Restore

```bash
# Crear backup (se guarda en backups/)
npm run db:backup

# Restaurar desde backup
docker-compose exec -T postgres psql -U kolicode -d kolicode < backups/kolicode_20260513_120000.sql
```

---

## 🔴 Redis - Detalles

### Configuración

- **Versión:** Redis 7 (alpine)
- **Volumen:** `redis_data` (persistente)
- **Persistencia:** AOF (Append Only File) habilitado
- **Max Memory:** 256MB
- **Eviction Policy:** allkeys-lru (elimina keys menos usadas)

### Health Check

Redis tiene un health check cada 10 segundos:
```bash
redis-cli ping
```

### Acceso Directo

```bash
# CLI interactivo
npm run redis:cli

# Ver todas las keys
docker-compose exec redis redis-cli KEYS '*'

# Ver info del servidor
docker-compose exec redis redis-cli INFO
```

### Comandos Útiles

```bash
# Ver memoria usada
docker-compose exec redis redis-cli INFO memory

# Ver número de keys
docker-compose exec redis redis-cli DBSIZE

# Limpiar toda la base de datos (¡cuidado!)
docker-compose exec redis redis-cli FLUSHALL
```

---

## 🔧 Troubleshooting

### Docker no está corriendo

```
❌ Error: Docker is not running
```

**Solución:** Inicia Docker Desktop y espera a que el ícono deje de parpadear.

---

### Puerto ya en uso

```
Error: bind: address already in use
```

**Solución:** Cambia el puerto en `.env`:

```bash
# .env
POSTGRES_PORT=5433  # En lugar de 5432
REDIS_PORT=6380     # En lugar de 6379
```

Luego reinicia:
```bash
npm run docker:restart
```

---

### Servicios no pasan health check

```
⚠️ PostgreSQL is starting... (may take a few more seconds)
```

**Solución:** Espera 10-15 segundos más. Si continúa:

```bash
# Ver logs para identificar el problema
npm run docker:logs

# Reiniciar servicios
npm run docker:restart
```

---

### Permisos en volúmenes (Linux)

Si tienes problemas de permisos en Linux:

```bash
# Ver permisos de volúmenes
docker volume inspect kolicode_postgres_data

# Si necesitas recrear volúmenes
npm run docker:clean
npm run docker:up
```

---

### Limpiar todo y empezar de cero

```bash
# 1. Detener y eliminar contenedores + volúmenes
npm run docker:clean

# 2. Eliminar imágenes (opcional)
docker-compose down --rmi all

# 3. Volver a iniciar
npm run docker:up
```

---

## 📊 Health Checks

Los servicios tienen health checks automáticos:

### PostgreSQL
- **Intervalo:** 10 segundos
- **Timeout:** 5 segundos
- **Reintentos:** 5
- **Test:** `pg_isready -U kolicode -d kolicode`

### Redis
- **Intervalo:** 10 segundos
- **Timeout:** 5 segundos
- **Reintentos:** 5
- **Test:** `redis-cli ping`

Puedes verificar el estado de salud:

```bash
docker-compose ps
# Columna "Status" muestra "healthy" cuando todo está bien
```

---

## 🔒 Seguridad

### Desarrollo Local

Las credenciales por defecto son **solo para desarrollo**:
- `POSTGRES_PASSWORD=kolicode_dev_pass`

### Producción

**NUNCA uses las credenciales por defecto en producción.**

1. Genera contraseñas seguras:
   ```bash
   openssl rand -base64 32
   ```

2. Actualiza `.env`:
   ```bash
   POSTGRES_PASSWORD=tu_contraseña_segura_aleatoria
   ```

3. **No commitees `.env` a Git** (ya está en `.gitignore`)

---

## 🚀 Próximos Pasos

Una vez Docker esté funcionando:

1. **Task 2.4:** Configurar Node.js Bridge (API Gateway)
2. **Task 2.5:** Configurar ThunderKoli y UniversalEngine
3. **Task 3.1:** Crear schema inicial de PostgreSQL
4. **Task 3.2:** Configurar Redis para sesiones

En ese momento, descomenta los servicios backend en `docker-compose.yml`.

---

## 📚 Referencias

- [Docker Compose Docs](https://docs.docker.com/compose/)
- [PostgreSQL Docker Hub](https://hub.docker.com/_/postgres)
- [Redis Docker Hub](https://hub.docker.com/_/redis)
- [PostgreSQL Documentation](https://www.postgresql.org/docs/16/)
- [Redis Documentation](https://redis.io/docs/)

---

## 📝 Changelog

| Versión | Fecha | Cambios |
|---------|-------|---------|
| 1.0 | 2026-05-13 | Setup inicial: PostgreSQL 16 + Redis 7 |

---

**Última actualización:** 2026-05-13  
**Mantenido por:** KoliCode Team  
**Status:** ✅ Completado (Task 1.4)

