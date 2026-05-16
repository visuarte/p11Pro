# Auditoría técnica ejecutiva — KoliCode

**Fecha:** 2026-05-15  
**Rol:** evaluación ejecutiva/técnica del estado real del proyecto  
**Ámbito:** monorepo `p11Pro`, con foco en `fusion-workspace/kolicode/`

---

## 1. Resumen ejecutivo

**Veredicto:** **KoliCode está en condición de seguir implementando features sobre una base técnica sólida.**

La **Fase 1 de infraestructura base** quedó cerrada y el producto activo ya tiene:

- frontend Electron + React operativo como base
- Bridge funcional con HTTP, health checks, PostgreSQL, Redis, gRPC base, WebSocket y fallback REST
- contratos compartidos en `shared/proto/`
- bases de servicio alineadas para ThunderKoli, UniversalEngine y Design Studio

La principal deuda técnica ya no está en la infraestructura base, sino en la **consolidación de UniversalEngine** y en la **gobernanza del área `proyectos_generados/`**.

---

## 2. Estado por dominio

| Dominio | Estado | Evaluación |
|---|---|---|
| Infraestructura base | **Completa** | Lista para soportar desarrollo continuo |
| Frontend Electron + React | **Base operativa** | Preparado para expansión funcional |
| Bridge | **Operativo** | Hoy es el backend más maduro del sistema |
| Persistencia PostgreSQL + Redis | **Operativa** | Integrada y ya usada por el Bridge |
| Shared contracts | **Operativos** | Buena base para crecimiento modular |
| ThunderKoli | **Base alineada** | Evolucionable sin rediseño inmediato |
| Design Studio base | **Scaffold** | Aún no es motor gráfico completo |
| UniversalEngine | **Mixto** | Útil, pero estructuralmente mezclado con legado |
| `proyectos_generados/` | **Controlado, no resuelto** | Se redujo ruido, pero sigue siendo área heredada |
| `proyecto_18` | **Referencia consultable** | No debe considerarse fuente canónica del producto |

---

## 3. Lo que está bien resuelto

### 3.1 Arquitectura

- La separación **Frontend / Bridge / Engines** es correcta.
- El **Bridge** ya actúa como centro de integración real, no solo como intención arquitectónica.
- Los contratos Protobuf ya reducen ambigüedad entre servicios.

### 3.2 Plataforma

- Docker, PostgreSQL, Redis, migraciones y backup quedaron integrados.
- El sistema ya tiene:
  - health checks
  - readiness/liveness
  - logging estructurado
  - workflows base de CI/CD
  - fallback REST útil

### 3.3 Dirección técnica

- La documentación raíz se realineó con el estado real del repo.
- Se tomó la decisión correcta de **no mover `proyecto_<id>`** mientras el runtime siga resolviendo por esa convención.
- La limpieza reciente de `proyectos_generados/` fue **no destructiva**.

---

## 4. Riesgos principales

### Riesgo 1 — UniversalEngine mezcla runtime, legado y generados

**Impacto:** alto  
**Problema:** `backend/universalengine/` mezcla código vivo, scripts históricos, documentación operativa vieja y outputs generados.  
**Riesgo:** dificulta gobernanza técnica y eleva coste de mantenimiento.

### Riesgo 2 — Resolución rígida por `proyecto_<id>`

**Impacto:** alto  
**Problema:** el motor depende de rutas fijas `proyectos_generados/proyecto_<id>`.  
**Riesgo:** impide reorganizar almacenamiento de proyectos sin tocar runtime.

### Riesgo 3 — `proyecto_18` validado parcialmente

**Impacto:** medio  
**Problema:** la implementación quedó hecha, pero la validación final completa quedó bloqueada por el entorno (`posix_spawn`).  
**Riesgo:** no debe elevarse aún a plantilla oficial.

### Riesgo 4 — Desalineación futura entre docs y estado real

**Impacto:** medio  
**Problema:** el repo ya mostró señales de documentación histórica desactualizada.  
**Riesgo:** reaparece deuda de contexto si no se mantiene disciplina documental.

---

## 5. Decisiones estratégicas recomendadas

### 5.1 Declarar formalmente la fuente de verdad

La fuente de verdad del producto es:

```text
fusion-workspace/kolicode/
```

Todo lo demás debe considerarse soporte, legado o material histórico.

### 5.2 Mantener `proyectos_generados/` como zona controlada, no como producto

Regla vigente:

- `proyecto_<id>` sigue siendo la ruta viva del Hub
- `_archive/`, `_candidates/` y `_legacy_import/` se usan para limpieza segura
- no mover proyectos vivos hasta desacoplar el runtime de esa convención

