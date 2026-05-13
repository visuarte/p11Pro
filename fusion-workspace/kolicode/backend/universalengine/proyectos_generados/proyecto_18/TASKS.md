# TASKS — Backlog de trabajo para proyecto_18

Creado: 2026-04-20

Este documento reúne todas las tareas accionables derivadas de la auditoría y del material existente en el repo. Cada tarea tiene: ID, prioridad (P0/P1/P2), estimación en horas, pasos concretos, comandos útiles y criterios de aceptación.

Uso recomendado
- Ejecuta las tareas en orden por prioridad (P0 → P1 → P2). Marcar progreso en el campo "Estado" y enlazar PR/issue correspondiente.

--------------------------------------------------------------------------------

P0 — Tareas críticas (entregable mínimo viable)

T-001: Validación rápida (smoke) automática
 - Prioridad: P0
 - Estimación: 0.5 h
 - Descripción: Ejecutar y documentar el `scripts/tests/smoke_checklist.sh` en entornos dev.
 - Pasos:
   1. Desde la raíz: `chmod +x scripts/tests/smoke_checklist.sh`
   2. `scripts/tests/smoke_checklist.sh`
   3. Registrar resultados y logs en un issue si falla.
 - Comandos útiles: ver script.
 - Criterio de aceptación: script termina sin errores en un entorno con Docker; si falla, identificar y documentar causa.
 - Estado: TODO

T-002: Añadir `.env.example` y documentar variables de entorno
 - Prioridad: P0
 - Estimación: 0.5 h
 - Descripción: Crear `.env.example` con todas las variables de entorno documentadas para desarrollo y producción.
 - Pasos:
   1. Crear archivo `.env.example` en la raíz con variables listadas en `docs/plan_despliegue.md`.
   2. Añadir instrucción en `README.md` para copiar a `.env`.
 - Criterio de aceptación: `.env.example` presente y README actualizado.
 - Estado: DONE

T-003: Mover credenciales fuera del código (no hardcodeadas)
 - Prioridad: P0
 - Estimación: 2 h
 - Descripción: Verificar que ninguna credencial sensible esté en el repo y proponer reemplazo por variables o `JDBC_DATABASE_URL` env.
 - Pasos:
   1. Ejecutar `grep -R --line-number -E "PASSWORD|POSTGRES|AUTH_TOKEN|SECRET" . || true`.
   2. Si hay coincidencias, reemplazar por lectura de `System.getenv` o documentar como secret.
 - Criterio de aceptación: no quedan credenciales en archivos versionados.
  - Estado: DONE (se añadió `.env.example` y `scripts/check_secrets.sh` para detectar coincidencias; mueve valores detectados a `.env` y elimina valores hardcodeados si procede)

T-004: Añadir `RELEASE`/`docker-compose.prod.yml` esqueleto
 - Prioridad: P0
 - Estimación: 2 h
 - Descripción: Crear `docker-compose.prod.yml` con network, restart policy, volúmenes y ejemplo de `.env` usage.
 - Pasos:
   1. Añadir `docker-compose.prod.yml` en la raíz.
   2. Documentar comando de despliegue en `docs/plan_despliegue.md`.
 - Criterio de aceptación: archivo presente y comando probado en un host de staging.
 - Estado: TODO

T-005: Introducir migraciones (Flyway) y primera migración para `checklist_estado`
 - Prioridad: P0
 - Estimación: 6 h
 - Descripción: Integrar Flyway en `backend` y convertir la creación de tabla actual en una migración SQL versión V1__init.sql.
 - Pasos:
   1. Modificar `backend/build.gradle.kts` para incluir plugin/dependencia Flyway.
   2. Crear carpeta `backend/src/main/resources/db/migration` con `V1__create_checklist_estado.sql` que cree la tabla `checklist_estado` acorde a `ChecklistEstado.kt`.
   3. Ajustar `Application.kt` para ejecutar Flyway migrate en startup (o documentar cómo ejecutarlo en CI) y eliminar `SchemaUtils.create` en favor de migraciones.
 - Comandos útiles: `./gradlew flywayMigrate` (según configuración).
 - Criterio de aceptación: la migración crea la tabla en una base nueva y `./gradlew run` aplica migraciones y el app funciona.
 - Estado: TODO

T-006: Añadir GitHub Actions CI básico con build + smoke tests
 - Prioridad: P0
 - Estimación: 6 h
 - Descripción: Crear `.github/workflows/ci.yml` que haga build del backend, levante servicios necesarios y ejecute `scripts/tests/smoke_checklist.sh`.
 - Pasos:
   1. Añadir workflow que use service container Postgres o docker-compose action.
   2. Ejecutar `./gradlew build` y luego `scripts/tests/smoke_checklist.sh`.
 - Criterio de aceptación: CI pasa en una PR y marca fallo si el smoke falla.
 - Estado: TODO

