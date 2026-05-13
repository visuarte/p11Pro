# proyecto_18 — README oficial

Última actualización: 2026-04-20

Resumen
-------
Proyecto scaffold "next_level" que combina un backend JVM (Ktor + Exposed + PostgreSQL) y un frontend SPA (Vue 3 + Vite). Está pensado como ejemplo para integrar una API sencilla con un cliente que decide si inicializar three.js según la configuración devuelta por el backend.

Estructura relevante
- `backend/` — Servidor Ktor, Exposed ORM, Gradle build.
- `frontend/` — Vue 3 + Vite app.
- `docker-compose.yml` — servicios para desarrollo (Postgres + opcionalmente backend/frontend).
- `docs/plan_despliegue.md` — plan de despliegue detallado.
- `REQUIREMENTS.md` — requisitos funcionales y no funcionales derivados de la auditoría.

Quickstart (desarrollo, macOS zsh)
---------------------------------
1) Clona el repositorio y sitúate en la raíz del proyecto:

```bash
cd /ruta/al/proyecto_18
```

2) Levantar servicios (requiere Docker + Docker Compose):

```bash
docker-compose up --build -d
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
- `SKIP_DB_INIT` — si =1 evita la creación de tablas en startup
- `PORT` — puerto del backend (por defecto 8040)
- `USE_THREE_JS`, `ENABLE_TAILWIND_DIRECTIVES`

Uso de `.env`
- Se incluye un archivo de ejemplo `.env.example` en la raíz. Copia este archivo a `.env` y ajusta valores antes de ejecutar localmente o en un host de staging.
- NO comitees tu `.env` con credenciales reales. Añade `.env` a tu `.gitignore` si es necesario.

Comprobación de secretos
- Incluye un script de comprobación rápida `scripts/check_secrets.sh` que busca patrones comunes de credenciales en el repo. Ejecuta el script antes de crear PRs que añadan dependencias o config nueva.


Endpoints principales
- GET `/` — saludo simple
- GET `/health` y `/api/health` — healthcheck
- GET `/api/v1/webgl/config` — devuelve configuración para frontend
- POST `/api/v1/checklist` — crea un estado (body como texto)
- GET `/api/v1/checklist/{id}` — obtiene un estado
- Rutas bajo `/api/v1/kotguaicli` — opciones para generar/servir docs (protegibles mediante `KOTGUAICLI_AUTH_TOKEN`)

Buenas prácticas y recomendaciones rápidas
- No llevar credenciales en el repo: usar `.env` o secret manager.
- Añadir migraciones (Flyway) en vez de depender de `SchemaUtils.create` para producción.
- Añadir CI que ejecute pruebas smoke y construya/pushee imágenes.

Soporte y siguientes pasos
- Para el plan completo de despliegue ver `docs/plan_despliegue.md`.
- Para requisitos funcionales ver `REQUIREMENTS.md`.

Si quieres que genere el `docker-compose.prod.yml`, manifests de Kubernetes o un GitHub Actions CI automatizado, dime cuál priorizas: producción (Docker Compose), Kubernetes, o CI.

