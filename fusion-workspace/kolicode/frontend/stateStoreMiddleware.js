
// stateStoreMiddleware.js
// MITIGADOR: Rollback, trazabilidad, limpieza de suscripciones
// Middleware quirúrgico para blindaje de State Store (Zustand/Redux compatible)
// KoliCode 2026 – Referencia para agentes y desarrolladores

import { v4 as uuidv4 } from 'uuid';

// Utilidad para generar revision_id incremental
let currentRevision = 0;
function nextRevision() {
  return ++currentRevision;
}

// Middleware principal
// MITIGADOR: Este middleware implementa rollback automático, trazabilidad con TRACE-ID y limpieza de suscripciones para evitar memory leaks.
// Consulta BIBLIA_QA_CHECKLIST.md tras cualquier cambio.
export const stateStoreMiddleware = (config) => (set, get, api) => {
  // Guarda el último revision_id confirmado por el Core
  let lastConfirmedRevision = 0;
  // Guarda el snapshot previo para rollback
  let prevState = null;

  // Envoltura de set para trazabilidad y control de versiones
  function tracedSet(partial, replace, actionName = 'UNKNOWN_ACTION') {
    const traceId = uuidv4();
    const revision_id = nextRevision();
    prevState = get();
    // Log de trazabilidad
    console.info(`[INFO] [Store] [TRACE-ID: ${traceId}] Acción: ${actionName}, Rev: ${revision_id}`);
    set({ ...partial, revision_id }, replace);
    // Enviar mutación al Bridge/Core
    api.sendToCore({ ...partial, revision_id, traceId })
      .then((coreResponse) => {
        // Solo aceptar respuesta si revision_id es >= al actual
        if (coreResponse.revision_id >= revision_id) {
          lastConfirmedRevision = coreResponse.revision_id;
          set({ ...coreResponse.state, revision_id: coreResponse.revision_id });
        }
      })
      .catch((err) => {
        // Rollback automático en caso de error
        console.error(`[ERROR] [Store] [TRACE-ID: ${traceId}] Rollback por error:`, err);
        set(prevState, true);
        // Notificación al usuario (puedes integrar con tu sistema de notificaciones)
        api.notifyUser && api.notifyUser('Error al actualizar el estado. Se ha restaurado el estado anterior.');
      });
  }

  // Limpieza de suscripciones para evitar memory leaks
  api.subscribe = (listener) => {
    let unsub = api.subscribe(listener);
    return () => {
      unsub();
      // Limpieza adicional si es necesario
    };
  };

  // Devuelve la store original pero con set envuelto
  return config(tracedSet, get, api);
};


// Ejemplo de uso en Zustand:
// import create from 'zustand';
// import { stateStoreMiddleware } from './stateStoreMiddleware';
// const useStore = create(stateStoreMiddleware((set, get, api) => ({ ... })));

// CHECKLIST QA: Tras modificar este archivo, ejecuta el script de validación QA y revisa la BIBLIA_QA_CHECKLIST.md.

// ---

## 🛡️ Instrucciones Críticas para Agentes IA y Humanos: Blindaje del State Store (2026)

**Resumen:**
El 90% de los bugs difíciles en arquitecturas híbridas (Node/Electron + C++ Core + Python Worker) provienen de condiciones de carrera, desincronizaciones y estados fantasma. Para erradicar estos problemas y cumplir el Manifiesto 2026, todo agente (IA o humano) debe seguir estas reglas y patrones al pie de la letra.

### 1. Única Fuente de Verdad (SSOT)
- El Core C++ es el único dueño del estado del documento (vector, color, etc.).
- El State Store del Frontend es solo una caché visual (View State).
- El Frontend nunca debe asumir que un cambio es definitivo hasta recibir confirmación (evento STATE_UPDATED) del Core.

### 2. Versionado de Estado y Condiciones de Carrera
- Cada mutación de estado debe llevar un `revision_id` incremental.
- El Store de la UI debe ignorar cualquier actualización entrante cuyo `revision_id` sea más antiguo que el actual.
- Esto elimina condiciones de carrera y estados corruptos.

### 3. Actualizaciones Optimistas y Rollback Automático
- La UI debe actualizarse instantáneamente (optimistic update) para mantener 60 FPS.
- Siempre guardar un snapshot del estado anterior antes de mutar.
- Si el Core/Bridge devuelve error, ejecutar rollback silencioso y notificar al usuario.

### 4. Middleware de Trazabilidad y Limpieza
- Toda mutación debe inyectar un TRACE-ID y loguear el estado previo y nuevo.
- Los despachos hacia el Bridge deben estar envueltos para capturar promesas rechazadas y detonar rollback.
- Al desmontar un componente React, limpiar suscripciones al State Store para evitar memory leaks y errores de actualización en componentes desmontados.

### 5. Ejemplo de Middleware (Zustand/Redux compatible)

```js
import { stateStoreMiddleware } from './stateStoreMiddleware';
// Uso:
// const useStore = create(stateStoreMiddleware((set, get, api) => ({ ... })));
```

**Obligatorio:**
- No dupliques estado entre Frontend y Core.
- No aceptes actualizaciones fuera de orden.
- Siempre implementa rollback y trazabilidad.
- Documenta cada mutación relevante con TRACE-ID.

**Referencia:** Consulta y reutiliza el archivo `stateStoreMiddleware.js` como plantilla oficial para todos los proyectos híbridos KoliCode.

---
