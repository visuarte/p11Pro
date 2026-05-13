# Plan de despliegue — proyecto_18

Última actualización: 2026-04-20

Este documento describe pasos reproducibles para desplegar el proyecto en entornos de desarrollo y producción. Contiene: prerrequisitos, variables de entorno, despliegue con Docker Compose (dev y staging), recomendaciones para producción (kubernetes), migraciones de BD, TLS, gestión de secretos, monitorización y CI/CD mínimo.

--------------------------------------------------------------------------------

1) Prerrequisitos
- macOS (zsh) para instrucciones locales.
- Docker y Docker Compose (v2 compatible) instalados y funcionando.
- Java 17+ (si deseas ejecutar el backend localmente sin Docker).
- Node.js 18+ y npm (para frontend build localmente si no usas Docker).

2) Variables de entorno importantes
Se recomienda crear un archivo `.env` (NO incluirlo en el repo) y usar `docker-compose --env-file .env` o `export` en el shell.

- DB_HOST (default: localhost)
- DB_PORT (default: 5432)
- DB_NAME (default: ciberpunk)
- DB_USER (default: postgres)
- DB_PASSWORD (default: postgres)
- JDBC_DATABASE_URL (opcional; tiene prioridad si presente)
- SKIP_DB_INIT (1 para evitar que Exposed cree tablas en startup)
- PORT (puerto para el backend; default 8040)
- USE_THREE_JS (true/false para frontend behavior desde backend)
- ENABLE_TAILWIND_DIRECTIVES (true/false)
- KOTGUAICLI_PATH, KOTGUAICLI_AUTH_TOKEN (si usas integración kotguaicli)

Ejemplo mínimo `.env` (desarrollo):

```bash
DB_HOST=db
DB_PORT=5432
DB_NAME=ciberpunk
DB_USER=postgres
DB_PASSWORD=postgres
PORT=8040
SKIP_DB_INIT=0
USE_THREE_JS=true
ENABLE_TAILWIND_DIRECTIVES=false
```

3) Despliegue local con Docker Compose (desarrollo)

- Desde la raíz del repositorio:

```bash
cd /path/to/proyecto_18
docker-compose up --build -d
# Ver logs del backend
docker-compose logs -f backend
```

- Validación rápida (zsh):

```bash
curl -fsS http://localhost:8040/health
curl -fsS http://localhost:8040/api/v1/webgl/config | jq .
```

- Ejecutar smoke test incluido:

```bash
chmod +x scripts/tests/smoke_checklist.sh
scripts/tests/smoke_checklist.sh
```

4) Ejecutar backend localmente sin Docker (desarrollo rápido)

- Entrar a la carpeta backend y usar Gradle wrapper:

```bash
cd backend
./gradlew run
```

- Opcional: construir fatJar y ejecutarlo:

```bash
./gradlew -q fatJar
java -jar build/libs/*-all.jar
```

5) Construcción y despliegue del frontend (local)

```bash
cd frontend
npm install
npm run dev    # modo desarrollo (Vite)
npm run build  # produce `dist/`
```

Para servir `dist/` en producción puedes usar nginx o servir desde un contenedor estático.

6) Recomendaciones para Producción

- Separar servicios: ejecutar Postgres gestionado (RDS/GCP SQL) o instancias dedicadas; no usar credenciales por defecto.
- Gestionar secretos: Vault / AWS Secrets Manager / GCP Secret Manager o Kubernetes Secrets.
- Migraciones: introducir Flyway o Liquibase. Actualmente el proyecto usa Exposed `SchemaUtils.create` — recomendable convertir a migraciones controladas para producción.
- TLS/HTTPS: poner un reverse-proxy (nginx/Traefik) delante del backend + renovar certificados (Let's Encrypt / ACME).
- Escalado y orquestación: usar Kubernetes para alta disponibilidad y auto-scaling. Propuesta mínima:
  - Crear Deployment para `backend` con readiness/liveness probes apuntando a `/health`.
  - Servicio ClusterIP (o LoadBalancer) y Ingress con TLS.

7) Ejemplo de pasos rápidos para desplegar en un servidor Linux con Docker Compose (producción básica)

- Copiar repo al servidor o usar CI/CD para entregar imágenes.
- Configurar `.env` con credenciales seguras (no en repo).
- Levantar con restart policy y en background:

```bash
docker-compose -f docker-compose.yml --env-file .env up -d --remove-orphans
docker-compose ps
docker-compose logs -f backend
```

8) Migraciones y backups de BD
- Implementar migraciones: añadir Flyway en `backend/build.gradle.kts` y mantener SQLs versionadas en `backend/db/migration`.
- Backup automático: snapshots periódicos del volumen de Postgres o backup vía `pg_dump` a almacenamiento externo.

9) Monitorización y logs
- En producción enviar logs a un colector (Filebeat/Fluentbit) o usar stdout y recoger con el runtime (Docker logging driver).
- Añadir métricas (Prometheus) en siguiente fase; exponer `/metrics` o integrar Micrometer si se migra.

10) CI/CD mínimo (sugerencia)
- Pipeline (GitHub Actions) stages:
  - checkout
  - build backend (`./gradlew build`)
  - run smoke tests (usar `docker-compose` ephemeral or service containers)
  - build/push Docker images to registry (Docker Hub / GHCR)
  - deploy to environment (SSH + docker-compose pull && docker-compose up -d) or trigger k8s rollout

Adjunto snippet (GitHub Actions conceptual):

```yaml
name: CI
on: [push]
jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - name: Build backend
        run: cd backend && ./gradlew -q build
      - name: Run smoke tests
        run: docker-compose up --build -d && ./scripts/tests/smoke_checklist.sh
```

11) Rollback y estrategia de despliegue
- Mantener tags semánticos para imágenes. En caso de fallo, hacer `docker-compose pull <image>:previous && docker-compose up -d` o en k8s hacer `kubectl rollout undo`.

12) Checklist previo a producción (mínimo)
- [ ] Eliminar credenciales hardcodeadas; usar `.env` y secrets manager
- [ ] Añadir migraciones controladas (Flyway)
- [ ] Configurar TLS e Ingress/reverse-proxy
- [ ] Configurar monitorización y alarmas para `/health`
- [ ] Probar restauración de BD desde backup

13) Estimación de esfuerzo (orientativo)
- Preparar entorno de staging con docker-compose y secrets: 4–8 h
- Introducir Flyway y migraciones iniciales: 4–8 h
- Configurar TLS + Ingress (k8s) y CI/CD: 8–16 h

14) Recursos y referencias
- Archivo principal backend: `backend/src/main/kotlin/Application.kt`
- Rutas de checklist: `backend/src/main/kotlin/ChecklistApi.kt`
- Scripts de verificación: `scripts/tests/smoke_checklist.sh`

Si quieres, puedo generar automáticamente:
- un `docker-compose.prod.yml` con ajustes de producción (volúmenes, restart policy, networks),
- manifests Kubernetes básicos (Deployment/Service/Ingress),
- y un flujo GitHub Actions más completo que haga build/push/deploy.

