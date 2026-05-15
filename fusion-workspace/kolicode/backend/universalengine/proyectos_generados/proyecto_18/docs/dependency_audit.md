# Dependency audit — proyecto_18

Estado actual del flujo de auditoría:

1. `scripts/audit_dependencies.sh` ejecuta:
   - `npm audit --json` en `frontend/`
   - `./gradlew dependencyReport` en `backend/`
2. El workflow `Security` publica los reportes como artefactos.
3. Los resultados se escriben en `build/reports/dependency-audit/`.

## Cómo ejecutar localmente

```bash
chmod +x scripts/audit_dependencies.sh backend/gradlew
./scripts/audit_dependencies.sh
```

## Artefactos esperados

- `build/reports/dependency-audit/frontend-npm-audit.json`
- `build/reports/dependency-audit/backend-dependency-report.txt`

## Política de remediación

1. Corregir primero vulnerabilidades **CRITICAL** y **HIGH**.
2. Subir versiones menores/patch cuando no rompan la API pública.
3. Si un upgrade mayor es necesario, abrir issue/PR específico con plan de migración.
4. Mantener `npm ci` y `./gradlew build` como validaciones mínimas tras cada cambio.
