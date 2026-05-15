
## Arranque rapido (Docker)

```zsh
cd /Users/visuarte/Desktop/vegabajaimprentaa
docker compose up -d --force-recreate db-universal api-universal web-universal
STRICT_JSON=1 STRICT_HEADERS=1 ./scripts/smoke_api_8081.zsh
```

- Hub UI: `http://localhost:3001`
- API: `http://localhost:8081`
- Health: `http://localhost:8081/status`

### Orden recomendado de arranque + check del sistema

1) Unificar carpetas legacy/canonicas.
2) Levantar contenedores.
3) Esperar readiness API.
4) Validar endpoint de proyectos.
5) Ejecutar check de sistema de arranque.

El script `scripts/levantar_hub.zsh` ya ejecuta ese orden automaticamente y, por defecto, corre check rapido al final.

```zsh
cd /Users/visuarte/Desktop/vegabajaimprentaa
scripts/levantar_hub.zsh
```

Opciones de check al arrancar:

```zsh
# Omitir check de arranque
RUN_STARTUP_CHECK=0 scripts/levantar_hub.zsh

# Check rapido (default): contrato HTTP/JSON estricto
SYSTEM_CHECK_LEVEL=quick scripts/levantar_hub.zsh

# Check completo: ejecuta preflight local completo
SYSTEM_CHECK_LEVEL=full scripts/levantar_hub.zsh
```

## Limpieza y mantenimiento

Para mantener el proyecto libre de archivos, dependencias y configuraciones antiguas que puedan generar errores o confusión, sigue el checklist y script de LIMPIEZA_TOTAL.md tras cada migración, integración mayor o antes de releases importantes.

- Ver archivo [LIMPIEZA_TOTAL.md](LIMPIEZA_TOTAL.md) para pasos detallados y script automatizado.
- Guia completa de uso con editor externo (VSCode/IntelliJ) y mantenimiento del motor: `docs/runbook_mantenimiento_editor_externo.md`.
- Plantilla de reporte diario operativo: `docs/reportediario.md`.
- Plantilla de reporte semanal de control: `docs/reportesemanal.md`.

---

## Clonado Docker sin colisiones

Se agregaron scripts para crear copias del proyecto en una carpeta nueva con `docker-compose.yml` y `.env` propios. Cada clon usa puertos, nombres de contenedor y volumenes distintos.

### 1) Crear clon

```zsh
cd /Users/visuarte/Desktop/vegabajaimprentaa
scripts/new-clone.zsh vegabajaimprentaa-copia-1 1
```

- Carpeta destino: `/Users/visuarte/Desktop/vegabajaimprentaa-copia-1`
- Puertos por `CLONE_ID=1`: API `8081`, WEB `3001`, DB `5433`
- Si pasas `--up`, lo levanta al terminar.

### 2) Levantar el clon

```zsh
cd /Users/visuarte/Desktop/vegabajaimprentaa
scripts/up-clone.zsh /Users/visuarte/Desktop/vegabajaimprentaa-copia-1
```

### 3) Detener el clon

```zsh
cd /Users/visuarte/Desktop/vegabajaimprentaa
scripts/down-clone.zsh /Users/visuarte/Desktop/vegabajaimprentaa-copia-1
```

### 4) Validar que no colisiona con el original

```zsh
docker compose -p vegabajaimprentaa ps
docker compose -p vegabajaimprentaa_copia_1 ps
lsof -i :8080 -i :8081 -i :3000 -i :3001 -i :5432 -i :5433
```

---

Este README debe ser complementado con instrucciones de build, test, despliegue y contribución.

## Recuperar Hub y unificar generados

```zsh
cd /Users/visuarte/Desktop/vegabajaimprentaa
scripts/unificar_generados.zsh
scripts/levantar_hub.zsh
```

- Carpeta canonica: `proyectos_generados`
- Carpeta legacy (si existe): `generados`
- Contenido no estandar se mueve a: `proyectos_generados/_legacy_import`

### Regla actual para no romper el motor

- Los proyectos vivos del Hub siguen en `proyectos_generados/proyecto_<id>`.
- **No mover** carpetas `proyecto_<id>` fuera de esa raíz mientras el runtime siga resolviendo rutas por convención fija.
- Para bajar ruido sin romper compatibilidad, la limpieza segura se hace dentro de la propia carpeta:
  - `proyectos_generados/_legacy_import/`
  - `proyectos_generados/_archive/`
  - `proyectos_generados/_candidates/`

### Uso recomendado de subcarpetas internas

