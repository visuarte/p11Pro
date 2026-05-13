# 🤖 WORKFLOW PLAN - Agentes IA con Hooks, Steering & Skills

**Fecha:** 2026-04-21  
**Objetivo:** Crear un sistema automatizado de desarrollo con agentes IA

---

## 🎯 Visión General

Crear un workflow automatizado donde:
1. **Hooks** disparan acciones automáticas en eventos del IDE
2. **Steering** guía a los agentes con contexto específico del proyecto
3. **Skills** proporcionan capacidades especializadas a los agentes

---

## 🏗️ Arquitectura del Workflow

```
┌─────────────────────────────────────────────────────────────┐
│                    EVENTOS DEL IDE                          │
├─────────────────────────────────────────────────────────────┤
│  fileEdited  │  promptSubmit  │  preToolUse  │  agentStop  │
└──────┬───────────────┬──────────────┬──────────────┬────────┘
       │               │              │              │
       ▼               ▼              ▼              ▼
┌─────────────────────────────────────────────────────────────┐
│                         HOOKS                               │
├─────────────────────────────────────────────────────────────┤
│  • code-review-hook                                         │
│  • test-runner-hook                                         │
│  • security-check-hook                                      │
│  • architecture-validation-hook                             │
│  • documentation-generator-hook                             │
└──────┬──────────────────────────────────────────────────────┘
       │
       ▼
┌─────────────────────────────────────────────────────────────┐
│                    AGENTE IA (Kiro)                         │
├─────────────────────────────────────────────────────────────┤
│  Contexto cargado:                                          │
│  • Steering files (guías específicas)                       │
│  • Skills (capacidades especializadas)                      │
│  • Proyecto context                                         │
└──────┬──────────────────────────────────────────────────────┘
       │
       ▼
┌─────────────────────────────────────────────────────────────┐
│                    STEERING FILES                           │
├─────────────────────────────────────────────────────────────┤
│  • unified-design-studio-architecture.md                    │
│  • thunderkoli-security-guidelines.md                       │
│  • universalengine-api-patterns.md                          │
│  • frontend-react-conventions.md                            │
│  • python-worker-implementation.md                          │
└─────────────────────────────────────────────────────────────┘
       │
       ▼
┌─────────────────────────────────────────────────────────────┐
│                         SKILLS                              │
├─────────────────────────────────────────────────────────────┤
│  • backend-api-developer                                    │
│  • frontend-react-developer                                 │
│  • security-auditor                                         │
│  • test-engineer                                            │
│  • documentation-writer                                     │
└─────────────────────────────────────────────────────────────┘
```

---

## 📋 Plan de Implementación

### FASE 1: Crear Hooks (30 min)

#### Hook 1: Code Review on Save
**Trigger:** `fileEdited`  
**Acción:** Revisar código automáticamente cuando se guarda un archivo  
**Archivos:** `*.ts`, `*.js`, `*.tsx`, `*.jsx`

#### Hook 2: Run Tests on Code Change
**Trigger:** `fileEdited`  
**Acción:** Ejecutar tests relacionados cuando cambia código  
**Archivos:** `*.test.ts`, `*.spec.ts`

#### Hook 3: Security Check Before Tool Use
**Trigger:** `preToolUse`  
**Acción:** Validar operaciones de escritura antes de ejecutarlas  
**Tools:** `write` category

#### Hook 4: Architecture Validation
**Trigger:** `postToolUse`  
**Acción:** Validar que los cambios siguen la arquitectura  
**Tools:** `write` category

#### Hook 5: Documentation Generator
**Trigger:** `agentStop`  
**Acción:** Generar documentación automática después de cambios  
**Scope:** Global

---

### FASE 2: Crear Steering Files (45 min)

#### Steering 1: Arquitectura del Proyecto
**Archivo:** `.kiro/steering/unified-design-studio-architecture.md`  
**Inclusión:** `always` (siempre cargado)  
**Contenido:**
- Estructura de directorios
- Patrones de arquitectura (microservicios)
- Comunicación entre componentes
- Puertos y servicios

