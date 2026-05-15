# RELEASE — proyecto_18

Checklist operativo de salida:

1. Copiar `.env.example` a `.env` y cargar secretos reales.
2. Ejecutar `docker compose -f docker-compose.prod.yml --env-file .env up -d --build`.
3. Verificar:
   - `curl -fsS http://localhost:8040/health`
   - `curl -fsS http://localhost:8040/metrics`
   - `scripts/tests/smoke_checklist.sh`
4. Revisar vulnerabilidades:
   - `scripts/audit_dependencies.sh`
   - workflow `Security`
5. Publicar manifiestos Kubernetes con `kustomize build k8s/overlays/production`.

Artefactos incluidos en esta release:

- `docker-compose.prod.yml`
- migración Flyway `V1__create_checklist_estado.sql`
- workflow CI + workflow Security/Trivy
- endpoint `/metrics`
- tests automatizados de `kotguaicli`
