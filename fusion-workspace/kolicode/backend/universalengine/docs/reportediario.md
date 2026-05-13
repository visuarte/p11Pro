# Reporte Diario

## Meta

Registrar el estado operativo diario del Motor Universal y de los proyectos activos (especial foco en sincronizacion IDE externo <-> Hub).

## Datos del dia

- Fecha: `YYYY-MM-DD`
- Responsable: `nombre`
- Entorno: `local | staging | otro`
- Rama/commit: `branch` / `sha`

## Estado rapido

- API (`/status`): `OK | FAIL`
- Hub (`/api/v1/projects`): `OK | FAIL`
- Docker (`db/api/web`): `Up | Degraded | Down`
- Ollama: `OK | FAIL | N/A`

## Chequeos ejecutados

- [ ] `scripts/levantar_hub.zsh`
- [ ] `STRICT_JSON=1 STRICT_HEADERS=1 ./scripts/smoke_api_8081.zsh`
- [ ] Sync `dryRun` en proyectos activos
- [ ] Validacion de UI Hub (lista/carga)

## Proyectos tocados hoy

| Proyecto | IDE | Tipo de cambio | Sync dryRun | Sync apply | Resultado |
|---|---|---|---|---|---|
| `proyecto_11` | VSCode | ejemplo: backend/api | OK/FAIL | OK/FAIL | notas |

## Incidencias y diagnostico

- Incidencia:
- Sintoma:
- Causa raiz estimada:
- Mitigacion aplicada:
- Estado final:

## Mantenimiento aplicado

- [ ] Limpieza de cache/artefactos locales
- [ ] Rehidratacion ejecutada (si aplico)
- [ ] Exclusion de artefactos (`node_modules`, `venv`, binarios) verificada

## Evidencia tecnica

```zsh
# Pegar comandos ejecutados clave del dia
```

```text
# Pegar outputs clave (resumidos)
```

## Riesgos abiertos

- Riesgo 1:
- Riesgo 2:

## Plan para manana

1. 
2. 
3. 