#### Steering 2: Guías de Seguridad ThunderKoli
**Archivo:** `.kiro/steering/thunderkoli-security-guidelines.md`  
**Inclusión:** `fileMatch` con patrón `**/thunderkoli/**`  
**Contenido:**
- Implementación de Vault AES-256
- Patrones de auditoría
- Autenticación multi-proveedor
- Manejo de secretos

#### Steering 3: Patrones de API UniversalEngine
**Archivo:** `.kiro/steering/universalengine-api-patterns.md`  
**Inclusión:** `fileMatch` con patrón `**/universalengine/**`  
**Contenido:**
- Patrones Ktor/Kotlin
- Integración con Ollama/DeepSeek
- Manejo de PostgreSQL con Exposed
- Generación de código IA

#### Steering 4: Convenciones Frontend React
**Archivo:** `.kiro/steering/frontend-react-conventions.md`  
**Inclusión:** `fileMatch` con patrón `**/frontend/**`  
**Contenido:**
- Estructura de componentes React
- Gestión de estado
- Integración con API Gateway
- Patrones de diseño

#### Steering 5: Implementación Python Workers
**Archivo:** `.kiro/steering/python-worker-implementation.md`  
**Inclusión:** `fileMatch` con patrón `**/python-worker/**`  
**Contenido:**
- Integración MediaPipe
- Little CMS para color
- Blend2D para vectores
- IPC con Node.js

---

### FASE 3: Crear Skills (45 min)

#### Skill 1: Backend API Developer
**Archivo:** `.kiro/skills/backend-api-developer.md`  
**Capacidades:**
- Crear endpoints RESTful
- Implementar middleware
- Gestionar base de datos
- Escribir tests de API

#### Skill 2: Frontend React Developer
**Archivo:** `.kiro/skills/frontend-react-developer.md`  
**Capacidades:**
- Crear componentes React
- Gestionar estado con hooks
- Integrar con APIs
- Implementar UI/UX

#### Skill 3: Security Auditor
**Archivo:** `.kiro/skills/security-auditor.md`  
**Capacidades:**
- Revisar código por vulnerabilidades
- Validar encriptación
- Auditar autenticación
- Verificar OWASP Top 10

#### Skill 4: Test Engineer
**Archivo:** `.kiro/skills/test-engineer.md`  
**Capacidades:**
- Escribir tests unitarios
- Crear tests de integración
- Implementar tests e2e
- Configurar CI/CD

#### Skill 5: Documentation Writer
**Archivo:** `.kiro/skills/documentation-writer.md`  
**Capacidades:**
- Generar documentación de API
- Crear guías de usuario
- Escribir README
- Documentar arquitectura

---

## 🔄 Flujos de Trabajo Automatizados

### Flujo 1: Desarrollo de Nueva Feature

```
1. Usuario crea archivo nuevo → Hook detecta
2. Steering carga contexto del módulo
3. Skill "Backend API Developer" se activa
4. Agente genera código siguiendo patrones
5. Hook "Code Review" valida calidad
6. Hook "Test Runner" ejecuta tests
7. Hook "Documentation Generator" actualiza docs
```

### Flujo 2: Modificación de Código Existente

```
1. Usuario edita archivo → Hook "fileEdited" dispara
2. Steering carga guías específicas del módulo
3. Hook "Security Check" valida cambios (preToolUse)
4. Agente aplica cambios
5. Hook "Architecture Validation" verifica (postToolUse)
6. Hook "Test Runner" ejecuta tests relacionados
7. Hook "Documentation Generator" actualiza docs
```

### Flujo 3: Revisión de Seguridad

```
1. Usuario intenta operación de escritura → Hook "preToolUse"
2. Skill "Security Auditor" se activa
3. Agente revisa código por vulnerabilidades
4. Si pasa → Permite operación
5. Si falla → Bloquea y sugiere correcciones
```

---

## 📊 Estructura de Archivos

```
.kiro/
├── hooks/
│   ├── code-review-on-save.json
│   ├── test-runner-on-change.json
│   ├── security-check-pre-write.json
│   ├── architecture-validation-post-write.json
│   └── documentation-generator-on-stop.json
│
├── steering/
│   ├── unified-design-studio-architecture.md
│   ├── thunderkoli-security-guidelines.md
│   ├── universalengine-api-patterns.md
│   ├── frontend-react-conventions.md
│   └── python-worker-implementation.md
│
└── skills/
    ├── backend-api-developer.md
    ├── frontend-react-developer.md
    ├── security-auditor.md
    ├── test-engineer.md
    └── documentation-writer.md
```

