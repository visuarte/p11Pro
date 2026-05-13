# REQUIREMENTS — Auditoría y Requerimientos para proyecto_18

Fecha: 2026-04-20

Objeto: Definir los requisitos funcionales, no funcionales y de validación para el scaffold "next_level", compuesto por un backend JVM con Ktor + Exposed + PostgreSQL y un frontend SPA con Vue 3 + Vite.

--------------------------------------------------------------------------------

1. Contexto técnico

- Backend: Ktor sobre JVM, persistencia con Exposed y PostgreSQL. Punto de entrada: `backend/src/main/kotlin/Application.kt`.
- Frontend: Vue 3 + Vite en `frontend/`. La SPA consume `GET /api/v1/webgl/config` para decidir si inicializa three.js.
- Base de datos: PostgreSQL, base por defecto `ciberpunk`.
- Entidad principal auditada: `checklist_estado` (ver `backend/src/main/kotlin/ChecklistEstado.kt`).

--------------------------------------------------------------------------------

2. Alcance de la auditoría

La auditoría debe verificar:

- Arranque correcto del backend y exposición de endpoints básicos.
- Integración funcional con PostgreSQL y creación de esquema mediante Exposed (o migraciones si se introducen).
- Disponibilidad y comportamiento de los endpoints públicos definidos.
- Funcionamiento del flujo frontend/backend para configuración de WebGL.
- Reproducibilidad del entorno de desarrollo con `docker-compose` y scripts incluidos.

--------------------------------------------------------------------------------

3. Requisitos funcionales (RF)

RF-001 — Arranque del servicio HTTP
- Descripción: El backend debe iniciar correctamente y escuchar en el puerto configurado (por defecto 8040).
- Criterio de aceptación: `GET /health` responde HTTP 200 con el cuerpo exacto `Health Check successful`.
- Validación: `curl -fsS http://localhost:8040/health` (esperar 200 y texto exacto).

RF-002 — Endpoint de configuración WebGL
- Descripción: `GET /api/v1/webgl/config` debe devolver una respuesta JSON válida con las claves `useThreeJsInterop` y `enableTailwindDirectives`.
- Criterio de aceptación: La respuesta incluye `useThreeJsInterop` como booleano; `enableTailwindDirectives` es booleano.
- Validación: `curl -fsS http://localhost:8040/api/v1/webgl/config | jq .` — comprobar esquema y tipos.

RF-003 — Alta de checklist (crear)
- Descripción: `POST /api/v1/checklist` debe aceptar un cuerpo de texto plano y/o JSON (según contrato), persistir el registro en la tabla `checklist_estado` y devolver una respuesta JSON con `id` y `status`.
- Esquema de petición: texto plano en body (Content-Type: text/plain) o JSON libre (según implementación actual).
- Esquema de respuesta esperado (ejemplo): `{ "id": 123, "status": "created" }`.
- Criterio de aceptación:
  - Petición válida devuelve HTTP 201.
  - Registro persistido en PostgreSQL en `checklist_estado` con contenido enviado.
  - Respuesta incluye `id` numérico y `status` igual a `created`.
- Validación:
  - `curl -sS -X POST http://localhost:8040/api/v1/checklist -H 'Content-Type:text/plain' -d 'texto de prueba' | jq .` debe devolver `{"id": <n>, "status":"created"}` y `SELECT estado FROM checklist_estado WHERE id = <n>;` debe devolver el texto enviado.

RF-004 — Consulta de checklist (leer)
- Descripción: `GET /api/v1/checklist/{id}` debe devolver el contenido persistido.
- Criterio de aceptación:
  - Petición con id válido devuelve HTTP 200 y el cuerpo con el texto JSON o texto almacenado.
  - Petición con id inválido (no numérico) devuelve HTTP 400.
  - Petición con id no existente devuelve HTTP 404.
- Validación:
  - `curl -fsS http://localhost:8040/api/v1/checklist/{id}` → 200 y contenido.
  - `curl -fsS http://localhost:8040/api/v1/checklist/notanumber` → 400.

RF-005 — Rutas públicas complementarias
- Descripción: Rutas `/`, `/health`, `/api/health`, `/api/v1/webgl/config` y rutas bajo `/api/v1/kotguaicli` deben responder según contrato.
- Criterio de aceptación: Cada ruta devuelve el código HTTP esperado (200, 201, 202, 401 según contrato) y no genera errores 5xx en condiciones normales.
- Validación: peticiones `curl` específicas y comprobación de códigos y cuerpos.

--------------------------------------------------------------------------------

4. Requisitos no funcionales (RNF)

