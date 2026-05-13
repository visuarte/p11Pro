# Guia QA de Triggers CI (GitHub Actions)

## Objetivo

Validar que los filtros (`paths` / `paths-ignore`) disparan solo los workflows esperados, reduciendo ruido y manteniendo cobertura en cambios de backend/contrato/scripts/infra.

## Workflows bajo prueba

- `Kotlin CI` (`.github/workflows/ci.yml`)
- `smoke-contract` (`.github/workflows/smoke-contract.yml`)
- `preflight-gate` (`.github/workflows/preflight-gate.yml`)

Checks recomendados como requeridos en branch protection:

- `build` (job de `Kotlin CI`)
- `Icon System Consistency` (job de `Kotlin CI`)
- `preflight-local-gate` (job de `preflight-gate`)

`workflow_dispatch` esta habilitado en los 3 workflows para ejecucion manual.

## Prerrequisitos

- Permisos para crear ramas y PR en el repositorio.
- Acceso a la pestana **Actions** y a los checks de PR.
- Rama base: `main` (o `master`, segun politica del repo).

## Matriz de aceptacion (casos reales)

| Caso | Cambio de ejemplo | Kotlin CI | smoke-contract | preflight-gate |
|---|---|---|---|---|
| docs-only | `docs/runbook.md` | No | Si | No |
| frontend-only | `frontend/app.js` | No | No | No |
| scripts-only | `scripts/smoke_api_8081.zsh` | Si | Si | Si |
| backend-only | `src/main/kotlin/com/universal/api/UniversalEngine.kt` | Si | Si | Si |
| gradle-root | `build.gradle.kts` | Si | Si | Si |
| compose | `docker-compose.yml` | Si | Si | Si |
| mixto docs+scripts | `README.md` + `scripts/preflight_local.zsh` | Si | Si | Si |

## Procedimiento QA (por caso)

1. Crea rama de prueba: `qa/gha-trigger-<caso>`.
2. Aplica solo el cambio del caso.
3. Haz commit y push.
4. Abre PR contra `main`/`master`.
5. Revisa seccion **Checks** del PR.
6. Revisa la pestana **Actions** para confirmar workflows disparados/no disparados.
7. Adjunta evidencia (capturas + tiempos).

## Comandos base (copiar/pegar)

```zsh
git checkout -b qa/gha-trigger-docs-only
echo "qa docs trigger" >> docs/runbook.md
git add docs/runbook.md
git commit -m "test(ci): docs-only trigger"
git push -u origin qa/gha-trigger-docs-only
```

```zsh
git checkout -b qa/gha-trigger-frontend-only
echo "// qa trigger" >> frontend/app.js
git add frontend/app.js
git commit -m "test(ci): frontend-only trigger"
git push -u origin qa/gha-trigger-frontend-only
```

```zsh
git checkout -b qa/gha-trigger-scripts-only
echo "# qa trigger" >> scripts/smoke_api_8081.zsh
git add scripts/smoke_api_8081.zsh
git commit -m "test(ci): scripts-only trigger"
git push -u origin qa/gha-trigger-scripts-only
```

```zsh
git checkout -b qa/gha-trigger-backend-only
echo "// qa trigger" >> src/main/kotlin/com/universal/api/UniversalEngine.kt
git add src/main/kotlin/com/universal/api/UniversalEngine.kt
git commit -m "test(ci): backend-only trigger"
git push -u origin qa/gha-trigger-backend-only
```

```zsh
git checkout -b qa/gha-trigger-build-gradle
echo "// qa trigger" >> build.gradle.kts
git add build.gradle.kts
git commit -m "test(ci): build.gradle trigger"
git push -u origin qa/gha-trigger-build-gradle
```

```zsh
git checkout -b qa/gha-trigger-compose
echo "# qa trigger" >> docker-compose.yml
git add docker-compose.yml
git commit -m "test(ci): docker-compose trigger"
git push -u origin qa/gha-trigger-compose
```

```zsh
git checkout -b qa/gha-trigger-docs-scripts
echo "qa mixed trigger" >> README.md
echo "# qa trigger" >> scripts/preflight_local.zsh
git add README.md scripts/preflight_local.zsh
git commit -m "test(ci): mixed docs+scripts trigger"
git push -u origin qa/gha-trigger-docs-scripts
```

## Evidencia requerida (capturas)

Por cada caso, adjuntar 3 capturas:

1. **PR Checks** (lista completa de checks con estado).
2. **Actions run list** (workflow disparado y hora).
3. **Workflow run detail** (duracion total y resultado final).

Convencion sugerida de nombres:

- `01-<caso>-pr-checks.png`
- `02-<caso>-actions-list.png`
- `03-<caso>-run-detail.png`

## Tiempos aproximados esperados

Rangos orientativos para detectar anomalias (pueden variar por carga de runners):

- `Kotlin CI`: ~4 a 10 min
- `smoke-contract`: ~3 a 8 min
- `preflight-gate`: ~8 a 20 min

Nota: `preflight-gate` ahora incluye smokes extra de `sync-from-disk` e iconos, por lo que puede subir en picos de carga.

Escalar investigacion si:

- `smoke-contract` supera ~12 min de forma sostenida.
- `preflight-gate` supera ~25 min o se acerca al timeout (30 min).
- hay disparos inesperados en casos `docs-only` o `frontend-only`.

## Criterio de aceptacion de la ronda QA

- Los 7 casos cumplen la matriz esperada.
- No hay workflow extra disparado fuera de expectativa.
- Se adjuntan capturas y tiempos por caso.
- Se registra un breve resumen final con hallazgos (si los hay).

## Paso posterior (post-QA)

Si todo pasa:

1. Ajustar/confirmar branch protection con checks requeridos vigentes.
2. Ejecutar monitoreo 1 semana de cobertura/tiempo.
3. Revisar outliers y afinar filtros si hace falta.

