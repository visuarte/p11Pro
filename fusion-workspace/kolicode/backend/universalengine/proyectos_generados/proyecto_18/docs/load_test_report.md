# Load test baseline — proyecto_18

## Objetivos

- `/health`: p95 < 150ms, error rate 0%
- `/api/v1/webgl/config`: p95 < 250ms, error rate 0%
- `/api/v1/checklist`: p95 < 400ms con payload pequeño, error rate < 1%

## Scripts incluidos

- `scripts/load/health_check.sh`
- `scripts/load/checklist_create.sh`

## Ejecución sugerida

```bash
chmod +x scripts/load/health_check.sh scripts/load/checklist_create.sh
./scripts/load/health_check.sh http://localhost:8040 50 20
./scripts/load/checklist_create.sh http://localhost:8040 25 10
```

## Herramientas soportadas

1. `hey` si está instalada
2. `wrk` si está instalada
3. Fallback bash+cURL si no hay herramientas de carga

## Resultado inicial

Este archivo define la línea base y el procedimiento. El siguiente paso operativo es ejecutar los scripts contra staging y adjuntar latencias/throughput reales.