---

## 🎯 Beneficios del Workflow

### Automatización
- ✅ Code review automático en cada guardado
- ✅ Tests ejecutados automáticamente
- ✅ Documentación generada automáticamente
- ✅ Validación de seguridad en tiempo real

### Consistencia
- ✅ Todos los cambios siguen patrones establecidos
- ✅ Arquitectura validada automáticamente
- ✅ Estándares de código aplicados
- ✅ Documentación siempre actualizada

### Productividad
- ✅ Menos errores manuales
- ✅ Feedback inmediato
- ✅ Desarrollo más rápido
- ✅ Menos context switching

### Calidad
- ✅ Código revisado automáticamente
- ✅ Tests ejecutados siempre
- ✅ Seguridad validada
- ✅ Documentación completa

---

## 🚀 Orden de Implementación

### Paso 1: Crear Hooks (Prioridad ALTA)
```bash
1. code-review-on-save.json
2. test-runner-on-change.json
3. security-check-pre-write.json
4. architecture-validation-post-write.json
5. documentation-generator-on-stop.json
```

### Paso 2: Crear Steering Files (Prioridad ALTA)
```bash
1. unified-design-studio-architecture.md (always)
2. thunderkoli-security-guidelines.md (fileMatch)
3. universalengine-api-patterns.md (fileMatch)
4. frontend-react-conventions.md (fileMatch)
5. python-worker-implementation.md (fileMatch)
```

### Paso 3: Crear Skills (Prioridad MEDIA)
```bash
1. backend-api-developer.md
2. frontend-react-developer.md
3. security-auditor.md
4. test-engineer.md
5. documentation-writer.md
```

---

## 📝 Plantillas de Contenido

### Plantilla Hook
```json
{
  "name": "Hook Name",
  "version": "1.0.0",
  "description": "Description of what this hook does",
  "when": {
    "type": "eventType",
    "patterns": ["file patterns"],
    "toolTypes": ["tool categories"]
  },
  "then": {
    "type": "askAgent | runCommand",
    "prompt": "Prompt for agent",
    "command": "Command to run"
  }
}
```

### Plantilla Steering
```markdown
---
inclusion: always | fileMatch | manual
fileMatchPattern: "pattern"
---

# Steering Title

## Context

Brief description of when this steering applies.

## Guidelines

1. Guideline 1
2. Guideline 2
3. Guideline 3

## Examples

### Good Example
\`\`\`typescript
// Good code example
\`\`\`

### Bad Example
\`\`\`typescript
// Bad code example
\`\`\`

## References

- Link 1
- Link 2
```

### Plantilla Skill
```markdown
# Skill Name

## Description

What this skill enables the agent to do.

## Capabilities

- Capability 1
- Capability 2
- Capability 3

## Usage

When to activate this skill.

## Examples

### Example 1
Description and code example.

### Example 2
Description and code example.

## Best Practices

1. Best practice 1
2. Best practice 2
3. Best practice 3
```

---

## ⏱️ Estimación de Tiempo

| Fase | Tiempo | Prioridad |
|------|--------|-----------|
| Crear 5 Hooks | 30 min | ALTA |
| Crear 5 Steering Files | 45 min | ALTA |
| Crear 5 Skills | 45 min | MEDIA |
| Testing del Workflow | 30 min | ALTA |
| Documentación | 20 min | MEDIA |
| **TOTAL** | **2h 50min** | - |

---

## ✅ Criterios de Éxito

- [ ] 5 Hooks creados y funcionando
- [ ] 5 Steering Files cargándose correctamente
- [ ] 5 Skills disponibles para activación
- [ ] Workflow completo probado end-to-end
- [ ] Documentación completa generada
- [ ] Ejemplos de uso documentados

---

**¿Procedemos con la implementación? ¿Empezamos por los Hooks, Steering o Skills?**
