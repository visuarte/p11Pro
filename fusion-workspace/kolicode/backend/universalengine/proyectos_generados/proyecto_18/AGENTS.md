# AGENTS: guía rápida para agentes AI que contribuyen al repositorio

Propósito: dar a un agente AI (o nuevo desarrollador) la información mínima y accionable
para ser productivo inmediatamente en este proyecto.

- Arquitectura alta ("big picture")
  - Backend: Ktor (JVM) + Exposed + PostgreSQL. Código principal en `backend/src/main/kotlin`.
    - Entrada principal: `backend/src/main/kotlin/Application.kt` (server Netty, puerto 8040).
    - Rutas y API: `ChecklistApi.kt` expone `/api/v1/checklist` y `Application.kt` expone `/api/v1/webgl/config`, `/health`.
    - Modelo de datos: `ChecklistEstado.kt` define la tabla `checklist_estado` con columnas `id` y `estado`.
  - Frontend: Vue 3 + Vite (npm) en `frontend/`.
    - Código principal: `frontend/src/App.vue`, `frontend/src/main.js`.
    - Scripts npm: `npm run dev`, `npm run build`, `npm run preview` (ver `frontend/package.json`).
  - Integración: El frontend hace llamadas a backend en rutas `/api/v1/*`.
    - Ejemplo crítico: `App.vue` hace `fetch('/api/v1/webgl/config')` para decidir si inicializar three.js.

- Por qué está así (decisiones estructurales)
  - Proyecto scaffold 'next_level' que mezcla JVM backend y una SPA moderna. El backend expone APIs simples y una configuración de WebGL que guía la inicialización del frontend.
  - Uso de Exposed con SQL directo (objetos Table) para simplicidad y portabilidad en el scaffold.

- Comandos esenciales (workflows reproducibles)
  - Backend (rápido):
    - Desde la raíz: `cd backend && ./gradlew run` — inicia Ktor en el puerto 8040.
    - Build: `cd backend && ./gradlew build`.
  - Frontend (rápido, npm):
    - `cd frontend && npm install && npm run dev` — arranca Vite (por defecto puerto 5173).
    - Build (producción): `cd frontend && npm run build` -> `frontend/dist`.
  - Alternativa frontend (Gradle Kotlin/JS): `cd frontend && ./gradlew jsBrowserDevelopmentRun` (documentado en `README_NEXT_LEVEL.md`).

Docker / entorno local
- Archivo incluido: `docker-compose.yml` (raíz) para levantar PostgreSQL en desarrollo.
- Levantar DB y comprobar:
  ```bash
  docker-compose up -d
  docker-compose logs -f db
  ```
- Variables de entorno usadas por el backend (con valores por defecto):
  - DB_HOST (default: localhost)
  - DB_PORT (default: 5432)
  - DB_NAME (default: ciberpunk)
  - DB_USER (default: postgres)
  - DB_PASSWORD (default: postgres)
  - JDBC_DATABASE_URL (si está presente, tiene prioridad sobre DB_HOST/DB_PORT/DB_NAME)
  - USE_THREE_JS, ENABLE_TAILWIND_DIRECTIVES (flags booleanos, leídos desde env)


- Patrones y convenciones del repositorio (específicos)
  - APIs versionadas bajo `/api/v1/...` y endpoints health en `/health` y `/api/health`.
  - Flags de configuración embedidos como constantes en `Application.kt` (p.ej. `USE_THREE_JS`) — los agentes pueden actualizar ahí para cambiar comportamiento runtime.
  - DB credentials hardcodeadas en `Application.kt` (localhost/postgres/postgres). Trátalas como valores de desarrollo: cambiar a variables de entorno o `application.conf` al preparar PRs.
  - Minimalismo en serialización: Ktor + kotlinx.json está instalado y usado (`ContentNegotiation` + `json()` en `Application.kt`).
  - Objetos de Exposed (p.ej. `ChecklistEstado`) colocan la lógica de esquema en código; los agentes deben usar `SchemaUtils.create(...)` si introducen nuevas tablas.

- Integración y puntos externos
  - PostgreSQL: dependencia en `backend/build.gradle.kts` (driver `org.postgresql:postgresql:42.7.4`).
  - three.js está en `frontend/package.json` — la decisión de usarlo depende de la respuesta de `/api/v1/webgl/config`.
  - No hay servidor estático configurado para servir `frontend/dist` desde Ktor; README sugiere integrarlo en una fase posterior — PRs que implementen servir estático deben modificar `Application.kt`.

- Qué buscar antes de editar/añadir código
  - Revisa `PROJECT_CONTEXT.json` y `README_NEXT_LEVEL.md` para entender el perfil `next_level` y requisitos del dominio.
  - Comprueba las rutas HTTP existentes en `Application.kt` y `ChecklistApi.kt` para evitar choques de rutas.
  - Si añades tablas Exposed, actualiza la sección de conexión y `SchemaUtils.create(...)` para incluirlas.

- Ejemplos concretos rápidos
  - Añadir bandera runtime: cambiar `private const val USE_THREE_JS = true` en `backend/src/main/kotlin/Application.kt` para forzar raw WebGL.
  - Probar endpoint webgl config: `curl http://localhost:8040/api/v1/webgl/config` — devuelve JSON con `useThreeJsInterop`.
  - Insertar checklist (curl):
    - `curl -X POST -d '{"foo":1}' http://localhost:8040/api/v1/checklist` -> crea un registro (el body se guarda como texto JSON en `estado`).

    Ejecutar con docker-compose
    - Levantar Postgres y luego el backend (desde la raíz):
      ```bash
      docker-compose up -d
      cd backend && ./gradlew run
      ```
      El backend por defecto se conecta a la base de datos usando las variables de entorno descritas arriba; si usas el docker-compose del repositorio no necesitas cambiar nada.

- Prioridades al preparar PRs y revisiones automáticas
  - No modificar credenciales hardcodeadas en PRs de funcionalidad; propone usar variables de entorno y documentarlo.
  - Pruebas de integración mínimas: comprobar `/health`, `/api/health`, `/api/v1/webgl/config` y las rutas de `checklist` en un entorno dev con Postgres corriendo.

Referencias claves (archivos y directorios):
  - `backend/src/main/kotlin/Application.kt`
  - `backend/src/main/kotlin/ChecklistApi.kt`
  - `backend/src/main/kotlin/ChecklistEstado.kt`
  - `backend/build.gradle.kts`
  - `frontend/package.json`, `frontend/src/App.vue`, `frontend/src/main.js`
  - `PROJECT_CONTEXT.json`, `README_NEXT_LEVEL.md`

Si necesitas, puedo expandir esto con pasos automáticos para ejecutar un entorno de desarrollo (docker-compose para Postgres + comandos para iniciar backend y frontend), o generar PRs que conviertan las credenciales en variables de entorno.

