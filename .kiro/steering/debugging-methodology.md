---
inclusion: always
---

# Metodología de Debugging - Arquitectura de Tres Capas

## Introducción

Esta guía define la metodología estándar para debugging y diagnóstico en KoliCode usando el enfoque de "Arquitectura de Tres Capas" con "Pedidos de Ejecución Técnica".

## Principios Fundamentales

### 1. No Romper Nada
- Todos los cambios deben ser quirúrgicos y modulares
- Preservar la lógica existente
- Usar flags de activación/desactivación
- Mantener tests pasando

### 2. Captura Contextual
- Definir exactamente dónde capturar (punto de control)
- Especificar qué datos capturar (contrato de datos)
- Establecer cuándo capturar (criterio de activación)

### 3. Reemplazo Quirúrgico
- Código listo para copiar y pegar
- Integración sin modificar estructura existente
- Rollback simple y rápido

## Arquitectura de Tres Capas en KoliCode

```
┌─────────────────────────────────────────────────┐
│         CAPA 1: Frontend (React)                │
│         - UI Components                         │
│         - State Management                      │
│         - User Interactions                     │
└────────────────┬────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────┐
│         CAPA 2: Bridge (API Gateway)            │
│         - Request Routing                       │
│         - Authentication                        │
│         - Data Transformation                   │
└────────────────┬────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────┐
│         CAPA 3: Engine (Backend Services)       │
│         - ThunderKoli (Security & Audit)        │
│         - UniversalEngine (AI Generation)       │
│         - Vault (Encryption)                    │
│         - Database (PostgreSQL + Redis)         │
└─────────────────────────────────────────────────┘
```

## Template: Pedido de Ejecución Técnica

### Estructura Completa

```markdown
**Pedido de Ejecución Técnica**

**Rol:** Actúa como mi [Engine Lead / Bridge Architect / Frontend Specialist]

**1. Punto de Control**
- Capa: [Frontend / Bridge / Engine / Data Layer]
- Ubicación exacta: [ruta/archivo.js] función [nombreFuncion()]
- Momento: [antes de / después de / durante] [operación específica]

**2. Contrato de Datos**
- Variables a capturar:
  - `variable1` (tipo): descripción
  - `variable2` (tipo): descripción
- Condición de captura: [cuándo activar]
- Formato esperado: [estructura JSON]

**3. Criterio de Activación**
- Trigger: [error / siempre / condicional]
- Filtros: [condiciones específicas]
- Entorno: [dev / staging / prod]

**4. Estrategia de Persistencia**
- Destino: [@seald-io/nedb / archivo JSON / Redis / logs]
- Rotación: [límite de registros / TTL]
- Naming: [patrón de nombres]

**5. Formato de Salida**
- Tipo: [Bloque quirúrgico / Módulo completo / Middleware]
- Integración: [copiar-pegar / import / inyección]
- Preservar: [modularidad / tests / performance]

**6. Plan de Rollback**
- Desactivación: [flag en .env / comentar bloque]
- Validación: [cómo verificar que no rompe nada]
```

## Ejemplos Específicos de KoliCode

### Ejemplo 1: Debugging en ThunderEngine (Capa Engine)

```markdown
**Pedido de Ejecución Técnica**

**Rol:** Actúa como mi ThunderKoli Engine Lead

**1. Punto de Control**
- Capa: Engine (ThunderEngine)
- Ubicación exacta: `backend/thunderkoli/src/lib/ThunderEngine.js` función `processMission()`
- Momento: Justo después de recibir respuesta de Ollama/DeepSeek, antes de retornar al Bridge

**2. Contrato de Datos**
- Variables a capturar:
  - `missionPrompt` (string): El prompt original del usuario
  - `aiResponse` (object): Respuesta completa del proveedor IA
  - `processingTime` (number): Tiempo de procesamiento en ms
  - `error` (Error | null): Stack trace si falla
- Condición de captura: Solo si `aiResponse.status === 'error'` o `processingTime > 10000`
- Formato esperado:
  ```json
  {
    "timestamp": "ISO 8601",
    "missionId": "uuid",
    "prompt": "string",
    "response": "object",
    "processingTime": "number",
    "error": "string | null"
  }
  ```

**3. Criterio de Activación**
- Trigger: Error en respuesta IA o timeout (>10s)
- Filtros: Solo en NODE_ENV !== 'test'
- Entorno: dev y production

**4. Estrategia de Persistencia**
- Destino: @seald-io/nedb en `backend/thunderkoli/data/engine-diagnostics.db`
- Rotación: Máximo 500 registros, eliminar más antiguos
- Naming: `engine-diagnostics-{timestamp}.json` para exports

**5. Formato de Salida**
- Tipo: Bloque quirúrgico para insertar en `processMission()`
- Integración: Copiar-pegar después de try-catch del AI call
- Preservar: No modificar lógica existente, solo agregar captura

**6. Plan de Rollback**
- Desactivación: Flag `ENABLE_ENGINE_DIAGNOSTICS=false` en .env
- Validación: Tests existentes deben pasar sin cambios
```

