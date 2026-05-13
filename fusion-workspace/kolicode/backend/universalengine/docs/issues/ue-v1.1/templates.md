# Plantillas de Issues - UniversalEngine

Estas plantillas estan pensadas para reutilizarse en `v1.1`, `v1.2+` y siguientes lotes.

## Convenciones

- Version: `{{VERSION}}` (ej. `v1.1`, `v1.2`)
- Fase: `{{PHASE}}` (ej. `fase1`, `fase2`, `baseline`)
- Gate principal: `{{GATE_SCRIPT}}` (ej. `./scripts/smoke_domain_spec_8081.zsh`)
- Etiquetas: `ue-{{VERSION}}`, `ue-{{VERSION}}-{{PHASE}}`
- Evidencia baseline: comentario pinned con formato audit-ready.

## 1) Template generico de fase

```markdown
{{VERSION}} - {{PHASE}}

## Estimacion
- {{SIZE}} (S=0.5d, M=1d, L=1.5-2d)

## Tasks
- [ ] Task 1: {{TASK1}}
- [ ] Task 2: {{TASK2}}
- [ ] Daily: Commit + {{GATE_SCRIPT}}
- [ ] Gate: {{GATE_SCRIPT}} ✅

## Salida
{{DELIVERABLE}}

## Paths affected
- {{PATH1}}
- {{PATH2}}

## Referencias
- `README.md`
- `docs/qa-triggers-gha.md`

Labels: ue-{{VERSION}}, ue-{{VERSION}}-{{PHASE}}
```

## 2) Template baseline (con evidencia pinned)

```markdown
{{VERSION}} - baseline

## Estimacion
- S (0.5d)

## Tasks
- [ ] Crear tag: {{TAG_NAME}}
- [ ] Alinear checklist de gates en README.md
- [ ] Ejecutar smoke base
- [ ] Publicar evidencia pinned como primer comentario

## Gate
- [ ] {{GATE_SCRIPT}} ✅

## Salida
- Tag publicado
- Documentacion de gates actualizada
- Evidencia audit-ready publicada

## Paths affected
- README.md
- scripts/**
- docs/**

Labels: ue-{{VERSION}}, ue-{{VERSION}}-baseline
```

## 3) Formato de evidencia pinned (comentario inicial)

Usar siempre un unico comentario con este formato:

```text
Smoke output + fecha + commit SHA

✅ {{GATE_SCRIPT}} passed
Fecha: YYYY-MM-DD
Commit: <SHA>

--- output ---
<pegar salida completa del smoke>
```

## 4) Flujo rapido recomendado

```zsh
# 1) Ejecutar smoke base
./scripts/smoke_domain_spec_8081.zsh

# 2) Crear issue baseline
# gh issue create --title "..." --body "..."

# 3) Publicar evidencia pinned
# gh issue comment <ISSUE_NUMBER> --body "$(cat smoke-evidence.txt)"

# 4) Verificar backlog de version
gh issue list --label ue-v1.1
```