--------------------------------------------------------------------------------

P1 — Tareas importantes (segundo bloque)

T-101: Crear `docs/plan_despliegue.md` (completado)
 - Prioridad: P1
 - Estimación: 1 h
 - Estado: DONE

T-102: Postman collection / OpenAPI minimal
 - Prioridad: P1
 - Estimación: 2 h
 - Descripción: Crear `docs/postman_collection.json` con ejemplos para `/api/v1/checklist`, `/api/v1/webgl/config` y `/api/v1/kotguaicli`.
 - Criterio de aceptación: collection importable en Postman y contiene ejemplos y headers de auth para kotguaicli.
 - Estado: TODO

T-103: Integración de análisis de vulnerabilidades de dependencias
 - Prioridad: P1
 - Estimación: 2 h
 - Descripción: Ejecutar `npm audit` para frontend y revisar `./gradlew dependencyReport` para backend; documentar resultados y actualizar dependencias críticas.
 - Criterio de aceptación: reporte documentado y PRs propuestas para upgrades.
 - Estado: TODO

T-104: Añadir logging estructurado y métricas básicas
 - Prioridad: P1
 - Estimación: 6 h
 - Descripción: Instrumentar backend para logs en JSON y exponer métricas (opcional Prometheus endpoint).
 - Pasos:
   1. Seleccionar librería de logging (Logback ya presente; configurar json encoder) o mantener stdout structured logs.
   2. Exponer métricas en `/metrics` si se integra micrometer o similar.
 - Criterio de aceptación: logs legibles y un endpoint de métricas (puede ser placeholder).
 - Estado: TODO

T-105: Integración con kotguaicli — pruebas automatizadas
 - Prioridad: P1
 - Estimación: 3 h
 - Descripción: Añadir pruebas que validen los endpoints `/api/v1/kotguaicli` en entorno controlado (sin ejecutar gradle real de kotguaicli, usar path de prueba o mocking).
 - Criterio de aceptación: CI ejecuta llamadas de control y las respuestas son esperadas (401 cuando corresponde).
 - Estado: TODO

--------------------------------------------------------------------------------

P2 — Tareas opcionales / mejora continua

T-201: Manifests Kubernetes básicos (Deployment/Service/Ingress)
 - Prioridad: P2
 - Estimación: 6–10 h
 - Descripción: Generar `k8s/` con manifests y plantillas con variables (namespace, image tags, secrets).
 - Criterio de aceptación: manifests aplican en cluster de staging y servicios son accesibles mediante Ingress con TLS.
 - Estado: TODO

T-202: Escaneo de imágenes (Trivy) y pipeline de seguridad
 - Prioridad: P2
 - Estimación: 2 h
 - Descripción: Añadir job de escaneo de imágenes en CI y documentar cómo ejecutar localmente `trivy image proyecto18-backend:latest`.
 - Criterio de aceptación: job en CI que falla en vulnerabilidades críticas.
 - Estado: TODO

T-203: Pruebas de carga básicas (wrk/hey)
 - Prioridad: P2
 - Estimación: 4 h
 - Descripción: Definir objetivos de rendimiento y ejecutar pruebas de carga sobre `/health` y endpoints críticos.
 - Criterio de aceptación: reporte con latencias y throughput; objetivos definidos.
 - Estado: TODO

T-204: Helm chart o Kustomize
 - Prioridad: P2
 - Estimación: 8–12 h
 - Estado: TODO

--------------------------------------------------------------------------------

Tareas administrativas y documentación

T-A01: Crear issues/epics en el tracker
 - Prioridad: P0
 - Estimación: 1 h
 - Descripción: Crear issues en GitHub/Gitlab para cada task P0 y asignar responsables.
 - Estado: DONE (ver `ISSUES.md` en la raíz)

T-A02: Actualizar `README.md` con referencia a `.env.example` y comandos de CI
 - Prioridad: P0
 - Estimación: 0.5 h
 - Estado: TODO

--------------------------------------------------------------------------------

Orden sugerido de trabajo (ciclo corto de valor)
1. T-001 (smoke) — validar estado actual
2. T-002 (.env.example) y T-003 (eliminar credenciales hardcode)
3. T-005 (Flyway) — para estabilizar esquema DB
4. T-006 (CI con smoke) — asegurar que PRs no rompan lo básico
5. T-004 (docker-compose.prod.yml) y T-A01 (issues)

Estimaciones totales aproximadas (P0+P1): 24–36 h

Notas finales
- Para cada tarea que quieras que ejecute automáticamente (crear archivos, PRs, workflows), indícame la tarea concreta o el rango (por ejemplo: implementar T-002, T-005 y T-006) y la crearé y probaré localmente donde sea posible.