### 5.3 No promover `proyecto_18` todavía

Debe seguir como:

- referencia consultable
- candidato conceptual
- no plantilla oficial del sistema

### 5.4 Abrir una fase explícita de consolidación

La siguiente prioridad ya no es infraestructura base, sino:

1. consolidar UniversalEngine
2. desacoplar el runtime de la ruta fija `proyecto_<id>`
3. definir plantilla canónica real para futuros proyectos generados

---

## 6. Lista de tareas recomendadas para continuar

Las siguientes tareas están ordenadas por prioridad técnica y de negocio.

### Tarea A — Inventario de `proyectos_generados/`

**Objetivo:** clasificar qué proyectos siguen siendo útiles, cuáles son solo historial y cuáles podrían ser candidatos a plantilla.

**Entregables**
- inventario de `proyecto_<id>` con estado: `activo`, `consultable`, `archivable`, `candidato`
- nota de decisión para `proyecto_18`

**Verificación**
1. existe un documento de inventario versionado
2. cada `proyecto_<id>` tiene clasificación explícita
3. se identifican candidatos reales y no se mueven proyectos vivos

### Tarea B — Desacoplar el runtime de la convención `proyecto_<id>`

**Objetivo:** permitir que UniversalEngine resuelva proyectos por metadatos o registro, no por nombre de carpeta rígido.

**Entregables**
- capa de resolución de rutas/proyectos
- compatibilidad temporal con la ruta actual
- documentación del nuevo mecanismo

**Verificación**
1. el runtime puede resolver un proyecto sin hardcodear `proyecto_<id>`
2. se mantienen compatibles los proyectos ya existentes
3. el Hub sigue pudiendo abrir/sincronizar proyectos vivos

### Tarea C — Definir plantilla canónica de proyecto

**Objetivo:** crear una base oficial para futuros proyectos generados sin depender de snapshots legacy.

**Entregables**
- plantilla oficial fuera del flujo histórico de `proyectos_generados/`
- criterios de qué entra en la plantilla y qué no
- README breve de uso de la plantilla

**Verificación**
1. la plantilla no vive como proyecto histórico del Hub
2. la estructura está limpia y documentada
3. se puede crear una nueva instancia a partir de ella

### Tarea D — Consolidar UniversalEngine

**Objetivo:** separar runtime vivo, scripts útiles, legado y documentación histórica.

**Entregables**
- mapa claro de qué carpetas son runtime, soporte y legado
- README de UniversalEngine alineado al estado real
- reducción de ruido operativo

**Verificación**
1. se puede identificar fácilmente qué parte del árbol es productiva
2. no se eliminan rutas críticas sin compatibilidad
3. la documentación refleja el estado real del motor

### Tarea E — Cerrar validación operativa de `proyecto_18`

**Objetivo:** cerrar la validación pendiente como referencia técnica, no como prioridad de roadmap.

**Entregables**
- ejecución completa de:
  - `./backend/gradlew --no-daemon clean test build`
  - `./scripts/tests/smoke_checklist.sh`
- evidencia del resultado

**Verificación**
1. build backend final OK
2. smoke final OK
3. `POST /api/v1/checklist` devuelve `id`
4. el registro aparece en PostgreSQL

### Tarea F — Gobernanza documental

**Objetivo:** evitar que vuelva a haber documentación histórica presentada como estado actual.

**Entregables**
- convención simple para marcar docs como `canónica`, `operativa`, `histórica`
- limpieza progresiva de referencias obsoletas

**Verificación**
1. los documentos raíz apuntan a fuentes actuales
2. los documentos históricos quedan identificados como tales
3. no hay rutas/documentos principales apuntando a estados ya superados

---

## 7. Orden recomendado de ejecución

1. **Tarea A** — Inventario de `proyectos_generados/`
2. **Tarea D** — Consolidación de UniversalEngine
3. **Tarea B** — Desacoplar convención `proyecto_<id>`
4. **Tarea C** — Plantilla canónica oficial
5. **Tarea E** — Cerrar validación de `proyecto_18`
6. **Tarea F** — Gobernanza documental continua

---

## 8. Veredicto final

**Go** para seguir implementando features en KoliCode.  
**No-Go** para convertir aún `proyecto_18` o el árbol histórico de generados en base oficial del sistema.

La prioridad real ya no es “más setup”, sino:

- consolidación estructural
- reducción de legado
- definición canónica de proyectos futuros

En resumen: **KoliCode ya es una base real de producto; ahora necesita disciplina de consolidación, no otra ronda de infraestructura base.**