- `_legacy_import/`: material importado o no normalizado
- `_archive/`: copias o snapshots retirados del flujo activo
- `_candidates/`: candidatos a plantilla o evaluación, sin sustituir la copia viva `proyecto_<id>`

`proyecto_18` queda en evaluación como posible base reutilizable, pero su copia viva no debe moverse todavía si se quiere mantener compatibilidad con el Hub actual.

## Deprecacion de `ProjectApi.kt`

- T0 (2026-04-06): anuncio formal
- T+3 meses (2026-07-06): warnings severos + seguimiento activo por logs
- T+6 meses (2026-10-06): corte del contrato legacy

### Señales para clientes legacy

- Header `Deprecation: true`
- Header `Sunset: 2026-10-06T00:00:00Z`
- Header `Warning: 299 ...`
- Header `Link: </docs/migrations/project-api-to-universalengine>; rel="deprecation"`

### Politica

`ProjectApi.kt` queda en modo read-only / mantenimiento critico.
Toda feature nueva va a `UniversalEngine`.

### Operacion legacy y sunset

- Logs de uso legacy por tenant/endpoint:
  - `GET /api/v1/projects/legacy-usage?tenantId=<id>&endpoint=<path>&limit=100`
  - `GET /api/v1/projects/legacy-usage/summary?tenantId=<id>`
- Dashboard de hitos para Hub:
  - `GET /api/v1/projects/milestones/dashboard?status=planned|on-track|delayed|completed`

### Activar stub `410 Gone` en T+6m

- Modo por entorno: `LEGACY_PROJECT_MODE=warn|gone` (default `warn`)
- Auto corte por fecha sunset: `LEGACY_PROJECT_AUTO_GONE=true`

Ejemplo:

```zsh
cd /Users/visuarte/Desktop/vegabajaimprentaa
LEGACY_PROJECT_MODE=gone docker compose up -d --force-recreate api-universal
```

### Suite automatica de validacion legacy/hitos

```zsh
cd /Users/visuarte/Desktop/vegabajaimprentaa
scripts/test_legacy_endpoints.zsh
```

Valida automaticamente:
- `legacy-usage/summary`
- `milestones/dashboard`
- Stub `410 Gone` con `LEGACY_PROJECT_MODE=gone`

## Prompt IA (PATCH / SCAFFOLD)

La ruta `POST /api/v1/projects/iterate` ahora soporta modo de prompt:

- `mode: "PATCH"` (default): salida solo Kotlin para modificar un archivo.
- `mode: "SCAFFOLD"`: permite respuesta multiarchivo con formato `### FILE: ...`.

Validacion y fallback seguro:

- En `PATCH`, se rechaza salida no-Kotlin (texto explicativo/markdown) y se devuelve fallback seguro con el codigo origen.
- En `SCAFFOLD`, se valida el patron `### FILE: <ruta>` y si no cumple se devuelve fallback seguro con un archivo `Fallback.kt`.
- Baseline sanitizer activado: antes de iterar se limpia ruido narrativo/fences del contenido base para evitar reciclar respuestas contaminadas.

Configuracion de motor local IA por entorno:

- `AI_MODEL` (default `qwen2.5:0.5b`)
- `OLLAMA_URL` (default `http://host.docker.internal:11434/api/generate`)
- `ICON_CONSISTENCY_CHECK` (default `true`) habilita/deshabilita el warning de consistencia del spritesheet al arrancar (`true|false`, tambien acepta `1|0`, `yes|no`, `on|off`).

Ejemplo payload PATCH:

```json
{
  "fileId": 123,
  "instruccion": "Refactoriza para null-safety estricto",
  "mode": "PATCH"
}
```

Ejemplo payload SCAFFOLD:

```json
{
  "fileId": 123,
  "instruccion": "Genera estructura domain/application/infrastructure",
  "mode": "SCAFFOLD"
}
```

## Knowledge Hub (MVP inicial)

Se inicio una capa grounded para fuentes universales (`pdf`, `md`, `txt`) con politica mixta anti-alucinacion.

- Capabilities expone:
  - `knowledgeHubEnabled`
  - `groundedQueryEnabled`
  - `knowledgeSourceFormats`
  - `groundedPolicyMode=mixed`
  - `minCitations=1`, `minConfidence=0.8`

### Endpoints MVP

- `POST /api/v1/knowledge/sources`
  - Registra fuente y la indexa en chunks + embeddings.
  - `type=pdf` espera `content` en base64 de binario PDF.
  - Validacion PDF activa: version `1.4` a `1.7` y capa de texto extraible obligatoria.