## Puntos de Control Comunes en KoliCode

### Frontend (Capa 1)
- **Canvas Editor**: Capturar operaciones lentas (>500ms)
- **State Management**: Capturar cambios de estado inesperados
- **API Calls**: Capturar requests fallidos o lentos

### Bridge (Capa 2)
- **API Gateway**: Capturar routing errors
- **Authentication**: Capturar intentos fallidos
- **Rate Limiting**: Capturar requests bloqueados

### Engine (Capa 3)
- **ThunderEngine**: Capturar fallos de IA
- **Vault**: Capturar fallos de encriptación/desencriptación
- **Database**: Capturar queries lentas (>50ms)
- **Asset Pipeline**: Capturar cuellos de botella

## Prácticas Avanzadas de Debugging

### 1. Reproducción Consistente (Diagnóstico Primero)

**Principio:** Antes de tocar código, debes replicar el error a voluntad.

**Proceso:**
1. Aislar el entorno (Frontend/Bridge/Engine)
2. Captura de estados (payloads exactos)
3. Documentar pasos reproducibles

### 2. Método de "Dividir y Conquistar" (Bisección)

Divide el flujo de datos a la mitad para encontrar el origen.

### 3. Logging Estratégico y Rastreo

Niveles: ERROR, WARN, INFO, DEBUG

### 4. Escritura de Tests de Regresión

Ciclo: Test falla → Arreglar código → Test pasa → Test permanece

### 5. Análisis de Causa Raíz

Pregunta "¿Por qué?" hasta llegar al fondo.

## Captura de Estados en Puntos de Control

### State Logger en el Bridge
Middleware que captura entrada/salida de cada request.

### Snapshots en el Engine
Shadow Logging - Solo exporta estado si hay error.

### Modo Diagnóstico en Frontend
Exporta estado de Vuex/Pinia + logs del Bridge.

## Checklist de Captura de Estado

- [ ] Timestamp (ISO 8601)
- [ ] User Context (userId, role)
- [ ] Input Data (request body/params)
- [ ] Internal State (variables globales)
- [ ] Layer (Frontend/Bridge/Engine)
- [ ] Component (archivo y función)
- [ ] Error Context (stack trace)
- [ ] Environment (dev/staging/prod)
- [ ] Performance Metrics

## Checklist de Implementación

Antes de implementar un diagnóstico, verificar:

- [ ] Punto de control claramente definido
- [ ] Contrato de datos especificado
- [ ] Criterio de activación establecido
- [ ] Estrategia de persistencia definida
- [ ] Flag de desactivación en .env
- [ ] Plan de rollback documentado
- [ ] Tests existentes pasan sin cambios
- [ ] No hay datos sensibles en capturas (usar hashes)
- [ ] Rotación automática configurada
- [ ] Performance impact < 5ms por captura
- [ ] Logging estratégico con niveles apropiados
- [ ] Test de regresión escrito para el bug
- [ ] Análisis de causa raíz documentado

## Referencias

- Arquitectura: `docs/ARCHITECTURE.md`
- Requerimientos: `.kiro/specs/kolicode/requirements.md`

---

**Última actualización:** 2026-04-21  
**Versión:** 1.0.0
