# proyecto_18 — README oficial

Última actualización: 2026-05-15

Resumen
-------
Proyecto scaffold "next_level" que combina un backend JVM (Ktor + Exposed + PostgreSQL) y un frontend SPA (Vue 3 + Vite). Está pensado como ejemplo para integrar una API sencilla con un cliente que decide si inicializar three.js según la configuración devuelta por el backend.

Estructura relevante
- `backend/` — Servidor Ktor, Exposed ORM, Gradle build.
- `frontend/` — Vue 3 + Vite app.
- `docker-compose.yml` — servicios para desarrollo (Postgres + opcionalmente backend/frontend).
- `docker-compose.prod.yml` — esqueleto operativo para staging/producción.
- `docs/plan_despliegue.md` — plan de despliegue detallado.
- `docs/postman_collection.json` — colección importable para Postman.
- `docs/dependency_audit.md` — procedimiento y salida de auditoría de dependencias.
- `docs/load_test_report.md` — baseline de carga y objetivos de rendimiento.
- `REQUIREMENTS.md` — requisitos funcionales y no funcionales derivados de la auditoría.

Quickstart (desarrollo, macOS zsh)
---------------------------------
1) Clona el repositorio y sitúate en la raíz del proyecto:

```bash
cd /ruta/al/proyecto_18
```

2) Levantar servicios (requiere Docker + Docker Compose):

```bash
docker compose up --build -d
```

3) Comprobar salud del backend:

```bash
curl -fsS http://localhost:8040/health
curl -fsS http://localhost:8040/api/v1/webgl/config | jq .
```

4) Ejecutar el smoke test automatizado incluido:

```bash
chmod +x scripts/tests/smoke_checklist.sh
scripts/tests/smoke_checklist.sh
```

Ejecutar backend localmente (sin Docker)
-------------------------------------
Si prefieres ejecutar solo el backend:

```bash
cd backend
./gradlew run
```

Build frontend local
--------------------
```bash
cd frontend
npm install
npm run dev    # modo desarrollo
npm run build  # build producción -> dist/
```

Variables de entorno claves
- `DB_HOST`, `DB_PORT`, `DB_NAME`, `DB_USER`, `DB_PASSWORD`, `JDBC_DATABASE_URL`
- `SKIP_DB_INIT` — si =1 evita ejecutar migraciones/arranque de BD
- `PORT` — puerto del backend (por defecto 8040)
- `USE_THREE_JS`, `ENABLE_TAILWIND_DIRECTIVES`
- `KOTGUAICLI_PATH`, `KOTGUAICLI_AUTH_TOKEN`

Uso de `.env`
- Se incluye un archivo de ejemplo `.env.example` en la raíz. Copia este archivo a `.env` y ajusta valores antes de ejecutar localmente o en un host de staging.
- NO comitees tu `.env` con credenciales reales. Añade `.env` a tu `.gitignore` si es necesario.

Comprobación de secretos
- Incluye un script de comprobación rápida `scripts/check_secrets.sh` que busca patrones comunes de credenciales en el repo. Ejecuta el script antes de crear PRs que añadan dependencias o config nueva.

CI y calidad
- `./github/workflows/ci.yml` valida backend, frontend y smoke.
- `./github/workflows/security.yml` ejecuta auditoría de dependencias y Trivy.
- `scripts/audit_dependencies.sh` genera reportes locales en `build/reports/dependency-audit/`.

Observabilidad
- El backend expone `/metrics` en formato Prometheus.
- `backend/src/main/resources/logback.xml` emite logs estructurados JSON en stdout.
- Hay tests de `kotguaicli` en `backend/src/test/kotlin/com/generated/ciberpunk/KotguaicliApiTest.kt`.

Despliegue y empaquetado
- `k8s/base/` contiene manifests base para backend, frontend e ingress.
- `k8s/overlays/production/` contiene overlay Kustomize para producción.
- `RELEASE.md` resume el checklist de salida.

Limpieza de generados
- `proyecto_18` es reutilizable como **template saneado**, pero no debe convivir con snapshots residuales dentro del mismo flujo operativo.
- Recomendación: promover este proyecto a una plantilla canónica y dejar `proyectos_generados/` solo para instancias activas o archivadas.


Endpoints principales
- GET `/` — saludo simple
- GET `/health` y `/api/health` — healthcheck
- GET `/metrics` — métricas Prometheus
- GET `/api/v1/webgl/config` — devuelve configuración para frontend
- POST `/api/v1/checklist` — crea un estado (body como texto)
- GET `/api/v1/checklist/{id}` — obtiene un estado
- Rutas bajo `/api/v1/kotguaicli` — opciones para generar/servir docs (protegibles mediante `KOTGUAICLI_AUTH_TOKEN`)

Buenas prácticas y recomendaciones rápidas
- No llevar credenciales en el repo: usar `.env` o secret manager.
- Usar Flyway para migraciones antes de arrancar en staging/producción.
- Ejecutar `scripts/tests/smoke_checklist.sh` y `scripts/audit_dependencies.sh` antes de abrir PRs importantes.
- Limpiar `._*` / residuos de macOS antes de builds Docker si se trabaja desde Finder o discos externos.

## Nota sobre `proyecto_18`

`proyecto_18` se conserva como referencia consultable dentro de `proyectos_generados/`, pero **no debe considerarse fuente canónica del producto KoliCode**.

Si en el futuro se decide reutilizarlo como base o plantilla:

1. evaluarlo primero fuera del flujo activo del Hub
2. promover una copia a `_candidates/` o a una carpeta de plantilla dedicada
3. no mover la copia viva `proyecto_18/` mientras el motor siga resolviendo por `proyecto_<id>`

Soporte y siguientes pasos
- Para el plan completo de despliegue ver `docs/plan_despliegue.md`.
- Para requisitos funcionales ver `REQUIREMENTS.md`.
- Para desplegar en producción básica usa `docker compose -f docker-compose.prod.yml --env-file .env up -d --build`.
- Para Kubernetes usa `kustomize build k8s/overlays/production`.