- `POST /api/v1/knowledge/query`
  - Ejecuta consulta grounded por similitud de embeddings y devuelve `citations`, `confidence` y metadatos de politica mixta.
- `POST /api/v1/projects/init-from-knowledge`
  - Crea proyecto usando `domainSpec` grounded derivado de citas.
  - Enforment estricto: requiere `>=1` cita y `confidence >= 0.8`.

### Feature flags

- `KNOWLEDGE_HUB_ENABLED=true|false` (default `true`)
- `KNOWLEDGE_GROUNDED_QUERY_ENABLED=true|false` (default `true`)

### Ejemplo rapido

```zsh
curl -sS -X POST "http://localhost:8081/api/v1/knowledge/sources" \
  -H "Content-Type: application/json" \
  -d '{"name":"runbook","type":"md","content":"DomainSpec define functionalRequirements,useCases,dataModel,requiredApis"}'

curl -sS -X POST "http://localhost:8081/api/v1/knowledge/query" \
  -H "Content-Type: application/json" \
  -d '{"query":"Que incluye domainSpec?","intent":"assist"}'

curl -sS -X POST "http://localhost:8081/api/v1/projects/init-from-knowledge" \
  -H "Content-Type: application/json" \
  -d '{"name":"Proyecto Grounded","query":"Genera un proyecto inicial","profile":"static","cliente":"Acme","tarea":"MVP"}'
```

### Manejo global de errores (Ktor)

- Se usa `StatusPages` como pieza central obligatoria para evitar excepciones crudas al cliente.
- Contrato uniforme de error: `apiError` con `code`, `category`, `message`, `requestId`, `tenantId` y `details`.
- Capa de dominio formalizada con `sealed class DomainError` + `DomainException`.
- Correlacion de logs y requests:
  - `CallId` activo con header `X-Request-Id` (si no llega, se genera).
  - `CallLogging` con MDC: `requestId` y `tenantId`.
- Logging estructurado JSON-like activo en `src/main/resources/logback.xml` (stdout).

### Simulacion de edge cases en tests

- Timeout IA (sin dependencia real):
  - system property: `test.ai.timeout=true`
  - env opcional: `TEST_AI_TIMEOUT_SIM=true`
- DB down simulado en `/ready`:
  - system property: `test.db.down=true`
  - env opcional: `TEST_DB_DOWN_SIM=true`

Ejemplo de error esperado:

```json
{
  "status": "ERROR",
  "payload": null,
  "error": "invalid request payload",
  "apiError": {
    "code": "VALIDATION_ERROR",
    "category": "VALIDATION",
    "message": "invalid request payload",
    "requestId": "req-123",
    "tenantId": "tenant-demo",
    "details": null
  }
}
```

## Cierre de bloque API 8081

### Objetivo

Evitar regresiones donde la API responde `200` con body vacio/no JSON en endpoints criticos.

### Runbook rapido

```zsh
REPO_DIR="${REPO_DIR:-$HOME/Desktop/vegabajaimprentaa}"
cd "$REPO_DIR"
docker compose up -d --force-recreate api-universal
STRICT_JSON=1 STRICT_HEADERS=1 ./scripts/smoke_api_8081.zsh
```

Si hay intermitencia de arranque:

```zsh
REPO_DIR="${REPO_DIR:-$HOME/Desktop/vegabajaimprentaa}"
cd "$REPO_DIR"
./scripts/fix_api_runtime.zsh
```

### Scripts disponibles

- `scripts/smoke_api_8081.zsh`
  - Verifica `GET /status`, `GET /api/v1/projects`, `GET /api/v1/capabilities`.
  - `STRICT_JSON=1` falla si el body no es JSON valido.
  - `STRICT_HEADERS=1` falla si `Content-Type` no contiene `application/json`.
- `scripts/fix_api_runtime.zsh`
  - Recreate de `api-universal` por ciclos + smoke estricto.
- `scripts/preflight_local.zsh`
  - Pipeline unico antes de deploy local: tests clave + recreate API + smoke estricto.
- `scripts/system_check_startup.zsh`
  - Check reutilizable de arranque del sistema.
  - `SYSTEM_CHECK_LEVEL=quick` -> smoke HTTP/JSON estricto.
  - `SYSTEM_CHECK_LEVEL=full` -> delega al `preflight_local` completo.