RNF-001 — Reproducibilidad local
- El proyecto debe poder levantarse en macOS (zsh) con dependencias documentadas y comandos repetibles.
- Criterio de aceptación: Un entorno limpio puede ejecutar backend, frontend y base de datos usando `docker-compose` y los scripts provistos.

RNF-002 — Separación de responsabilidades
- La lógica de negocio reside en el backend; el frontend solo consume configuración y datos.
- Criterio de aceptación: El frontend no contiene lógica de persistencia ni reglas de negocio críticas.

RNF-003 — Mantenibilidad
- Código legible y modular; nuevas rutas y propiedades de configuración deben poder añadirse con cambios localizados.
- Criterio de aceptación: estructura de paquetes clara y tests/ejemplos para agregar nuevas APIs.

RNF-004 — Compatibilidad de frontend
- La SPA debe construir con Vite (`npm run build`) y funcionar en modo producción.
- Criterio de aceptación: `npm run build` finaliza sin errores y genera `dist/` utilizable.

RNF-005 — Tolerancia a errores y manejo de excepciones
- Los endpoints deben devolver respuestas controladas ante entradas inválidas o fallos de DB (400, 404, 500 según corresponda) y no filtrar excepciones internas.
- Criterio de aceptación: pruebas que simulan entradas inválidas y desconexiones de DB muestran códigos y mensajes previstos.

--------------------------------------------------------------------------------

5. Validación técnica (suite mínima)

La validación mínima automatizable debe incluir:

- Arranque del backend y comprobación de logs.
- Verificación de `GET /health` (200 y texto exacto).
- Verificación de `GET /api/v1/webgl/config` (esquema esperado y tipos booleanos).
- Inserción y lectura de registros en `checklist_estado` mediante `POST`/`GET`.
- Construcción del frontend (`npm ci && npm run build`).
- Levantado completo con `docker-compose up --build -d` y ejecución de `scripts/tests/smoke_checklist.sh`.

Comandos de ejemplo (macOS zsh):

```bash
cd /ruta/al/proyecto_18
docker-compose up --build -d
curl -fsS http://localhost:8040/health
curl -fsS http://localhost:8040/api/v1/webgl/config | jq .
# POST de prueba
curl -sS -X POST http://localhost:8040/api/v1/checklist -H 'Content-Type:text/plain' -d 'texto de prueba' | jq .
```

--------------------------------------------------------------------------------

6. Criterios de aceptación globales

El proyecto se considera conforme si:

- El backend inicia sin errores y responde en el puerto esperado.
- PostgreSQL está correctamente integrado (las tablas necesarias se crean y los datos persisten).
- Los endpoints públicos documentados devuelven respuestas coherentes y los códigos HTTP esperados.
- El frontend puede decidir de forma dinámica si inicializar three.js usando la respuesta de `/api/v1/webgl/config`.
- La construcción y ejecución local son reproducibles mediante `docker-compose` y los scripts provistos.

--------------------------------------------------------------------------------

7. Mejoras recomendadas (para completar el contrato)

- Definir el formato exacto de la petición y respuesta de `POST /api/v1/checklist` (por ejemplo, Content-Type y JSON schema o texto puro).
- Documentar si `/api/v1/kotguaicli` es endpoint real, legado o temporal y establecer política de autenticación.
- Añadir sección de errores esperados por endpoint (400, 404, 500) con mensajes de ejemplo.
- Incluir DDL esperado de `checklist_estado` o referencia a la migración SQL (si se introduce Flyway).
- Separar "auditoría técnica" de "requisitos del sistema" para facilitar su uso como checklist y como base de desarrollo.

--------------------------------------------------------------------------------

8. RF-003 (redacción robusta recomendada)

RF-003: Crear checklist (versión robusta)
- Descripción: `POST /api/v1/checklist` acepta una entrada válida (texto o JSON según contrato), persiste el contenido en `checklist_estado` y devuelve una respuesta JSON con `id` y `status`.
- Criterio de aceptación:
  - HTTP 201 en caso de éxito con `{"id": <number>, "status": "created"}`.
  - HTTP 400 para cuerpos inválidos con `{ "error": "invalid payload" }`.
  - Persistencia verificada en la tabla `checklist_estado`.
- Validación: `curl -fsS -X POST http://localhost:8040/api/v1/checklist -H 'Content-Type:text/plain' -d 'texto de prueba' | jq .` debe devolver los campos indicados y la DB debe contener el registro.

--------------------------------------------------------------------------------

Notas finales

Si quieres, actualizo `REQUIREMENTS.md` con:

- DDL exacto de `checklist_estado` sacado de `ChecklistEstado.kt`.
- Un ejemplo detallado de body/response para cada endpoint y sección de errores esperados.
- Un OpenAPI minimal que refleje los endpoints y esquemas.

Indica qué prefieres que añada y lo incorporo en la versión final.


