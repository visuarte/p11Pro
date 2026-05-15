# Guia completa de uso y buenas practicas de mantenimiento

## Objetivo

Estandarizar el trabajo con proyectos editados en VSCode/IntelliJ (por ejemplo `proyecto_11`) sin perder visibilidad en el Hub, evitando roturas de arranque y reduciendo ruido por archivos no relevantes.

Esta guia aplica a todos los proyectos vivos en `proyectos_generados/proyecto_<id>`.

> Regla actual: mientras el motor siga resolviendo por ruta fija `proyecto_<id>`, no mover esas carpetas a otra raíz. Si hace falta limpiar ruido, usar `_archive/`, `_candidates/` y `_legacy_import/` dentro de `proyectos_generados/`.

## Alcance de las 3 aclaraciones

1. Flujo correcto cuando editas en un IDE externo (VSCode/IntelliJ/otro).
2. Impacto y buenas practicas al excluir `node_modules`, `venv` y binarios.
3. Correcciones para mejorar arranque estable del Motor Universal.

## 1) Flujo de trabajo recomendado (editor externo + Hub)

### Regla base

- **Fuente de verdad**: disco (`proyectos_generados/proyecto_<id>`).
- **Hub**: indice visual, auditoria, operaciones API y sincronizacion.

### Flujo operativo diario

1. Abrir proyecto en IDE externo.
2. Implementar cambios en codigo/configuracion del proyecto.
3. Validar localmente el propio proyecto (tests/lint/build segun stack).
4. Ejecutar sync en modo `dryRun` para revisar delta sin escribir DB.
5. Si el delta es correcto, sincronizar con `deleteMissing=false`.
6. Revisar Hub y confirmar conteo/estructura esperada.

### Comandos de sync (ejemplo `proyecto_11`)

```zsh
cd /Users/visuarte/Desktop/vegabajaimprentaa
curl -sS -X POST "http://localhost:8081/api/v1/projects/11/sync-from-disk" \
  -H "Content-Type: application/json" \
  -d '{"dryRun":true,"deleteMissing":false}'
```

```zsh
cd /Users/visuarte/Desktop/vegabajaimprentaa
curl -sS -X POST "http://localhost:8081/api/v1/projects/11/sync-from-disk" \
  -H "Content-Type: application/json" \
  -d '{"dryRun":false,"deleteMissing":false}'
```

### Criterios de seguridad al sincronizar

- `dryRun=true` siempre primero.
- `deleteMissing=false` por defecto para evitar borrados accidentales.
- Solo usar `deleteMissing=true` cuando tengas backup/commit y confirmes poda intencional.

## 2) Exclusion de `node_modules`, `venv` y binarios

## Que ocurre si se excluyen

- El Hub muestra codigo fuente util en vez de artefactos de entorno.
- Mejora el rendimiento de sync/rehidratacion.
- Evita errores comunes de encoding (`invalid byte sequence for encoding UTF8`).
- Reduce riesgo de payloads gigantes y fallos por limites de shell/DB.

## Es buena practica

Si. Es lo recomendado para plataformas con indexacion de archivos de proyecto.

### Debe incluirse en Hub

- Codigo fuente (`src`, `app`, `backend`, `frontend/src`).
- Config (`build.gradle.kts`, `package.json`, `pyproject.toml`, `uv.lock`, `vite.config.js`, etc.).
- Documentacion y assets ligeros relevantes.

### Debe excluirse del Hub

- Dependencias instaladas: `node_modules/`, `venv/`.
- Cache/temporales: `__pycache__/`, `.pytest_cache/`, `.gradle/`, `build/`, `dist/`.
- Binarios/compilados: `*.pyc`, `*.so`, `*.node`, `*.class`, `*.jar` grandes.
- Carpetas del IDE: `.idea/`, `.vscode/`.

### Nota sobre rehidratacion

`scripts/rehidratar_hub_desde_disco.zsh` ya omite:

- Archivos no UTF-8.
- Archivos por encima de `MAX_INLINE_BYTES`.

Esto evita romper importaciones masivas en proyectos grandes como `proyecto_11`.

## 3) Correcciones para mejorar arranque del Motor Universal

## Critico

- No usar borrado de volumenes por defecto en arranque.
  - `scripts/levantar_hub.zsh` ya preserva DB salvo `RESET_DB=1`.
- Forzar siempre compose con `.env` y `-p`.
  - Evita mezclar stacks (`cineops_mvp` vs `vegabajaimprentaa`).

## Recomendado

- Check automatico al arranque:
  - `SYSTEM_CHECK_LEVEL=quick` para uso diario.
  - `SYSTEM_CHECK_LEVEL=full` antes de cambios sensibles/release local.
- Mantener smoke estricto (`STRICT_JSON=1 STRICT_HEADERS=1`).
- Verificar API base del Hub si aparece vacio:
  - limpiar `localStorage` (`cineops:apiBaseUrl`) y recargar.

## Comandos de arranque robusto

```zsh
cd /Users/visuarte/Desktop/vegabajaimprentaa
scripts/levantar_hub.zsh
```

```zsh
cd /Users/visuarte/Desktop/vegabajaimprentaa
SYSTEM_CHECK_LEVEL=full scripts/levantar_hub.zsh
```

```zsh
cd /Users/visuarte/Desktop/vegabajaimprentaa
RUN_STARTUP_CHECK=0 scripts/levantar_hub.zsh
```

## Recuperacion cuando el Hub sale vacio

### Paso 1: verificar API

```zsh
curl -sS http://localhost:8081/status
curl -sS http://localhost:8081/api/v1/projects
```

### Paso 2: rehidratar desde disco

```zsh
cd /Users/visuarte/Desktop/vegabajaimprentaa
MAX_INLINE_BYTES=80000 ./scripts/rehidratar_hub_desde_disco.zsh
```

### Paso 3: recarga de UI

- Hard reload (`Cmd + Shift + R`).
- Si persiste, en consola del navegador:

```js
localStorage.removeItem('cineops:apiBaseUrl');
location.reload();
```

## Checklist de mantenimiento

## Diario

- Confirmar contenedores `db/api/web` en `Up`.
- Ejecutar `dryRun` de sync en proyectos activos.
- Mantener commit frecuente antes de sync con impacto.

## Semanal

- Ejecutar `scripts/preflight_local.zsh` con smokes opcionales relevantes.
- Revisar proyectos grandes por ruido de dependencias en carpeta fuente.
- Validar que no se esta usando `RESET_DB=1` por error en rutina diaria.

## Antes de release local

- `SYSTEM_CHECK_LEVEL=full`.
- `RUN_DOMAIN_SPEC_SMOKE=1 RUN_UI_TOOLING_SMOKE=1 RUN_SYNC_SMOKE=1 RUN_ICONS_SMOKE=1 ./scripts/preflight_local.zsh`.

## Politica operativa recomendada

- Trabajar siempre sobre disco + Git como control de cambios.
- Usar Hub para visibilidad, trazabilidad y operaciones API.
- Evitar sincronizar artefactos reconstruibles (`node_modules`, `venv`, binarios).
- Escalar a `full preflight` cuando cambias runtime, contratos o scripts base.