- `scripts/generar_reporte.zsh`
  - Genera `reportediario` y/o `reportesemanal` con fecha/semana pre-rellenada.
  - Uso: `scripts/generar_reporte.zsh daily|weekly|both [--date YYYY-MM-DD] [--week YYYY-WNN] [--responsable "Nombre"]`.
- `scripts/smoke_domain_spec_8081.zsh`
  - Crea un proyecto temporal via `init-static` con `domainSpec` completo.
  - Valida que `PROJECT_CONTEXT.json` persiste `domainSpec` con los 4 bloques no vacios.
  - Falla (exit != 0) si `domainSpec` no queda guardado.
- `scripts/smoke_ui_tooling_8081.zsh`
  - Crea un proyecto temporal con `uiPreset/uiTooling`.
  - Valida que `PROJECT_CONTEXT.json` persiste `uiPreset`, `uiTooling`, `enableA11yChecks`, `enableVisualRegression`.
  - Verifica que se genera `design-tokens.css` cuando se solicita `design-tokens`.
- `scripts/smoke_sync_from_disk_8081.zsh`
  - Valida contrato del endpoint `POST /api/v1/projects/{id}/sync-from-disk` en modo `dryRun`.
- `scripts/smoke_icons_8081.zsh`
  - Verifica `GET /assets/icons.svg`, `GET /assets/icons/catalog` y `POST /api/v1/projects/icons/propagate`.
  - Falla si el catálogo no es consistente (`count != len(icons)`) o falta respuesta esperada.

Runbook de operación de iconos:

- `docs/runbook_icons.md`

### Sync VSCode -> Hub por proyecto

Para reflejar en Hub archivos nuevos/editados directamente en disco (`proyectos_generados/proyecto_<id>`):

```zsh
cd /Users/visuarte/Desktop/vegabajaimprentaa
curl -sS -X POST "http://localhost:8081/api/v1/projects/11/sync-from-disk" \
  -H "Content-Type: application/json" \
  -d '{"dryRun":true,"deleteMissing":false}'
```

- `dryRun=true`: solo calcula cambios (no escribe en DB).
- `deleteMissing=false` (recomendado): no borra registros faltantes en disco.
- En UI del Hub existe botón `Sincronizar VSCode` por tarjeta de proyecto.
- Al abrir un proyecto desde Hub se lanza auto-check `dryRun` (no bloqueante): si detecta cambios en disco, muestra aviso con acción `Sincronizar ahora`.

### Reportes diarios/semanales desde Motor Universal

- Endpoint backend: `POST /api/v1/projects/reports/generate`.
- Botones en Hub (seccion "Estado del motor"): `Generar reporte diario`, `Generar reporte semanal` y `Generar ambos`.
- Campos opcionales en UI: `responsable`, `fecha (diario)` y `semana (YYYY-WNN)`.
- La UI persiste estos campos en `localStorage` (`cineops:reportPreferences`) y se auto-recupera ante JSON corrupto.
- Los archivos se guardan en: `docs/reportes_generados/`.

Smoke dedicado del endpoint:

```zsh
cd /Users/visuarte/Desktop/vegabajaimprentaa
./scripts/smoke_sync_from_disk_8081.zsh
```

Smoke dedicado de iconos:

```zsh
cd /Users/visuarte/Desktop/vegabajaimprentaa
./scripts/smoke_icons_8081.zsh
```

Ejecutar preflight completo:

```zsh
REPO_DIR="${REPO_DIR:-$HOME/Desktop/vegabajaimprentaa}"
cd "$REPO_DIR"
./scripts/preflight_local.zsh
```

Ejecutar preflight con validacion extra de persistencia `domainSpec`:

```zsh
REPO_DIR="${REPO_DIR:-$HOME/Desktop/vegabajaimprentaa}"
cd "$REPO_DIR"
RUN_DOMAIN_SPEC_SMOKE=1 ./scripts/preflight_local.zsh
```

Ejecutar preflight con validacion extra de `domainSpec` y UI tooling:

```zsh
REPO_DIR="${REPO_DIR:-$HOME/Desktop/vegabajaimprentaa}"
cd "$REPO_DIR"
RUN_DOMAIN_SPEC_SMOKE=1 RUN_UI_TOOLING_SMOKE=1 ./scripts/preflight_local.zsh
```

Ejecutar preflight con validación extra de iconos:

```zsh
REPO_DIR="${REPO_DIR:-$HOME/Desktop/vegabajaimprentaa}"
cd "$REPO_DIR"
RUN_DOMAIN_SPEC_SMOKE=1 RUN_UI_TOOLING_SMOKE=1 RUN_SYNC_SMOKE=1 RUN_ICONS_SMOKE=1 ./scripts/preflight_local.zsh
```

