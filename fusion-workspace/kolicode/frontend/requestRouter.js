
// requestRouter.js
// MITIGADOR: Validación Zod, Correlation ID, Watchdog, DLQ
// Plan quirúrgico: Blindaje del Request Router (IPC/Bridge en Node/Electron)
// KoliCode 2026 – Referencia para agentes y desarrolladores

import { v4 as uuidv4 } from 'uuid';
import { z } from 'zod'; // Validación de esquemas (Fail Fast)

// Ejemplo de esquema para una petición de mover nodo
const moveNodeSchema = z.object({
  nodeId: z.string(),
  position: z.tuple([z.number(), z.number()]),
  revision_id: z.number(),
});

// Dead Letter Queue (DLQ) en memoria (puede persistirse en archivo/log)
const deadLetterQueue = [];

// Mapa de promesas pendientes
const pendingRequests = new Map();

// Función principal para enviar petición
// MITIGADOR: Esta función implementa validación estricta de contratos, Correlation ID, watchdog de timeout y Dead Letter Queue (DLQ).
// Consulta BIBLIA_QA_CHECKLIST.md tras cualquier cambio.
export function sendRequestToCore(payload, schema = moveNodeSchema, timeoutMs = 5000) {
  // 1. Validación estricta de contratos (Fail Fast)
  const parseResult = schema.safeParse(payload);
  if (!parseResult.success) {
    console.error('[ERROR] [RequestRouter] [FAIL-FAST] Esquema inválido:', parseResult.error);
    throw new Error('Payload inválido. Consulta el esquema.');
  }

  // 2. Correlation ID y TRACE-ID
  const correlationId = uuidv4();
  const traceId = uuidv4();
  const enrichedPayload = { ...payload, correlationId, traceId };

  // 3. Promesa y Watchdog de timeout
  let timer;
  const promise = new Promise((resolve, reject) => {
    timer = setTimeout(() => {
      // Timeout: limpiar y mover a DLQ
      pendingRequests.delete(correlationId);
      deadLetterQueue.push({
        correlationId,
        traceId,
        payload: enrichedPayload,
        reason: 'Timeout',
        timestamp: Date.now(),
      });
      console.error(`[ERROR] [RequestRouter] [${traceId}] - Timeout de ${timeoutMs}ms excedido esperando respuesta. Payload movido a DLQ.`);
      reject(new Error('Timeout esperando respuesta del Core/Worker.'));
    }, timeoutMs);
    pendingRequests.set(correlationId, { resolve, reject, timer });
  });

  // 4. Enviar petición (ejemplo con ipcRenderer)
  window.ipcRenderer.send('core:request', enrichedPayload);

  return promise;
}

// Función para recibir respuesta del Core/Worker
export function handleCoreResponse(response) {
  const { correlationId, traceId } = response;
  if (!pendingRequests.has(correlationId)) {
    // Respuesta huérfana o ya expirada
    deadLetterQueue.push({
      correlationId,
      traceId,
      payload: response,
      reason: 'Respuesta huérfana',
      timestamp: Date.now(),
    });
    return;
  }
  const { resolve, timer } = pendingRequests.get(correlationId);
  clearTimeout(timer);
  pendingRequests.delete(correlationId);
  resolve(response);
}

// Exponer la DLQ para debugging
export function getDeadLetterQueue() {
  return deadLetterQueue;
}


// Instrucciones para agentes:
// - Usa sendRequestToCore() para toda petición al Core/Worker.
// - Implementa handleCoreResponse() como listener de ipcRenderer.on('core:response', ...)
// - Consulta getDeadLetterQueue() para debugging de fallos y reproducibilidad.

// CHECKLIST QA: Tras modificar este archivo, ejecuta el script de validación QA y revisa la BIBLIA_QA_CHECKLIST.md.

