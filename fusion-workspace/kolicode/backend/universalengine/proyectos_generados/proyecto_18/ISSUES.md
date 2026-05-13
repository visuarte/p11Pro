# ISSUES sugeridos — crear en el tracker (GitHub/GitLab)

Lista de issues/epics que conviene crear para organizar el trabajo. Puedes copiar/pegar los títulos y cuerpos en tu tracker.

1) [P0] Validación automática (smoke) — `scripts/tests/smoke_checklist.sh`
Title: Validación automática (smoke) del stack
Body: Ejecutar y documentar `scripts/tests/smoke_checklist.sh`. Reproducir fallos, adjuntar logs y corregir.

2) [P0] Añadir `.env.example` y documentar variables de entorno
Title: Añadir `.env.example` y documentación de uso
Body: Crear `.env.example` (ya añadido) y actualizar README para indicar que se debe copiar a `.env` y no commitearlo.

3) [P0] Eliminar credenciales hardcodeadas y reforzar uso de variables de entorno
Title: Auditar y eliminar credenciales hardcodeadas
Body: Ejecutar `scripts/check_secrets.sh`. Si el script detecta coincidencias, mover valores a `.env` o a secret manager. Revisar `Application.kt` y otros archivos.

4) [P0] Flyway: migraciones iniciales
Title: Integrar Flyway y crear migración inicial V1__create_checklist_estado.sql
Body: Añadir dependencia en `backend/build.gradle.kts`, crear SQL de migración y remover `SchemaUtils.create`.

5) [P0] CI: GitHub Actions con build + smoke tests
Title: Añadir workflow CI que ejecute build y smoke tests
Body: Crear `.github/workflows/ci.yml` con pasos para build backend y ejecutar `scripts/tests/smoke_checklist.sh`.

6) [P1] Postman collection / OpenAPI
Title: Crear Postman collection para endpoints básicos
Body: Incluir ejemplos para `/api/v1/checklist`, `/api/v1/webgl/config`, y operaciones kotguaicli.

7) [P1] Revisión de dependencias y vulnerabilidades
Title: Ejecutar `npm audit` y revisar dependencias de backend
Body: Documentar vulnerabilidades y proponer upgrades.

Procedimiento sugerido
- Crea un epic 'Auditoría proyecto_18' y agrupa los issues P0 bajo ese epic.
- Asigna responsables y fechas objetivo de 1–2 semanas para P0.