Nota CI: `preflight-gate.yml` ejecuta este mismo gate completo con `RUN_DOMAIN_SPEC_SMOKE=1` y `RUN_UI_TOOLING_SMOKE=1`.

### Criterios de aceptacion del bloque

### Contrato HTTP explicito (headers + body JSON)

- `GET /api/v1/capabilities`
  - Header requerido: `Content-Type: application/json`.
  - Body requerido: JSON valido con `status`, `payload`, `error`.
- `POST /api/v1/projects/init-static` ante payload invalido (`400`)
  - Header requerido: `Content-Type: application/json`.
  - Body requerido: JSON valido con `status="ERROR"` y `error` consistente.

### DomainSpec universal (opcional recomendado)

Puedes enviar `domainSpec` para hacer el scaffold mas preciso sin romper compatibilidad legacy.

```json
{
  "domainSpec": {
    "functionalRequirements": ["Autenticacion por roles", "CRUD principal"],
    "useCases": ["Usuario crea contenido", "Moderador revisa reportes"],
    "dataModel": ["User(id,email,role)", "Post(id,authorId,content,status)"],
    "requiredApis": ["POST /api/v1/auth/login", "GET /api/v1/posts"]
  }
}
```

Si `domainSpec` no se envia, el motor aplica una plantilla base automaticamente.

### Tooling UI (opcional recomendado)

Puedes enviar estos campos para mejorar scaffolds de interfaz con prácticas actuales:

```json
{
  "uiPreset": "modern-saas",
  "uiTooling": ["design-tokens", "ui-kit", "a11y-checks"],
  "enableA11yChecks": true,
  "enableVisualRegression": false
}
```

- `uiPreset`: estilo base visual (ej. `modern-saas`, `creative-minimal`, `enterprise-dashboard`).
- `uiTooling`: herramientas de implementación UI sugeridas para el scaffold.
- `enableA11yChecks`: habilita guía/checks de accesibilidad.
- `enableVisualRegression`: habilita guía/checks de regresión visual en CI.

Validacion shell (fuera de `testApplication`):

```zsh
REPO_DIR="${REPO_DIR:-$HOME/Desktop/vegabajaimprentaa}"
cd "$REPO_DIR"
STRICT_JSON=1 STRICT_HEADERS=1 ./scripts/smoke_api_8081.zsh
```

Verificacion especifica de persistencia `domainSpec`:

```zsh
REPO_DIR="${REPO_DIR:-$HOME/Desktop/vegabajaimprentaa}"
cd "$REPO_DIR"
./scripts/smoke_domain_spec_8081.zsh
```

Verificacion especifica de persistencia UI tooling + `design-tokens.css`:

```zsh
REPO_DIR="${REPO_DIR:-$HOME/Desktop/vegabajaimprentaa}"
cd "$REPO_DIR"
./scripts/smoke_ui_tooling_8081.zsh
```

### Codigos de salida esperados (operacion rapida)

| Script | Codigo | Significado | Siguiente accion recomendada |
|---|---:|---|---|
| `scripts/smoke_api_8081.zsh` | `0` | Smoke OK (`status`, JSON y headers correctos) | Continuar despliegue local |
| `scripts/smoke_api_8081.zsh` | `1` | Falla readiness o contrato HTTP/JSON | Ejecutar `./scripts/fix_api_runtime.zsh` y repetir smoke |
| `scripts/preflight_local.zsh` | `10` | Fallaron tests clave | Revisar `./gradlew test` y corregir antes de recrear API |
| `scripts/preflight_local.zsh` | `20` | Fallo estabilizacion runtime (recreate) | Inspeccionar `docker compose logs api-universal` |
| `scripts/preflight_local.zsh` | `30` | Fallo smoke estricto final | Re-ejecutar `STRICT_JSON=1 STRICT_HEADERS=1 ./scripts/smoke_api_8081.zsh` |
| `scripts/preflight_local.zsh` | `40` | Fallo persistencia `domainSpec` en `PROJECT_CONTEXT.json` | Ejecutar `./scripts/smoke_domain_spec_8081.zsh` y revisar generación |
| `scripts/preflight_local.zsh` | `50` | Fallo persistencia UI tooling o `design-tokens.css` | Ejecutar `./scripts/smoke_ui_tooling_8081.zsh` y revisar generación |

Nota: en `preflight_local`, un fallo de smoke estricto siempre termina con codigo `30`.

