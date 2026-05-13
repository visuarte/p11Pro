# Runbook de iconos (spritesheet)

## Objetivo
Verificar y recuperar el sistema de iconos centralizado del Motor Universal IA:

- endpoint de sprite: `/assets/icons.svg`
- catálogo: `/assets/icons/catalog`
- propagación a proyectos: `POST /api/v1/projects/icons/propagate`

## Síntomas comunes

- Botones del Hub se ven sin icono o en blanco.
- Warnings en arranque sobre `Icon spritesheet consistency check`.
- Nuevos proyectos no incluyen `public/icons.svg` o `public/js/icons.js`.

## Diagnóstico rápido

### 1) Smoke dedicado

```zsh
cd /Users/visuarte/Desktop/vegabajaimprentaa
scripts/smoke_icons_8081.zsh
```

### 2) Verificar endpoint de sprite

```zsh
curl -s http://localhost:8081/assets/icons.svg | head
```

### 3) Verificar catálogo

```zsh
curl -s http://localhost:8081/assets/icons/catalog
```

### 4) Forzar propagación manual

```zsh
curl -s -X POST http://localhost:8081/api/v1/projects/icons/propagate
```

## Recuperación

1. Corregir IDs/`<symbol>` en `src/main/kotlin/com/universal/api/IconSystem.kt`.
2. Ejecutar test de consistencia:

```zsh
cd /Users/visuarte/Desktop/vegabajaimprentaa
./gradlew test --tests com.universal.api.IconSystemConsistencyTest --no-daemon
```

3. Recompilar backend:

```zsh
cd /Users/visuarte/Desktop/vegabajaimprentaa
./gradlew compileKotlin --no-daemon
```

4. Relanzar API y repetir smoke.
5. Si hay proyectos previos, ejecutar `POST /api/v1/projects/icons/propagate`.

## Flags de entorno relevantes

- `ICON_CONSISTENCY_CHECK` (default `true`)
  - `true|1|yes|on`: valida en arranque
  - `false|0|no|off`: desactiva check de consistencia (solo recomendado temporalmente)

## Branch protection (checks requeridos)

Para cerrar el área de iconos con gate obligatorio en PR, configurar estos checks como **required**:

- `build` (job de `Kotlin CI`)
- `Icon System Consistency` (job de `Kotlin CI`)
- `preflight-local-gate` (job de `preflight-gate`)

Ruta en GitHub:

1. `Settings` -> `Branches` -> `Branch protection rules`.
2. Editar regla de `main` (y `master` si aplica).
3. Activar `Require status checks to pass before merging`.
4. Seleccionar los 3 checks anteriores.

## Checklist de cierre del área (Done Definition)

- [ ] `IconSystemConsistencyTest` pasa en local y CI.
- [ ] `IconConsistencyEnvFlagTest` pasa en local y CI.
- [ ] Smoke operativo OK:
  - [ ] `scripts/smoke_icons_8081.zsh`
  - [ ] `POST /api/v1/projects/icons/propagate` responde `SUCCESS`
- [ ] `ICON_CONSISTENCY_CHECK` documentado y probado (`true/false`).
- [ ] Branch protection con checks requeridos activado.
- [ ] Runbook actualizado y enlazado desde `README.md`.

Plantilla para registrar el cierre formal:

- `docs/acta_cierre_iconos.md`
- `docs/pr_comment_icons_template.md`

## Comandos rápidos de verificación final

```zsh
cd /Users/visuarte/Desktop/vegabajaimprentaa
./gradlew test --tests com.universal.api.IconSystemConsistencyTest --tests com.universal.api.IconConsistencyEnvFlagTest --no-daemon
```

```zsh
cd /Users/visuarte/Desktop/vegabajaimprentaa
API_PORT=8081 REQUEST_TIMEOUT=12 ./scripts/smoke_icons_8081.zsh
```