Diagnostico inmediato por codigo:

- `0` -> Todo OK: `./scripts/preflight_local.zsh` para confirmar antes de deploy.
- `1` -> Smoke fallo: `./scripts/fix_api_runtime.zsh && STRICT_JSON=1 STRICT_HEADERS=1 ./scripts/smoke_api_8081.zsh`.
- `10` -> Tests clave fallaron: `./gradlew test --no-daemon`.
- `20` -> Runtime inestable tras recreate: `docker compose logs --tail=200 api-universal | cat`.
- `30` -> Contrato HTTP/JSON roto al final: `STRICT_JSON=1 STRICT_HEADERS=1 ./scripts/smoke_api_8081.zsh`.
- `40` -> DomainSpec no persistido: `./scripts/smoke_domain_spec_8081.zsh`.
- `50` -> UI tooling no persistido/tokens no generado: `./scripts/smoke_ui_tooling_8081.zsh`.

- `http://localhost:8081/status` responde `200`.
- `http://localhost:8081/api/v1/projects` responde `200` + JSON valido.
- `http://localhost:8081/api/v1/capabilities` responde `200` + JSON valido.
- `STRICT_JSON=1 STRICT_HEADERS=1 ./scripts/smoke_api_8081.zsh` termina en `Done.`.
- `./scripts/fix_api_runtime.zsh` completa sin agotar ciclos.

### Matriz de aceptacion CI (cambio -> workflows disparados)

Aplica para `push` y `pull_request` en `main/master`.

Guia QA detallada (casos reales + evidencia con capturas): `docs/qa-triggers-gha.md`.

### Checks recomendados para Branch Protection

Marca estos checks como requeridos en `main`:

- `build`
- `Icon System Consistency`
- `preflight-local-gate`
- `smoke-contract`

| Caso de PR | Archivos ejemplo | `Kotlin CI` (`ci.yml`) | `smoke-contract` | `preflight-gate` |
|---|---|---|---|---|
| docs-only | `docs/runbook.md` | No | Si | No |
| frontend-only | `frontend/app.js` | No | No | No |
| scripts-only | `scripts/smoke_api_8081.zsh` | Si | Si | Si |
| backend-only | `src/main/kotlin/com/universal/api/UniversalEngine.kt` | Si | Si | Si |
| gradle root | `build.gradle.kts` | Si | Si | Si |
| compose | `docker-compose.yml` | Si | Si | Si |
| mixto docs+scripts | `README.md` + `scripts/preflight_local.zsh` | Si | Si | Si |

Notas de interpretacion:

- En `ci.yml`, `paths-ignore` solo evita ejecucion cuando **todos** los cambios caen en `docs/**`, `frontend/**` o `**/*.md`.
- En `smoke-contract` y `preflight-gate`, con `paths` basta que **un** archivo coincida para disparar el workflow.
- `workflow_dispatch` se mantiene en los 3 workflows (`ci.yml`, `smoke-contract.yml`, `preflight-gate.yml`) para ejecucion manual/debug.

## Creative Coding (Sprint 1)

### Perfiles y engines soportados

- `profile: "creative-coding"`
- `engine: "processing" | "py5"`
- `runtime` permitido:
  - `processing` -> `java17`
  - `py5` -> `python3.11`

### Estandar Python

- Se usa `pyproject.toml + uv.lock` como base reproducible.
- No se usa `poetry.lock` en el scaffold nuevo.

### Seguridad (backend no ejecutor)

- El backend genera y persiste archivos, pero no ejecuta sketches.
- Endpoint de ejecucion bloqueado por politica: `POST /api/v1/projects/{id}/execute` -> `403`.

### Ejemplo rapido (py5)

```zsh
curl -s -X POST http://localhost:8081/api/v1/projects/init-static \
  -H 'Content-Type: application/json' \
  -d '{
    "name": "Creative py5 Demo",
    "profile": "creative-coding",
    "engine": "py5",
    "runtime": "python3.11",
    "tags": ["creative", "py5"],
    "preview": "cover.png",
    "dependencias": [],
    "timeline": []
  }'
```

## Plantillas de backlog (GitHub Issues)

- Plantilla reusable para lotes `v1.1`, `v1.2+`: `docs/issues/ue-v1.1/templates.md`
- Incluye placeholders `{{VERSION}}`, `{{PHASE}}`, `{{GATE_SCRIPT}}`.
- Estandar baseline: evidencia pinned como primer comentario (`Smoke output + fecha + commit SHA`).

